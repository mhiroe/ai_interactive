# 流体パーティクルシステム実装計画

このドキュメントでは、Three.jsを使用した流体パーティクルシステムの実装計画について詳細に説明します。

## 実装順序

流体パーティクルシステムの実装は、以下の順序で進めることを推奨します：

1. **基本セットアップとDenoアプリケーションの構築** (1-2日)
   - Denoプロジェクトの初期化
   - Three.jsの統合
   - 基本的なレンダリング環境の構築

2. **流体シミュレーションの実装** (2-3日)
   - GPUComputationRendererのセットアップ
   - 速度場の更新シェーダーの実装
   - 発散計算シェーダーの実装
   - 圧力計算シェーダーの実装

3. **パーティクルシステムの実装** (2-3日)
   - パーティクルの位置と寿命の管理
   - パーティクルの更新シェーダーの実装
   - パーティクルの描画シェーダーの実装

4. **インタラクション管理の実装** (1-2日)
   - マウスイベントの処理
   - タッチイベントの処理
   - 座標変換の実装

5. **統合とメインクラスの実装** (1-2日)
   - 各コンポーネントの統合
   - メインクラスの実装
   - アニメーションループの実装

6. **最適化とパフォーマンス改善** (2-3日)
   - デバイス性能の検出と適応
   - レンダリングの最適化
   - メモリ使用量の最適化

合計: 約9-15日

## Denoベースのシステム構成

### 推奨技術スタック

1. **ランタイム**: Deno
2. **言語**: TypeScript
3. **ビルドツール**: Deno自体がビルドツールを内蔵
4. **Three.js統合**: npm:three と npm:@types/three
5. **フロントエンドフレームワーク**: Fresh または Preact
6. **スタイリング**: Twind (Tailwind CSS for Deno)

### プロジェクト構造

```
fluid-particles-app/
├── deno.json                  # Deno設定ファイル
├── import_map.json            # インポートマップ
├── main.ts                    # エントリーポイント
├── components/
│   ├── FluidParticlesCanvas.ts  # Three.jsキャンバスコンポーネント
│   ├── Controls.ts           # UIコントロール
│   └── ...
├── hooks/
│   ├── useWindowSize.ts       # ウィンドウサイズフック
│   └── ...
├── simulation/
│   ├── FluidSimulation.ts     # 流体シミュレーションクラス
│   ├── ParticleSystem.ts      # パーティクルシステムクラス
│   ├── InteractionManager.ts  # インタラクション管理クラス
│   └── shaders/
│       ├── velocity.frag      # 速度更新シェーダー
│       ├── pressure.frag      # 圧力計算シェーダー
│       ├── divergence.frag    # 発散計算シェーダー
│       ├── particle.vert      # パーティクル頂点シェーダー
│       ├── particle.frag      # パーティクル断片シェーダー
│       └── ...
├── utils/
│   ├── deviceDetection.ts     # デバイス検出ユーティリティ
│   ├── performanceMonitor.ts  # パフォーマンス監視
│   └── ...
└── static/
    ├── index.html             # HTMLエントリーポイント
    └── ...
```

### Denoでの開発環境セットアップ

```bash
# Denoのインストール（まだインストールしていない場合）
# macOS, Linux
curl -fsSL https://deno.land/x/install/install.sh | sh

# Windows (PowerShell)
iwr https://deno.land/x/install/install.ps1 -useb | iex

# プロジェクトの初期化
mkdir fluid-particles-app
cd fluid-particles-app
touch deno.json
```

### deno.json の設定例

```json
{
  "tasks": {
    "start": "deno run --allow-net --allow-read --allow-env main.ts",
    "dev": "deno run --allow-net --allow-read --allow-env --watch main.ts",
    "build": "deno bundle main.ts dist/bundle.js"
  },
  "importMap": "./import_map.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "dom.asynciterable", "deno.ns"]
  }
}
```

### import_map.json の設定例

