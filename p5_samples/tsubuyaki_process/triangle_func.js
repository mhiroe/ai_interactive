let angle = 0;

function setup() {
  createCanvas(600, 400);
  noStroke();
  textSize(16);
}

function draw() {
  background(240);

  fill(0);
  text("sin: y = sin(angle)", 20, 30);
  text("cos: x = cos(angle)", 20, 160);
  text("tan: y = tan(angle)", 20, 290);

  // sin の波（上下運動）
  fill(100, 150, 255);
  let y1 = 80 + sin(angle) * 40;
  ellipse(100, y1, 30, 30);

  // cos の波（左右運動）
  fill(255, 150, 100);
  let x2 = 100 + cos(angle) * 40;
  ellipse(x2, 210, 30, 30);

  // tan の動き（発散）
  fill(150, 255, 100);
  let y3 = tan(angle);
  if (abs(y3) < 5) {
    // 発散を制限
    ellipse(100, 340 + y3 * 20, 30, 30);
  } else {
    fill(150);
    text("発散", 100, 340);
  }

  // --- ここから棒グラフ ---
  let centerX = 350;
  let baseY = height / 2; // 0位置をcanvas中央に
  let barWidth = 40;
  let scale = 100; // 値を棒の高さに変換

  // sin 棒グラフ
  fill(100, 150, 255);
  let sinVal = sin(angle);
  rect(centerX, baseY, barWidth, -sinVal * scale);
  fill(0);
  text("sin", centerX + 5, baseY + 20);
  text(
    nf(sinVal, 1, 2),
    centerX + 5,
    baseY - sinVal * scale - 10 * Math.sign(sinVal)
  );

  // cos 棒グラフ
  fill(255, 150, 100);
  let cosVal = cos(angle);
  rect(centerX + 60, baseY, barWidth, -cosVal * scale);
  fill(0);
  text("cos", centerX + 65, baseY + 20);
  text(
    nf(cosVal, 1, 2),
    centerX + 65,
    baseY - cosVal * scale - 10 * Math.sign(cosVal)
  );

  // tan 棒グラフ
  let tanVal = tan(angle);
  fill(150, 255, 100);
  if (abs(tanVal) < 5) {
    rect(centerX + 120, baseY, barWidth, (-tanVal * scale) / 2); // tanは発散しやすいので高さを抑える
    fill(0);
    text("tan", centerX + 125, baseY + 20);
    text(
      nf(tanVal, 1, 2),
      centerX + 125,
      baseY - (tanVal * scale) / 2 - 10 * Math.sign(tanVal)
    );
  } else {
    fill(150);
    text("発散", centerX + 125, baseY - 30);
    text("tan", centerX + 125, baseY + 20);
  }

  angle += 0.03;
}
