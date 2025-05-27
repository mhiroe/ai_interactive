// Optimized flower definitions
const flowers = [
  {
    name: "Rose",
    colors: ["#FF1744", "#D50000", "#FF4081", "#FFE0E0"],
    petals: 8,
    layers: 2,
  },
  {
    name: "Sunflower",
    colors: ["#FFD600", "#FFC107", "#FF9800", "#4E342E"],
    petals: 16,
    layers: 2,
  },
  {
    name: "Lavender",
    colors: ["#9575CD", "#7E57C2", "#B39DDB", "#EDE7F6"],
    petals: 6,
    layers: 3,
  },
  {
    name: "Lotus",
    colors: ["#FB8C00", "#F48FB1", "#EC407A", "#FCE4EC"],
    petals: 8,
    layers: 2,
  },
  {
    name: "Daisy",
    colors: ["#FFFFFF", "#FFF176", "#FFEE58", "#F0F4C3"],
    petals: 12,
    layers: 1,
  },
  {
    name: "Iris",
    colors: ["#5E35B1", "#7C4DFF", "#B388FF", "#E8EAF6"],
    petals: 6,
    layers: 2,
  },
  {
    name: "Cherry Blossom",
    colors: ["#F8BBD0", "#F06292", "#FFDDD0", "#FFFFFF"],
    petals: 5,
    layers: 1,
  },
  {
    name: "Chrysanthemum",
    colors: ["#FFF176", "#FFE082", "#FFCC80", "#FFE0B2"],
    petals: 16,
    layers: 3,
  },
  {
    name: "Lily",
    colors: ["#FFFFFF", "#F5F5F5", "#E0E0E0", "#90CAF9"],
    petals: 6,
    layers: 2,
  },
  {
    name: "Tulip",
    colors: ["#EF5350", "#EF9A9A", "#FFCDD2", "#FFEBEE"],
    petals: 6,
    layers: 1,
  },
  {
    name: "Orchid",
    colors: ["#9C27B0", "#CE93D8", "#E1BEE7", "#F3E5F5"],
    petals: 5,
    layers: 2,
  },
  {
    name: "Forget-me-not",
    colors: ["#2196F3", "#90CAF9", "#BBDEFB", "#E3F2FD"],
    petals: 5,
    layers: 1,
  },
];

let currentFlowerIndex = 0; // Changed from currentFlower
let nextFlowerIndex = 1; // Changed from nextFlower
let particles = [];
let transitionTimer = 0;
let transitionDuration = 540; // at 60fps
let lastTransitionMs = 0; // Changed from lastTransitionTime
const PARTICLE_COUNT = 200;

class Particle {
  constructor() {
    this.pos = p5.Vector.random2D().mult(random(200, 300));
    this.vel = createVector();
    this.target = createVector();
    this.colorIndex = floor(random(4));
    this.size = random(3, 6);
    this.damping = random(0.1, 0.15);
  }

  update() {
    let force = p5.Vector.sub(this.target, this.pos);
    force.mult(this.damping);
    this.vel.add(force);
    this.vel.mult(0.95);
    this.pos.add(this.vel);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }
  updateTargets(true);
}

function draw() {
  background("rgb(27,47,27)");
  translate(width / 2, height / 2);

  // Update transition using timestamp
  let timeNow = millis();
  if (timeNow - lastTransitionMs > 10000) {
    lastTransitionMs = timeNow;
    currentFlowerIndex = nextFlowerIndex;
    nextFlowerIndex = (nextFlowerIndex + 1) % flowers.length;
    updateTargets(false);
  }

  // Draw connecting lines
  stroke(255, 30);
  for (let i = 0; i < particles.length; i++) {
    let p1 = particles[i];
    for (let j = i + 1; j < particles.length; j++) {
      let p2 = particles[j];
      let distance = dist(p1.pos.x, p1.pos.y, p2.pos.x, p2.pos.y);
      if (distance < 50) {
        strokeWeight(1);
        line(p1.pos.x, p1.pos.y, p2.pos.x, p2.pos.y);
      }
    }
  }

  // Update and draw particles
  noStroke();
  for (let particle of particles) {
    particle.update();
    fill(flowers[currentFlowerIndex].colors[particle.colorIndex]);
    circle(particle.pos.x, particle.pos.y, particle.size);
  }

  // Display current flower name
  fill(255);
  noStroke();
  textAlign(CENTER);
  textSize(20);
  text(flowers[currentFlowerIndex].name, 0, 170);
}

function generateFlowerPoints(flowerData) {
  let points = [];
  const baseRadius = 150;

  // Generate points for each layer
  for (let layer = 0; layer < flowerData.layers; layer++) {
    let layerRadius = baseRadius * (1 - layer * 0.3);
    for (let i = 0; i < flowerData.petals; i++) {
      let angle = (TWO_PI / flowerData.petals) * i;
      angle += layer * (TWO_PI / flowerData.petals / 2);
      let x = cos(angle) * layerRadius;
      let y = sin(angle) * layerRadius;
      points.push(createVector(x, y));
    }
  }

  // Add randomized points
  while (points.length < PARTICLE_COUNT) {
    let randAngle = random(TWO_PI);
    let randRadius = random(50, baseRadius);
    points.push(
      createVector(cos(randAngle) * randRadius, sin(randAngle) * randRadius)
    );
  }

  return points;
}

function updateTargets(isInitial) {
  let points = generateFlowerPoints(
    flowers[isInitial ? currentFlowerIndex : nextFlowerIndex]
  );

  // Shuffle points array
  for (let i = points.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }

  // Update particle targets
  for (let i = 0; i < particles.length; i++) {
    particles[i].target = points[i % points.length];
  }
}
