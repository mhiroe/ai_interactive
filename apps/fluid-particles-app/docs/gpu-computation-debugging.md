# GPUComputationRendererのデバッグガイド

## 概要

GPUComputationRendererを使用したシェーダープログラミングでは、モジュールが提供する機能と独自の実装の境界を正しく理解することが重要です。このドキュメントでは、一般的な問題とその解決方法、およびベストプラクティスについて説明します。

## シェーダーの構造

### GPUComputationRendererが提供する機能

1. ヘッダー部分
   - `#version 300 es`
   - precision宣言
   - 基本的なuniform宣言（resolution等）

2. テクスチャ管理
   - 計算用テクスチャのuniform宣言
   - テクスチャ間の依存関係管理

3. 出力変数
   - `pc_fragColor`として定義される出力変数

### カスタム実装部分

1. 追加のuniform宣言
   - マウス位置（mousePos）
   - デルタ時間（dt）
   - その他のカスタムパラメータ

2. ヘルパー関数
   - 乱数生成
   - ベクトル演算
   - その他のユーティリティ関数

3. メイン処理
   - シミュレーションロジック
   - パーティクル更新
   - 物理計算

## 一般的な問題と解決方法

### 1. シェーダーコンパイルエラー

#### 問題: バージョン宣言の重複
```glsl
#version 300 es  // エラー: 重複した宣言
precision highp float;
```

**解決策**: GPUComputationRendererにヘッダーの追加を任せる

#### 問題: uniform宣言の重複
```glsl
uniform sampler2D velocityTexture;  // エラー: 重複した宣言
```

**解決策**: GPUComputationRendererが管理するテクスチャのuniform宣言は削除

#### 問題: 出力変数の競合
```glsl
out vec4 fragColor;  // エラー: pc_fragColorと競合
```

**解決策**: GPUComputationRendererが提供する`pc_fragColor`を使用

### 2. 実行時エラー

#### 問題: テクスチャアクセスエラー
```glsl
vec2 velocity = texture(velocityTexture, uv).xy;  // エラー: テクスチャが未定義
```

**解決策**: 
1. 必要なテクスチャの依存関係を`setVariableDependencies`で設定
2. カスタムテクスチャは明示的にuniform宣言を追加

## ベストプラクティス

### 1. シェーダーファイルの構造

```glsl
// 1. カスタムのuniform宣言
uniform vec2 mousePos;
uniform float dt;

// 2. ヘルパー関数
float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

// 3. メイン処理
void main() {
    // ...処理...
    pc_fragColor = vec4(result, 0.0, 1.0);
}
```

### 2. 変数の命名規則

- GPUComputationRendererが管理するテクスチャ: `<name>Texture`
- カスタムuniform変数: 明確な意図を示す名前（例: `mousePos`, `dt`）
- 一時変数: 処理内容を示す名前（例: `velocity`, `pressure`）

### 3. デバッグ手順

1. エラーメッセージの確認
   - コンパイルエラーの場合、行番号とエラー内容を確認
   - 実行時エラーの場合、WebGLエラーコードを確認

2. シェーダーの依存関係確認
   - テクスチャの依存関係が正しく設定されているか
   - uniform変数が適切に宣言されているか

3. 段階的な修正
   - 一度に1つの問題に対処
   - 修正後は必ずビルドしてエラーを確認

## モジュール使用時の注意点

1. GPUComputationRendererの初期化
   ```typescript
   const gpuCompute = new GPUComputationRenderer(
     resolution,
     resolution,
     renderer
   );
   ```

2. 変数の追加
   ```typescript
   const variable = gpuCompute.addVariable(
     'textureVariable',
     shaderCode,
     initialTexture
   );
   ```

3. 依存関係の設定
   ```typescript
   gpuCompute.setVariableDependencies(
     variable,
     [dependency1, dependency2]
   );
   ```

4. カスタムuniformの設定
   ```typescript
   variable.material.uniforms.mousePos = { value: new THREE.Vector2() };
   ```

## トラブルシューティング

1. シェーダーが正しくコンパイルされない
   - ヘッダー部分（#version, precision）を削除
   - GPUComputationRendererが管理するuniform宣言を確認

