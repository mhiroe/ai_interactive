(F = 20),
  (f = 0),
  (draw = (o) => {
    for (
      f++ || createCanvas((w = 400), w, WEBGL),
        j = 0,
        T = TAU,
        s = sin,
        background(0),
        t = (f / F) % 1,
        p = F,
        rotateX(0.3),
        rotateY(-0.7);
      j < F;
      j++
    )
      for (b = (j / F) * T, i = 0; i < F; i++)
        (a = (i / F) * T),
          (r = (i + t) / F),
          push(),
          translate(tan(r * T) * F, 90 * s(b * T), F - ((j * b) / F) * p),
          box(p + s(PI + t * T - r * T) * p),
          pop();
  });
