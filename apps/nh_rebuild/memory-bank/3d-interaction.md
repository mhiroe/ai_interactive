# 3Dインタラクション実装メモ

## ファイル構成

```
apps/nh_rebuild/src/
├── gl/
│   ├── base.ts      # 基本WebGLクラスと型定義
│   ├── matrix.ts    # 行列演算ユーティリティ
│   ├── shaders.ts   # シェーダーコード
│   ├── types.ts     # 型定義
│   └── utils.ts     # ユーティリティ関数
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
   - デバイス別最適化
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
   - モバイル向け最適化
   - GPU機能検出
   - パーティクル数調整

## 型安全性

1. WebGL型定義
```typescript
type WebGLContext = WebGLRenderingContext;
type WebGLProg = WebGLProgram;
type WebGLShad = WebGLShader;
type WebGLBuf = WebGLBuffer;
type WebGLTex = WebGLTexture;
type WebGLFBuf = WebGLFramebuffer;
type WebGLUniformLoc = WebGLUniformLocation;
```

2. バッファ関連の型定義
```typescript
interface WebGLBufferWithLocation {
    buffer: WebGLBuf;
    location: number;
}

interface WebGLBufferWithCount {
    buffer: WebGLBuf;
    cnt: number;
}

interface CursorBuffers {
    position: WebGLBufferWithLocation;
    direction: WebGLBufferWithLocation;
    index: WebGLBufferWithCount;
}
```

## シェーダー最適化

1. 頂点シェーダー
   - 座標変換の最適化
   - アトリビュート最小化

2. フラグメントシェーダー
   - 計算量の削減
   - テクスチャ参照の最適化
   - 条件分岐の削減

## 移植時の改善点

1. コードの構造化
   - 責務の分離
   - クラス階層の整理
   - インターフェースの明確化

2. 型安全性の向上
   - TypeScriptの型定義追加
   - エラー処理の改善
   - nullチェックの追加

3. パフォーマンス最適化
   - メモリ使用量の削減
   - 描画処理の効率化
   - デバイス対応の強化

## 参照元

- `apps/nh_top/HACK The Nikkei_files/index-91c257438e1e5263.js`
- `apps/nh_rebuild/docs/3d-rendering-technical-spec.md`