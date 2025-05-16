import * as THREE from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer";
import { DeviceCapabilities } from "../utils/deviceDetection.ts";
import { ResourceManager } from "../utils/resourceManager.ts";
import { PerformanceMonitor } from "../utils/performanceMonitor.ts";

export class FluidSimulation {
  protected renderer: THREE.WebGLRenderer;
  protected resolution: number;
  protected gpuCompute: GPUComputationRenderer;
  protected velocityTexture: THREE.DataTexture;
  protected pressureTexture: THREE.DataTexture;
  protected divergenceTexture: THREE.DataTexture;
  protected velocityVariable: any;
  protected pressureVariable: any;
  protected divergenceVariable: any;
  protected velocityUniforms: any;
  protected pressureUniforms: any;
  protected divergenceUniforms: any;
  protected resourceManager: ResourceManager;
  protected performanceMonitor: PerformanceMonitor;
  protected deviceCapabilities: DeviceCapabilities;
  protected initialized: boolean = false;
  protected pressureIterations: number = 20;

  static async create(
    renderer: THREE.WebGLRenderer,
    resolution: number,
    deviceCapabilities: DeviceCapabilities,
  ): Promise<FluidSimulation> {
    const simulation = new FluidSimulation(renderer, resolution, deviceCapabilities);
    await simulation.initialize();
    return simulation;
  }

  private constructor(
    renderer: THREE.WebGLRenderer,
    resolution: number,
    deviceCapabilities: DeviceCapabilities,
  ) {
    this.renderer = renderer;
    this.resolution = resolution;
    this.deviceCapabilities = deviceCapabilities;
    this.resourceManager = new ResourceManager();
    this.performanceMonitor = new PerformanceMonitor(30);

    // デバイス性能に応じて反復回数を調整
    if (deviceCapabilities.gpuPerformance === "low") {
      this.pressureIterations = 10;
    }

    this.gpuCompute = new GPUComputationRenderer(
      resolution,
      resolution,
      renderer,
    );

    // テクスチャの初期化
    this.velocityTexture = this.gpuCompute.createTexture();
    this.pressureTexture = this.gpuCompute.createTexture();
    this.divergenceTexture = this.gpuCompute.createTexture();

    this.initTextures();
  }

  private async initialize(): Promise<void> {
    await this.initShaders();
    this.initialized = true;
  }

  private initTextures() {
    // 速度場テクスチャの初期化
    const velocityData = this.velocityTexture.image?.data as unknown;
    if (!velocityData || !ArrayBuffer.isView(velocityData)) {
      throw new Error("Failed to initialize velocity texture");
    }
    const velocityArray = new Float32Array(velocityData.buffer);
    for (let i = 0; i < velocityArray.length; i += 4) {
      velocityArray[i] = 0; // x方向の速度
      velocityArray[i + 1] = 0; // y方向の速度
      velocityArray[i + 2] = 0;
      velocityArray[i + 3] = 1;
    }

    // 圧力場テクスチャの初期化
    const pressureData = this.pressureTexture.image?.data as unknown;
    if (!pressureData || !ArrayBuffer.isView(pressureData)) {
      throw new Error("Failed to initialize pressure texture");
    }
    const pressureArray = new Float32Array(pressureData.buffer);
    for (let i = 0; i < pressureArray.length; i += 4) {
      pressureArray[i] = 0;
      pressureArray[i + 1] = 0;
      pressureArray[i + 2] = 0;
      pressureArray[i + 3] = 1;
    }

    // 発散場テクスチャの初期化
    const divergenceData = this.divergenceTexture.image?.data as unknown;
    if (!divergenceData || !ArrayBuffer.isView(divergenceData)) {
      throw new Error("Failed to initialize divergence texture");
    }
    const divergenceArray = new Float32Array(divergenceData.buffer);
    for (let i = 0; i < divergenceArray.length; i += 4) {
      divergenceArray[i] = 0;
      divergenceArray[i + 1] = 0;
      divergenceArray[i + 2] = 0;
      divergenceArray[i + 3] = 1;
    }
  }

