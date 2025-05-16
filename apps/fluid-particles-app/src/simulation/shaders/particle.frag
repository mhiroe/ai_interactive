precision highp float;

varying float vVelocityMagnitude;
varying float vLifeRatio;

void main() {
  // ポイントスプライトの形状を円形に
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  
  // 速度と寿命に基づいて色と透明度を設定
  float alpha = (1.0 - dist * 2.0) * vLifeRatio * mix(0.05, 0.9, vVelocityMagnitude);
  vec3 color = vec3(1.0);
  
  gl_FragColor = vec4(color, alpha);
}