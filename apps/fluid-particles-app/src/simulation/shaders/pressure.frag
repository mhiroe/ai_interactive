// GPUComputationRendererが自動的に追加するuniforms:
// uniform sampler2D pressureTexture;
// uniform sampler2D divergenceTexture;
// uniform vec2 resolution;

uniform float dt;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  // 周囲の圧力を取得
  float pL = texture(pressureTexture, uv - vec2(1.0 / resolution.x, 0.0)).x;
  float pR = texture(pressureTexture, uv + vec2(1.0 / resolution.x, 0.0)).x;
  float pB = texture(pressureTexture, uv - vec2(0.0, 1.0 / resolution.y)).x;
  float pT = texture(pressureTexture, uv + vec2(0.0, 1.0 / resolution.y)).x;
  
  // 発散を取得
  float divergence = texture(divergenceTexture, uv).x;
  
  // ポアソン方程式を解く（ヤコビ法）
  float pressure = (pL + pR + pB + pT - divergence) * 0.25;
  
  pc_fragColor = vec4(pressure, 0.0, 0.0, 1.0);
}