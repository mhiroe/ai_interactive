class Morph {
  constructor(num, iter, type) {
    this.num = num;
    this.iter = iter;
    this.type = type; // ~~random(3);
    this.part1 = this.genParticles(this.num, true);
    this.part2 = this.genParticles(this.num);
    this.easingFunc = random(easingFuncs);
  }

  update() {
    if (frameCount % this.iter === 0) {
      this.part1 = [...this.part2];
      this.part2 = this.genParticles(this.num, random() < 0.2);
      this.easingFunc = random(easingFuncs);
      // console.log(this.part1.length, this.part2.length);
    }
  }

  show() {
    const f = min(1, (frameCount % this.iter) / this.iter); // / 0.8
    const ef = this.easingFunc(f); // pt1.eas(f);

    for (let i = 0; i < min(this.part1.length, this.part2.length); i++) {
      const pt1 = this.part1[i];
      const pt2 = this.part2[i];

      const x = lerp(pt1.x, pt2.x, ef);
      const y = lerp(pt1.y, pt2.y, ef);
      const c = lerpColor(pt1.clr, pt2.clr, ef);

      stroke(c);
      point(x, y);
    } // all points
  }

  genParticles(num, initial = false, tries = 19999) {
    const arr = [];

    // const shCirc = {x: random(-0.1, 0.9)*width, y: random(-0.1, 0.9)*height, r: random(0.3, 0.5)*min(width, height)};
    // const shCirc = {x: random(0.3, 0.7)*width, y: random(0.3, 0.7)*height, r: random(0.4, 0.6)*min(width, height)};
    const shCirc = {
      x: 0.5 * width,
      y: 0.5 * height,
      r: random(0.4, 0.7) * min(width, height),
    };
    // const shRect = {x: random(-0.1, 0.9)*width, y: random(-0.1, 0.9)*height, w: random(0.3, 0.6)*width, h: random(0.5, 0.8)*height};
    const shRect = { x: 0, y: 0, w: width, h: height };
    // cost shTria = {x: random(-0.1, 0.9)*width, y: random(-0.1, 0.9)*height, w: random(0.3, 0.6)*width, h: random(0.5, 0.8)*height};
    // const shTria = {x: random(0.4, 0.6)*width, y: 0, w: random(0.6, 0.8)*width, h: height};
    const shTria = { x: 0.5 * width, y: 0, w: 0.75 * width, h: height };
    const shType = this.type; // ~~random(3);
    const pal = random(palettes);
    rot = (~~random(6) / 6) * TAU;

    while (arr.length < num) {
      const eas = random(easingFuncs);

      if (initial) {
        arr.push({
          x: randomGaussian(width / 2, 75),
          y: randomGaussian(height / 2, 75),
          clr: color(random(pal)),
          eas,
        });
        continue;
      }

      const x = random(width);
      const y = random(height);

      if (shType === 0 && isInCircle({ x, y }, shCirc))
        arr.push({ x, y, clr: color(random(pal)), eas });
      if (shType === 1 && isInRect({ x, y }, shRect))
        arr.push({ x, y, clr: color(random(pal)), eas });
      if (shType === 2 && isInTria({ x, y }, shTria))
        arr.push({ x, y, clr: color(random(pal)), eas });
      if (tries-- < 0 || arr.length >= num) break;
    }
    // console.log(`${arr.length} (in ${tries} tries)`)
    return arr;
  }
}

// pt {x, y}, circ {x, y, r}
function isInCircle(pt, circ) {
  return dist(pt.x, pt.y, circ.x, circ.y) < circ.r;
}

// pt {x, y}, rct {x, y, w, h}
function isInRect(pt, rct) {
  return (
    pt.x >= rct.x &&
    pt.x <= rct.x + rct.w &&
    pt.y >= rct.y &&
    pt.y <= rct.y + rct.h
  );
}

// pt {x, y}, tria {x, y, w, h}
function isInTria(pt, tria) {
  const rp = getRotatedPt(pt.x, pt.y, {
    point: { x: width / 2, y: height / 2 },
    angle: rot,
  });
  if (rp.y < tria.y || rp.y > tria.y + tria.h) return false;
  const dx = map(rp.y, tria.y, tria.y + tria.h, 0, tria.w / 2);
  return abs(tria.x - rp.x) <= dx;
}

function genParticles(num, initial = false, tries = 19999) {
  const arr = [];

  // const shCirc = {x: random(-0.1, 0.9)*width, y: random(-0.1, 0.9)*height, r: random(0.3, 0.5)*min(width, height)};
  const shCirc = {
    x: random(0.3, 0.7) * width,
    y: random(0.3, 0.7) * height,
    r: random(0.4, 0.6) * min(width, height),
  };
  // const shRect = {x: random(-0.1, 0.9)*width, y: random(-0.1, 0.9)*height, w: random(0.3, 0.6)*width, h: random(0.5, 0.8)*height};
  const shRect = { x: 0, y: 0, w: width, h: height };
  // cost shTria = {x: random(-0.1, 0.9)*width, y: random(-0.1, 0.9)*height, w: random(0.3, 0.6)*width, h: random(0.5, 0.8)*height};
  const shTria = {
    x: random(0.4, 0.6) * width,
    y: 0,
    w: random(0.6, 0.8) * width,
    h: height,
  };
  const shType = ~~random(3);
  const pal = random(palettes);
  rot = (~~random(12) / 12) * TAU;

  while (arr.length < num) {
    const eas = random(easingFuncs);

    if (initial) {
      arr.push({
        x: randomGaussian(width / 2, 75),
        y: randomGaussian(height / 2, 75),
        clr: color(random(pal)),
        eas,
      });
      continue;
    }

    const x = random(width);
    const y = random(height);

    if (shType === 0 && isInCircle({ x, y }, shCirc))
      arr.push({ x, y, clr: color(random(pal)), eas });
    if (shType === 1 && isInRect({ x, y }, shRect))
      arr.push({ x, y, clr: color(random(pal)), eas });
    if (shType === 2 && isInTria({ x, y }, shTria))
      arr.push({ x, y, clr: color(random(pal)), eas });
    if (tries-- < 0 || arr.length >= num) break;
  }
  // console.log(`${arr.length} (in ${tries} tries)`)
  return arr;
}

function getRotatedPt(px, py, rotation) {
  // Apply manual rotation if required
  if (rotation) {
    const rotationPoint = rotation.point; // rotation?.point || { x: 0, y: 0 };
    const rotationAngle = rotation.angle; // rotation?.angle || 0;
    let dx = px - rotationPoint.x;
    let dy = py - rotationPoint.y;
    let rotatedX =
      rotationPoint.x + dx * cos(rotationAngle) - dy * sin(rotationAngle);
    let rotatedY =
      rotationPoint.y + dx * sin(rotationAngle) + dy * cos(rotationAngle);
    px = rotatedX;
    py = rotatedY;
  }
  return { x: px, y: py };
}
