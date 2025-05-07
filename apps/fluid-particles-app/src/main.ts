import * as THREE from "npm:three@0.150.0";
import { FluidSimulation } from "./simulation/FluidSimulation.ts";

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

// 流体表示用のジオメトリ
const geometry = new THREE.PlaneGeometry(1.8, 1.8);
const material = new THREE.MeshBasicMaterial({
  map: null, // シミュレーション結果のテクスチャを後で設定
  transparent: true,
  opacity: 0.8,
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// マウス位置の追跡
const mouse = new THREE.Vector2();
const mouseDelta = new THREE.Vector2();
const prevMouse = new THREE.Vector2();
let isMouseDown = false;

// マウスイベントハンドラ
function updateMousePosition(event: MouseEvent) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

window.addEventListener("mousedown", (event) => {
  isMouseDown = true;
  updateMousePosition(event);
  prevMouse.copy(mouse);
});

window.addEventListener("mouseup", () => {
  isMouseDown = false;
  mouseDelta.set(0, 0);
});

window.addEventListener("mousemove", (event) => {
  if (!isMouseDown) return;

  updateMousePosition(event);
  mouseDelta.subVectors(mouse, prevMouse);
  prevMouse.copy(mouse);
});

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);

  // 流体シミュレーションの更新
  if (isMouseDown) {
    const simulationTexture = fluidSimulation.update(mouse, mouseDelta);
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
});

console.log("Fluid Particles App initialized");
