# 流体パーティクルシステムの最適化戦略

このドキュメントでは、Three.jsを使用した流体パーティクルシステムのパフォーマンス最適化戦略について詳細に説明します。

## パフォーマンス最適化の重要性

流体シミュレーションとパーティクルシステムは計算負荷が高く、特にモバイルデバイスやローエンドのコンピュータでは、最適化が不十分な場合にパフォーマンスの問題が発生する可能性があります。適切な最適化戦略を実装することで、より広範なデバイスで滑らかな体験を提供することができます。

## デバイス性能の検出と適応

### デバイスの種類と性能の検出

```javascript
// デバイスの種類を検出
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// GPUの性能を推定（ピクセル比を使用）
const gpuPerformance = window.devicePixelRatio > 1 ? 'high' : 'low';

// 画面サイズに基づく調整
const isSmallScreen = window.innerWidth < 768 || window.innerHeight < 768;
```

### 解像度の動的調整

デバイスの性能に応じてシミュレーションの解像度とパーティクル数を調整します。

```javascript
function adjustResolutionForDevice() {
  let resolution = 256; // デフォルト解像度
  let particleCount = 256 * 256; // デフォルトパーティクル数
  
  // モバイルデバイスの場合
  if (isMobile) {
    resolution = 128;
    particleCount = 128 * 128;
  }
  
  // 低性能GPUの場合
  if (gpuPerformance === 'low') {
    resolution = Math.min(resolution, 128);
    particleCount = Math.min(particleCount, 128 * 128);
  }
  
  // 小さい画面の場合
  if (isSmallScreen) {
    resolution = Math.min(resolution, 128);
    particleCount = Math.min(particleCount, 128 * 128);
  }
  
  return { resolution, particleCount };
}
```

### フレームレートの監視と動的調整

実行時にフレームレートを監視し、パフォーマンスが低下した場合に設定を調整します。

```javascript
class PerformanceMonitor {
  constructor(targetFPS = 30) {
    this.targetFPS = targetFPS;
    this.fpsHistory = [];
    this.lastTime = 0;
    this.adjustmentNeeded = false;
  }
  
  update(currentTime) {
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
      return false;
    }
    
    const deltaTime = currentTime - this.lastTime;
    const currentFPS = 1000 / deltaTime;
    
    this.fpsHistory.push(currentFPS);
    if (this.fpsHistory.length > 30) {
      this.fpsHistory.shift();
    }
    
    const averageFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    
    this.lastTime = currentTime;
    this.adjustmentNeeded = averageFPS < this.targetFPS;
    
    return this.adjustmentNeeded;
  }
}

// 使用例
const performanceMonitor = new PerformanceMonitor();

function animate(currentTime) {
  requestAnimationFrame(animate);
  
  if (performanceMonitor.update(currentTime) && !hasAdjustedSettings) {
    // パフォーマンスが低下している場合、設定を調整
    reduceSimulationQuality();
    hasAdjustedSettings = true;
  }
  
  // 通常の更新処理
  fluidParticleSystem.update();
  renderer.render(scene, camera);
}
```

## Denoでの実装

Denoでは、以下のように実装することができます：

```typescript
// utils/performanceMonitor.ts
export class PerformanceMonitor {
  targetFPS: number;
  fpsHistory: number[];
  lastTime: number;
  adjustmentNeeded: boolean;
  
  constructor(targetFPS = 30) {
    this.targetFPS = targetFPS;
    this.fpsHistory = [];
    this.lastTime = 0;
    this.adjustmentNeeded = false;
  }
  
  update(currentTime: number): boolean {
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
      return false;
    }
    
    const deltaTime = currentTime - this.lastTime;
    const currentFPS = 1000 / deltaTime;
    
    this.fpsHistory.push(currentFPS);
    if (this.fpsHistory.length > 30) {
      this.fpsHistory.shift();
    }
    
    const averageFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    
    this.lastTime = currentTime;
    this.adjustmentNeeded = averageFPS < this.targetFPS;
    
    return this.adjustmentNeeded;
  }
}

// utils/deviceDetection.ts
export function detectDeviceCapabilities() {
  // デバイスの種類を検出
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // GPUの性能を推定（ピクセル比を使用）
  const gpuPerformance = window.devicePixelRatio > 1 ? 'high' : 'low';
  
  // 画面サイズに基づく調整
  const isSmallScreen = window.innerWidth < 768 || window.innerHeight < 768;
  
  return { isMobile, gpuPerformance, isSmallScreen };
}
```

## 流体シミュレーションの最適化

