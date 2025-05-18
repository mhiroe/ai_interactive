import type {
  BlendMode,
  CursorBuffers,
  ProgramInfo,
  UniformData,
  WebGLBuf,
  WebGLBufferWithCount,
  WebGLBufferWithLocation,
  WebGLContext,
  WebGLFBuf,
  WebGLProg,
  WebGLShad,
  WebGLTex,
  WebGLUniformLoc,
} from "./types.ts";

// 基本WebGLクラス
export abstract class BaseGLRenderer {
  protected gl: WebGLContext;
  protected program: WebGLProg;
  protected uniforms: { [key: string]: WebGLUniformLoc };
  protected textures: { [key: string]: WebGLTex } = {};
  protected frameBuffers: { [key: string]: WebGLFBuf } = {};
  protected vbos: { position: { [key: string]: WebGLBuf } } = { position: {} };
  protected programs: { [key: string]: ProgramInfo } = {};

  constructor(gl: WebGLContext) {
    this.gl = gl;
    this.program = this.gl.createProgram()!;
    this.uniforms = {};
  }

  public createProgram(
    name: string,
    vertexSource: string,
    fragmentSource: string,
  ): void {
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      fragmentSource,
    );
    if (!vertexShader || !fragmentShader) {
      throw new Error("Failed to create shaders");
    }

    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error(
        "Failed to link program: " + this.gl.getProgramInfoLog(program),
      );
    }

    this.programs[name] = {
      id: program,
      uniforms: {},
    };
  }

  public createShader(type: number, source: string): WebGLShad | null {
    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(this.gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

  public getUniforms(names: string[]): { [key: string]: WebGLUniformLoc } {
    const uniforms: { [key: string]: WebGLUniformLoc } = {};
    for (const name of names) {
      const location = this.gl.getUniformLocation(this.program, name);
      if (location) uniforms[name] = location;
    }
    return uniforms;
  }

  public createBuffer(
    data: Float32Array,
    attributeName: string,
  ): WebGLBufferWithLocation {
    const buffer = this.gl.createBuffer();
    if (!buffer) throw new Error("Failed to create buffer");

    const location = this.gl.getAttribLocation(this.program, attributeName);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

    return { buffer, location };
  }

  public createIndexBuffer(data: Uint16Array): WebGLBufferWithCount {
    const buffer = this.gl.createBuffer();
    if (!buffer) throw new Error("Failed to create index buffer");

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

    return { buffer, cnt: data.length };
  }

  public setProgram(name: string): void {
    const program = this.programs[name];
    if (!program) throw new Error(`Program ${name} not found`);
    this.gl.useProgram(program.id);
  }

  public initTexture(
    name: string,
    width: number,
    height: number,
    type: number,
    data: Float32Array | null = null,
  ): void {
    const texture = this.gl.createTexture();
    if (!texture) return;

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.LINEAR,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE,
    );
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      width,
      height,
      0,
      this.gl.RGBA,
      type,
      data,
    );

    this.textures[name] = texture;
  }

  public initFramebuffer(name: string, width: number, height: number): void {
    const texture = this.textures[name];
    if (!texture) return;

    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) return;

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      texture,
      0,
    );

    this.frameBuffers[name] = framebuffer;
  }

  public swapTextures(name1: string, name2: string): void {
    const tempTex = this.textures[name1];
    this.textures[name1] = this.textures[name2];
    this.textures[name2] = tempTex;

    const tempFB = this.frameBuffers[name1];
    this.frameBuffers[name1] = this.frameBuffers[name2];
    this.frameBuffers[name2] = tempFB;
  }

  public run(
    program: string,
    inputs: string[],
    output: string,
    blendMode: BlendMode = "normal",
  ): void {
    this.setProgram(program);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffers[output]);

    // テクスチャのバインド
    inputs.forEach((input, i) => {
      this.gl.activeTexture(this.gl.TEXTURE0 + i);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[input]);
    });

    // ブレンドモードの設定
    switch (blendMode) {
      case "add":
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
        break;
      case "multiply":
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.DST_COLOR, this.gl.ZERO);
        break;
      default:
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        break;
    }

    // 描画
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  public setUniform(programName: string, uniformData: UniformData): void {
    const program = this.programs[programName];
    if (!program) return;

    let location = program.uniforms[uniformData.name];
    if (!location) {
      const newLocation = this.gl.getUniformLocation(
        program.id,
        uniformData.name,
      );
      if (!newLocation) return;
      location = newLocation;
      program.uniforms[uniformData.name] = location;
    }

    switch (uniformData.type) {
      case "1f":
        this.gl.uniform1f(location, uniformData.value as number);
        break;
      case "2f":
        const [x, y] = uniformData.value as [number, number];
        this.gl.uniform2f(location, x, y);
        break;
      case "3f":
        const [r, g, b] = uniformData.value as [number, number, number];
        this.gl.uniform3f(location, r, g, b);
        break;
      case "1i":
        this.gl.uniform1i(location, uniformData.value as number);
        break;
      case "mat4":
        this.gl.uniformMatrix4fv(
          location,
          false,
          uniformData.value as Float32Array,
        );
        break;
      default:
        console.warn(`Unsupported uniform type: ${uniformData.type}`);
    }
  }
}

export type { CursorBuffers, WebGLBufferWithCount, WebGLBufferWithLocation };
