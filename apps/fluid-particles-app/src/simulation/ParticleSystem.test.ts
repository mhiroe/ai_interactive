import { expect } from "@std/expect";
import { beforeEach, describe, it } from "@std/testing/bdd";
import * as THREE from "three";
import { ParticleSystem, ParticleSystemOptions } from "./ParticleSystem.ts";
import { DeviceCapabilities } from "../utils/deviceDetection.ts";

// モックシェーダー
const mockShaders = {
  position: `
    void main() {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  `,
  life: `
    void main() {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  `,
  particle: `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `,
};

// DOMのモック
class MockCanvas {
  width = 800;
  height = 600;
}

// グローバルオブジェクトの型定義
declare global {
  interface Window {
    GPUComputationRenderer: any;
  }
}

// WebGLRendererのモック
class MockWebGLRenderer {
  domElement = new MockCanvas();
  capabilities = {
    isWebGL2: true,
    maxVertexTextures: 16, // Required by GPUComputationRenderer
    maxTextures: 16,
    floatFragmentTextures: true,
    floatVertexTextures: true,
  };
  renderTarget: THREE.WebGLRenderTarget | null = null;

  // Mocked GL context parts that might be used by state
  mockGlContext = {
    enable: (cap: number) => {/* console.log(`MockGL: enable(${cap})`); */},
    disable: (cap: number) => {/* console.log(`MockGL: disable(${cap})`); */},
    getExtension: (name: string) => {
      // console.log(`MockGL: getExtension(${name})`);
      if (name === "OES_texture_float_linear") return {}; // Example
      return null;
    },
    getParameter: (pname: number) => {
      // console.log(`MockGL: getParameter(${pname})`);
      if (pname === 0x8D57) return 16; // MAX_VERTEX_TEXTURE_IMAGE_UNITS
      return null;
    },
    DEPTH_TEST: 0x0B71, // Example value
  };

  state = {
    enable: () => {},
    disable: () => {},
    enabled: true,
    enabledState: new Map<string, boolean>(),
    buffers: {
      color: { setMask: () => {} },
      depth: {
        setMask: () => {},
        setFunc: () => {},
        setTest: (test: boolean) => { // Add setTest
          if (test) {
            this.mockGlContext.enable(this.mockGlContext.DEPTH_TEST);
          } else {
            this.mockGlContext.disable(this.mockGlContext.DEPTH_TEST);
          }
        },
      },
      stencil: { setMask: () => {}, setFunc: () => {}, setOp: () => {} },
    },
    setBlending: () => {},
    setColorWrite: () => {},
    setDepthTest: () => {},
    setDepthWrite: () => {},
  };

  // Mock extensions object
  extensions = {
    has: (extensionName: string) => {
      if (extensionName === "OES_texture_float") return true;
      if (extensionName === "OES_texture_half_float_linear") return true;
      if (extensionName === "OES_texture_float_linear") return true;
      return false;
    },
    get: (extensionName: string) => {
      if (this.extensions.has(extensionName)) return {}; // Return a dummy object
      return null;
    },
  };
  constructor() {
    this.domElement.width = 800;
    this.domElement.height = 600;
  }

  setRenderTarget(target: THREE.WebGLRenderTarget | null) {
    this.renderTarget = target;
  }

  getRenderTarget() {
    return this.renderTarget;
  }

  getContext() {
    return this.mockGlContext;
  }

  setSize() {}
  render() {}

  // Properties GPUComputationRenderer might access
  xr = {
    enabled: false,
    isPresenting: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  shadowMap = { autoUpdate: false, enabled: false };

  // Methods GPUComputationRenderer might call
  setRenderTargetMS = () => {}; // For WebGL2
  readRenderTargetPixels = () => {};
}

// GPUComputationRendererのモック
class MockGPUComputationRenderer {
  private variables: Map<string, any> = new Map();
  private currentRenderTarget: THREE.WebGLRenderTarget;
  private renderer: MockWebGLRenderer;
  private renderTargetTexture: THREE.Texture;
  state = {
    enabled: true,
  };

  constructor(width: number, height: number, renderer: MockWebGLRenderer) {
    this.renderer = renderer;
    this.currentRenderTarget = new THREE.WebGLRenderTarget(width, height);
    this.renderTargetTexture = new THREE.Texture();
  }

  createTexture() {
    return {
      image: {
        data: new Float32Array(16),
      },
    };
  }

  addVariable(name: string, shader: string, texture: any) {
    const variable = {
      name,
      initialValueTexture: texture,
      material: {
        uniforms: {},
      },
      dependencies: null as string[] | null,
      renderTargets: [
        new THREE.WebGLRenderTarget(800, 600),
        new THREE.WebGLRenderTarget(800, 600),
      ],
      wrapS: null as number | null,
      wrapT: null as number | null,
      minFilter: null as number | null,
      magFilter: null as number | null,
    };
    this.variables.set(name, variable);
    return variable;
  }

  setVariableDependencies(variable: any, dependencies: string[]) {
    variable.dependencies = dependencies;
  }

