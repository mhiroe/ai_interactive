uniform vec2 mousePos;
uniform vec2 mouseDelta;
uniform float dt;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  // 現在の速度を取得
  vec2 velocity = texture(velocityTexture, uv).xy;
  
  // マウスの影響を計算
  vec2 mouseVec = mousePos - uv;
  float mouseDist = length(mouseVec);
  float mouseInfluence = exp(-mouseDist * 10.0);
  vec2 mouseForce = mouseDelta * 30.0 * mouseInfluence;
  
  // 圧力勾配を計算
  float pressure = texture(pressureTexture, uv).x;
  float pL = texture(pressureTexture, uv - vec2(1.0 / resolution.x, 0.0)).x;
  float pR = texture(pressureTexture, uv + vec2(1.0 / resolution.x, 0.0)).x;
  float pB = texture(pressureTexture, uv - vec2(0.0, 1.0 / resolution.y)).x;
  float pT = texture(pressureTexture, uv + vec2(0.0, 1.0 / resolution.y)).x;
  
  vec2 pressureGradient = vec2(pR - pL, pT - pB) * 0.5;
  
  // 速度を更新
  velocity += mouseForce * dt;
  velocity -= pressureGradient * dt;
  
  // 減衰を適用
  velocity *= 0.99;
  
  pc_fragColor = vec4(velocity, 0.0, 1.0);
}