import * as THREE from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer";
import { DeviceCapabilities } from "../utils/deviceDetection.ts";
import { ResourceManager } from "../utils/resourceManager.ts";
import { PerformanceMonitor } from "../utils/performanceMonitor.ts";

export interface ParticleSystemOptions {
  particleCount?: number;
  deviceCapabilities: DeviceCapabilities;
}

interface ParticleUniforms {
  positionTexture: { value: THREE.Texture | null };
  velocityTexture: { value: THREE.Texture | null };
  lifeTexture: { value: THREE.Texture | null };
  screenSize: { value: THREE.Vector2 };
}

type ParticleMaterial = THREE.ShaderMaterial & { uniforms: ParticleUniforms };

export class ParticleSystem {
  protected renderer: THREE.WebGLRenderer;
  protected particleCount: number;
  protected resolution: number;
  protected gpuCompute: GPUComputationRenderer;
  protected positionTexture: THREE.DataTexture;
  protected velocityTexture: THREE.DataTexture;
  protected lifeTexture: THREE.DataTexture;
  protected positionVariable: any;
  protected lifeVariable: any;
  protected positionUniforms: any;
  protected lifeUniforms: any;
  protected particleMesh!: THREE.Points;
  protected resourceManager: ResourceManager;
  protected performanceMonitor: PerformanceMonitor;
  protected deviceCapabilities: DeviceCapabilities;
  protected initialized: boolean = false;
  protected screenSize: THREE.Vector2;

  constructor(
    renderer: THREE.WebGLRenderer,
    options: ParticleSystemOptions,
  ) {
    this.renderer = renderer;
    this.deviceCapabilities = options.deviceCapabilities;
    this.resourceManager = new ResourceManager();
    this.performanceMonitor = new PerformanceMonitor(30);
    this.screenSize = new THREE.Vector2(800, 600); // デフォルトサイズ

    // デバイス性能に応じてパーティクル数を調整
    const baseParticleCount = options.particleCount || 65536; // 256 * 256
    this.particleCount = this.calculateOptimalParticleCount(baseParticleCount);
    this.resolution = Math.sqrt(this.particleCount);

    this.gpuCompute = new GPUComputationRenderer(
      this.resolution,
      this.resolution,
      renderer,
    );

    // テクスチャの初期化
    this.positionTexture = this.gpuCompute.createTexture();
    this.velocityTexture = this.gpuCompute.createTexture();
    this.lifeTexture = this.gpuCompute.createTexture();

    this.initTextures();
    this.initParticleMesh();
    this.initShaders().then(() => {
      this.initialized = true;
    });
  }

  /**
   * スクリーンサイズを設定
   */
  public setScreenSize(width: number, height: number): void {
    this.screenSize.set(width, height);
    if (this.particleMesh) {
      const material = this.particleMesh
        .material as unknown as ParticleMaterial;
      if (material.uniforms?.screenSize) {
        material.uniforms.screenSize.value.copy(this.screenSize);
      }
    }
  }

  private calculateOptimalParticleCount(baseCount: number): number {
    let count = baseCount;

    // モバイルデバイスの場合は粒子数を減らす
    if (this.deviceCapabilities.isMobile) {
      count = Math.floor(count * 0.5);
    }

    // 低性能GPUの場合はさらに減らす
    if (this.deviceCapabilities.gpuPerformance === "low") {
      count = Math.floor(count * 0.5);
    }

    // 小さい画面の場合も減らす
    if (this.deviceCapabilities.isSmallScreen) {
      count = Math.floor(count * 0.75);
    }

    // 最小値を確保
    count = Math.max(count, 4096); // 64 * 64

    // 2の累乗の平方根に近い値に調整
    const sqrt = Math.sqrt(count);
    const powerOf2 = Math.pow(2, Math.ceil(Math.log2(sqrt)));
    return powerOf2 * powerOf2;
  }

  private initTextures() {
    // 位置テクスチャの初期化
    const positionData = this.positionTexture.image?.data as unknown;
    if (!positionData || !ArrayBuffer.isView(positionData)) {
      throw new Error("Failed to initialize position texture");
    }
    const positionArray = new Float32Array(positionData.buffer);
    for (let i = 0; i < positionArray.length; i += 4) {
      // ランダムな位置を設定（画面内に収まるように）
      positionArray[i] = Math.random() * 1.8 - 0.9; // x
      positionArray[i + 1] = Math.random() * 1.8 - 0.9; // y
      positionArray[i + 2] = 0; // z
      positionArray[i + 3] = 1;
    }

    // 寿命テクスチャの初期化
    const lifeData = this.lifeTexture.image?.data as unknown;
    if (!lifeData || !ArrayBuffer.isView(lifeData)) {
      throw new Error("Failed to initialize life texture");
    }
    const lifeArray = new Float32Array(lifeData.buffer);
    for (let i = 0; i < lifeArray.length; i += 4) {
      // ランダムな寿命を設定（デバイス性能に応じて調整）
      const duration = this.deviceCapabilities.gpuPerformance === "high"
        ? Math.random() * 5.0 + 1.0
        : Math.random() * 3.0 + 1.0;
      const startTime = -Math.random() * duration;
      lifeArray[i] = startTime; // 現在の時間
      lifeArray[i + 1] = duration; // 寿命の長さ
      lifeArray[i + 2] = 0;
      lifeArray[i + 3] = 1;
    }
  }

