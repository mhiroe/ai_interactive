import { getWindowSize } from "./gl/utils.ts";
import { ParticleSystem } from "./main.ts";

// ブラウザ環境でのみ実行
if (typeof document !== "undefined") {
  class App {
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    private particleSystem: ParticleSystem;
    private animationFrameId: number = 0;

    constructor() {
      // Canvasの初期化
      this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
      const gl = this.canvas.getContext("webgl");
      if (!gl) throw new Error("WebGL not supported");
      this.gl = gl;

      // ウィンドウサイズの設定
      const { width, height } = getWindowSize();
      this.canvas.width = width;
      this.canvas.height = height;

      // パーティクルシステムの初期化
      this.particleSystem = new ParticleSystem(this.gl, 1024); // パーティクル数を1024に設定

      // リサイズイベントの設定
      window.addEventListener("resize", this.handleResize.bind(this));

      // アニメーションの開始
      this.animate();

      // デバイスモーションの有効化
      this.particleSystem.enableDeviceMotion();
    }

    private handleResize() {
      const { width, height } = getWindowSize();
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }

    private animate() {
      const { width, height } = getWindowSize();
      this.particleSystem.render(width, height);
      this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    }

    public dispose() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.particleSystem.dispose();
    }
  }

  // DOMContentLoadedイベントで初期化
  document.addEventListener("DOMContentLoaded", () => {
    new App();
  });
}
