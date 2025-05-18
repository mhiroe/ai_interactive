/// <reference lib="dom" />

// 基本型定義
export interface WebGLBufferWithLocation {
    buffer: WebGLBuffer;
    location: number;
}

export interface WebGLBufferWithCount {
    buffer: WebGLBuffer;
    cnt: number;
}

export interface CursorBuffers {
    position: WebGLBufferWithLocation;
    direction: WebGLBufferWithLocation;
    index: WebGLBufferWithCount;
}

// 基本WebGLクラス
export abstract class BaseGLRenderer {
    protected gl: WebGLRenderingContext;
    protected program: WebGLProgram;
    protected uniforms: { [key: string]: WebGLUniformLocation };

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        this.program = this.gl.createProgram()!;
        this.uniforms = {};
    }

    protected createProgram(
        vertexSource: string,
        fragmentSource: string,
    ): WebGLProgram {
        const vertexShader = this.createShader(
            this.gl.VERTEX_SHADER,
            vertexSource,
        );
        const fragmentShader = this.createShader(
            this.gl.FRAGMENT_SHADER,
            fragmentSource,
        );
        if (!vertexShader || !fragmentShader) {
            throw new Error("Failed to create shaders");
        }

        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            throw new Error(
                "Failed to link program: " +
                    this.gl.getProgramInfoLog(this.program),
            );
        }

        return this.program;
    }

    protected createShader(type: number, source: string): WebGLShader | null {
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

    protected getUniforms(
        names: string[],
    ): { [key: string]: WebGLUniformLocation } {
        const uniforms: { [key: string]: WebGLUniformLocation } = {};
        for (const name of names) {
            const location = this.gl.getUniformLocation(this.program, name);
            if (location) uniforms[name] = location;
        }
        return uniforms;
    }

    protected createBuffer(
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

    protected createIndexBuffer(data: Uint16Array): WebGLBufferWithCount {
        const buffer = this.gl.createBuffer();
        if (!buffer) throw new Error("Failed to create index buffer");

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
        this.gl.bufferData(
            this.gl.ELEMENT_ARRAY_BUFFER,
            data,
            this.gl.STATIC_DRAW,
        );

        return { buffer, cnt: data.length };
    }

    public getProgram(): WebGLProgram {
        return this.program;
    }
}
