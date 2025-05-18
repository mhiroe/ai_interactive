export const detectDevice = () => {
    const ua = navigator.userAgent;
    return {
        platform: {
            type: /(iPad|iPhone|iPod)/g.test(ua) ? "mobile" : "desktop",
        },
    };
};

export const isAppleDevice = (gpu: { gpu?: string[] }) => {
    const hasAppleGPU = !!gpu.gpu && gpu.gpu.includes("Apple");
    return /(iPad|iPhone|iPod)/g.test(navigator.userAgent) || hasAppleGPU;
};

export const createShader = (
    gl: WebGLRenderingContext,
    type: number,
    source: string,
): WebGLShader | null => {
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

export const createProgram = (
    gl: WebGLRenderingContext,
    vertexSource: string,
    fragmentSource: string,
): WebGLProgram | null => {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn(`WebGLProgram: ${gl.getProgramInfoLog(program)}`);
        return null;
    }

    return program;
};

export const getUniforms = (
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    names: string[],
): { [key: string]: WebGLUniformLocation } => {
    const uniforms: { [key: string]: WebGLUniformLocation } = {};
    for (const name of names) {
        const location = gl.getUniformLocation(program, name);
        if (location) uniforms[name] = location;
    }
    return uniforms;
};

export const createBuffer = (
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    data: Float32Array,
    attributeName: string,
) => {
    const buffer = gl.createBuffer();
    const location = gl.getAttribLocation(program, attributeName);
    if (!buffer) throw new Error("Failed to create buffer");

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    return { buffer, location };
};

export const createIndexBuffer = (
    gl: WebGLRenderingContext,
    data: Uint16Array,
) => {
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error("Failed to create index buffer");

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    return { buffer, cnt: data.length };
};
