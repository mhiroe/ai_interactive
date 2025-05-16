import * as THREE from "three";
import { FluidSimulation } from "./simulation/FluidSimulation.ts";
import { ParticleSystem } from "./simulation/ParticleSystem.ts";
import { InteractionManager } from "./simulation/InteractionManager.ts";
import { detectDeviceCapabilities } from "./utils/deviceDetection.ts";

// デバイス性能の検出
const deviceCapabilities = detectDeviceCapabilities();

// レンダラーの設定
const renderer = new THREE.WebGLRenderer({
  antialias: deviceCapabilities.gpuPerformance === "high",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// シーンの設定
const scene = new THREE.Scene();

// カメラの設定
const aspectRatio = window.innerWidth / window.innerHeight;
const frustumSize = 2;
const camera = new THREE.OrthographicCamera(
  (frustumSize * aspectRatio) / -2,
  (frustumSize * aspectRatio) / 2,
  frustumSize / 2,
  frustumSize / -2,
  -1000,
  1000,
);
(camera as unknown as { position: THREE.Vector3 }).position.set(0, 0, 1);

// メインの初期化関数
async function init() {
  try {
    console.log("Initializing systems...");

    // 流体シミュレーションの初期化
    const fluidResolution = deviceCapabilities.gpuPerformance === "high"
      ? 256
      : 128;
    const fluidSimulation = await FluidSimulation.create(
      renderer,
      fluidResolution,
      deviceCapabilities,
    );

    // パーティクルシステムの初期化
    const particleSystem = await ParticleSystem.create(renderer, {
      particleCount: 65536,
      deviceCapabilities,
    });
    scene.add(particleSystem.getMesh());

    // インタラクションマネージャーの初期化
    const interactionManager = new InteractionManager(renderer.domElement);

    console.log("All systems initialized successfully");

    // アニメーションループ
    function animate() {
      requestAnimationFrame(animate);

      // マウス入力の更新
      const mousePos = interactionManager.getMousePosition();
      const mouseDelta = interactionManager.getMouseDelta();

      // 流体シミュレーションの更新
      const velocityTexture = fluidSimulation.update(mousePos, mouseDelta);

      // パーティクルの更新
      particleSystem.update(velocityTexture);

      // レンダリング
      renderer.render(scene, camera);
    }

    // リサイズハンドラー
    function onWindowResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = width / height;

      camera.left = (frustumSize * aspect) / -2;
      camera.right = (frustumSize * aspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = frustumSize / -2;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      particleSystem.setScreenSize(width, height);
    }

    window.addEventListener("resize", onWindowResize);

    // クリーンアップ
    window.addEventListener("beforeunload", () => {
      fluidSimulation.dispose();
      particleSystem.dispose();
      renderer.dispose();
    });

    // アニメーション開始
    animate();
  } catch (error) {
    console.error("Initialization failed:", error);
    throw error;
  }
}

// 初期化を開始
init().catch((error) => {
  console.error("Fatal error:", error);
});
