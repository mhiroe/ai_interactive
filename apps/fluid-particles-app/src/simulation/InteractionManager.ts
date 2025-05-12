import * as THREE from "three";

/**
 * インタラクション管理クラス
 * マウスやタッチイベントを処理し、流体シミュレーションに入力を提供します
 */
export class InteractionManager {
  private element: HTMLElement;
  private mousePos: THREE.Vector2;
  private mouseDelta: THREE.Vector2;
  private lastMousePos: THREE.Vector2;
  private isPointerDown: boolean;

  constructor(element: HTMLElement) {
    this.element = element;
    this.mousePos = new THREE.Vector2(0, 0);
    this.mouseDelta = new THREE.Vector2(0, 0);
    this.lastMousePos = new THREE.Vector2(0, 0);
    this.isPointerDown = false;

    this.setupEventListeners();
  }

  /**
   * イベントリスナーのセットアップ
   */
  private setupEventListeners(): void {
    // マウスイベント
    this.element.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.element.addEventListener("mousedown", this.onPointerDown.bind(this));
    this.element.addEventListener("mouseup", this.onPointerUp.bind(this));
    this.element.addEventListener("mouseleave", this.onPointerUp.bind(this));

    // タッチイベント
    this.element.addEventListener("touchmove", this.onTouchMove.bind(this), {
      passive: false,
    });
    this.element.addEventListener("touchstart", this.onTouchStart.bind(this), {
      passive: false,
    });
    this.element.addEventListener("touchend", this.onTouchEnd.bind(this), {
      passive: false,
    });
  }

  /**
   * マウス移動イベントハンドラ
   */
  private onMouseMove(event: MouseEvent): void {
    this.updateMousePosition(event.clientX, event.clientY);
  }

  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    this.updateMousePosition(touch.clientX, touch.clientY);
  }

  private onPointerDown(): void {
    this.isPointerDown = true;
  }

  private onPointerUp(): void {
    this.isPointerDown = false;
  }

  private onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this.isPointerDown = true;
    const touch = event.touches[0];
    this.updateMousePosition(touch.clientX, touch.clientY);
  }

  private onTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    this.isPointerDown = false;
  }

  private updateMousePosition(x: number, y: number): void {
    // 正規化された座標に変換
    this.mousePos.x = (x / window.innerWidth) * 2 - 1;
    this.mousePos.y = -(y / window.innerHeight) * 2 + 1;

    // 移動量を計算
    this.mouseDelta.x = this.mousePos.x - this.lastMousePos.x;
    this.mouseDelta.y = this.mousePos.y - this.lastMousePos.y;

    // 前回の位置を更新
    this.lastMousePos.copy(this.mousePos);
  }

  getMousePosition(): THREE.Vector2 {
    return this.mousePos.clone();
  }

  getMouseDelta(): THREE.Vector2 {
    // ポインターが押されていない場合は移動量を0に
    if (!this.isPointerDown) {
      return new THREE.Vector2(0, 0);
    }
    return this.mouseDelta.clone();
  }

  /**
   * リソースの解放
   */
  dispose(): void {
    // イベントリスナーの削除
    this.element.removeEventListener("mousemove", this.onMouseMove.bind(this));
    this.element.removeEventListener(
      "mousedown",
      this.onPointerDown.bind(this),
    );
    this.element.removeEventListener("mouseup", this.onPointerUp.bind(this));
    this.element.removeEventListener("mouseleave", this.onPointerUp.bind(this));

    this.element.removeEventListener("touchmove", this.onTouchMove.bind(this));
    this.element.removeEventListener(
      "touchstart",
      this.onTouchStart.bind(this),
    );
    this.element.removeEventListener("touchend", this.onTouchEnd.bind(this));
  }
}
