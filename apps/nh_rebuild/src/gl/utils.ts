import type {
    WebGLContext,
    WebGLProg,
    WebGLShad,
    WebGLUniformLoc,
    WindowSize,
} from "./types.ts";

// シェーダーの作成
export const createShader = (
    gl: WebGLContext,
    type: number,
    source: string,
): WebGLShad | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
};

// プログラムの作成
export const createProgram = (
    gl: WebGLContext,
    vertexSource: string,
    fragmentSource: string,
): WebGLProg | null => {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) {
        return null;
    }

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return null;
    }

    return program;
};

// ユニフォーム変数の取得
export const getUniforms = (
    gl: WebGLContext,
    program: WebGLProg,
    names: string[],
): { [key: string]: WebGLUniformLoc } => {
    const uniforms: { [key: string]: WebGLUniformLoc } = {};
    for (const name of names) {
        const location = gl.getUniformLocation(program, name);
        if (location) uniforms[name] = location;
    }
    return uniforms;
};

// バッファの作成
export const createBuffer = (
    gl: WebGLContext,
    program: WebGLProg,
    data: Float32Array,
    attributeName: string,
) => {
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error("Failed to create buffer");

    const location = gl.getAttribLocation(program, attributeName);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    return { buffer, location };
};

// インデックスバッファの作成
export const createIndexBuffer = (gl: WebGLContext, data: Uint16Array) => {
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error("Failed to create index buffer");

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    return { buffer, cnt: data.length };
};

// デバイス検出
export const detectDevice = () => {
    const ua = navigator.userAgent;
    const platform = {
        type: /Mobile|Android|iPhone|iPad|iPod/i.test(ua)
            ? /iPad/i.test(ua) ? "tablet" : "mobile"
            : "desktop",
    };
    return { platform };
};

// Apple デバイスの検出
export const isAppleDevice = (info: { gpu: string[] }) => {
    const hasAppleGPU = info.gpu.some((gpu) => gpu.includes("Apple"));
    return /(iPad|iPhone|iPod)/g.test(navigator.userAgent) || hasAppleGPU;
};

// ウィンドウサイズの取得
export const getWindowSize = (): WindowSize => ({
    width: globalThis.innerWidth,
    height: globalThis.innerHeight,
});
