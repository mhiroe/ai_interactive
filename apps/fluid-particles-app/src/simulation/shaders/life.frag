// GPUComputationRendererが自動的に追加するuniforms:
// uniform sampler2D lifeTexture;
// uniform vec2 resolution;

uniform float dt;

// 乱数生成関数
float random(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  // 現在の寿命を取得
  vec2 life = texture(lifeTexture, uv).xy;
  
  // 時間を進める
  life.x += dt;
  
  // 寿命が尽きたら再初期化
  if (life.x > life.y) {
    life.x = -random(uv + vec2(0.3, 0.3)) * 4.0;
    life.y = random(uv + vec2(0.4, 0.4)) * 5.0 + 1.0;
  }
  
  gl_FragColor = vec4(life, 0.0, 1.0);
}