```json
{
  "imports": {
    "three": "npm:three@0.150.0",
    "@types/three": "npm:@types/three@0.150.0",
    "three/examples/jsm/misc/GPUComputationRenderer": "npm:three@0.150.0/examples/jsm/misc/GPUComputationRenderer.js",
    "preact": "https://esm.sh/preact@10.11.3",
    "preact/hooks": "https://esm.sh/preact@10.11.3/hooks",
    "twind": "https://esm.sh/twind@0.16.17"
  }
}
```

### Three.jsのDenoでの使用方法

Denoでは、npmパッケージを `npm:` プレフィックスを使用してインポートできます：

```typescript
// Three.jsのインポート
import * as THREE from "npm:three";
import { GPUComputationRenderer } from "npm:three/examples/jsm/misc/GPUComputationRenderer";

// シェーダーのインポート
// Denoでは、テキストファイルを直接インポートできます
const velocityShader = await Deno.readTextFile("./shaders/velocity.frag");
const pressureShader = await Deno.readTextFile("./shaders/pressure.frag");
const divergenceShader = await Deno.readTextFile("./shaders/divergence.frag");
```

### Denoでのフロントエンド開発

Denoでフロントエンド開発を行う場合、以下のアプローチが考えられます：

1. **スタンドアロンアプローチ**:
   - 静的HTMLファイルとTypeScriptファイルを使用
   - Denoのバンドラーを使用してJavaScriptにバンドル
   - 静的ファイルをサーブするためのシンプルなサーバーを実装

```typescript
// main.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.177.0/http/file_server.ts";

serve((req) => {
  return serveDir(req, {
    fsRoot: "static",
  });
}, { port: 8000 });
```

2. **Freshフレームワークを使用**:
   - Denoの公式フレームワーク
   - アイランドアーキテクチャ
   - サーバーサイドレンダリングとクライアントサイドハイドレーション

```bash
# Freshプロジェクトの作成
deno run -A -r https://fresh.deno.dev fluid-particles-app
cd fluid-particles-app
```

### メインクラスの実装

メインクラスは各コンポーネントを統合し、全体を管理します：

```typescript
// simulation/FluidParticleSystem.ts
import * as THREE from "npm:three";
import { GPUComputationRenderer } from "npm:three/examples/jsm/misc/GPUComputationRenderer";
import { FluidSimulation } from "./FluidSimulation.ts";
import { ParticleSystem } from "./ParticleSystem.ts";
import { InteractionManager } from "./InteractionManager.ts";

export class FluidParticleSystem {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  fluidSimulation: FluidSimulation;
  particleSystem: ParticleSystem;
  interactionManager: InteractionManager;
  options: {
    particleCount: number;
    resolution: number;
    devicePixelRatio: number;
  };
  
  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, options = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.options = Object.assign({
      particleCount: 65536,
      resolution: 256,
      devicePixelRatio: 1
    }, options);
    
    // デバイス性能に応じて解像度を調整
    this.adjustResolutionForDevice();
    
    // 流体シミュレーションの初期化
    this.fluidSimulation = new FluidSimulation(
      renderer, 
      this.options.resolution
    );
    
    // パーティクルシステムの初期化
    this.particleSystem = new ParticleSystem(
      renderer, 
      {
        particleCount: this.options.particleCount,
        resolution: Math.sqrt(this.options.particleCount)
      }
    );
    
    // インタラクション管理の初期化
    this.interactionManager = new InteractionManager(renderer.domElement);
    
    // パーティクルメッシュをシーンに追加
    this.scene.add(this.particleSystem.particleMesh);
  }
  
  adjustResolutionForDevice() {
    // モバイルデバイスの場合は解像度を下げる
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.options.resolution = Math.min(this.options.resolution, 128);
      this.options.particleCount = Math.min(this.options.particleCount, 128 * 128);
    }
    
    // GPUの性能が低い場合も解像度を下げる
    if (this.options.devicePixelRatio < 1) {
      this.options.resolution = Math.min(this.options.resolution, 128);
      this.options.particleCount = Math.min(this.options.particleCount, 128 * 128);
    }
  }
  
  update() {
    // マウスの位置と移動量を取得
    const mousePos = this.interactionManager.getMousePosition();
    const mouseDelta = this.interactionManager.getMouseDelta();
    
    // 流体シミュレーションの更新
    const velocityTexture = this.fluidSimulation.update(mousePos, mouseDelta);
    
    // パーティクルシステムの更新
    this.particleSystem.update(velocityTexture);
  }
  
  resize(width: number, height: number) {
    // リサイズ時の処理
    // 必要に応じてシミュレーションのパラメータを調整
  }
  
  dispose() {
    // リソースの解放
    this.fluidSimulation.dispose();
    this.particleSystem.dispose();
    this.interactionManager.dispose();
  }
}
```

