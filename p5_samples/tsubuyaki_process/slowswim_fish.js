a = (x, y, o = mag((k = x / 4 - 12.5), (e = y / 9)) / 9) =>
  point(
    (q =
      99 +
      (3 * (tan(y / 2) / 2 + cos(y))) / k +
      k * (3 + cos(y) / 3 + sin(e + o * 4 - t * 2))) *
      cos((c = o / 4 + e / 4 - t / 8)) *
      cos(c / 2 - e / 3 + t / 8) +
      200,
    q * sin(c) + 200
  );
(t = 0),
  (draw = ($) => {
    t || createCanvas((w = 400), w);
    background(6).stroke(w, 46);
    for (t += PI / 90, i = 3e4; i--; ) a(i % 100, i / 350);
  });
