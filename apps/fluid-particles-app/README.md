# Fluid Particles App

Three.jsを使用した流体パーティクルシミュレーションアプリケーションです。WebGLを活用して、インタラクティブな流体シミュレーションとパーティクルシステムを実装しています。

## 概要

このアプリケーションは以下の機能を提供します：

- GPUベースの流体シミュレーション
- パーティクルシステムによる可視化
- マウス/タッチによるインタラクション
- デバイス性能に応じた自動最適化

## 必要な環境

- [Deno](https://deno.land/) v1.32.0以上

### Denoのインストール

**macOS / Linux:**

```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```

**Windows (PowerShell):**

```powershell
iwr https://deno.land/x/install/install.ps1 -useb | iex
```

## プロジェクトのセットアップ

1. リポジトリをクローン

```bash
git clone <repository-url>
cd fluid-particles-app
```

2. 依存関係の確認

このプロジェクトは `deno.jsonc` (または `deno.json`) の `imports` フィールドを使用して依存関係を管理しています。特別なインストール手順は必要ありません。

## 開発方法

### 開発サーバーの起動

開発モードでサーバーを起動するには以下のコマンドを実行します：

```bash
deno task dev
```

このコマンドは以下の処理を行います：
- ファイル変更の監視
- 自動再読み込み
- 開発サーバーの起動（http://localhost:8000）

### テストの実行

テストを実行するには以下のコマンドを実行します：

```bash
deno task test
```

このコマンドは以下のテストを実行します：
- ユニットテスト
- インテグレーションテスト
- シミュレーションのテスト

## 停止
kill -f "deno run"

### ビルドとデプロイ

#### ビルド

プロジェクトをビルドするには以下のコマンドを実行します：

```bash
deno task build
```

このコマンドは以下の処理を行います：

1. シェーダーファイルのコピー
   - `src/simulation/shaders/*.{frag,vert}` から `static/` へシェーダーファイルをコピー (または、ビルドプロセスに合わせて修正)
   - シェーダーファイルはソースコードとして `src/simulation/shaders/` で管理し、ビルド時に配信用ディレクトリにコピー

2. TypeScript のバンドル
   - `src/main.ts` を esbuild を使用してバンドル
   - `static/main.js` として出力
   - Three.js は外部依存として扱い、CDN から読み込む

#### デプロイ

このプロジェクトは `static/` ディレクトリのみを公開する設計になっています：

- `static/` ディレクトリ構成
  - `index.html` - メインのHTMLファイル
  - `main.js` - ビルドされたJavaScriptファイル
  - `*.{frag,vert}` - シェーダーファイル（ビルド時にコピー）
  - `three.module.js` - Three.js モジュール
  - `GPUComputationRenderer.js` - GPUComputationRenderer モジュール

デプロイ時は `static/` ディレクトリの内容のみを配信サーバーにアップロードしてください。これにより：
- ソースコードとビルド結果が明確に分離される
- 開発用ファイルが公開されない
- 必要最小限のファイルのみが配信される

### 依存関係の管理

このプロジェクトでは、Three.js などの主要な依存関係は CDN（npm）から直接インポートしています。これは開発環境とプロダクション環境の両方で同じ設定を使用します。依存関係の設定は `deno.jsonc` の `imports` セクションで管理されています。

## プロジェクト構造

```
fluid-particles-app/
├── deno.json             # Deno設定ファイル
├── import_map.json       # 依存関係の定義
├── docs/                 # プロジェクトドキュメント
├── src/
│   ├── main.ts           # クライアントサイドのエントリーポイント
│   ├── server.ts         # サーバーサイドのエントリーポイント
│   └── simulation/       # シミュレーション関連のコード
│       ├── InteractionManager.ts  # インタラクション管理
│       └── shaders/      # GLSLシェーダーファイル
│           ├── velocity.frag      # 速度更新シェーダー
│           ├── pressure.frag      # 圧力計算シェーダー
│           ├── divergence.frag    # 発散計算シェーダー
│           ├── particle.vert      # パーティクル頂点シェーダー
│           └── particle.frag      # パーティクル断片シェーダー
├── static/               # 静的ファイル
│   ├── index.html        # HTMLエントリーポイント
│   └── main.js           # コンパイル済みJavaScript（ビルド時に生成）
└── tasks/                # タスク定義ファイル
    ├── 0_implementation-plan.md
    ├── 1_fluid-simulation-implementation.md
    ├── 2_particle-system-implementation.md
    ├── 3_interaction-implementation.md
    └── 4_optimization-strategies.md
```

## デプロイ

このプロジェクトは以下のプラットフォームへのデプロイをサポートしています：

### Deno Deploy（推奨）

1. [Deno Deploy](https://deno.com/deploy) にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成
3. GitHubリポジトリを連携
4. エントリーポイントとして `src/server.ts` を指定

### その他のデプロイオプション

- Vercel
- Netlify
- GitHub Pages

## タスクの進捗状況

- [x] 基本セットアップとDenoアプリケーションの構築
- [ ] 流体シミュレーションの実装
- [ ] パーティクルシステムの実装
- [ ] インタラクション管理の実装
- [ ] 統合とメインクラスの実装
- [ ] 最適化とパフォーマンス改善

## ライセンス

MIT