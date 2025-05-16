/**
 * パフォーマンスモニタリングクラス
 * フレームレートを監視し、パフォーマンスの低下を検出します
 */
export class PerformanceMonitor {
  private targetFPS: number;
  private fpsHistory: number[];
  private lastTime: number;
  private adjustmentNeeded: boolean;

  constructor(targetFPS = 30) {
    this.targetFPS = targetFPS;
    this.fpsHistory = [];
    this.lastTime = 0;
    this.adjustmentNeeded = false;
  }

  /**
   * 現在のフレームレートを更新し、パフォーマンスの調整が必要かどうかを判断します
   * @param currentTime 現在の時間（performance.now()の値）
   * @returns パフォーマンスの調整が必要な場合はtrue
   */
  update(currentTime: number): boolean {
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
      return false;
    }

    const deltaTime = currentTime - this.lastTime;
    const currentFPS = 1000 / deltaTime;

    this.fpsHistory.push(currentFPS);
    if (this.fpsHistory.length > 30) {
      this.fpsHistory.shift();
    }

    const averageFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) /
      this.fpsHistory.length;

    this.lastTime = currentTime;
    this.adjustmentNeeded = averageFPS < this.targetFPS;

    return this.adjustmentNeeded;
  }

  /**
   * 平均フレームレートを取得します
   * @returns 直近30フレームの平均FPS
   */
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return this.fpsHistory.reduce((sum, fps) => sum + fps, 0) /
      this.fpsHistory.length;
  }

  /**
   * パフォーマンスの調整が必要かどうかを取得します
   * @returns パフォーマンスの調整が必要な場合はtrue
   */
  needsAdjustment(): boolean {
    return this.adjustmentNeeded;
  }

  /**
   * パフォーマンスモニタリングをリセットします
   */
  reset(): void {
    this.fpsHistory = [];
    this.lastTime = 0;
    this.adjustmentNeeded = false;
  }
}
