# パーティクルシステムの実装

このドキュメントでは、Three.jsを使用したパーティクルシステムの実装方法について詳細に説明します。

## パーティクルシステムのセットアップ

パーティクルシステムはGPU上で管理され、Three.jsのPointsを使用して描画されます。

```javascript
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

export class ParticleSystem {
  constructor(renderer, options) {
    this.renderer = renderer;
    this.particleCount = options.particleCount || 65536; // 256 * 256
    this.resolution = Math.sqrt(this.particleCount);
    
    this.gpuCompute = new GPUComputationRenderer(this.resolution, this.resolution, renderer);
    
    // テクスチャの初期化
    this.positionTexture = this.gpuCompute.createTexture();
    this.velocityTexture = this.gpuCompute.createTexture();
    this.lifeTexture = this.gpuCompute.createTexture();
    
    this.initTextures();
    this.initShaders();
    this.initParticleMesh();
  }
  
  initTextures() {
    // 位置テクスチャの初期化
    const positionData = this.positionTexture.image.data;
    for (let i = 0; i < positionData.length; i += 4) {
      // ランダムな位置を設定
      positionData[i] = (Math.random() * 2 - 1);     // x
      positionData[i + 1] = (Math.random() * 2 - 1); // y
      positionData[i + 2] = 0;                       // z
      positionData[i + 3] = 1;
    }
    
    // 寿命テクスチャの初期化
    const lifeData = this.lifeTexture.image.data;
    for (let i = 0; i < lifeData.length; i += 4) {
      // ランダムな寿命を設定
      const startTime = -Math.random() * 4.0;
      const duration = Math.random() * 5.0 + 1.0;
      lifeData[i] = startTime;     // 現在の時間
      lifeData[i + 1] = duration;  // 寿命の長さ
      lifeData[i + 2] = 0;
      lifeData[i + 3] = 1;
    }
  }
  
  initShaders() {
    // 位置更新シェーダー
    this.positionVariable = this.gpuCompute.addVariable(
      'positionTexture',
      positionShader,
      this.positionTexture
    );
    
    // 寿命更新シェーダー
    this.lifeVariable = this.gpuCompute.addVariable(
      'lifeTexture',
      lifeShader,
      this.lifeTexture
    );
    
    // 依存関係の設定
    this.gpuCompute.setVariableDependencies(this.positionVariable, [
      this.positionVariable, this.lifeVariable
    ]);
    this.gpuCompute.setVariableDependencies(this.lifeVariable, [
      this.lifeVariable
    ]);
    
    // ユニフォーム変数の設定
    this.positionUniforms = this.positionVariable.material.uniforms;
    this.positionUniforms.velocityFieldTexture = { value: null };
    this.positionUniforms.dt = { value: 0.016 };
    
    this.lifeUniforms = this.lifeVariable.material.uniforms;
    this.lifeUniforms.dt = { value: 0.016 };
    
    // GPUComputationRendererの初期化
    this.gpuCompute.init();
  }
  
  initParticleMesh() {
    // パーティクルのジオメトリ
    const geometry = new THREE.BufferGeometry();
    
    // UVを生成（テクスチャからデータを取得するため）
    const uvs = new Float32Array(this.particleCount * 2);
    for (let i = 0; i < this.resolution; i++) {
      for (let j = 0; j < this.resolution; j++) {
        const idx = i * this.resolution + j;
        uvs[idx * 2] = j / (this.resolution - 1);
        uvs[idx * 2 + 1] = i / (this.resolution - 1);
      }
    }
    
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    
    // パーティクルのマテリアル
    const material = new THREE.ShaderMaterial({
      uniforms: {
        positionTexture: { value: null },
        velocityTexture: { value: null },
        lifeTexture: { value: null }
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // パーティクルメッシュの作成
    this.particleMesh = new THREE.Points(geometry, material);
  }
  
  update(velocityFieldTexture) {
    // 速度場テクスチャの更新
    this.positionUniforms.velocityFieldTexture.value = velocityFieldTexture;
    
    // パーティクルの位置と寿命の更新
    this.gpuCompute.compute();
    
    // パーティクルメッシュのテクスチャを更新
    this.particleMesh.material.uniforms.positionTexture.value = 
      this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
    this.particleMesh.material.uniforms.lifeTexture.value = 
      this.gpuCompute.getCurrentRenderTarget(this.lifeVariable).texture;
    this.particleMesh.material.uniforms.velocityTexture.value = velocityFieldTexture;
  }
  
  dispose() {
    // リソースの解放
    this.gpuCompute.dispose();
    this.particleMesh.geometry.dispose();
    this.particleMesh.material.dispose();
  }
}
```