  private async initShaders() {
    try {
      // シェーダーの読み込みと最適化
      console.log("Loading shaders...");
      const [velocityShader, divergenceShader, pressureShader] = await Promise
        .all(
          [
            this.loadAndOptimizeShader("/shaders/velocity.frag"),
            this.loadAndOptimizeShader(
              "/shaders/divergence.frag",
            ),
            this.loadAndOptimizeShader("/shaders/pressure.frag"),
          ],
        );
      console.log("Shaders loaded successfully");

      // 速度場の更新シェーダー
      this.velocityVariable = this.gpuCompute.addVariable(
        "velocityTexture",
        velocityShader,
        this.velocityTexture,
      );

      // 発散場の計算シェーダー
      this.divergenceVariable = this.gpuCompute.addVariable(
        "divergenceTexture",
        divergenceShader,
        this.divergenceTexture,
      );

      // 圧力場の計算シェーダー
      this.pressureVariable = this.gpuCompute.addVariable(
        "pressureTexture",
        pressureShader,
        this.pressureTexture,
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
      this.velocityUniforms = this.velocityVariable.material.uniforms;
      this.velocityUniforms.dt = { value: 0.016 };
      this.velocityUniforms.mousePos = { value: new THREE.Vector2(0, 0) };
      this.velocityUniforms.mouseDelta = { value: new THREE.Vector2(0, 0) };
      this.velocityUniforms.resolution = {
        value: new THREE.Vector2(this.resolution, this.resolution),
      };

      this.divergenceUniforms = this.divergenceVariable.material.uniforms;
      this.divergenceUniforms.dt = { value: 0.016 };
      this.divergenceUniforms.resolution = {
        value: new THREE.Vector2(this.resolution, this.resolution),
      };

      this.pressureUniforms = this.pressureVariable.material.uniforms;
      this.pressureUniforms.dt = { value: 0.016 };
      this.pressureUniforms.resolution = {
        value: new THREE.Vector2(this.resolution, this.resolution),
      };

      // GPUComputationRendererの初期化
      const error = this.gpuCompute.init();
      if (error !== null) {
        throw new Error(
          `GPUComputationRenderer initialization failed: ${error}`,
        );
      }
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
    // シェーダーから#versionとprecision宣言のみを削除
    const cleanedShader = shader
      .split("\n")
      .filter((line) => {
        const trimmedLine = line.trim();
        return !trimmedLine.startsWith("#version") &&
          !trimmedLine.startsWith("precision");
      })
      .join("\n");

    // シェーダー本体を最適化
    let optimizedBody = cleanedShader;
    if (this.deviceCapabilities.gpuPerformance === "low") {
      optimizedBody = optimizedBody
        .replace(/(?<!uniform\s+)vec4/g, "mediump vec4")
        .replace(/(?<!uniform\s+)vec3/g, "mediump vec3")
        .replace(/(?<!uniform\s+)vec2/g, "mediump vec2");
    }

    // シェーダー本体のみを返す（GPUComputationRendererがヘッダーを追加する）
    return optimizedBody;
  }

  update(mousePos: THREE.Vector2, mouseDelta: THREE.Vector2): THREE.Texture {
    if (!this.initialized) {
      console.log("FluidSimulation not yet initialized");
      return this.velocityTexture;
    }

    // パフォーマンスモニタリング
    const currentTime = performance.now();
    const needsQualityReduction = this.performanceMonitor.update(currentTime);

    // マウス入力の更新
    this.velocityUniforms.mousePos.value.copy(mousePos);
    this.velocityUniforms.mouseDelta.value.copy(mouseDelta);

    // 流体シミュレーションの更新
    for (let i = 0; i < this.pressureIterations; i++) {
      // gpuCompute.compute() は、initShadersで設定されたすべての変数（velocity, divergence, pressure）を
      // 依存関係に基づいて計算します。pressureIterationsループは、通常、圧力計算のような
      // 反復解法を複数回実行して結果を収束させるために使用されます。
      this.gpuCompute.compute();
    }

    return this.gpuCompute.getCurrentRenderTarget(this.velocityVariable)
      .texture;
  }

  /**
   * 現在のパフォーマンス状態を取得
   */
  getPerformanceInfo(): {
    averageFPS: number;
    pressureIterations: number;
  } {
    return {
      averageFPS: this.performanceMonitor.getAverageFPS(),
      pressureIterations: this.pressureIterations,
    };
  }

  dispose() {
    // リソースの解放
    this.gpuCompute.dispose();
    this.resourceManager.dispose();
  }
}
