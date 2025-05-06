# 3Dアイステキスト流体ダイナミクス効果の仕様

## 概要
この仕様書では、Three.jsを使用して実装する3D氷のようなテキストエフェクトと流体ダイナミクスの統合について説明します。このエフェクトでは、半透明で結晶のような見た目のテキストオブジェクトが、流体シミュレーションの影響を受けて動的に変化します。

## 技術要件

### ライブラリ/フレームワーク
- Three.js: 3Dレンダリングエンジン
- GPUComputationRenderer: GPGPUベースの計算を実行するためのユーティリティ

### ブラウザ互換性
- WebGL 2.0をサポートするモダンブラウザ（Chrome, Firefox, Safari, Edge）
- モバイルデバイスでは簡略化されたバージョンを表示する機能

## 視覚的要素

### テキスト
- 3Dテキストジオメトリ（TextGeometry）
- カスタマイズ可能なテキスト内容
- 適切な深さと面取り設定

### 氷/結晶マテリアル
- 半透明の外観（transmission: 0.9～1.0）
- 氷のような屈折効果（ior: 1.4～1.6）
- 表面の反射/キラキラ効果（環境マップを使用）
- 微細な結晶構造の表現（法線マップを使用）
- 僅かな青みがかった色調（color: 軽い青白色）

### 流体ダイナミクス
- テキスト周辺または内部の流体シミュレーション
- マウス/タッチによるインタラクティブな流体操作
- 流体の動きに応じたテキストの屈折/歪み効果

## 技術実装詳細

### テキスト生成
```javascript
const loader = new THREE.FontLoader();
loader.load('fonts/helvetiker_bold.typeface.json', (font) => {
  const textGeometry = new THREE.TextGeometry('ICE TEXT', {
    font: font,
    size: 1,
    height: 0.2,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelSegments: 5
  });
  
  textGeometry.center();
  
  const textMesh = new THREE.Mesh(textGeometry, iceMaterial);
  scene.add(textMesh);
});
```

### 氷マテリアル定義
```javascript
const iceMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xc4f5fc,  // 薄い水色
  metalness: 0.1,
  roughness: 0.2,
  transmission: 0.95,  // 透過性
  thickness: 0.5,      // 厚さ
  ior: 1.5,            // 屈折率
  envMapIntensity: 1.0,
  clearcoat: 0.5,      // 光沢コーティング
  clearcoatRoughness: 0.1
});

// 環境マップの追加
const envMapLoader = new THREE.RGBELoader();
envMapLoader.load('textures/environment.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  iceMaterial.envMap = texture;
  scene.environment = texture;
});

// 結晶構造の法線マップ
const textureLoader = new THREE.TextureLoader();
const normalMap = textureLoader.load('textures/ice_normal_map.jpg');
iceMaterial.normalMap = normalMap;
iceMaterial.normalScale.set(0.15, 0.15);
```

### 流体シミュレーション
```javascript
// GPGPUComputationRendererの初期化
const gpuCompute = new GPUComputationRenderer(simResolution, simResolution, renderer);

// 速度およびシミュレーションテクスチャの作成
const velocityVar = gpuCompute.addVariable('textureVelocity', velocityShader, initVelocityTexture);
const positionVar = gpuCompute.addVariable('texturePosition', positionShader, initPositionTexture);

// シミュレーション変数の依存関係設定
gpuCompute.setVariableDependencies(velocityVar, [positionVar, velocityVar]);
gpuCompute.setVariableDependencies(positionVar, [positionVar, velocityVar]);

// 流体シミュレーションのユニフォーム（パラメータ）設定
const velocityUniforms = velocityVar.material.uniforms;
velocityUniforms['viscosity'] = { value: 0.95 };
velocityUniforms['force'] = { value: 0.5 };
velocityUniforms['mousePos'] = { value: new THREE.Vector3(0, 0, 0) };

// 初期化
gpuCompute.init();
```

### 流体とテキストの統合
流体シミュレーションの結果をテキストマテリアルに適用して、動的な屈折効果を生成します。これは以下の方法で実現します：

1. 流体シミュレーションのレンダリングターゲットをテクスチャとして取得
2. この動的テクスチャをテキストマテリアルの屈折/変位マップとして使用
3. シェーダー内でテクスチャの値に基づいて法線や屈折をリアルタイムで変更

```javascript
// レンダリングループ内
function animate() {
  // 流体シミュレーションを更新
  gpuCompute.compute();
  
  // 流体テクスチャを取得
  const fluidTexture = gpuCompute.getCurrentRenderTarget(velocityVar).texture;
  
  // テキストマテリアルに適用
  iceMaterial.transmissionMap = fluidTexture;
  // または
  iceMaterial.displacementMap = fluidTexture;
  iceMaterial.displacementScale = 0.05;
  
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

## パフォーマンス最適化
- モバイルデバイスでは解像度の低い流体シミュレーションを使用
- LOD（Level of Detail）を実装して、視距離に応じてジオメトリの複雑さを調整
- テクスチャサイズとシミュレーション解像度をデバイス性能に基づいて調整
- オフスクリーンレンダリングを使用して、流体シミュレーションを最適化

## ユーザーインタラクション
- マウス/タッチによる流体かき混ぜ効果
- スクロールに応じたテキストの回転や表示変更
- オプションのコントロールUIを提供して、ユーザーがエフェクトをカスタマイズ可能に

## ブラウザ互換性とフォールバック
WebGL 2.0またはGPGPUをサポートしていないブラウザでは、以下の簡略化されたバージョンを表示：
- 静的な3Dテキストと簡略化された氷マテリアル
- プリレンダリングされたアニメーションやエフェクト
- 2Dキャンバスベースの代替表現 