## Denoでの実装

Denoでは、以下のように実装することができます：

```typescript
// simulation/ParticleSystem.ts
import * as THREE from "npm:three";
import { GPUComputationRenderer } from "npm:three/examples/jsm/misc/GPUComputationRenderer";

export class ParticleSystem {
  renderer: THREE.WebGLRenderer;
  particleCount: number;
  resolution: number;
  gpuCompute: GPUComputationRenderer;
  positionTexture: THREE.DataTexture;
  velocityTexture: THREE.DataTexture;
  lifeTexture: THREE.DataTexture;
  positionVariable: any;
  lifeVariable: any;
  positionUniforms: any;
  lifeUniforms: any;
  particleMesh: THREE.Points;

  constructor(renderer: THREE.WebGLRenderer, options: { particleCount?: number }) {
    this.renderer = renderer;
    this.particleCount = options.particleCount || 65536; // 256 * 256
    this.resolution = Math.sqrt(this.particleCount);
    
    this.gpuCompute = new GPUComputationRenderer(this.resolution, this.resolution, renderer);
    
    // テクスチャの初期化
    this.positionTexture = this.gpuCompute.createTexture();
    this.velocityTexture = this.gpuCompute.createTexture();
    this.lifeTexture = this.gpuCompute.createTexture();
    
    this.initTextures();
    this.initShaders();
    this.initParticleMesh();
  }
  
  async initShaders() {
    // シェーダーの読み込み
    const positionShader = await Deno.readTextFile("./shaders/position.frag");
    const lifeShader = await Deno.readTextFile("./shaders/life.frag");
    const particleVertexShader = await Deno.readTextFile("./shaders/particle.vert");
    const particleFragmentShader = await Deno.readTextFile("./shaders/particle.frag");
    
    // 位置更新シェーダー
    this.positionVariable = this.gpuCompute.addVariable(
      'positionTexture',
      positionShader,
      this.positionTexture
    );
    
    // 寿命更新シェーダー
    this.lifeVariable = this.gpuCompute.addVariable(
      'lifeTexture',
      lifeShader,
      this.lifeTexture
    );
    
    // 依存関係の設定
    this.gpuCompute.setVariableDependencies(this.positionVariable, [
      this.positionVariable, this.lifeVariable
    ]);
    this.gpuCompute.setVariableDependencies(this.lifeVariable, [
      this.lifeVariable
    ]);
    
    // ユニフォーム変数の設定
    this.positionUniforms = this.positionVariable.material.uniforms;
    this.positionUniforms.velocityFieldTexture = { value: null };
    this.positionUniforms.dt = { value: 0.016 };
    
    this.lifeUniforms = this.lifeVariable.material.uniforms;
    this.lifeUniforms.dt = { value: 0.016 };
    
    // GPUComputationRendererの初期化
    this.gpuCompute.init();
    
    // パーティクルのマテリアル
    const material = new THREE.ShaderMaterial({
      uniforms: {
        positionTexture: { value: null },
        velocityTexture: { value: null },
        lifeTexture: { value: null }
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // パーティクルメッシュの更新
    this.particleMesh.material = material;
  }
  
  // 他のメソッドは同じ
}
```

## パーティクルシステムシェーダー

### 位置更新シェーダー (position.frag)

