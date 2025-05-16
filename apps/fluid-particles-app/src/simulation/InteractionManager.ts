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

  // Store bound versions of event handlers for correct removal
  private _onMouseMove: (event: MouseEvent) => void;
  private _onPointerDown: () => void;
  private _onPointerUp: () => void;
  private _onTouchMove: (event: TouchEvent) => void;
  private _onTouchStart: (event: TouchEvent) => void;
  private _onTouchEnd: (event: TouchEvent) => void;

  constructor(element: HTMLElement) {
    this.element = element;
    this.mousePos = new THREE.Vector2(0, 0);
    this.mouseDelta = new THREE.Vector2(0, 0);
    this.lastMousePos = new THREE.Vector2(0, 0);
    this.isPointerDown = false;

    // Bind event handlers once
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onPointerDown = this.onPointerDown.bind(this);
    this._onPointerUp = this.onPointerUp.bind(this);
    this._onTouchMove = this.onTouchMove.bind(this);
    this._onTouchStart = this.onTouchStart.bind(this);
    this._onTouchEnd = this.onTouchEnd.bind(this);

    this.setupEventListeners();
  }

  /**
   * イベントリスナーのセットアップ
   */
  private setupEventListeners(): void {
    // マウスイベント
    this.element.addEventListener("mousemove", this._onMouseMove);
    this.element.addEventListener("mousedown", this._onPointerDown);
    this.element.addEventListener("mouseup", this._onPointerUp);
    this.element.addEventListener("mouseleave", this._onPointerUp); // mouseleave also uses onPointerUp

    // タッチイベント
    this.element.addEventListener("touchmove", this._onTouchMove, {
      passive: false,
    });
    this.element.addEventListener("touchstart", this._onTouchStart, {
      passive: false,
    });
    this.element.addEventListener("touchend", this._onTouchEnd, {
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
    // Use this.element.clientWidth and this.element.clientHeight
    if (this.element.clientWidth === 0 || this.element.clientHeight === 0) {
      // Avoid division by zero if element is not yet sized or visible
      this.mousePos.set(0, 0);
      this.mouseDelta.set(0, 0);
      this.lastMousePos.set(0, 0); // Ensure lastMousePos is also reset
      return;
    }
    this.mousePos.x = (x / this.element.clientWidth) * 2 - 1;
    this.mousePos.y = -(y / this.element.clientHeight) * 2 + 1;

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
    this.element.removeEventListener("mousemove", this._onMouseMove);
    this.element.removeEventListener("mousedown", this._onPointerDown);
    this.element.removeEventListener("mouseup", this._onPointerUp);
    this.element.removeEventListener("mouseleave", this._onPointerUp);
    this.element.removeEventListener("touchmove", this._onTouchMove);
    this.element.removeEventListener("touchstart", this._onTouchStart);
    this.element.removeEventListener("touchend", this._onTouchEnd);
  }
}
