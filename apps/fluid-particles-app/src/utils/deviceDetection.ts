/**
 * デバイスの性能に関する情報を表すインターフェース
 */
export interface DeviceCapabilities {
  /** モバイルデバイスかどうか */
  isMobile: boolean;
  /** GPU性能の評価（'high' または 'low'） */
  gpuPerformance: 'high' | 'low';
  /** 小さい画面かどうか */
  isSmallScreen: boolean;
}

/**
 * デバイスの性能を検出します
 * @returns デバイスの性能情報
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  // モバイルデバイスの検出
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    .test(navigator.userAgent);

  // GPU性能の推定
  // - デバイスのピクセル比が1より大きい場合は高性能と判断
  // - WebGL2のサポートも確認
  const hasWebGL2 = (() => {
    try {
      const canvas = document.createElement("canvas");
      return !!canvas.getContext("webgl2");
    } catch {
      return false;
    }
  })();

  const gpuPerformance = (window.devicePixelRatio > 1 && hasWebGL2)
    ? "high"
    : "low";

  // 画面サイズの検出
  // - 768px未満を小さい画面とみなす
  const isSmallScreen = window.innerWidth < 768 || window.innerHeight < 768;

  return {
    isMobile,
    gpuPerformance,
    isSmallScreen,
  };
}

/**
 * デバイスの性能に基づいて最適な解像度を計算します
 * @param baseResolution 基準となる解像度
 * @param capabilities デバイスの性能情報
 * @returns 最適化された解像度
 */
export function calculateOptimalResolution(
  baseResolution: number,
  capabilities: DeviceCapabilities,
): number {
  let resolution = baseResolution;

  // モバイルデバイスの場合は解像度を下げる
  if (capabilities.isMobile) {
    resolution = Math.floor(resolution * 0.5);
  }

  // 低性能GPUの場合はさらに解像度を下げる
  if (capabilities.gpuPerformance === "low") {
    resolution = Math.floor(resolution * 0.75);
  }

  // 小さい画面の場合も解像度を下げる
  if (capabilities.isSmallScreen) {
    resolution = Math.floor(resolution * 0.75);
  }

  // 最小解像度を保証（64x64）
  resolution = Math.max(resolution, 64);

  // 2の累乗に調整
  const powerOf2 = Math.pow(2, Math.floor(Math.log2(resolution)));
  return powerOf2;
}

/**
 * デバイスの性能に基づいて最適なパーティクル数を計算します
 * @param baseCount 基準となるパーティクル数
 * @param capabilities デバイスの性能情報
 * @returns 最適化されたパーティクル数
 */
export function calculateOptimalParticleCount(
  baseCount: number,
  capabilities: DeviceCapabilities,
): number {
  let count = baseCount;

  // モバイルデバイスの場合はパーティクル数を減らす
  if (capabilities.isMobile) {
    count = Math.floor(count * 0.5);
  }

  // 低性能GPUの場合はさらに減らす
  if (capabilities.gpuPerformance === "low") {
    count = Math.floor(count * 0.5);
  }

  // 小さい画面の場合も減らす
  if (capabilities.isSmallScreen) {
    count = Math.floor(count * 0.75);
  }

  // 最小値を確保（64x64）
  count = Math.max(count, 64 * 64);

  // 2の累乗の平方根に近い値に調整
  const sqrt = Math.sqrt(count);
  const powerOf2 = Math.pow(2, Math.ceil(Math.log2(sqrt)));
  return powerOf2 * powerOf2;
}
