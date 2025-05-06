# 流体シミュレーションの実装

このドキュメントでは、Three.jsを使用した流体シミュレーションの実装方法について詳細に説明します。

## GPUComputationRendererのセットアップ

流体シミュレーションはGPU上で実行するため、Three.jsのGPUComputationRendererを使用します。

```javascript
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

export class FluidSimulation {
  constructor(renderer, resolution) {
    this.resolution = resolution;
    this.gpuCompute = new GPUComputationRenderer(resolution, resolution, renderer);
    
    // テクスチャの初期化
    this.velocityTexture = this.gpuCompute.createTexture();
    this.pressureTexture = this.gpuCompute.createTexture();
    this.divergenceTexture = this.gpuCompute.createTexture();
    
    this.initTextures();
    this.initShaders();
  }
  
  initTextures() {
    // 速度テクスチャの初期化
    const velocityData = this.velocityTexture.image.data;
    for (let i = 0; i < velocityData.length; i += 4) {
      velocityData[i] = 0;     // x方向の速度
      velocityData[i + 1] = 0; // y方向の速度
      velocityData[i + 2] = 0;
      velocityData[i + 3] = 1;
    }
    
    // 圧力テクスチャの初期化
    const pressureData = this.pressureTexture.image.data;
    for (let i = 0; i < pressureData.length; i += 4) {
      pressureData[i] = 0;
      pressureData[i + 1] = 0;
      pressureData[i + 2] = 0;
      pressureData[i + 3] = 1;
    }
  }
  
  initShaders() {
    // 速度更新シェーダー
    this.velocityVariable = this.gpuCompute.addVariable(
      'velocityTexture',
      velocityShader,
      this.velocityTexture
    );
    
    // 発散計算シェーダー
    this.divergenceVariable = this.gpuCompute.addVariable(
      'divergenceTexture',
      divergenceShader,
      this.divergenceTexture
    );
    
    // 圧力計算シェーダー
    this.pressureVariable = this.gpuCompute.addVariable(
      'pressureTexture',
      pressureShader,
      this.pressureTexture
    );
    
    // 依存関係の設定
    this.gpuCompute.setVariableDependencies(this.velocityVariable, [
      this.velocityVariable, this.pressureVariable
    ]);
    this.gpuCompute.setVariableDependencies(this.divergenceVariable, [
      this.velocityVariable
    ]);
    this.gpuCompute.setVariableDependencies(this.pressureVariable, [
      this.pressureVariable, this.divergenceVariable
    ]);
    
    // ユニフォーム変数の設定
    this.velocityUniforms = this.velocityVariable.material.uniforms;
    this.velocityUniforms.mousePos = { value: new THREE.Vector2(0, 0) };
    this.velocityUniforms.mouseDelta = { value: new THREE.Vector2(0, 0) };
    this.velocityUniforms.dt = { value: 0.016 };
    
    this.divergenceUniforms = this.divergenceVariable.material.uniforms;
    this.divergenceUniforms.dx = { value: 1.0 / this.resolution };
    
    this.pressureUniforms = this.pressureVariable.material.uniforms;
    this.pressureUniforms.alpha = { value: -1.0 };
    this.pressureUniforms.beta = { value: 0.25 };
    
    // GPUComputationRendererの初期化
    this.gpuCompute.init();
  }
  
  update(mousePos, mouseDelta) {
    // マウス位置と移動量の更新
    this.velocityUniforms.mousePos.value.copy(mousePos);
    this.velocityUniforms.mouseDelta.value.copy(mouseDelta);
    
    // 流体シミュレーションの更新
    // 1. 速度場の更新
    this.gpuCompute.compute();
    
    // 2. 発散の計算
    this.divergenceVariable.material.uniforms.velocityTexture = { 
      value: this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture 
    };
    this.gpuCompute.compute();
    
    // 3. 圧力の計算（複数回の反復）
    for (let i = 0; i < 10; i++) {
      this.pressureVariable.material.uniforms.divergenceTexture = { 
        value: this.gpuCompute.getCurrentRenderTarget(this.divergenceVariable).texture 
      };
      this.gpuCompute.compute();
    }
    
    // 4. 速度場の修正
    this.velocityVariable.material.uniforms.pressureTexture = { 
      value: this.gpuCompute.getCurrentRenderTarget(this.pressureVariable).texture 
    };
    this.gpuCompute.compute();
    
    return this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture;
  }
  
  dispose() {
    // リソースの解放
    this.gpuCompute.dispose();
  }
}
```

