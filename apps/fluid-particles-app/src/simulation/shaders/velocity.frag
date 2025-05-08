// 速度場の更新シェーダー
uniform vec2 mousePos;
uniform vec2 mouseDelta;
uniform float dt;
uniform float dissipation;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 velocity = texture2D(velocityTexture, uv).xy;
    
    // マウスの影響を計算
    float influence = exp(-distance(uv, mousePos) * 10.0);
    velocity += mouseDelta * influence * 0.5;
    
    // 減衰を適用
    velocity *= dissipation;
    
    gl_FragColor = vec4(velocity, 0.0, 1.0);
}