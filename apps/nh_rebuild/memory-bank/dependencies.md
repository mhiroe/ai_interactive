# 依存関係の整理

## 外部ライブラリ

元のコードで使用されていたライブラリ：

1. `ua-parser-js`
   - 用途：デバイス検出
   - 現在の実装：独自のdetectDevice関数で代替
   - 場所：`src/gl/utils.ts`

2. `@gpu-info/detector`
   - 用途：GPU情報検出
   - 現在の実装：独自のisAppleDevice関数で代替
   - 場所：`src/gl/utils.ts`

3. `react/jsx-runtime`と`next/link`
   - 用途：UIフレームワーク
   - 現在の実装：不要（WebGL実装のみ）

## 内部モジュール

1. WebGL関連
   - `src/gl/base.ts`: 基本WebGLクラス
   - `src/gl/types.ts`: 型定義
   - `src/gl/matrix.ts`: 行列演算
   - `src/gl/shaders.ts`: シェーダーコード
   - `src/gl/utils.ts`: ユーティリティ関数

2. インタラクション関連
   - `src/interaction/device.ts`: デバイスモーション
   - `src/interaction/svg.ts`: SVGレンダリング

## 注意点

1. デバイス検出
```typescript
// 現在の実装（utils.ts）
export const detectDevice = () => {
    const ua = navigator.userAgent;
    return {
        platform: {
            type: /Mobile|Android|iPhone|iPad|iPod/i.test(ua) ? 
                  /iPad/i.test(ua) ? "tablet" : "mobile" : 
                  "desktop"
        }
    };
};

// 本来はua-parser-jsを使用
import UAParser from "ua-parser-js";
const parser = new UAParser();
const result = parser.getResult();
```

2. GPU検出
```typescript
// 現在の実装（utils.ts）
export const isAppleDevice = (info: { gpu: string[] }) => {
    const hasAppleGPU = info.gpu.some(gpu => gpu.includes('Apple'));
    return /(iPad|iPhone|iPod)/g.test(navigator.userAgent) || hasAppleGPU;
};

// 本来は@gpu-info/detectorを使用
import { detect } from "@gpu-info/detector";
const info = await detect();
const isApple = info.gpu.some(gpu => gpu.includes('Apple'));
```

## 移行手順

1. デバイス検出の移行
   - ua-parser-jsをインストール
   - detectDevice関数を置き換え
   - 影響を受けるコンポーネントを更新

2. GPU検出の移行
   - @gpu-info/detectorをインストール
   - isAppleDevice関数を置き換え
   - WebGLManagerとParticleSystemを更新

3. 型定義の更新
   - 新しいライブラリの型定義を追加
   - 既存の型定義を調整

## 今後の課題

1. パフォーマンス最適化
   - テクスチャのスワップ処理
   - バッファの再利用
   - メモリ管理

2. エラーハンドリング
   - WebGL非対応時の処理
   - シェーダーコンパイルエラー
   - テクスチャ読み込みエラー

3. デバイス対応
   - モバイルデバイスでの動作確認
   - タッチイベントの最適化
   - 画面サイズ対応