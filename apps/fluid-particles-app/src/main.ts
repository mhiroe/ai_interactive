import * as THREE from "three";
import { FluidSimulation } from "./simulation/FluidSimulation.ts";
import { InteractionManager } from "./simulation/InteractionManager.ts";

// Three.jsのセットアップ
const container = document.getElementById("container");
if (!container) {
  throw new Error("Container element not found");
}

// レンダラーの初期化
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// シーンとカメラのセットアップ
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

// 流体シミュレーションのセットアップ
const SIMULATION_RESOLUTION = 256;
const fluidSimulation = new FluidSimulation(renderer, SIMULATION_RESOLUTION);

// インタラクションマネージャーのセットアップ
const interactionManager = new InteractionManager(renderer.domElement);

// 流体表示用のジオメトリ
const geometry = new THREE.PlaneGeometry(1.8, 1.8);
const material = new THREE.MeshBasicMaterial({
  map: null, // シミュレーション結果のテクスチャを後で設定
  transparent: true,
  opacity: 0.8,
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);

  // 流体シミュレーションの更新
  const mousePos = interactionManager.getMousePosition();
  const mouseDelta = interactionManager.getMouseDelta();
  const simulationTexture = fluidSimulation.update(mousePos, mouseDelta);
  if (simulationTexture) {
    material.map = simulationTexture;
    material.needsUpdate = true;
  }

  renderer.render(scene, camera);
}
animate();

// リサイズハンドラ
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.left = -width / height;
  camera.right = width / height;
  camera.top = 1;
  camera.bottom = -1;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
});

// クリーンアップ
window.addEventListener("beforeunload", () => {
  fluidSimulation.dispose();
  interactionManager.dispose();
});

console.log("Fluid Particles App initialized");
