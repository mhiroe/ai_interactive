import * as THREE from "three";

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

// 簡単なジオメトリを追加（テスト用）
const geometry = new THREE.PlaneGeometry(1.8, 1.8);
const material = new THREE.MeshBasicMaterial({
  color: 0x3366ff,
  transparent: true,
  opacity: 0.5,
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);

  // テスト用のアニメーション
  mesh.rotation.z += 0.01;

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

console.log("Fluid Particles App initialized");
