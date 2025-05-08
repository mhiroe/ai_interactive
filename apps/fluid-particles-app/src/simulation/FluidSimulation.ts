import * as THREE from "three";
import { GPUComputationRenderer } from "../../static/GPUComputationRenderer.js";

export class FluidSimulation {
  private resolution: number;
  private gpuCompute: GPUComputationRenderer;
  private velocityTexture: THREE.DataTexture;
  private pressureTexture: THREE.DataTexture;
  private divergenceTexture: THREE.DataTexture;
  private velocityVariable: any;
  private divergenceVariable: any;
  private pressureVariable: any;
  private velocityUniforms: {
    mousePos: { value: THREE.Vector2 };
    mouseDelta: { value: THREE.Vector2 };
    dt: { value: number };
    dissipation: { value: number };
  } = {
    mousePos: { value: new THREE.Vector2(0, 0) },
    mouseDelta: { value: new THREE.Vector2(0, 0) },
    dt: { value: 0.016 },
    dissipation: { value: 0.99 },
  };
  private divergenceUniforms: {
    cellSize: { value: number };
  } = {
    cellSize: { value: 0 }, // Will be set in constructor
  };
  private pressureUniforms: {
    cellSize: { value: number };
    alpha: { value: number };
    beta: { value: number };
  } = {
    cellSize: { value: 0 }, // Will be set in constructor
    alpha: { value: -1.0 },
    beta: { value: 0.25 },
  };

  constructor(renderer: THREE.WebGLRenderer, resolution: number) {
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

    // cellSizeの設定
    this.divergenceUniforms.cellSize.value = 1.0 / resolution;
    this.pressureUniforms.cellSize.value = 1.0 / resolution;

    this.initTextures();
    this.initShaders();
  }

  private initTextures(): void {
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

  private async initShaders(): Promise<void> {
    // シェーダーの読み込み
    const velocityShader = await fetch("/velocity.frag").then((r) => r.text());
    const divergenceShader = await fetch("/divergence.frag").then((r) =>
      r.text()
    );
    const pressureShader = await fetch("/pressure.frag").then((r) => r.text());

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
      this.pressureVariable
    ]);
    this.gpuCompute.setVariableDependencies(this.divergenceVariable, [
      this.velocityVariable
    ]);
    this.gpuCompute.setVariableDependencies(this.pressureVariable, [
      this.pressureVariable,
      this.divergenceVariable
    ]);

    // ユニフォーム変数の設定
    Object.assign(
      this.velocityVariable.material.uniforms,
      this.velocityUniforms
    );
    Object.assign(
      this.divergenceVariable.material.uniforms,
      this.divergenceUniforms
    );
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

  update(mousePos: THREE.Vector2, mouseDelta: THREE.Vector2): THREE.Texture {
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

  dispose(): void {
    this.gpuCompute.dispose();
  }
}
