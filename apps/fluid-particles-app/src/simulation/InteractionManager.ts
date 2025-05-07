/**
 * インタラクション管理クラス
 * マウスやタッチイベントを処理し、流体シミュレーションに入力を提供します
 */
export class InteractionManager {
  private element: HTMLElement;
  private mousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private mouseDelta: { x: number; y: number } = { x: 0, y: 0 };
  private isPointerDown: boolean = false;

  constructor(element: HTMLElement) {
    this.element = element;
    this.setupEventListeners();
  }

  /**
   * イベントリスナーのセットアップ
   */
  private setupEventListeners(): void {
    // マウスイベント
    this.element.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.element.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.element.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.element.addEventListener("mouseleave", this.handleMouseUp.bind(this));

    // タッチイベント
    this.element.addEventListener(
      "touchmove",
      this.handleTouchMove.bind(this),
      { passive: false }
    );
    this.element.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
      { passive: false }
    );
    this.element.addEventListener("touchend", this.handleTouchEnd.bind(this));
  }

  /**
   * マウス移動イベントハンドラ
   */
  private handleMouseMove(event: MouseEvent): void {
    this.previousMousePosition = { ...this.mousePosition };

    // 正規化された座標に変換
    const rect = this.element.getBoundingClientRect();
    this.mousePosition = {
      x: (event.clientX - rect.left) / rect.width,
      y: 1.0 - (event.clientY - rect.top) / rect.height, // Y座標を反転
    };

    this.updateMouseDelta();
  }

  /**
   * マウスボタン押下イベントハンドラ
   */
  private handleMouseDown(event: MouseEvent): void {
    this.isPointerDown = true;
    this.handleMouseMove(event);
  }

  /**
   * マウスボタン解放イベントハンドラ
   */
  private handleMouseUp(): void {
    this.isPointerDown = false;
    this.mouseDelta = { x: 0, y: 0 };
  }

  /**
   * タッチ移動イベントハンドラ
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      this.handleMouseMove(mouseEvent);
    }
  }

  /**
   * タッチ開始イベントハンドラ
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const mouseEvent = new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      this.handleMouseDown(mouseEvent);
    }
  }

  /**
   * タッチ終了イベントハンドラ
   */
  private handleTouchEnd(): void {
    this.handleMouseUp();
  }

  /**
   * マウスの移動量を更新
   */
  private updateMouseDelta(): void {
    if (this.isPointerDown) {
      this.mouseDelta = {
        x: this.mousePosition.x - this.previousMousePosition.x,
        y: this.mousePosition.y - this.previousMousePosition.y,
      };
    } else {
      this.mouseDelta = { x: 0, y: 0 };
    }
  }

  /**
   * 現在のマウス位置を取得
   */
  getMousePosition(): { x: number; y: number } {
    return this.mousePosition;
  }

  /**
   * マウスの移動量を取得
   */
  getMouseDelta(): { x: number; y: number } {
    return this.mouseDelta;
  }

  /**
   * ポインターが押下されているかを取得
   */
  getIsPointerDown(): boolean {
    return this.isPointerDown;
  }

  /**
   * リソースの解放
   */
  dispose(): void {
    // イベントリスナーの削除
    this.element.removeEventListener(
      "mousemove",
      this.handleMouseMove.bind(this)
    );
    this.element.removeEventListener(
      "mousedown",
      this.handleMouseDown.bind(this)
    );
    this.element.removeEventListener("mouseup", this.handleMouseUp.bind(this));
    this.element.removeEventListener(
      "mouseleave",
      this.handleMouseUp.bind(this)
    );
    this.element.removeEventListener(
      "touchmove",
      this.handleTouchMove.bind(this)
    );
    this.element.removeEventListener(
      "touchstart",
      this.handleTouchStart.bind(this)
    );
    this.element.removeEventListener(
      "touchend",
      this.handleTouchEnd.bind(this)
    );
  }
}
