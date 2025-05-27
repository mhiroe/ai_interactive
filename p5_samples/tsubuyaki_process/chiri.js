// 光と塵のインタラクティブビジュアライゼーション

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// 光線の始点を画面外の1点に設定
const LIGHT_SOURCE_X = -CANVAS_WIDTH * 0.5; // 画面左外
const LIGHT_SOURCE_Y = -CANVAS_HEIGHT * 0.3; // 画面上外

class LightBeam {
  constructor(angle) {
    this.position = createVector(LIGHT_SOURCE_X, LIGHT_SOURCE_Y);
    // 光線の太さをより極端に
    const isThick = random() < 0.3; // 30%の確率で太い光線
    this.width = isThick ? random(40, 100) : random(2, 20);
    this.brightness = random(60, 120);
    this.angle = angle;
    this.phase = random(TWO_PI);
    this.speed = random(0.01, 0.03); // 明暗の変化速度を上げる
  }

  update() {
    this.brightness = map(
      sin(frameCount * this.speed + this.phase),
      -1,
      1,
      60,
      120
    );
  }

  draw() {
    push();
    translate(this.position.x, this.position.y);
    rotate(this.angle);
    noStroke();
    fill(255, this.brightness * 0.5);
    const diagonal =
      sqrt(CANVAS_WIDTH * CANVAS_WIDTH + CANVAS_HEIGHT * CANVAS_HEIGHT) * 2;
    rect(0, 0, diagonal, this.width);
    pop();
  }
}

class DustParticle {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.initialY = y;
    this.size = random(1.5, 4);
    this.baseOpacity = random(60, 100);
    this.opacity = this.baseOpacity;
    this.velocity = createVector(0, 0);
    this.phase = random(TWO_PI);
    this.phaseX = random(TWO_PI);
    this.amplitude = random(0.3, 0.5);
    this.amplitudeX = random(0.2, 0.3);
    this.period = random(8000, 15000);
    this.periodX = random(12000, 18000);
  }

  update() {
    const verticalMovement =
      sin((millis() / this.period) * TWO_PI + this.phase) * this.amplitude;
    const horizontalMovement =
      cos((millis() / this.periodX) * TWO_PI + this.phaseX) * this.amplitudeX;

    const brownianX = random(-0.05, 0.05);
    const brownianY = random(-0.05, 0.05);

    this.position.y = this.initialY + verticalMovement + brownianY;
    this.position.x += horizontalMovement + brownianX;

    this.velocity.mult(0.85);
    this.position.add(this.velocity);
  }

  draw() {
    noStroke();
    fill(255, this.opacity);
    circle(this.position.x, this.position.y, this.size);
  }

  isDead() {
    return (
      this.position.x < -10 ||
      this.position.x > CANVAS_WIDTH + 10 ||
      this.position.y < -10 ||
      this.position.y > CANVAS_HEIGHT + 10
    );
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.lightBeams = [];
    this.targetParticleCount = 1500;
    this.setupLightBeams();
    this.setupParticles();
  }

  setupLightBeams() {
    const beamCount = 50;
    const baseAngle = PI / 4;
    const totalSpread = PI * 0.8;

    for (let i = 0; i < beamCount; i++) {
      const angleOffset = map(
        i,
        0,
        beamCount - 1,
        -totalSpread / 2,
        totalSpread / 2
      );
      const angle = baseAngle + angleOffset;
      this.lightBeams.push(new LightBeam(angle));
    }
  }

  setupParticles() {
    for (let i = 0; i < this.targetParticleCount; i++) {
      this.particles.push(
        new DustParticle(random(CANVAS_WIDTH), random(CANVAS_HEIGHT))
      );
    }
  }

  update() {
    for (const beam of this.lightBeams) {
      beam.update();
    }

    for (const particle of this.particles) {
      particle.update();
      this.checkLightInteraction(particle);
    }

    this.maintainParticleCount();
  }

  draw() {
    for (const beam of this.lightBeams) {
      beam.draw();
    }

    for (const particle of this.particles) {
      particle.draw();
    }
  }

  checkLightInteraction(particle) {
    let maxBrightness = 0;

    for (const beam of this.lightBeams) {
      const d = this.distanceToBeam(particle.position, beam);
      if (d < beam.width) {
        const brightness = map(d, 0, beam.width, beam.brightness, 0);
        maxBrightness = max(maxBrightness, brightness);
      }
    }

    particle.opacity = map(
      maxBrightness,
      0,
      120,
      particle.baseOpacity * 0.4,
      particle.baseOpacity * 1.5
    );
  }

  distanceToBeam(point, beam) {
    const diagonal =
      sqrt(CANVAS_WIDTH * CANVAS_WIDTH + CANVAS_HEIGHT * CANVAS_HEIGHT) * 2;
    const beamEnd = createVector(
      beam.position.x + cos(beam.angle) * diagonal,
      beam.position.y + sin(beam.angle) * diagonal
    );

    const a = p5.Vector.sub(beamEnd, beam.position);
    const b = p5.Vector.sub(point, beam.position);
    const projection = b.dot(a) / a.magSq();

    if (projection < 0) {
      return p5.Vector.dist(point, beam.position);
    } else if (projection > 1) {
      return p5.Vector.dist(point, beamEnd);
    }

    const projectionPoint = p5.Vector.add(beam.position, a.mult(projection));
    return p5.Vector.dist(point, projectionPoint);
  }

  applyForce(mousePos, mouseVelocity) {
    const maxForce = mouseVelocity.mag() * 0.2;
    const radius = 100;

    for (const particle of this.particles) {
      const d = p5.Vector.dist(mousePos, particle.position);
      if (d < radius) {
        const force = p5.Vector.sub(particle.position, mousePos);
        force.normalize();
        force.mult(map(d, 0, radius, maxForce, 0, true));
        force.rotate(PI / 2);
        particle.velocity.add(force);
      }
    }
  }

  maintainParticleCount() {
    this.particles = this.particles.filter((p) => !p.isDead());

    while (this.particles.length < this.targetParticleCount) {
      this.particles.push(new DustParticle(random(CANVAS_WIDTH), -5));
    }
  }
}

let particleSystem;
let prevMouseX;
let prevMouseY;

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  frameRate(30);
  particleSystem = new ParticleSystem();
  prevMouseX = mouseX;
  prevMouseY = mouseY;
}

function draw() {
  background(30);

  const mouseVelocity = createVector(mouseX - prevMouseX, mouseY - prevMouseY);
  if (mouseVelocity.mag() > 0) {
    particleSystem.applyForce(createVector(mouseX, mouseY), mouseVelocity);
  }

  particleSystem.update();
  particleSystem.draw();

  prevMouseX = mouseX;
  prevMouseY = mouseY;
}
