# インタラクション管理の実装

このドキュメントでは、流体パーティクルシステムのインタラクション管理の実装方法について詳細に説明します。

## インタラクションマネージャーの実装

インタラクションマネージャーは、マウスとタッチイベントを処理し、流体シミュレーションに影響を与えるためのクラスです。

```javascript
import * as THREE from 'three';

export class InteractionManager {
  constructor(element) {
    this.element = element;
    this.mousePos = new THREE.Vector2(0, 0);
    this.mouseDelta = new THREE.Vector2(0, 0);
    this.lastMousePos = new THREE.Vector2(0, 0);
    this.isPointerDown = false;
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // マウスイベント
    this.element.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.element.addEventListener('mousedown', this.onPointerDown.bind(this));
    this.element.addEventListener('mouseup', this.onPointerUp.bind(this));
    this.element.addEventListener('mouseleave', this.onPointerUp.bind(this));
    
    // タッチイベント
    this.element.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
  }
  
  onMouseMove(event) {
    this.updateMousePosition(event.clientX, event.clientY);
  }
  
  onTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    this.updateMousePosition(touch.clientX, touch.clientY);
  }
  
  onPointerDown() {
    this.isPointerDown = true;
  }
  
  onPointerUp() {
    this.isPointerDown = false;
  }
  
  onTouchStart(event) {
    event.preventDefault();
    this.isPointerDown = true;
    const touch = event.touches[0];
    this.updateMousePosition(touch.clientX, touch.clientY);
  }
  
  onTouchEnd(event) {
    event.preventDefault();
    this.isPointerDown = false;
  }
  
  updateMousePosition(x, y) {
    // 正規化された座標に変換
    this.mousePos.x = (x / window.innerWidth) * 2 - 1;
    this.mousePos.y = -(y / window.innerHeight) * 2 + 1;
    
    // 移動量を計算
    this.mouseDelta.x = this.mousePos.x - this.lastMousePos.x;
    this.mouseDelta.y = this.mousePos.y - this.lastMousePos.y;
    
    // 前回の位置を更新
    this.lastMousePos.copy(this.mousePos);
  }
  
  getMousePosition() {
    return this.mousePos.clone();
  }
  
  getMouseDelta() {
    // ポインターが押されていない場合は移動量を0に
    if (!this.isPointerDown) {
      return new THREE.Vector2(0, 0);
    }
    return this.mouseDelta.clone();
  }
  
  dispose() {
    // イベントリスナーの削除
    this.element.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.element.removeEventListener('mousedown', this.onPointerDown.bind(this));
    this.element.removeEventListener('mouseup', this.onPointerUp.bind(this));
    this.element.removeEventListener('mouseleave', this.onPointerUp.bind(this));
    
    this.element.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.element.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.element.removeEventListener('touchend', this.onTouchEnd.bind(this));
  }
}
```

## Denoでの実装

Denoでは、以下のように実装することができます：

```typescript
// simulation/InteractionManager.ts
import * as THREE from "npm:three";

export class InteractionManager {
  element: HTMLElement;
  mousePos: THREE.Vector2;
  mouseDelta: THREE.Vector2;
  lastMousePos: THREE.Vector2;
  isPointerDown: boolean;
  
  constructor(element: HTMLElement) {
    this.element = element;
    this.mousePos = new THREE.Vector2(0, 0);
    this.mouseDelta = new THREE.Vector2(0, 0);
    this.lastMousePos = new THREE.Vector2(0, 0);
    this.isPointerDown = false;
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // マウスイベント
    this.element.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.element.addEventListener('mousedown', this.onPointerDown.bind(this));
    this.element.addEventListener('mouseup', this.onPointerUp.bind(this));
    this.element.addEventListener('mouseleave', this.onPointerUp.bind(this));
    
    // タッチイベント
    this.element.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
  }
  
  onMouseMove(event: MouseEvent) {
    this.updateMousePosition(event.clientX, event.clientY);
  }
  
  onTouchMove(event: TouchEvent) {
    event.preventDefault();
    const touch = event.touches[0];
    this.updateMousePosition(touch.clientX, touch.clientY);
  }
  
  onPointerDown() {
    this.isPointerDown = true;
  }
  
  onPointerUp() {
    this.isPointerDown = false;
  }
  
  onTouchStart(event: TouchEvent) {
    event.preventDefault();
    this.isPointerDown = true;
    const touch = event.touches[0];
    this.updateMousePosition(touch.clientX, touch.clientY);
  }
  
  onTouchEnd(event: TouchEvent) {
    event.preventDefault();
    this.isPointerDown = false;
  }
  
  updateMousePosition(x: number, y: number) {
    // 正規化された座標に変換
    this.mousePos.x = (x / window.innerWidth) * 2 - 1;
    this.mousePos.y = -(y / window.innerHeight) * 2 + 1;
    
    // 移動量を計算
    this.mouseDelta.x = this.mousePos.x - this.lastMousePos.x;
    this.mouseDelta.y = this.mousePos.y - this.lastMousePos.y;
    
    // 前回の位置を更新
    this.lastMousePos.copy(this.mousePos);
  }
  
  getMousePosition() {
    return this.mousePos.clone();
  }
  
  getMouseDelta() {
    // ポインターが押されていない場合は移動量を0に
    if (!this.isPointerDown) {
      return new THREE.Vector2(0, 0);
    }
    return this.mouseDelta.clone();
  }
  
  dispose() {
    // イベントリスナーの削除
    this.element.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.element.removeEventListener('mousedown', this.onPointerDown.bind(this));
    this.element.removeEventListener('mouseup', this.onPointerUp.bind(this));
    this.element.removeEventListener('mouseleave', this.onPointerUp.bind(this));
    
    this.element.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.element.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.element.removeEventListener('touchend', this.onTouchEnd.bind(this));
  }
}
```

