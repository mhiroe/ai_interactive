// 圧力計算シェーダー
uniform sampler2D pressureTexture;
uniform sampler2D divergenceTexture;
uniform float cellSize;
uniform float alpha;
uniform float beta;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // 隣接するセルの圧力を取得
    float pL = texture2D(pressureTexture, uv - vec2(cellSize, 0.0)).x;
    float pR = texture2D(pressureTexture, uv + vec2(cellSize, 0.0)).x;
    float pT = texture2D(pressureTexture, uv + vec2(0.0, cellSize)).x;
    float pB = texture2D(pressureTexture, uv - vec2(0.0, cellSize)).x;
    
    // 発散を取得
    float divergence = texture2D(divergenceTexture, uv).x;
    
    // 圧力を計算
    float pressure = (pL + pR + pT + pB - divergence * alpha) * beta;
    
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}