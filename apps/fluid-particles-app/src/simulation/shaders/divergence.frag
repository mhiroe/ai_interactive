// GPUComputationRendererが自動的に追加するuniforms:
// uniform sampler2D velocityTexture;
// uniform vec2 resolution;

uniform float dt;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  // 速度場の発散を計算
  vec2 vL = texture(velocityTexture, uv - vec2(1.0 / resolution.x, 0.0)).xy;
  vec2 vR = texture(velocityTexture, uv + vec2(1.0 / resolution.x, 0.0)).xy;
  vec2 vB = texture(velocityTexture, uv - vec2(0.0, 1.0 / resolution.y)).xy;
  vec2 vT = texture(velocityTexture, uv + vec2(0.0, 1.0 / resolution.y)).xy;
  
  float divergence = ((vR.x - vL.x) + (vT.y - vB.y)) * 0.5;
  
  pc_fragColor = vec4(divergence, 0.0, 0.0, 1.0);
}