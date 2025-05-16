import * as THREE from "three";

/**
 * リソース管理クラス
 * テクスチャ、ジオメトリ、マテリアルなどのリソースを一元管理します
 */
export class ResourceManager {
  private textures: Map<string, THREE.Texture>;
  private geometries: Map<string, THREE.BufferGeometry>;
  private materials: Map<string, THREE.Material>;
  private shaders: Map<string, string>;

  constructor() {
    this.textures = new Map();
    this.geometries = new Map();
    this.materials = new Map();
    this.shaders = new Map();
  }

  /**
   * テクスチャを取得または作成します
   * @param key テクスチャの識別子
   * @param createFunc テクスチャを作成する関数
   * @returns テクスチャ
   */
  getTexture(
    key: string,
    createFunc: () => THREE.Texture,
  ): THREE.Texture {
    if (!this.textures.has(key)) {
      this.textures.set(key, createFunc());
    }
    return this.textures.get(key)!;
  }

  /**
   * ジオメトリを取得または作成します
   * @param key ジオメトリの識別子
   * @param createFunc ジオメトリを作成する関数
   * @returns ジオメトリ
   */
  getGeometry(
    key: string,
    createFunc: () => THREE.BufferGeometry,
  ): THREE.BufferGeometry {
    if (!this.geometries.has(key)) {
      this.geometries.set(key, createFunc());
    }
    return this.geometries.get(key)!;
  }

  /**
   * マテリアルを取得または作成します
   * @param key マテリアルの識別子
   * @param createFunc マテリアルを作成する関数
   * @returns マテリアル
   */
  getMaterial(
    key: string,
    createFunc: () => THREE.Material,
  ): THREE.Material {
    if (!this.materials.has(key)) {
      this.materials.set(key, createFunc());
    }
    return this.materials.get(key)!;
  }

  /**
   * シェーダーを取得または読み込みます
   * @param key シェーダーの識別子
   * @param path シェーダーファイルのパス
   * @returns シェーダーのソースコード
   */
  async getShader(key: string, path: string): Promise<string> {
    if (!this.shaders.has(key)) {
      const response = await fetch(path);
      const shader = await response.text();
      this.shaders.set(key, shader);
    }
    return this.shaders.get(key)!;
  }

  /**
   * キャッシュされたシェーダーを取得します
   * @param key シェーダーの識別子
   * @returns キャッシュされたシェーダーのソースコード、未キャッシュの場合はnull
   */
  getCachedShader(key: string): string | null {
    return this.shaders.get(key) ?? null;
  }

  /**
   * テクスチャを解放します
   * @param key テクスチャの識別子
   */
  disposeTexture(key: string): void {
    const texture = this.textures.get(key);
    if (texture) {
      texture.dispose();
      this.textures.delete(key);
    }
  }

  /**
   * ジオメトリを解放します
   * @param key ジオメトリの識別子
   */
  disposeGeometry(key: string): void {
    const geometry = this.geometries.get(key);
    if (geometry) {
      geometry.dispose();
      this.geometries.delete(key);
    }
  }

  /**
   * マテリアルを解放します
   * @param key マテリアルの識別子
   */
  disposeMaterial(key: string): void {
    const material = this.materials.get(key);
    if (material) {
      material.dispose();
      this.materials.delete(key);
    }
  }

  /**
   * すべてのリソースを解放します
   */
  dispose(): void {
    // テクスチャの解放
    this.textures.forEach((texture) => texture.dispose());
    this.textures.clear();

    // ジオメトリの解放
    this.geometries.forEach((geometry) => geometry.dispose());
    this.geometries.clear();

    // マテリアルの解放
    this.materials.forEach((material) => material.dispose());
    this.materials.clear();

    // シェーダーのクリア
    this.shaders.clear();
  }
}
