# 光と塵のインタラクティブビジュアライゼーション仕様

## 1. 全体構成

### 1.1 シーンの基本設定
- キャンバスサイズ: 800x600px
- 背景色: 暗めのグレー (#1a1a1a)
- フレームレート: 30fps

## 2. 光の表現

### 2.1 光線の基本特性
- 方向: 左上から右下へ (約45度)
- 本数: 15-20本
- 太さ: 10-50pxの範囲でランダム
- 透明度: 20-60%の範囲

### 2.2 明暗の変化
- 各光線の明るさが個別に変化
- 変化速度: 極めて遅い (0.1-0.3%/フレーム)
- 明るさの範囲: 20-100%
- サイン波による滑らかな明暗の遷移

## 3. チリ・埃の表現

### 3.1 パーティクルシステム
- 画面内パーティクル数: 常時約300個を維持
- サイズ: 1-3pxの範囲でランダム
- 色: 白 (#ffffff)
- 透明度: 基本40-60%

### 3.2 パーティクル管理
- フレームアウトしたパーティクルは自動的に削除
- 削除されたパーティクルの数だけ新規生成
- 生成位置: 画面上部からランダムに出現

### 3.3 自然な動き
- 基本移動速度: 極めて遅い (0.1-0.2px/フレーム)
- 上下の揺らぎ: サイン波による (振幅0.5px, 周期10秒)
- 左右の揺らぎ: コサイン波による (振幅0.3px, 周期15秒)
- ブラウン運動: 微小なランダムな動き (±0.05px/フレーム)

### 3.4 光との相互作用
- 光線との距離に応じた明るさの変化
- 光に当たった時の透明度: 60-90%
- 暗部での透明度: 10-30%

## 4. インタラクション

### 4.1 マウスによる攪拌
- 影響範囲: マウス位置から半径100px
- 力の強さ: マウスの移動速度に比例
- 最大移動速度: 10px/フレーム
- 減衰: 距離に応じて指数関数的に

### 4.2 パーティクルの挙動
- マウスからの距離に応じた移動
- 渦を巻くような動きの実現
- 徐々に元の動きに戻る (5-10秒で)

## 5. パフォーマンス最適化

### 5.1 描画の最適化
- パーティクルの描画をまとめて行う
- 光線は個別のレイヤーで描画
- 画面外のパーティクルの効率的な管理

### 5.2 計算の最適化
- 空間分割による衝突判定の効率化
- マウスとの距離計算の最適化
- フレームスキップ時の補間処理

## 6. 技術的な実装方針

### 6.1 クラス構造
```typescript
class LightBeam {
  position: Vector
  width: number
  brightness: number
  angle: number
  update()
  draw()
}

class DustParticle {
  position: Vector
  size: number
  opacity: number
  velocity: Vector
  lifespan: number
  update()
  draw()
  isDead(): boolean
}

class ParticleSystem {
  particles: DustParticle[]
  lightBeams: LightBeam[]
  targetParticleCount: number
  update()
  draw()
  applyForce(position: Vector, force: Vector)
  maintainParticleCount()
}
```

### 6.2 主要な関数
- `setup()`: 初期化処理
- `draw()`: メインループ
- `updateParticles()`: パーティクル状態更新
- `updateLights()`: 光の状態更新
- `calculateMouseForce()`: マウスによる力の計算
- `checkLightInteraction()`: 光との相互作用の計算
- `createParticle()`: 新規パーティクル生成
- `removeDeadParticles()`: 画面外パーティクルの削除

### 6.3 パーティクル管理の実装詳細
```typescript
// パーティクル数の管理
function maintainParticleCount() {
  // 画面外のパーティクルを削除
  const deadCount = removeDeadParticles()
  
  // 不足分を補充
  for (let i = 0; i < deadCount; i++) {
    particles.push(createParticle())
  }
}

// 新規パーティクル生成
function createParticle() {
  return new DustParticle({
    position: createRandomTopPosition(),
    velocity: createInitialVelocity(),
    size: random(1, 3),
    opacity: random(40, 60)
  })
}