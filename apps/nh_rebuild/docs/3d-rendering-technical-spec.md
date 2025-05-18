# 3Dレンダリング技術仕様

## 概要

このドキュメントでは、WebGLを使用した3Dレンダリング、シェーダー実装、インタラクション管理、およびパフォーマンス最適化に関する技術仕様を説明します。

## 1. 3Dレンダリング基盤

### WebGLプログラム管理
- クラス `M` による統合的なWebGLコンテキスト管理
- シェーダープログラムのコンパイルと管理
- テクスチャとバッファの効率的な管理

### 主要機能
```typescript
// シェーダープログラムの作成
function createProgram(gl: WebGLRenderingContext, vertexShader: string, fragmentShader: string): WebGLProgram

// テクスチャ初期化
initTexture(name: string, width: number, height: number, type: number, data: Float32Array | null = null)

// フレームバッファ管理
initFramebufferForTexture(name: string, width: number, height: number, depth: boolean = false)
```

## 2. シェーダー実装

### 頂点シェーダー

#### 基本変換シェーダー
```glsl
attribute vec3 position;
uniform vec2 px;
varying vec2 uv;

void main(){
    uv = vec2(0.5)+(position.xy)*0.5;
    gl_Position = vec4(position, 1.0);
}
```

#### パーティクル描画シェーダー
```glsl
attribute vec2 uv;
uniform mat4 uMVMatrix;
uniform mat4 uProjectionMatrix;
uniform sampler2D uTexture;
varying vec2 vUv;
varying float velocitySize;

void main() {
    vec4 position = texture2D(uTexture, uv);
    gl_Position = position;
    vec2 velocity = texture2D(uVelocityTexture, uv).xy;
    velocitySize = length(velocity) * 30.;
    gl_PointSize = mix(3.0, 1.0, clamp(velocitySize, 0.0, 1.0));
    vUv = uv;
}
```

### フラグメントシェーダー

#### カラー計算シェーダー
```glsl
precision highp float;
uniform sampler2D velocity;
uniform sampler2D pressure;
varying vec2 uv;

void main(){
    vec3 baseColor = mix(color0, mix(color0, color2, uv.x), uAlpha);
    gl_FragColor.rgb = mix(baseColor, color1, vec3(rate * uAlpha));
    gl_FragColor.a = 1.0;
}
```

## 3. インタラクション管理

### パーティクルシステム
- クラス `ef` によるパーティクル制御
- デバイス検出と最適化
- イベントハンドリング

```typescript
class ParticleSystem {
    constructor(gl: WebGLRenderingContext, options: ParticleSystemOptions) {
        this.gl = gl;
        this.isIOS = detectIOS(options);
        this.gpu = options.gpu;
        // ...
    }
}
```

## 4. パフォーマンス最適化

### デバイス別最適化
```typescript
// デバイス検出
const detectDevice = (options) => {
    const isAppleGPU = options.gpu && options.gpu.includes("Apple");
    return /(iPad|iPhone|iPod)/g.test(navigator.userAgent) || isAppleGPU;
};

// パーティクル数の動的調整
if (device.platform.type === "desktop") {
    this.side = gpu.tier === "high" ? 320 : gpu.tier === "normal" ? 300 : 280;
} else {
    this.side = gpu.tier === "high" ? 160 : 120;
}
```

### メモリ最適化
- テクスチャとバッファの再利用
- シェーダーの条件分岐最適化
- GPUメモリ使用量の制御

## 5. 技術的な制約と考慮事項

### デバイス互換性
- iOS/iPadOSデバイスでの特別な処理
- 異なるGPU性能への対応
- モバイルデバイスでのメモリ使用量制限

### パフォーマンス目標
- デスクトップ: 60 FPS
- モバイル: 30 FPS以上
- メモリ使用量: 最大100MB以下