import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import * as THREE from "three";
import { ParticleSystem } from "./ParticleSystem.ts";

// グローバルの型を拡張
declare global {
  var GPUComputationRenderer: any;
}

// WebGLRendererのモック
class MockWebGLRenderer {
  domElement = {};
  capabilities = { isWebGL2: true };
  xr = { enabled: false };
  shadowMap = { autoUpdate: true };
  info = { autoReset: true };
  constructor() {}
  setSize() {}
  getRenderTarget() {
    return null;
  }
  setRenderTarget() {}
  render() {}
  getContext() {
    return {
      getExtension() {
        return {};
      },
      createTexture() {
        return {};
      },
      bindTexture() {},
      texImage2D() {},
      texParameteri() {},
    };
  }
}

// GPUComputationRendererのモック
class MockGPUComputationRenderer {
  createTexture() {
    return new THREE.DataTexture(
      new Float32Array(16 * 16 * 4),
      16,
      16,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
  }
  addVariable() {
    return {
      material: {
        uniforms: {},
      },
    };
  }
  setVariableDependencies() {}
  init() {}
  compute() {}
  getCurrentRenderTarget() {
    return {
      texture: new THREE.DataTexture(
        new Float32Array(16 * 16 * 4),
        16,
        16,
        THREE.RGBAFormat,
        THREE.FloatType,
      ),
    };
  }
}

// Three.jsのモジュールをモック
const originalGPUComputationRenderer = globalThis.GPUComputationRenderer;
globalThis.GPUComputationRenderer = MockGPUComputationRenderer;

describe("ParticleSystem", () => {
  it("should initialize with correct properties", () => {
    const renderer = new MockWebGLRenderer() as unknown as THREE.WebGLRenderer;
    const particleCount = 256;

    // パーティクルシステムの作成
    const particleSystem = new ParticleSystem(renderer, { particleCount });

    // 基本的なプロパティの検証
    expect(particleSystem.particleCount).toBe(particleCount);
    expect(particleSystem.resolution).toBe(16); // sqrt(256)
    expect(particleSystem.renderer).toBe(renderer);
  });

  it("should create required textures", () => {
    const renderer = new MockWebGLRenderer() as unknown as THREE.WebGLRenderer;
    const particleSystem = new ParticleSystem(renderer, { particleCount: 256 });

    // テクスチャの存在確認
    expect(particleSystem.positionTexture).toBeDefined();
    expect(particleSystem.velocityTexture).toBeDefined();
    expect(particleSystem.lifeTexture).toBeDefined();
  });

  it("should create particle mesh", () => {
    const renderer = new MockWebGLRenderer() as unknown as THREE.WebGLRenderer;
    const particleSystem = new ParticleSystem(renderer, { particleCount: 256 });

    // メッシュの検証
    const mesh = particleSystem.getMesh();
    expect(mesh).toBeDefined();
    expect(mesh.geometry).toBeDefined();
    expect(mesh.material).toBeDefined();
  });
});

// モックを元に戻す
globalThis.GPUComputationRenderer = originalGPUComputationRenderer;
