# 3Dアイステキスト流体効果：技術仕様（Deno版）

## 概要
この仕様書では、Denoを使用して実装する3D氷のようなテキストエフェクトと流体ダイナミクスの統合について説明します。このエフェクトでは、半透明で結晶のような見た目のテキストオブジェクトが、流体シミュレーションの影響を受けて動的に変化します。

## 基本アーキテクチャ

### 開発環境
- **ランタイム**: Deno（TypeScriptネイティブサポート）
- **ビルドツール**: Deno標準ライブラリ
- **バージョン管理**: Git
- **ホスティング**: GitHub Pages

### フロントエンド
- **3Dレンダリング**: Three.js（CDN経由）
- **シェーダー言語**: GLSL
- **コンピュテーションライブラリ**: Three.js GPUComputationRenderer
- **アニメーション**: requestAnimationFrame

## プロジェクト構造

```
ice_text_effect/
├── .github/               # GitHub Actions ワークフロー
│   └── workflows/         # デプロイ自動化
├── src/
│   ├── main.ts            # メインアプリケーションコード
│   ├── index.html         # エントリーポイント
│   ├── types/             # TypeScript型定義
│   ├── shaders/           # GLSLシェーダーファイル
│   │   ├── velocity.glsl  # 流体速度計算シェーダー
│   │   ├── position.glsl  # 位置計算シェーダー
│   │   └── material.glsl  # 氷マテリアルシェーダー
│   ├── utils/             # ユーティリティ関数
│   │   ├── webgl.ts       # WebGL関連ヘルパー
│   │   └── performance.ts # パフォーマンス最適化
│   └── assets/            # テクスチャ、フォント等
│       ├── textures/      # 環境マップ、法線マップ
│       └── fonts/         # Threeで使用するフォント
├── deno.json              # Deno設定ファイル
├── import_map.json        # インポートマップ
├── server.ts              # 開発サーバー
└── README.md              # プロジェクト説明
```

## 技術詳細

### Denoセットアップ
```json
// deno.json
{
  "tasks": {
    "dev": "deno run --allow-net --allow-read --allow-env server.ts",
    "build": "deno run --allow-read --allow-write --allow-env build.ts",
    "deploy": "deno run --allow-read --allow-write --allow-env --allow-run deploy.ts"
  },
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext", "deno.ns"],
    "strict": true
  }
}
```

```json
// import_map.json
{
  "imports": {
    "three": "https://esm.sh/three@0.154.0",
    "three/examples/": "https://esm.sh/three@0.154.0/examples/",
    "three/addons/": "https://esm.sh/three@0.154.0/examples/jsm/"
  }
}
```

### ビルドプロセス
1. TypeScriptファイルの型チェック
2. 静的アセットのコピー
3. HTMLとCSSのバンドル
4. GitHub Pages用のCNAMEファイル生成（必要な場合）

### デプロイメント
GitHub Actionsを使用して、mainブランチへのプッシュ時に自動ビルド・デプロイを設定

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x
      - name: Build
        run: deno task build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

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
```typescript
import * as THREE from "three";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";

function createText(scene: THREE.Scene, material: THREE.Material): Promise<THREE.Mesh> {
  return new Promise((resolve) => {
    const loader = new FontLoader();
    loader.load('assets/fonts/helvetiker_bold.typeface.json', (font) => {
      const textGeometry = new TextGeometry('ICE TEXT', {
        font,
        size: 1,
        height: 0.2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelSegments: 5
      });
      
      textGeometry.center();
      
      const textMesh = new THREE.Mesh(textGeometry, material);
      scene.add(textMesh);
      resolve(textMesh);
    });
  });
}
```

### 氷マテリアル定義
```typescript
import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

async function createIceMaterial(scene: THREE.Scene): Promise<THREE.MeshPhysicalMaterial> {
  // 環境マップのロード
  const rgbeLoader = new RGBELoader();
  const texture = await new Promise<THREE.Texture>((resolve) => {
    rgbeLoader.load('assets/textures/environment.hdr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      resolve(texture);
    });
  });
  
  scene.environment = texture;
  
  // 氷マテリアルの作成
  const iceMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xc4f5fc,  // 薄い水色
    metalness: 0.1,
    roughness: 0.2,
    transmission: 0.95,  // 透過性
    thickness: 0.5,      // 厚さ
    ior: 1.5,            // 屈折率
    envMap: texture,
    envMapIntensity: 1.0,
    clearcoat: 0.5,      // 光沢コーティング
    clearcoatRoughness: 0.1,
    transparent: true
  });
  
  // 結晶構造の法線マップ
  const textureLoader = new THREE.TextureLoader();
  const normalMap = await new Promise<THREE.Texture>((resolve) => {
    textureLoader.load('assets/textures/ice_normal_map.jpg', resolve);
  });
  
  iceMaterial.normalMap = normalMap;
  iceMaterial.normalScale.set(0.15, 0.15);
  
  return iceMaterial;
}
```