## Denoでの実装

Denoでは、以下のように実装することができます：

```typescript
// simulation/FluidSimulation.ts
import * as THREE from "npm:three";
import { GPUComputationRenderer } from "npm:three/examples/jsm/misc/GPUComputationRenderer";

export class FluidSimulation {
  resolution: number;
  gpuCompute: GPUComputationRenderer;
  velocityTexture: THREE.DataTexture;
  pressureTexture: THREE.DataTexture;
  divergenceTexture: THREE.DataTexture;
  velocityVariable: any;
  divergenceVariable: any;
  pressureVariable: any;
  velocityUniforms: any;
  divergenceUniforms: any;
  pressureUniforms: any;

  constructor(renderer: THREE.WebGLRenderer, resolution: number) {
    this.resolution = resolution;
    this.gpuCompute = new GPUComputationRenderer(resolution, resolution, renderer);
    
    // テクスチャの初期化
    this.velocityTexture = this.gpuCompute.createTexture();
    this.pressureTexture = this.gpuCompute.createTexture();
    this.divergenceTexture = this.gpuCompute.createTexture();
    
    this.initTextures();
    this.initShaders();
  }
  
  async initShaders() {
    // シェーダーの読み込み
    const velocityShader = await Deno.readTextFile("./shaders/velocity.frag");
    const divergenceShader = await Deno.readTextFile("./shaders/divergence.frag");
    const pressureShader = await Deno.readTextFile("./shaders/pressure.frag");
    
    // 速度更新シェーダー
    this.velocityVariable = this.gpuCompute.addVariable(
      'velocityTexture',
      velocityShader,
      this.velocityTexture
    );
    
    // 発散計算シェーダー
    this.divergenceVariable = this.gpuCompute.addVariable(
      'divergenceTexture',
      divergenceShader,
      this.divergenceTexture
    );
    
    // 圧力計算シェーダー
    this.pressureVariable = this.gpuCompute.addVariable(
      'pressureTexture',
      pressureShader,
      this.pressureTexture
    );
    
    // 依存関係の設定
    this.gpuCompute.setVariableDependencies(this.velocityVariable, [
      this.velocityVariable, this.pressureVariable
    ]);
    this.gpuCompute.setVariableDependencies(this.divergenceVariable, [
      this.velocityVariable
    ]);
    this.gpuCompute.setVariableDependencies(this.pressureVariable, [
      this.pressureVariable, this.divergenceVariable
    ]);
    
    // ユニフォーム変数の設定
    this.velocityUniforms = this.velocityVariable.material.uniforms;
    this.velocityUniforms.mousePos = { value: new THREE.Vector2(0, 0) };
    this.velocityUniforms.mouseDelta = { value: new THREE.Vector2(0, 0) };
    this.velocityUniforms.dt = { value: 0.016 };
    
    this.divergenceUniforms = this.divergenceVariable.material.uniforms;
    this.divergenceUniforms.dx = { value: 1.0 / this.resolution };
    
    this.pressureUniforms = this.pressureVariable.material.uniforms;
    this.pressureUniforms.alpha = { value: -1.0 };
    this.pressureUniforms.beta = { value: 0.25 };
    
    // GPUComputationRendererの初期化
    this.gpuCompute.init();
  }
  
  // 他のメソッドは同じ
}
```

## 流体シミュレーションシェーダー

### 速度更新シェーダー (velocity.frag)