### 計算の効率化

#### 圧力計算の反復回数の調整

圧力計算の精度とパフォーマンスのバランスを取るために、反復回数を調整します。

```javascript
// 高性能デバイス用の設定
const highPerformanceIterations = 20;

// 低性能デバイス用の設定
const lowPerformanceIterations = 10;

// デバイス性能に応じて反復回数を選択
const pressureIterations = gpuPerformance === 'high' ? highPerformanceIterations : lowPerformanceIterations;

// 圧力計算の実装
for (let i = 0; i < pressureIterations; i++) {
  // 圧力計算の反復
  // ...
}
```

#### 部分的な更新

画面の一部のみが変化している場合、全体を更新する必要はありません。変化のある領域のみを更新することでパフォーマンスを向上させることができます。

```javascript
// マウスの影響範囲を計算
const mouseInfluenceRadius = 0.3; // 正規化された座標での半径

// マウスの位置に基づいて更新が必要な領域を判断
function shouldUpdateRegion(uv, mousePos) {
  const dx = uv.x - mousePos.x;
  const dy = uv.y - mousePos.y;
  const distSquared = dx * dx + dy * dy;
  return distSquared < mouseInfluenceRadius * mouseInfluenceRadius;
}
```

#### 計算の簡略化

モバイルデバイスなどの低性能デバイスでは、簡略化されたシミュレーションを使用することでパフォーマンスを向上させることができます。

```javascript
// 簡略化された速度更新シェーダー
const simplifiedVelocityShader = `
  uniform sampler2D velocityTexture;
  uniform vec2 mousePos;
  uniform vec2 mouseDelta;
  
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // 現在の速度を取得
    vec2 velocity = texture2D(velocityTexture, uv).xy;
    
    // マウスの影響を計算（簡略化）
    vec2 mouseVec = mousePos - uv;
    float mouseDist = length(mouseVec);
    float mouseInfluence = exp(-mouseDist * 5.0); // 減衰を弱める
    vec2 mouseForce = mouseDelta * 10.0 * mouseInfluence;
    
    // 速度を更新（圧力計算を省略）
    velocity = velocity + mouseForce;
    
    // 減衰を適用
    velocity *= 0.95; // 強めの減衰
    
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;
```

## パーティクルシステムの最適化

### レンダリングの最適化

#### 透明度ソートの最適化

透明なパーティクルの描画順序を最適化することで、レンダリング品質を向上させることができます。

```javascript
// 透明度ソートの設定
const material = new THREE.ShaderMaterial({
  // ...
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  // ...
});

// レンダラーの設定
renderer.sortObjects = true;
```

#### ポイントスプライトの使用

複雑なジオメトリの代わりにポイントスプライトを使用することで、レンダリングパフォーマンスを向上させることができます。

```javascript
// ポイントスプライトの最適化
const material = new THREE.ShaderMaterial({
  // ...
  vertexShader: `
    // ...
    void main() {
      // ...
      // ポイントサイズを最適化
      gl_PointSize = mix(2.0, 1.0, clamp(vVelocityMagnitude, 0.0, 1.0));
      // ...
    }
  `,
  // ...
});
```

#### シェーダーの最適化

条件分岐を減らし、計算を簡略化することでシェーダーのパフォーマンスを向上させることができます。

```javascript
// 最適化されたパーティクル断片シェーダー
const optimizedParticleFragmentShader = `
  varying float vVelocityMagnitude;
  varying float vLifeRatio;
  
  void main() {
    // 円形マスクの計算を簡略化
    float dist = length(gl_PointCoord - 0.5) * 2.0;
    if (dist > 1.0) discard;
    
    // 透明度計算を簡略化
    float alpha = (1.0 - dist) * vLifeRatio * vVelocityMagnitude;
    
    // 色計算を簡略化
    vec3 color = vec3(1.0);
    
    gl_FragColor = vec4(color, alpha);
  }
`;
```

### パーティクル数の最適化

#### 適応的なパーティクル数

デバイスの性能に応じてパーティクル数を動的に調整します。

```javascript
function calculateOptimalParticleCount() {
  // 基本パーティクル数
  let particleCount = 256 * 256;
  
  // デバイス性能に応じて調整
  if (isMobile) {
    particleCount = 128 * 128;
  }
  
  // フレームレートに応じて調整
  if (performanceMonitor.adjustmentNeeded) {
    particleCount = Math.floor(particleCount * 0.75);
  }
  
  // 最小値を確保
  particleCount = Math.max(particleCount, 64 * 64);
  
  return particleCount;
}
```

#### 画面外パーティクルの最適化

画面外のパーティクルの更新を省略または簡略化することでパフォーマンスを向上させることができます。

```javascript
// 画面外パーティクルの最適化シェーダー
const optimizedPositionShader = `
  // ...
  void main() {
    // ...
    // 画面外のパーティクルの更新を簡略化
    if (position.x < -1.2 || position.x > 1.2 || position.y < -1.2 || position.y > 1.2) {
      // 画面外のパーティクルは単純な動きのみ
      position.xy += velocity * dt * 0.5;
    } else {
      // 画面内のパーティクルは通常通り更新
      // ...
    }
    // ...
  }
`;
```

## メモリ使用量の最適化

### テクスチャサイズの最適化

必要最小限のテクスチャサイズを使用することでメモリ使用量を削減できます。

```javascript
// テクスチャサイズの最適化
function getOptimalTextureSize() {
  // デバイス性能に応じてテクスチャサイズを調整
  if (gpuPerformance === 'high') {
    return 1024;
  } else if (isMobile) {
    return 512;
  } else {
    return 768;
  }
}
```

### データ形式の最適化

必要な精度に応じてデータ形式を選択することでメモリ使用量を削減できます。

```javascript
// データ形式の最適化
const renderer = new THREE.WebGLRenderer({
  antialias: gpuPerformance === 'high', // 高性能デバイスのみアンチエイリアスを有効化
  alpha: true,
  precision: isMobile ? 'mediump' : 'highp' // モバイルデバイスでは中精度を使用
});
```

### リソースの再利用

可能な限りリソースを再利用し、新しい割り当てを最小限に抑えることでメモリ使用量を削減できます。

```javascript
// リソースの再利用
class ResourceManager {
  constructor() {
    this.textures = new Map();
    this.geometries = new Map();
    this.materials = new Map();
  }
  