## Freshフレームワークでの実装

Denoの公式フレームワークであるFreshを使用する場合、以下のようにフックとして実装することができます：

```typescript
// hooks/useInteraction.ts
import { useEffect, useRef, useState } from "preact/hooks";
import * as THREE from "npm:three";

export function useInteraction(elementRef: { current: HTMLElement | null }) {
  const mousePos = useRef(new THREE.Vector2(0, 0));
  const mouseDelta = useRef(new THREE.Vector2(0, 0));
  const lastMousePos = useRef(new THREE.Vector2(0, 0));
  const [isPointerDown, setIsPointerDown] = useState(false);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const updateMousePosition = (x: number, y: number) => {
      // 正規化された座標に変換
      mousePos.current.x = (x / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(y / window.innerHeight) * 2 + 1;
      
      // 移動量を計算
      mouseDelta.current.x = mousePos.current.x - lastMousePos.current.x;
      mouseDelta.current.y = mousePos.current.y - lastMousePos.current.y;
      
      // 前回の位置を更新
      lastMousePos.current.copy(mousePos.current);
    };
    
    const onMouseMove = (event: MouseEvent) => {
      updateMousePosition(event.clientX, event.clientY);
    };
    
    const onTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      const touch = event.touches[0];
      updateMousePosition(touch.clientX, touch.clientY);
    };
    
    const onPointerDown = () => {
      setIsPointerDown(true);
    };
    
    const onPointerUp = () => {
      setIsPointerDown(false);
    };
    
    const onTouchStart = (event: TouchEvent) => {
      event.preventDefault();
      setIsPointerDown(true);
      const touch = event.touches[0];
      updateMousePosition(touch.clientX, touch.clientY);
    };
    
    const onTouchEnd = (event: TouchEvent) => {
      event.preventDefault();
      setIsPointerDown(false);
    };
    
    // イベントリスナーの登録
    element.addEventListener('mousemove', onMouseMove);
    element.addEventListener('mousedown', onPointerDown);
    element.addEventListener('mouseup', onPointerUp);
    element.addEventListener('mouseleave', onPointerUp);
    
    element.addEventListener('touchmove', onTouchMove, { passive: false });
    element.addEventListener('touchstart', onTouchStart, { passive: false });
    element.addEventListener('touchend', onTouchEnd, { passive: false });
    
    // クリーンアップ
    return () => {
      element.removeEventListener('mousemove', onMouseMove);
      element.removeEventListener('mousedown', onPointerDown);
      element.removeEventListener('mouseup', onPointerUp);
      element.removeEventListener('mouseleave', onPointerUp);
      
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [elementRef.current]);
  
  const getMousePosition = () => mousePos.current.clone();
  const getMouseDelta = () => {
    if (!isPointerDown) {
      return new THREE.Vector2(0, 0);
    }
    return mouseDelta.current.clone();
  };
  
  return { getMousePosition, getMouseDelta, isPointerDown };
}
```

## マウスとタッチイベントの処理

### マウスイベントの処理

マウスイベントは以下のように処理されます：

1. **mousemove**: マウスの位置と移動量を更新
2. **mousedown**: ポインターの状態をアクティブに設定
3. **mouseup**: ポインターの状態を非アクティブに設定
4. **mouseleave**: ポインターの状態を非アクティブに設定（マウスがキャンバス外に出た場合）

### タッチイベントの処理

タッチイベントは以下のように処理されます：

1. **touchmove**: タッチの位置と移動量を更新
2. **touchstart**: ポインターの状態をアクティブに設定し、初期位置を記録
3. **touchend**: ポインターの状態を非アクティブに設定

タッチイベントはモバイルデバイスでの操作に対応するために重要です。`preventDefault()`を呼び出すことで、スクロールなどのデフォルトの動作を防止しています。

## 座標変換

マウスやタッチの座標は、ウィンドウ座標系から正規化された座標系（-1から1の範囲）に変換されます。これにより、ウィンドウサイズに依存しない一貫した座標系で操作できます。

```javascript
// 正規化された座標に変換
this.mousePos.x = (x / window.innerWidth) * 2 - 1;
this.mousePos.y = -(y / window.innerHeight) * 2 + 1;
```

y座標は反転されていることに注意してください。これは、ウィンドウ座標系（上から下へ増加）とWebGLの座標系（下から上へ増加）の違いを調整するためです。

## マウスの移動量の計算

マウスの移動量は、現在の位置と前回の位置の差として計算されます。この移動量は流体シミュレーションに力を加えるために使用されます。

```javascript
// 移動量を計算
this.mouseDelta.x = this.mousePos.x - this.lastMousePos.x;
this.mouseDelta.y = this.mousePos.y - this.lastMousePos.y;
```

## ポインターの状態管理

ポインターの状態（押されているかどうか）を管理することで、ユーザーがアクティブに操作しているときのみ流体に影響を与えるようにしています。

```javascript
getMouseDelta() {
  // ポインターが押されていない場合は移動量を0に
  if (!this.isPointerDown) {
    return new THREE.Vector2(0, 0);
  }
  return this.mouseDelta.clone();
}
```

このドキュメントは元の実装計画から分割されたものです。実装計画の詳細については `0_implementation-plan.md` を、流体シミュレーションの実装については `1_fluid-simulation-implementation.md` を、パーティクルシステムの実装については `2_particle-system-implementation.md` を、最適化戦略については `4_optimization-strategies.md` を参照してください。