  private initParticleMesh() {
    // パーティクルのジオメトリ
    const geometry = new THREE.BufferGeometry();

    // UVを生成（テクスチャからデータを取得するため）
    const uvs = new Float32Array(this.particleCount * 2);
    for (let i = 0; i < this.resolution; i++) {
      for (let j = 0; j < this.resolution; j++) {
        const idx = i * this.resolution + j;
        uvs[idx * 2] = j / (this.resolution - 1);
        uvs[idx * 2 + 1] = i / (this.resolution - 1);
      }
    }

    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

    // パーティクルのマテリアル
    const material = new THREE.ShaderMaterial({
      uniforms: {
        positionTexture: { value: null },
        velocityTexture: { value: null },
        lifeTexture: { value: null },
        screenSize: { value: this.screenSize.clone() },
      } as ParticleUniforms,
      vertexShader: "", // initShadersで設定
      fragmentShader: "", // initShadersで設定
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // パーティクルメッシュの作成
    this.particleMesh = new THREE.Points(
      geometry,
      material as unknown as THREE.PointsMaterial,
    );
  }

  private async initShaders() {
    try {
      // シェーダーの読み込みと最適化
      const [
        positionShader,
        lifeShader,
        particleVertexShader,
        particleFragmentShader,
      ] = await Promise.all([
        this.loadAndOptimizeShader("./shaders/position.frag"),
        this.loadAndOptimizeShader("./shaders/life.frag"),
        this.loadAndOptimizeShader("./shaders/particle.vert"),
        this.loadAndOptimizeShader("./shaders/particle.frag"),
      ]);

      // 位置更新シェーダー
      this.positionVariable = this.gpuCompute.addVariable(
        "positionTexture",
        positionShader,
        this.positionTexture,
      );

      // 寿命更新シェーダー
      this.lifeVariable = this.gpuCompute.addVariable(
        "lifeTexture",
        lifeShader,
        this.lifeTexture,
      );

      // 依存関係の設定
      this.gpuCompute.setVariableDependencies(this.positionVariable, [
        this.positionVariable,
        this.lifeVariable,
      ]);
      this.gpuCompute.setVariableDependencies(this.lifeVariable, [
        this.lifeVariable,
      ]);

      // ユニフォーム変数の設定
      this.positionUniforms = this.positionVariable.material.uniforms;
      this.positionUniforms.velocityFieldTexture = { value: null };
      this.positionUniforms.dt = { value: 0.016 };
      this.positionUniforms.screenSize = { value: this.screenSize.clone() };

      this.lifeUniforms = this.lifeVariable.material.uniforms;
      this.lifeUniforms.dt = { value: 0.016 };

      // GPUComputationRendererの初期化
      const error = this.gpuCompute.init();
      if (error !== null) {
        throw new Error(
          `GPUComputationRenderer initialization failed: ${error}`,
        );
      }

      // パーティクルのシェーダーを設定
      const material = this.particleMesh
        .material as unknown as ParticleMaterial;
      material.vertexShader = particleVertexShader;
      material.fragmentShader = particleFragmentShader;
    } catch (error) {
      console.error("シェーダーの初期化に失敗しました:", error);
      throw error;
    }
  }

  protected async loadAndOptimizeShader(path: string): Promise<string> {
    const shader = await fetch(path).then((r) => r.text());
    return this.optimizeShaderForDevice(shader);
  }

  private optimizeShaderForDevice(shader: string): string {
    if (this.deviceCapabilities.gpuPerformance === "low") {
      // 低性能デバイス用に最適化
      return shader
        .replace(/precision highp float/g, "precision mediump float")
        .replace(/vec4/g, "mediump vec4")
        .replace(/vec3/g, "mediump vec3")
        .replace(/vec2/g, "mediump vec2");
    }
    return shader;
  }

  update(velocityFieldTexture: THREE.Texture) {
    if (!this.initialized) return;

    // パフォーマンスモニタリング
    const currentTime = performance.now();
    const needsQualityReduction = this.performanceMonitor.update(currentTime);

    // 速度場テクスチャの更新
    this.positionUniforms.velocityFieldTexture.value = velocityFieldTexture;

    // パーティクルの位置と寿命の更新
    this.gpuCompute.compute();

    // パーティクルメッシュのテクスチャを更新
    const material = this.particleMesh.material as unknown as ParticleMaterial;
    material.uniforms.positionTexture.value =
      this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
    material.uniforms.lifeTexture.value =
      this.gpuCompute.getCurrentRenderTarget(this.lifeVariable).texture;
    material.uniforms.velocityTexture.value = velocityFieldTexture;
  }

  /**
   * 現在のパフォーマンス状態を取得
   */
  getPerformanceInfo(): {
    averageFPS: number;
    particleCount: number;
  } {
    return {
      averageFPS: this.performanceMonitor.getAverageFPS(),
      particleCount: this.particleCount,
    };
  }

  dispose() {
    // リソースの解放
    this.gpuCompute.dispose();
    this.resourceManager.dispose();

    if (this.particleMesh.geometry) {
      this.particleMesh.geometry.dispose();
    }
    if (this.particleMesh.material instanceof THREE.Material) {
      this.particleMesh.material.dispose();
    }
  }

  getMesh(): THREE.Points {
    return this.particleMesh;
  }

  // テスト用のメソッド
  getParticleCount(): number {
    return this.particleCount;
  }

  getResolution(): number {
    return this.resolution;
  }
}
