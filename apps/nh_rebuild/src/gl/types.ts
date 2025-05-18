/// <reference lib="dom" />

// WebGL関連の型定義
export type WebGLContext = WebGL2RenderingContext | WebGLRenderingContext;
export type WebGLProg = WebGLProgram;
export type WebGLShad = WebGLShader;
export type WebGLBuf = WebGLBuffer;
export type WebGLTex = WebGLTexture;
export type WebGLFBuf = WebGLFramebuffer;
export type WebGLUniformLoc = WebGLUniformLocation;

// バッファ関連の型定義
export interface WebGLBufferWithLocation {
  buffer: NonNullable<WebGLBuf>;
  location: number;
}

export interface WebGLBufferWithCount {
  buffer: NonNullable<WebGLBuf>;
  cnt: number;
}

export interface CursorBuffers {
  position: WebGLBufferWithLocation;
  direction: WebGLBufferWithLocation;
  index: WebGLBufferWithCount;
}

// ブレンドモードの型定義
export type BlendMode = "normal" | "add" | "multiply";

// ウィンドウサイズの型定義
export interface WindowSize {
  width: number;
  height: number;
}

// ユニフォーム変数の型定義
export type UniformValue =
  | number
  | [number, number]
  | [number, number, number]
  | Float32Array;
export type UniformType = "1f" | "2f" | "3f" | "1i" | "mat4";

export interface UniformData {
  name: string;
  value: UniformValue;
  type: UniformType;
}

// プログラム情報の型定義
export interface ProgramInfo {
  id: NonNullable<WebGLProg>;
  uniforms: { [key: string]: NonNullable<WebGLUniformLoc> };
}

// デバイスモーション関連の型定義
export interface DeviceMotionData {
  x: number;
  y: number;
  z: number;
}

// DOM関連の型定義
export type HTMLElementOrNull = HTMLElement | null;
export type SVGElementOrNull = SVGSVGElement | null;
