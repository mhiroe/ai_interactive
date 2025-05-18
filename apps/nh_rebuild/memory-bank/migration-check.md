# インタラクション部分の移植チェック

## 移植済みの機能

1. WebGLレンダラー
- BaseGLRenderer
- WebGLManager
- CursorRenderer
- OutlineRenderer
- ParticleSystem

2. シェーダー
- 頂点シェーダー
- フラグメントシェーダー
- アドベクションシェーダー
- 発散シェーダー
- 圧力シェーダー
- 速度シェーダー
- ライフサイクルシェーダー

3. マウスインタラクション
- マウス移動
- マウスエンター/リーブ
- タッチイベント

## 移植漏れの機能

1. デバイスモーション対応
```javascript
onDeviceMotionHandler(e) {
    console.log("motion");
    console.log(e.acceleration);
}
```

2. SVGレンダリング
```javascript
renderSVG() {}
```

3. ジャイロスコープ機能
```javascript
removeGyroscopeFunction() {}
```

## 修正が必要な点

1. デバイスモーション
- モバイルデバイスでの動作確認
- 加速度センサーの値の利用

2. パフォーマンス最適化
- テクスチャのスワップ処理
- バッファの再利用
- メモリ管理

3. エラーハンドリング
- WebGL非対応時の処理
- シェーダーコンパイルエラー
- テクスチャ読み込みエラー

## 参照元
- `apps/nh_top/HACK The Nikkei_files/index-91c257438e1e5263.js`
- `apps/nh_rebuild/src/main.ts`