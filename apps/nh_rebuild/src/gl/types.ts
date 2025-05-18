/// <reference lib="dom" />

// WebGL型定義
export type WebGLContext = WebGLRenderingContext;
export type WebGLProg = WebGLProgram;
export type WebGLShad = WebGLShader;
export type WebGLBuf = WebGLBuffer;
export type WebGLTex = WebGLTexture;
export type WebGLFBuf = WebGLFramebuffer;
export type WebGLUniformLoc = WebGLUniformLocation;

// バッファ関連の型定義
export interface WebGLBufferWithLocation {
    buffer: WebGLBuf;
    location: number;
}

export interface WebGLBufferWithCount {
    buffer: WebGLBuf;
    cnt: number;
}

export interface CursorBuffers {
    position: WebGLBufferWithLocation;
    direction: WebGLBufferWithLocation;
    index: WebGLBufferWithCount;
}

// シェーダー関連の型定義
export type UniformType = "1f" | "2f" | "3f" | "1i" | "mat4";
export type BlendMode = "normal" | "add" | "multiply";

// ウィンドウ関連の型定義
export interface WindowSize {
    width: number;
    height: number;
}

export const getWindowSize = (): WindowSize => ({
    width: window.innerWidth,
    height: window.innerHeight,
});
