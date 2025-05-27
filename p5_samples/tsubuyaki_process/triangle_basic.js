let angle = 0;

function setup() {
  createCanvas(600, 400);
  textSize(18);
}

function draw() {
  background(240);

  // --- 左側：円の回転ビジュアル ---
  push();
  translate(150, height / 2);
  let r = 100;

  // 円
  stroke(200);
  noFill();
  ellipse(0, 0, r * 2);

  // sin, cos の線
  let x = r * cos(angle);
  let y = r * sin(angle);

  // cos 線
  stroke("blue");
  line(0, 0, x, 0);
  // sin 線
  stroke("red");
  line(x, 0, x, y);
  // 斜辺
  stroke("black");
  line(0, 0, x, y);

  // tan 線
  stroke("green");
  if (abs(cos(angle)) > 0.01) {
    let tanY = r * tan(angle);
    line(x, 0, x, tanY);
  }

  // 点
  fill("black");
  noStroke();
  ellipse(x, y, 8);
  pop();

  // --- 右側：棒グラフ ---
  let centerX = 350;
  let baseY = height / 2; // 0位置をcanvas中央に
  let barWidth = 60;
  let scale = 100; // 値を棒の高さに変換

  // sin 棒グラフ
  fill(100, 150, 255);
  let sinVal = sin(angle);
  rect(centerX, baseY, barWidth, -sinVal * scale);
  fill(0);
  text("sin", centerX + 10, baseY + 30);
  text(
    nf(sinVal, 1, 2),
    centerX + 10,
    baseY - sinVal * scale - 10 * Math.sign(sinVal)
  );

  // cos 棒グラフ
  fill(255, 150, 100);
  let cosVal = cos(angle);
  rect(centerX + 80, baseY, barWidth, -cosVal * scale);
  fill(0);
  text("cos", centerX + 90, baseY + 30);
  text(
    nf(cosVal, 1, 2),
    centerX + 90,
    baseY - cosVal * scale - 10 * Math.sign(cosVal)
  );

  // tan 棒グラフ
  let tanVal = tan(angle);
  fill(150, 255, 100);
  if (abs(tanVal) < 5) {
    rect(centerX + 160, baseY, barWidth, (-tanVal * scale) / 2); // tanは発散しやすいので高さを抑える
    fill(0);
    text("tan", centerX + 170, baseY + 30);
    text(
      nf(tanVal, 1, 2),
      centerX + 170,
      baseY - (tanVal * scale) / 2 - 10 * Math.sign(tanVal)
    );
  } else {
    fill(150);
    text("発散", centerX + 170, baseY - 30);
    text("tan", centerX + 170, baseY + 30);
  }

  angle += 0.015;
}