```glsl
uniform sampler2D positionTexture;
uniform sampler2D lifeTexture;
uniform sampler2D velocityFieldTexture;
uniform float dt;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  // 現在の位置と寿命を取得
  vec4 position = texture2D(positionTexture, uv);
  vec2 life = texture2D(lifeTexture, uv).xy;
  
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
    vec2 velocity = texture2D(velocityFieldTexture, normalizedPos).xy;
    
    // 位置を更新
    position.xy += velocity * dt;
    
    // 境界チェック
    if (position.x < -1.0 || position.x > 1.0 || position.y < -1.0 || position.y > 1.0) {
      // 画面外に出た場合、反対側から再登場
      position.x = clamp(position.x, -1.0, 1.0) * 0.9;
      position.y = clamp(position.y, -1.0, 1.0) * 0.9;
    }
  }
  
  gl_FragColor = position;
}

// 乱数生成関数
float random(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}
```

### 寿命更新シェーダー (life.frag)

```glsl
uniform sampler2D lifeTexture;
uniform float dt;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  // 現在の寿命を取得
  vec2 life = texture2D(lifeTexture, uv).xy;
  
  // 時間を進める
  life.x += dt;
  
  // 寿命が尽きたら再初期化
  if (life.x > life.y) {
    life.x = -random(uv + vec2(0.3, 0.3)) * 4.0;
    life.y = random(uv + vec2(0.4, 0.4)) * 5.0 + 1.0;
  }
  
  gl_FragColor = vec4(life, 0.0, 1.0);
}

// 乱数生成関数
float random(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}
```

### パーティクル頂点シェーダー (particle.vert)

```glsl
uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform sampler2D lifeTexture;

varying float vVelocityMagnitude;
varying float vLifeRatio;

void main() {
  vec2 uv = uv;
  
  // テクスチャから位置、速度、寿命を取得
  vec4 position = texture2D(positionTexture, uv);
  vec2 velocity = texture2D(velocityTexture, uv).xy;
  vec2 life = texture2D(lifeTexture, uv).xy;
  
  // 速度の大きさを計算
  vVelocityMagnitude = length(velocity) * 30.0;
  
  // 寿命の比率を計算
  vLifeRatio = clamp(life.x / life.y, 0.0, 1.0);
  
  // ポイントサイズを速度に基づいて調整
  gl_PointSize = mix(3.0, 1.0, clamp(vVelocityMagnitude, 0.0, 1.0));
  
  // 位置を設定
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
}
```

### パーティクル断片シェーダー (particle.frag)

```glsl
varying float vVelocityMagnitude;
varying float vLifeRatio;

void main() {
  // ポイントスプライトの形状を円形に
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  
  // 速度と寿命に基づいて色と透明度を設定
  float alpha = (1.0 - dist * 2.0) * vLifeRatio * mix(0.05, 0.9, vVelocityMagnitude);
  vec3 color = vec3(1.0);
  
  gl_FragColor = vec4(color, alpha);
}
```

## 実装のポイント

### 1. パーティクルの位置と寿命の管理

パーティクルの位置と寿命はGPU上のテクスチャとして管理されています。これにより、多数のパーティクルを効率的に処理することができます。

- **位置テクスチャ**: パーティクルの位置情報を格納
- **寿命テクスチャ**: パーティクルの現在の時間と寿命の長さを格納

### 2. パーティクルの更新

パーティクルの更新は以下の2つのステップで行われます：

1. **位置の更新**: 流体シミュレーションの速度場に基づいてパーティクルの位置を更新
2. **寿命の更新**: パーティクルの寿命を管理し、寿命が尽きたパーティクルを再初期化

### 3. パーティクルの描画

パーティクルの描画にはThree.jsのPointsを使用しています。各パーティクルは以下の特性を持ちます：

- **サイズ**: 速度の大きさに基づいて調整
- **色と透明度**: 速度と寿命に基づいて調整
- **形状**: 断片シェーダーで円形に調整

### 4. 加算合成

パーティクルの描画には加算合成（AdditiveBlending）を使用しています。これにより、パーティクルが重なった部分が明るくなり、流体の密度が高い部分が視覚的に強調されます。

このドキュメントは元の実装計画から分割されたものです。実装計画の詳細については `0_implementation-plan.md` を、流体シミュレーションの実装については `1_fluid-simulation-implementation.md` を、インタラクション管理については `3_interaction-implementation.md` を、最適化戦略については `4_optimization-strategies.md` を参照してください。