  getTexture(key, createFunc) {
    if (!this.textures.has(key)) {
      this.textures.set(key, createFunc());
    }
    return this.textures.get(key);
  }
  
  // 同様にジオメトリとマテリアルも管理
  // ...
  
  dispose() {
    // 不要になったリソースを解放
    this.textures.forEach(texture => texture.dispose());
    this.geometries.forEach(geometry => geometry.dispose());
    this.materials.forEach(material => material.dispose());
    
    this.textures.clear();
    this.geometries.clear();
    this.materials.clear();
  }
}
```

## 非表示時の最適化

ページが非表示になっている場合（別のタブに切り替えた場合など）、シミュレーションの更新頻度を下げることでバッテリー消費を抑えることができます。

```javascript
// 非表示時の最適化
let isPageVisible = true;

document.addEventListener('visibilitychange', () => {
  isPageVisible = document.visibilityState === 'visible';
});

// アニメーションループ内で使用
function animate() {
  requestAnimationFrame(animate);
  
  // ページが非表示の場合、更新頻度を下げる
  if (!isPageVisible) {
    // フレームをスキップ
    if (Math.random() > 0.1) return; // 90%の確率でフレームをスキップ
  }
  
  // 通常の更新処理
  fluidParticleSystem.update();
  renderer.render(scene, camera);
}
```

## 最適化の適用タイミング

最適化は以下のタイミングで適用することを推奨します：

1. **初期化時**: デバイスの性能に基づいて初期設定を調整
2. **実行時**: フレームレートを監視し、必要に応じて設定を動的に調整
3. **リサイズ時**: 画面サイズの変更に応じて設定を調整
4. **バッテリー状態の変化時**: バッテリー残量が少ない場合は省電力モードに切り替え

```javascript
// バッテリー状態の監視
navigator.getBattery().then(battery => {
  function updateBatteryStatus() {
    const isLowBattery = battery.level < 0.2 && !battery.charging;
    if (isLowBattery) {
      // 省電力モードに切り替え
      enablePowerSavingMode();
    } else {
      // 通常モードに戻す
      disablePowerSavingMode();
    }
  }
  
  battery.addEventListener('levelchange', updateBatteryStatus);
  battery.addEventListener('chargingchange', updateBatteryStatus);
  
  updateBatteryStatus();
});
```

このドキュメントは元の実装計画から分割されたものです。実装計画の詳細については `0_implementation-plan.md` を、流体シミュレーションの実装については `1_fluid-simulation-implementation.md` を、パーティクルシステムの実装については `2_particle-system-implementation.md` を、インタラクション管理については `3_interaction-implementation.md` を参照してください。