2. テクスチャにアクセスできない
   - 依存関係が正しく設定されているか確認
   - テクスチャ名が正しいか確認

3. 出力が表示されない
   - `pc_fragColor`を使用しているか確認
   - フォーマットとデータ型が正しいか確認

## 参考資料

- [Three.js Documentation](https://threejs.org/docs/)
- [GPUComputationRenderer Source Code](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/misc/GPUComputationRenderer.js)
- [WebGL2 Specification](https://www.khronos.org/registry/webgl/specs/latest/2.0/)

## 実際のデバッグ事例

### テクスチャ宣言の重複問題

今回のデバッグ作業で遭遇した主な問題は、テクスチャのuniform宣言の重複でした。

#### 問題の症状
```
ERROR: 'velocityTexture' : redefinition
ERROR: 'pressureTexture' : redefinition
```

#### 原因
1. シェーダーファイルで明示的にテクスチャを宣言
2. GPUComputationRendererが同じテクスチャを自動的に宣言
3. 結果として同じテクスチャが2回宣言される

#### 解決方法
1. GPUComputationRendererが管理するテクスチャ
   - velocityTexture
   - pressureTexture
   - divergenceTexture
   - lifeTexture
   これらのuniform宣言は削除

2. 追加のテクスチャのみ宣言
   - velocityFieldTexture
   など、GPUComputationRendererが管理しないテクスチャのみ明示的に宣言

#### 学んだ教訓
1. GPUComputationRendererの動作を理解することが重要
2. シェーダーの依存関係を明確に把握する
3. モジュールが提供する機能と独自の実装の境界を理解する

この経験から、シェーダーのデバッグには以下のアプローチが効果的だと分かりました：

1. エラーメッセージを注意深く読む
2. モジュールのソースコードを確認する
3. 段階的に修正を行い、各ステップで動作を確認する
4. 修正内容をドキュメントに記録する

## シェーダーデバッグのベストプラクティス追加事項

### 1. シェーダー変数の分類と管理

シェーダーで使用する変数は以下のように分類して管理すると効果的です：

1. GPUComputationRenderer管理の変数
   - resolution（自動定義）
   - pc_fragColor（出力変数）
   - 計算用テクスチャ（velocityTexture等）

2. カスタム変数
   - 入力パラメータ（mousePos, dt等）
   - 追加テクスチャ（velocityFieldTexture等）
   - ローカル変数（velocity, pressure等）

### 2. シェーダーファイルの修正手順

1. まず現状を分析
   ```glsl
   // 既存のコード
   #version 300 es  // GPUComputationRendererと競合
   uniform sampler2D velocityTexture;  // 重複宣言
   ```

2. GPUComputationRenderer管理の部分を削除
   ```glsl
   // 削除対象
   #version 300 es
   precision highp float;
   uniform sampler2D velocityTexture;
   ```

3. カスタム部分のみ残す
   ```glsl
   // 残すべき部分
   uniform vec2 mousePos;
   uniform float dt;
   ```

### 3. デバッグ時の確認事項

1. シェーダーのコンパイル前
   - バージョン宣言の有無
   - uniform宣言の重複
   - 出力変数の定義

2. シェーダーのコンパイル後
   - WebGLエラーの有無
   - フレームバッファの状態
   - テクスチャの内容

3. 実行時
   - フレームレート
   - メモリ使用量
   - GPU負荷

### 4. エラー発生時のアプローチ

1. エラーの切り分け
   ```
   // 例: 重複エラー
   ERROR: 'velocityTexture' : redefinition
   ```
   - エラーの種類を特定
   - 影響範囲を確認
   - 関連するコードを特定

2. 段階的な修正
   - 1つずつ問題に対処
   - 各修正後にビルドテスト
   - 修正の影響を確認

3. 検証
   - 意図した動作の確認
   - パフォーマンスへの影響
   - 他の機能への影響

### 5. ドキュメント化のポイント

1. エラー情報の記録
   - エラーメッセージ
   - 発生状況
   - 原因と解決方法

2. 修正内容の記録
   - 変更したファイル
   - 具体的な修正内容
   - 修正理由

3. 学んだ教訓
   - 問題の本質
   - 効果的な解決方法
   - 今後の注意点