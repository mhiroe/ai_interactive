# 3Dインタラクション実装メモ

## 外部ライブラリの依存関係

元のコードで使用されているライブラリ：

1. `ua-parser-js`
   - 用途：デバイス検出
   - 現在の実装：utils.tsのdetectDevice関数で独自実装
   - 注意：本来はライブラリを使用すべき

2. `@gpu-info/detector`
   - 用途：GPU情報検出
   - 現在の実装：utils.tsのisAppleDevice関数で独自実装
   - 注意：本来はライブラリを使用すべき

3. `react/jsx-runtime`
   - 用途：Reactコンポーネントのレンダリング
   - 現在の実装：不要（純粋なWebGL実装）

4. `next/link`
   - 用途：Next.jsのルーティング
   - 現在の実装：不要（純粋なWebGL実装）

## 実装上の注意

1. デバイス検出
```typescript
// 現在の実装（要置き換え）
export const detectDevice = () => ({
    platform: {
        type: /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 
              /iPad/i.test(navigator.userAgent) ? "tablet" : "mobile" : 
              "desktop"
    }
});

// 本来の実装（ua-parser-jsを使用）
import UAParser from "ua-parser-js";
const parser = new UAParser();
const result = parser.getResult();
```

2. GPU検出
```typescript
// 現在の実装（要置き換え）
export const isAppleDevice = (info: { gpu: string[] }) => {
    const hasAppleGPU = info.gpu.some(gpu => gpu.includes('Apple'));
    return /(iPad|iPhone|iPod)/g.test(navigator.userAgent) || hasAppleGPU;
};

// 本来の実装（@gpu-info/detectorを使用）
import { detect } from "@gpu-info/detector";
const info = await detect();
const isApple = info.gpu.some(gpu => gpu.includes('Apple'));
```

## ファイル構成

```
apps/nh_rebuild/src/
├── gl/
│   ├── base.ts      # 基本WebGLクラスと型定義
│   ├── matrix.ts    # 行列演算ユーティリティ
│   ├── shaders.ts   # シェーダーコード
│   ├── types.ts     # 型定義
│   └── utils.ts     # ユーティリティ関数（要ライブラリ置き換え）
└── main.ts          # メインクラス実装
```

## 実装クラス

1. BaseGLRenderer (base.ts)
   - WebGL基本機能の抽象化
   - シェーダー管理
   - バッファ管理
   - ユニフォーム変数管理

2. WebGLManager (main.ts)
   - テクスチャ管理
   - フレームバッファ管理
   - ブレンドモード制御
   - バッファスワップ

3. CursorRenderer (main.ts)
   - カーソルの描画
   - マウスイベント処理
   - アニメーション制御
   - ブレンド効果

4. OutlineRenderer (main.ts)
   - アウトラインの描画
   - デバイス別最適化（要ライブラリ対応）
   - アニメーション効果
   - テクスチャ合成

5. ParticleSystem (main.ts)
   - パーティクル管理
   - ライフサイクル制御
   - 物理演算
   - 描画最適化

## 最適化ポイント

1. メモリ管理
   - Float32Array の使用
   - バッファの再利用
   - テクスチャのスワップ

2. レンダリング
   - ブレンドモードの最適化
   - バッチ処理
   - ビューポート管理

3. デバイス対応
   - モバイル向け最適化（要ライブラリ対応）
   - GPU機能検出（要ライブラリ対応）
   - パーティクル数調整

## 型安全性

[型定義は同じ]

## シェーダー最適化

[シェーダー最適化は同じ]

## 移植時の改善点

[移植時の改善点は同じ]

## 参照元

- `apps/nh_top/HACK The Nikkei_files/index-91c257438e1e5263.js`
- `apps/nh_rebuild/docs/3d-rendering-technical-spec.md`