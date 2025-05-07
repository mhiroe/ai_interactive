import * as THREE from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer";

class FluidSimulation {
  constructor(renderer, resolution) {
    this.resolution = resolution;
    this.gpuCompute = new GPUComputationRenderer(
      resolution,
      resolution,
      renderer
    );

    // テクスチャの初期化
    this.velocityTexture = this.gpuCompute.createTexture();
    this.pressureTexture = this.gpuCompute.createTexture();
    this.divergenceTexture = this.gpuCompute.createTexture();

    this.initTextures();
    this.initShaders();
  }

  initTextures() {
    // 速度テクスチャの初期化
    const velocityData = this.velocityTexture.image.data;
    for (let i = 0; i < velocityData.length; i += 4) {
      velocityData[i] = 0; // x方向の速度
      velocityData[i + 1] = 0; // y方向の速度
      velocityData[i + 2] = 0;
      velocityData[i + 3] = 1;
    }

    // 圧力テクスチャの初期化
    const pressureData = this.pressureTexture.image.data;
    for (let i = 0; i < pressureData.length; i += 4) {
      pressureData[i] = 0;
      pressureData[i + 1] = 0;
      pressureData[i + 2] = 0;
      pressureData[i + 3] = 1;
    }
  }

  async initShaders() {
    // シェーダーの読み込み
    const velocityShader = await fetch("velocity.frag").then((r) => r.text());
    const divergenceShader = await fetch("divergence.frag").then((r) =>
      r.text()
    );
    const pressureShader = await fetch("pressure.frag").then((r) => r.text());

    // 速度更新シェーダー
    this.velocityVariable = this.gpuCompute.addVariable(
      "velocityTexture",
      velocityShader,
      this.velocityTexture
    );

    // 発散計算シェーダー
    this.divergenceVariable = this.gpuCompute.addVariable(
      "divergenceTexture",
      divergenceShader,
      this.divergenceTexture
    );

    // 圧力計算シェーダー
    this.pressureVariable = this.gpuCompute.addVariable(
      "pressureTexture",
      pressureShader,
      this.pressureTexture
    );

    // 依存関係の設定
    this.gpuCompute.setVariableDependencies(this.velocityVariable, [
      this.velocityVariable,
      this.pressureVariable,
    ]);
    this.gpuCompute.setVariableDependencies(this.divergenceVariable, [
      this.velocityVariable,
    ]);
    this.gpuCompute.setVariableDependencies(this.pressureVariable, [
      this.pressureVariable,
      this.divergenceVariable,
    ]);

    // ユニフォーム変数の設定
    this.velocityUniforms = {
      mousePos: { value: new THREE.Vector2(0, 0) },
      mouseDelta: { value: new THREE.Vector2(0, 0) },
      dt: { value: 0.016 },
      dissipation: { value: 0.99 },
      resolution: {
        value: new THREE.Vector2(this.resolution, this.resolution),
      },
    };
    Object.assign(
      this.velocityVariable.material.uniforms,
      this.velocityUniforms
    );

    this.divergenceUniforms = {
      cellSize: { value: 1.0 / this.resolution },
      resolution: {
        value: new THREE.Vector2(this.resolution, this.resolution),
      },
    };
    Object.assign(
      this.divergenceVariable.material.uniforms,
      this.divergenceUniforms
    );

    this.pressureUniforms = {
      cellSize: { value: 1.0 / this.resolution },
      alpha: { value: -1.0 },
      beta: { value: 0.25 },
      resolution: {
        value: new THREE.Vector2(this.resolution, this.resolution),
      },
    };
    Object.assign(
      this.pressureVariable.material.uniforms,
      this.pressureUniforms
    );

    // GPUComputationRendererの初期化
    const error = this.gpuCompute.init();
    if (error !== null) {
      throw new Error(`GPUComputationRenderer initialization failed: ${error}`);
    }
  }

  update(mousePos, mouseDelta) {
    // マウス位置と移動量の更新
    this.velocityUniforms.mousePos.value.copy(mousePos);
    this.velocityUniforms.mouseDelta.value.copy(mouseDelta);

    // 流体シミュレーションの更新
    // 1. 速度場の更新
    this.gpuCompute.compute();

    // 2. 発散の計算
    this.divergenceVariable.material.uniforms.velocityTexture = {
      value: this.gpuCompute.getCurrentRenderTarget(this.velocityVariable)
        .texture,
    };
    this.gpuCompute.compute();

    // 3. 圧力の計算（複数回の反復）
    for (let i = 0; i < 10; i++) {
      this.pressureVariable.material.uniforms.divergenceTexture = {
        value: this.gpuCompute.getCurrentRenderTarget(this.divergenceVariable)
          .texture,
      };
      this.gpuCompute.compute();
    }

    // 4. 速度場の修正
    this.velocityVariable.material.uniforms.pressureTexture = {
      value: this.gpuCompute.getCurrentRenderTarget(this.pressureVariable)
        .texture,
    };
    this.gpuCompute.compute();

    return this.gpuCompute.getCurrentRenderTarget(this.velocityVariable)
      .texture;
  }

  dispose() {
    this.gpuCompute.dispose();
  }
}

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
function updateMousePosition(event) {
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
