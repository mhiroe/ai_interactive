// 設定パラメータ
const CONFIG = {
  // パーティクル設定
  NUM_PARTICLES: 200,
  MIN_SIZE: 1,
  MAX_SIZE: 3,

  // 物理パラメータ
  GRAVITY: 0.02,
  FRICTION: 0.99,

  // 光の設定
  LIGHT_FLICKER_SPEED: 0.05,
  LIGHT_INTENSITY_MIN: 0.7,
  LIGHT_INTENSITY_MAX: 1.0,

  // マウスインタラクション
  MOUSE_INFLUENCE_RADIUS: 100,
  MOUSE_FORCE: 0.5,
};

// パーティクルクラス
class Particle {
  constructor() {
    this.reset();
    this.size = random(CONFIG.MIN_SIZE, CONFIG.MAX_SIZE);
  }

  reset() {
    this.x = random(width);
    this.y = random(height);
    this.vx = random(-0.5, 0.5);
    this.vy = random(-0.5, 0);
    this.alpha = random(100, 200);
  }

  update() {
    // 重力の適用
    this.vy += CONFIG.GRAVITY;

    // 摩擦の適用
    this.vx *= CONFIG.FRICTION;
    this.vy *= CONFIG.FRICTION;

    // 位置の更新
    this.x += this.vx;
    this.y += this.vy;

    // 画面外に出たら再配置
    if (this.y > height) {
      this.reset();
    }
    if (this.x < 0 || this.x > width) {
      this.x = (this.x + width) % width;
    }
  }

  // マウスの影響を受ける
  applyForce(mx, my, force) {
    let dx = mx - this.x;
    let dy = my - this.y;
    let distance = sqrt(dx * dx + dy * dy);

    if (distance < CONFIG.MOUSE_INFLUENCE_RADIUS) {
      let angle = atan2(dy, dx);
      let strength =
        (CONFIG.MOUSE_INFLUENCE_RADIUS - distance) /
        CONFIG.MOUSE_INFLUENCE_RADIUS;

      // 渦を巻くような動きを追加
      this.vx += cos(angle + PI / 2) * force * strength;
      this.vy += sin(angle + PI / 2) * force * strength;
    }
  }

  draw(lightIntensity) {
    // 光の強さに応じて透明度を調整
    let adjustedAlpha = map(
      this.y,
      0,
      height,
      this.alpha * lightIntensity,
      this.alpha * 0.5
    );

    fill(255, adjustedAlpha);
    noStroke();
    circle(this.x, this.y, this.size);
  }
}

// グローバル変数
let particles = [];
let lightPhase = 0;
let prevMouseX = 0;
let prevMouseY = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // パーティクルの初期化
  for (let i = 0; i < CONFIG.NUM_PARTICLES; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  // 背景と光の表現
  background(0, 20);
  drawLight();

  // マウスの移動速度を計算
  let mouseSpeed = dist(mouseX, mouseY, prevMouseX, prevMouseY);
  let mouseForce = map(mouseSpeed, 0, 50, 0, CONFIG.MOUSE_FORCE);

  // パーティクルの更新と描画
  let lightIntensity = calculateLightIntensity();

  for (let particle of particles) {
    particle.applyForce(mouseX, mouseY, mouseForce);
    particle.update();
    particle.draw(lightIntensity);
  }

  // マウスの位置を記録
  prevMouseX = mouseX;
  prevMouseY = mouseY;
}

function drawLight() {
  // 光のグラデーションを描画
  noStroke();
  let lightIntensity = calculateLightIntensity();

  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, lightIntensity, 0);
    let c = color(255, 255 * inter * 0.1);
    fill(c);
    rect(0, y, width, 1);
  }
}

function calculateLightIntensity() {
  // 時間経過による光の強度変化
  lightPhase += CONFIG.LIGHT_FLICKER_SPEED;
  let baseIntensity = map(
    sin(lightPhase),
    -1,
    1,
    CONFIG.LIGHT_INTENSITY_MIN,
    CONFIG.LIGHT_INTENSITY_MAX
  );

  // ランダムなちらつきを追加
  let flicker = random(-0.1, 0.1);
  return constrain(baseIntensity + flicker, 0, 1);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