## エントリーポイントの実装

エントリーポイントは以下のように実装します：

```typescript
// main.ts
import * as THREE from "npm:three";
import { FluidParticleSystem } from "./simulation/FluidParticleSystem.ts";

// Three.jsのセットアップ
const container = document.getElementById('container');
if (!container) {
  throw new Error("Container element not found");
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// シーンとカメラのセットアップ
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  -1, 1, 1, -1, 0.1, 10
);
camera.position.z = 1;

// 流体パーティクルシステムの初期化
const fluidParticleSystem = new FluidParticleSystem(renderer, scene, camera, {
  particleCount: 256 * 256,
  resolution: 256,
  devicePixelRatio: window.devicePixelRatio
});

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  fluidParticleSystem.update();
  renderer.render(scene, camera);
}
animate();

// リサイズハンドラ
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  camera.left = -width / height;
  camera.right = width / height;
  camera.top = 1;
  camera.bottom = -1;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
  fluidParticleSystem.resize(width, height);
});
```

## デプロイ先の選択

GitHub Pages以外にも、無料で利用できる静的コンテンツのデプロイ先がいくつかあります：

### 1. Deno Deploy

**メリット**:
- Denoプロジェクトとの相性が最も良い
- GitHubとの連携が簡単
- グローバルエッジネットワーク
- Denoランタイムをそのまま使用可能
- 無料プランでも十分な機能

**設定方法**:
1. Deno Deployアカウントを作成
2. GitHubリポジトリを連携
3. デプロイ設定を構成
4. デプロイボタンをクリック

### 2. Vercel

**メリット**:
- GitHubとの連携が簡単
- 自動デプロイ（GitHubにプッシュするだけ）
- 高速なグローバルCDN
- プレビューデプロイ機能（PRごとに一時的な環境を作成）
- サーバーレス関数のサポート（将来的に必要になった場合）
- 無料プランでも十分な機能

**設定方法**:
1. Vercelアカウントを作成
2. GitHubリポジトリを連携
3. ビルド設定を構成
4. デプロイボタンをクリック

### 3. Netlify

**メリット**:
- GitHubとの連携が簡単
- 自動デプロイ
- グローバルCDN
- フォーム処理機能
- サーバーレス関数のサポート
- 無料プランでも十分な機能

**設定方法**:
1. Netlifyアカウントを作成
2. GitHubリポジトリを連携
3. ビルド設定を構成
4. デプロイボタンをクリック

### 推奨: Deno Deploy

Denoを使用したプロジェクトには、**Deno Deploy**が最も適しています。理由は以下の通りです：

1. Denoランタイムとの完全な互換性
2. デプロイが非常に簡単（GitHubリポジトリを連携するだけ）
3. エッジネットワークによる高速な配信
4. Denoのパーミッションモデルをそのまま使用可能
5. TypeScriptのサポートが標準で組み込まれている

このドキュメントは元の実装計画から更新されたものです。流体シミュレーションの実装については `1_fluid-simulation-implementation.md` を、パーティクルシステムの実装については `2_particle-system-implementation.md` を、インタラクション管理については `3_interaction-implementation.md` を参照してください。