### 流体シミュレーション
```typescript
import * as THREE from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";

interface SimulationParams {
  simResolution: number;
  viscosity: number;
  force: number;
}

class FluidSimulation {
  private gpuCompute: GPUComputationRenderer;
  private velocityVariable: any;
  private positionVariable: any;
  private renderer: THREE.WebGLRenderer;
  private params: SimulationParams;
  private mousePos: THREE.Vector3;
  
  constructor(renderer: THREE.WebGLRenderer, params: SimulationParams) {
    this.renderer = renderer;
    this.params = params;
    this.mousePos = new THREE.Vector3(0, 0, 0);
    this.initialize();
  }
  
  private initialize(): void {
    const { simResolution, viscosity, force } = this.params;
    
    // GPUComputationRendererの作成
    this.gpuCompute = new GPUComputationRenderer(simResolution, simResolution, this.renderer);
    
    // テクスチャの初期化
    const initVelocityTexture = this.gpuCompute.createTexture();
    const initPositionTexture = this.gpuCompute.createTexture();
    
    this.initTextureData(initVelocityTexture, initPositionTexture);
    
    // シェーダーファイルの読み込み
    const velocityShader = /* シェーダーコード */;
    const positionShader = /* シェーダーコード */;
    
    // 変数の追加
    this.velocityVariable = this.gpuCompute.addVariable('textureVelocity', velocityShader, initVelocityTexture);
    this.positionVariable = this.gpuCompute.addVariable('texturePosition', positionShader, initPositionTexture);
    
    // 依存関係の設定
    this.gpuCompute.setVariableDependencies(this.velocityVariable, [this.positionVariable, this.velocityVariable]);
    this.gpuCompute.setVariableDependencies(this.positionVariable, [this.positionVariable, this.velocityVariable]);
    
    // ユニフォームの設定
    const velocityUniforms = this.velocityVariable.material.uniforms;
    velocityUniforms.time = { value: 0.0 };
    velocityUniforms.viscosity = { value: viscosity };
    velocityUniforms.force = { value: force };
    velocityUniforms.mousePos = { value: this.mousePos };
    
    const positionUniforms = this.positionVariable.material.uniforms;
    positionUniforms.time = { value: 0.0 };
    
    // 初期化
    const error = this.gpuCompute.init();
    if (error !== null) {
      console.error(error);
    }
  }
  
  private initTextureData(velocityTexture: THREE.Texture, positionTexture: THREE.Texture): void {
    const velocityData = velocityTexture.image.data;
    const positionData = positionTexture.image.data;
    
    for (let i = 0; i < velocityData.length; i += 4) {
      velocityData[i] = Math.random() * 0.001 - 0.0005; // x方向の速度
      velocityData[i + 1] = Math.random() * 0.001 - 0.0005; // y方向の速度
      velocityData[i + 2] = 0;
      velocityData[i + 3] = 1;
      
      positionData[i] = 0;
      positionData[i + 1] = 0;
      positionData[i + 2] = 0;
      positionData[i + 3] = 1;
    }
  }
  
  public updateMousePosition(x: number, y: number): void {
    this.mousePos.set(x, y, 0);
  }
  
  public compute(time: number): THREE.Texture {
    this.velocityVariable.material.uniforms.time.value = time;
    this.positionVariable.material.uniforms.time.value = time;
    
    this.gpuCompute.compute();
    
    return this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture;
  }
}
```

## パフォーマンス最適化

### デバイス対応
- 高性能デバイス: 高解像度シミュレーション（128x128以上）
- 中性能デバイス: 中解像度シミュレーション（64x64）
- 低性能デバイス: 簡易版シミュレーション、またはプリレンダリング

### WebGL機能検出
```typescript
function detectWebGLCapabilities(): {
  webgl2: boolean;
  floatTextures: boolean;
  halfFloatTextures: boolean;
} {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || 
             canvas.getContext('webgl') || 
             canvas.getContext('experimental-webgl');
  
  if (!gl) return { webgl2: false, floatTextures: false, halfFloatTextures: false };
  
  const webgl2 = gl instanceof WebGL2RenderingContext;
  const floatTextures = !!gl.getExtension('OES_texture_float');
  const halfFloatTextures = !!gl.getExtension('OES_texture_half_float');
  
  return { webgl2, floatTextures, halfFloatTextures };
}
```

## フォールバック戦略
1. WebGL2未対応 → WebGL1へフォールバック
2. フロートテクスチャ未対応 → 簡易版シミュレーション
3. WebGL完全未対応 → CSS3D効果または静的画像

## ユーザーインタラクション
- マウス/タッチによる流体かき混ぜ効果
- スクロールに応じたテキストの回転や表示変更
- オプションのコントロールUIを提供して、ユーザーがエフェクトをカスタマイズ可能に

## 制約と対応
1. **ファイルサイズ制限**: テクスチャの最適化と圧縮
2. **ブラウザ互換性**: Webフレンドリーなフォーマットの使用
3. **ユーザーエクスペリエンス**: 初期ロード時のプログレッシブエンハンスメント

## GitHub Pages特有の考慮事項
- 相対パスの使用（絶対パスは避ける）
- 404.htmlによるSPAルーティング対応（必要に応じて）
- ドメイン設定のためのCNAMEファイル生成 