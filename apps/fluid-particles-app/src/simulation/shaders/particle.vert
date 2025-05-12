uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform sampler2D lifeTexture;

varying float vVelocityMagnitude;
varying float vLifeRatio;

void main() {
  vec2 uv = uv;
  
  // テクスチャから位置、速度、寿命を取得
  vec4 position = texture2D(positionTexture, uv);
  vec2 velocity = texture2D(velocityTexture, uv).xy;
  vec2 life = texture2D(lifeTexture, uv).xy;
  
  // 速度の大きさを計算
  vVelocityMagnitude = length(velocity) * 30.0;
  
  // 寿命の比率を計算
  vLifeRatio = clamp(life.x / life.y, 0.0, 1.0);
  
  // ポイントサイズを速度に基づいて調整
  gl_PointSize = mix(3.0, 1.0, clamp(vVelocityMagnitude, 0.0, 1.0));
  
  // 位置を設定
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
}