  init() {
    return null;
  }

  compute() {
    // シミュレートされた計算
    this.renderer.setRenderTarget(this.currentRenderTarget);
    this.renderer.render();
    this.renderer.setRenderTarget(null);
  }

  getCurrentRenderTarget(variable: any) {
    return {
      texture: this.renderTargetTexture,
    };
  }

  dispose() {
    this.variables.clear();
    if (this.currentRenderTarget) {
      this.currentRenderTarget.dispose();
    }
  }

  doRenderTarget(material: any, output: any) {
    // シミュレートされたレンダリング
    return true;
  }

  renderTexture(input: any, output: any) {
    // シミュレートされたテクスチャレンダリング
    return true;
  }
}

// モック用のデバイス性能情報
const mockHighPerformanceDevice: DeviceCapabilities = {
  isMobile: false,
  gpuPerformance: "high",
  isSmallScreen: false,
};

const mockLowPerformanceDevice: DeviceCapabilities = {
  isMobile: true,
  gpuPerformance: "low",
  isSmallScreen: true,
};

// テスト用のモッククラス
class TestParticleSystem extends ParticleSystem {
  constructor(renderer: THREE.WebGLRenderer, options: ParticleSystemOptions) {
    // GPUComputationRendererをモックに置き換え
    (globalThis as any).GPUComputationRenderer = MockGPUComputationRenderer;
    super(renderer, options);
  }

  // シェーダーのロードをオーバーライド
  protected override async loadAndOptimizeShader(
    path: string,
  ): Promise<string> {
    // パスからシェーダーの種類を判断
    const shaderType = path.split("/").pop()?.split(".")[0];
    if (!shaderType || !(shaderType in mockShaders)) {
      throw new Error(`Unknown shader type: ${shaderType}`);
    }
    return mockShaders[shaderType as keyof typeof mockShaders];
  }

  // スクリーンサイズの設定をオーバーライド
  public override setScreenSize(width: number, height: number): void {
    super.setScreenSize(width, height);
  }

  // テスト用のヘルパーメソッド
  getInternalState() {
    return {
      particleCount: this.getParticleCount(),
      resolution: this.getResolution(),
      renderer: this.renderer,
      positionTexture: this.positionTexture,
      velocityTexture: this.velocityTexture,
      lifeTexture: this.lifeTexture,
    };
  }
}

describe("ParticleSystem", () => {
  let renderer: THREE.WebGLRenderer;

  beforeEach(() => {
    // WebGLRendererをモックに置き換え
    renderer = new MockWebGLRenderer() as unknown as THREE.WebGLRenderer;
  });

  it("基本的な初期化", () => {
    const particleCount = 4096;
    const particleSystem = new TestParticleSystem(renderer, {
      particleCount,
      deviceCapabilities: mockHighPerformanceDevice,
    });

    const state = particleSystem.getInternalState();
    expect(state.particleCount).toBe(particleCount);
    expect(state.resolution).toBe(64); // sqrt(4096)
    expect(state.renderer).toBe(renderer);
  });

  it("テクスチャの初期化", () => {
    const particleSystem = new TestParticleSystem(renderer, {
      particleCount: 4096,
      deviceCapabilities: mockHighPerformanceDevice,
    });

    const state = particleSystem.getInternalState();
    expect(state.positionTexture).toBeDefined();
    expect(state.velocityTexture).toBeDefined();
    expect(state.lifeTexture).toBeDefined();
  });

  it("パーティクル数の最適化（低性能デバイス）", () => {
    const baseParticleCount = 65536; // 256 * 256
    const particleSystem = new TestParticleSystem(renderer, {
      particleCount: baseParticleCount,
      deviceCapabilities: mockLowPerformanceDevice,
    });

    const state = particleSystem.getInternalState();
    // モバイル(0.5) * 低性能GPU(0.5) * 小画面(0.75) = 0.1875
    // 65536 * 0.1875 = 12288、ただし2の累乗の平方根に調整される
    expect(state.particleCount).toBeLessThan(baseParticleCount);
  });

  it("パフォーマンス情報の取得", () => {
    const particleSystem = new TestParticleSystem(renderer, {
      particleCount: 4096,
      deviceCapabilities: mockHighPerformanceDevice,
    });

    const info = particleSystem.getPerformanceInfo();
    expect(info.particleCount).toBe(4096);
    expect(typeof info.averageFPS).toBe("number");
  });

  it("メッシュの取得", () => {
    const particleSystem = new TestParticleSystem(renderer, {
      particleCount: 4096,
      deviceCapabilities: mockHighPerformanceDevice,
    });

    const mesh = particleSystem.getMesh();
    expect(mesh).toBeInstanceOf(THREE.Points);
  });

  it("リソースの解放", () => {
    const particleSystem = new TestParticleSystem(renderer, {
      particleCount: 4096,
      deviceCapabilities: mockHighPerformanceDevice,
    });

    // disposeメソッドが例外を投げないことを確認
    expect(() => particleSystem.dispose()).not.toThrow();
  });
});
