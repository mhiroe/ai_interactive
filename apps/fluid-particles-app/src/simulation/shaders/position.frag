uniform sampler2D velocityFieldTexture;
uniform float dt;

// 乱数生成関数
float random(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  // 現在の位置と寿命を取得
  vec4 position = texture(positionTexture, uv);
  vec2 life = texture(lifeTexture, uv).xy;
  
  if (life.x < 0.0) {
    // パーティクルが非アクティブの場合、初期位置に戻す
    position = vec4(
      (random(uv + vec2(0.1, 0.1)) * 2.0 - 1.0),
      (random(uv + vec2(0.2, 0.2)) * 2.0 - 1.0),
      0.0,
      1.0
    );
  } else {
    // 速度場から速度を取得
    vec2 normalizedPos = position.xy * 0.5 + 0.5; // [-1,1] から [0,1] に変換
    vec2 velocity = texture(velocityFieldTexture, normalizedPos).xy;
    
    // 位置を更新
    position.xy += velocity * dt;
    
    // 境界チェック
    if (position.x < -1.0 || position.x > 1.0 || position.y < -1.0 || position.y > 1.0) {
      // 画面外に出た場合、反対側から再登場
      position.x = clamp(position.x, -1.0, 1.0) * 0.9;
      position.y = clamp(position.y, -1.0, 1.0) * 0.9;
    }
  }
  
  pc_fragColor = position;
}