```glsl
uniform sampler2D velocityTexture;
uniform sampler2D pressureTexture;
uniform vec2 mousePos;
uniform vec2 mouseDelta;
uniform float dt;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  // 現在の速度を取得
  vec2 velocity = texture2D(velocityTexture, uv).xy;
  
  // マウスの影響を計算
  vec2 mouseVec = mousePos - uv;
  float mouseDist = length(mouseVec);
  float mouseInfluence = exp(-mouseDist * 10.0);
  vec2 mouseForce = mouseDelta * 20.0 * mouseInfluence;
  
  // 圧力勾配を計算
  float p0 = texture2D(pressureTexture, uv - vec2(1.0/resolution.x, 0.0)).x;
  float p1 = texture2D(pressureTexture, uv + vec2(1.0/resolution.x, 0.0)).x;
  float p2 = texture2D(pressureTexture, uv - vec2(0.0, 1.0/resolution.y)).x;
  float p3 = texture2D(pressureTexture, uv + vec2(0.0, 1.0/resolution.y)).x;
  
  vec2 pressureGradient = vec2(p1 - p0, p3 - p2) * 0.5;
  
  // 速度を更新
  velocity = velocity + mouseForce - pressureGradient;
  
  // 減衰を適用
  velocity *= 0.99;
  
  // 境界条件の適用
  if (uv.x < 0.01 || uv.x > 0.99 || uv.y < 0.01 || uv.y > 0.99) {
    velocity = vec2(0.0);
  }
  
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
```

### 発散計算シェーダー (divergence.frag)

```glsl
uniform sampler2D velocityTexture;
uniform float dx;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  // 周囲の速度を取得
  vec2 vL = texture2D(velocityTexture, uv - vec2(dx, 0.0)).xy;
  vec2 vR = texture2D(velocityTexture, uv + vec2(dx, 0.0)).xy;
  vec2 vB = texture2D(velocityTexture, uv - vec2(0.0, dx)).xy;
  vec2 vT = texture2D(velocityTexture, uv + vec2(0.0, dx)).xy;
  
  // 発散を計算
  float divergence = 0.5 * ((vR.x - vL.x) + (vT.y - vB.y));
  
  gl_FragColor = vec4(divergence, 0.0, 0.0, 1.0);
}
```

### 圧力計算シェーダー (pressure.frag)

```glsl
uniform sampler2D pressureTexture;
uniform sampler2D divergenceTexture;
uniform float alpha;
uniform float beta;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  // 周囲の圧力を取得
  float pL = texture2D(pressureTexture, uv - vec2(1.0/resolution.x, 0.0)).x;
  float pR = texture2D(pressureTexture, uv + vec2(1.0/resolution.x, 0.0)).x;
  float pB = texture2D(pressureTexture, uv - vec2(0.0, 1.0/resolution.y)).x;
  float pT = texture2D(pressureTexture, uv + vec2(0.0, 1.0/resolution.y)).x;
  
  // 発散を取得
  float divergence = texture2D(divergenceTexture, uv).x;
  
  // ヤコビ法による圧力の計算
  float pressure = (pL + pR + pB + pT + alpha * divergence) * beta;
  
  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
```

## 実装のポイント

### 1. 流体シミュレーションのステップ

流体シミュレーションは以下の4つのステップで実装されています：

1. **速度場の更新**: マウスの動きや前のフレームの速度に基づいて速度場を更新
2. **発散の計算**: 速度場の発散を計算
3. **圧力の計算**: 発散に基づいて圧力を計算（ポアソン方程式の解法）
4. **速度場の修正**: 圧力勾配に基づいて速度場を修正（非圧縮性の確保）

### 2. ヤコビ法による圧力計算

圧力計算には反復法の一種であるヤコビ法を使用しています。これにより、ポアソン方程式を数値的に解いています。反復回数を増やすと精度が向上しますが、計算コストも増加します。

### 3. 境界条件の処理

シミュレーション領域の境界では、速度をゼロに設定することで壁の効果を表現しています。これにより、流体が画面の端で反射するような挙動を実現しています。

### 4. マウスの影響

マウスの位置と移動量に基づいて流体に力を加えています。マウスからの距離に応じて影響力が減衰するようにしています。

このドキュメントは元の実装計画から分割されたものです。実装計画の詳細については `0_implementation-plan.md` を、パーティクルシステムの実装については `2_particle-system-implementation.md` を、インタラクション管理については `3_interaction-implementation.md` を、最適化戦略については `4_optimization-strategies.md` を参照してください。