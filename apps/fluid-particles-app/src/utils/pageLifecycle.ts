/**
 * ページのライフサイクル状態を管理するクラス
 * ページの表示状態やバッテリー状態に応じてパフォーマンスを最適化します
 */
export class PageLifecycle {
  private isVisible: boolean;
  private isLowBattery: boolean;
  private isPowerSaving: boolean;
  private updateCallbacks: Set<() => void>;
  private battery: any | null = null;

  constructor() {
    this.isVisible = document.visibilityState === "visible";
    this.isLowBattery = false;
    this.isPowerSaving = false;
    this.updateCallbacks = new Set();

    // ページの可視性変更イベントの監視
    document.addEventListener("visibilitychange", () => {
      this.isVisible = document.visibilityState === "visible";
      this.notifyUpdate();
    });

    // バッテリー状態の監視
    this.initBatteryMonitoring();
  }

  /**
   * バッテリー状態の監視を初期化します
   */
  private async initBatteryMonitoring(): Promise<void> {
    try {
      // Battery APIのサポートを確認
      if ("getBattery" in navigator) {
        this.battery = await (navigator as any).getBattery();
        this.updateBatteryStatus();

        // バッテリー状態の変更イベントを監視
        this.battery.addEventListener(
          "levelchange",
          () => this.updateBatteryStatus(),
        );
        this.battery.addEventListener(
          "chargingchange",
          () => this.updateBatteryStatus(),
        );
      }
    } catch (error) {
      console.warn("Battery API is not supported:", error);
    }
  }

  /**
   * バッテリー状態を更新します
   */
  private updateBatteryStatus(): void {
    if (this.battery) {
      // バッテリー残量が20%未満で充電していない場合を低バッテリー状態とみなす
      this.isLowBattery = this.battery.level < 0.2 && !this.battery.charging;
      this.notifyUpdate();
    }
  }

  /**
   * 省電力モードを有効/無効にします
   * @param enabled 省電力モードを有効にする場合はtrue
   */
  setPowerSaving(enabled: boolean): void {
    if (this.isPowerSaving !== enabled) {
      this.isPowerSaving = enabled;
      this.notifyUpdate();
    }
  }

  /**
   * 状態の更新を通知します
   */
  private notifyUpdate(): void {
    this.updateCallbacks.forEach((callback) => callback());
  }

  /**
   * 状態の更新を監視するコールバックを登録します
   * @param callback 状態が更新されたときに呼び出されるコールバック関数
   */
  onUpdate(callback: () => void): void {
    this.updateCallbacks.add(callback);
  }

  /**
   * 状態の更新の監視を解除します
   * @param callback 解除するコールバック関数
   */
  offUpdate(callback: () => void): void {
    this.updateCallbacks.delete(callback);
  }

  /**
   * ページが表示状態かどうかを取得します
   * @returns ページが表示状態の場合はtrue
   */
  isPageVisible(): boolean {
    return this.isVisible;
  }

  /**
   * バッテリー残量が少ないかどうかを取得します
   * @returns バッテリー残量が少ない場合はtrue
   */
  isBatteryLow(): boolean {
    return this.isLowBattery;
  }

  /**
   * 省電力モードが有効かどうかを取得します
   * @returns 省電力モードが有効な場合はtrue
   */
  isPowerSavingEnabled(): boolean {
    return this.isPowerSaving;
  }

  /**
   * 現在のフレームをスキップすべきかどうかを判断します
   * パフォーマンス最適化のために、特定の条件下でフレームをスキップします
   * @returns フレームをスキップすべき場合はtrue
   */
  shouldSkipFrame(): boolean {
    // ページが非表示の場合、90%の確率でフレームをスキップ
    if (!this.isVisible) {
      return Math.random() > 0.1;
    }

    // バッテリー残量が少ない、または省電力モードの場合、50%の確率でフレームをスキップ
    if (this.isLowBattery || this.isPowerSaving) {
      return Math.random() > 0.5;
    }

    return false;
  }

  /**
   * パフォーマンス係数を取得します
   * デバイスの状態に応じて0.0から1.0の値を返します
   * この値は品質やパーティクル数の調整に使用できます
   * @returns パフォーマンス係数（0.0-1.0）
   */
  getPerformanceFactor(): number {
    let factor = 1.0;

    // ページが非表示の場合
    if (!this.isVisible) {
      factor *= 0.1;
    }

    // バッテリー残量が少ない場合
    if (this.isLowBattery) {
      factor *= 0.5;
    }

    // 省電力モードの場合
    if (this.isPowerSaving) {
      factor *= 0.5;
    }

    return factor;
  }

  /**
   * リソースを解放します
   */
  dispose(): void {
    // イベントリスナーの解除
    if (this.battery) {
      this.battery.removeEventListener("levelchange", this.updateBatteryStatus);
      this.battery.removeEventListener(
        "chargingchange",
        this.updateBatteryStatus,
      );
    }
    this.updateCallbacks.clear();
  }
}
