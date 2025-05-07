// 発散計算シェーダー
uniform sampler2D velocityTexture;
uniform float cellSize;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // 隣接するセルの速度を取得
    vec2 vL = texture2D(velocityTexture, uv - vec2(cellSize, 0.0)).xy;
    vec2 vR = texture2D(velocityTexture, uv + vec2(cellSize, 0.0)).xy;
    vec2 vT = texture2D(velocityTexture, uv + vec2(0.0, cellSize)).xy;
    vec2 vB = texture2D(velocityTexture, uv - vec2(0.0, cellSize)).xy;
    
    // 発散を計算
    float divergence = 0.5 * ((vR.x - vL.x) + (vT.y - vB.y));
    
    gl_FragColor = vec4(divergence, 0.0, 0.0, 1.0);
}