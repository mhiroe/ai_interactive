/// <reference lib="dom" />

// ユーティリティ関数
const detectDevice = () => {
    const ua = navigator.userAgent;
    return {
        platform: {
            type: /(iPad|iPhone|iPod)/g.test(ua) ? "mobile" : "desktop",
        },
    };
};

const detectGPU = (options: { gpu?: string }): boolean => {
    const isIOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
    const isAppleGPU = typeof options.gpu === "string" &&
        options.gpu.includes("Apple");
    return isIOS || isAppleGPU;
};

const MAT4 = "mat4";

// テクスチャ名の定数
const VELOCITY0 = "velocity0";
const VELOCITY1 = "velocity1";
const POSITION0 = "position0";
const POSITION1 = "position1";
const POSITION = "position";
const LIFE0 = "life0";
const LIFE1 = "life1";

// シェーダーコード
const VERTEX_SHADER = `
attribute vec3 position;
uniform vec2 px;
varying vec2 uv;

void main() {
    uv = vec2(0.5)+(position.xy)*0.5;
    gl_Position = vec4(position, 1.0);
}`;

const FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D velocity;
uniform sampler2D pressure;
uniform float uAlpha;
varying vec2 uv;

const vec3 color0 = vec3(0.0,98./255., 157./255.);
const vec3 color2 = vec3(0.0,66./255., 107./255.); 
const vec3 color1 = vec3(0.15,0.54 + 0.15,0.86+ 0.1);

void main() {
    vec3 baseColor = mix(color0, mix(color0, color2, uv.x), uAlpha);
    vec2 vel = texture2D(velocity, uv).xy;
    float rate = length(vel);
    gl_FragColor.rgb = mix(baseColor, color1, vec3(rate * uAlpha));
    gl_FragColor.a = 1.0;
}`;

// WebGLマネージャークラス
class M {
    gl: WebGLRenderingContext;
    programs: {
        [key: string]: {
            id: WebGLProgram;
            uniforms: { [key: string]: WebGLUniformLocation | null };
        };
    } = {};
    textures: { [key: string]: WebGLTexture } = {};
    frameBuffers: { [key: string]: WebGLFramebuffer } = {};
    vbos: { position: { [key: string]: WebGLBuffer } } = { position: {} };

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        this.reset();
    }

    reset() {
        this.programs = {};
        this.frameBuffers = {};
        this.textures = {};
        this.vbos = { position: {} };
    }

    setSize(width: number, height: number) {
        this.gl.viewport(0, 0, width, height);
    }

    createProgram(name: string, vertexSource: string, fragmentSource: string) {
        const vertexShader = this.createShader(
            this.gl.VERTEX_SHADER,
            vertexSource,
        );
        const fragmentShader = this.createShader(
            this.gl.FRAGMENT_SHADER,
            fragmentSource,
        );
        if (!vertexShader || !fragmentShader) return null;

        const program = this.gl.createProgram();
        if (!program) return null;

        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.warn(`WebGLProgram: ${this.gl.getProgramInfoLog(program)}`);
            return null;
        }

        this.gl.useProgram(program);
        this.programs[name] = { id: program, uniforms: {} };
        return program;
    }

    createShader(type: number, source: string): WebGLShader | null {
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

    initTexture(
        name: string,
        width: number,
        height: number,
        type: number,
        data: Float32Array | null = null,
    ) {
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

    initFramebufferForTexture(
        name: string,
        width: number,
        height: number,
        depth = false,
    ) {
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

        if (depth) {
            const renderbuffer = this.gl.createRenderbuffer();
            if (renderbuffer) {
                this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, renderbuffer);
                this.gl.renderbufferStorage(
                    this.gl.RENDERBUFFER,
                    this.gl.DEPTH_COMPONENT16,
                    width,
                    height,
                );
            }
        }

        this.frameBuffers[name] = framebuffer;
    }

    setProgram(name: string) {
        const program = this.programs[name];
        if (program) {
            this.gl.useProgram(program.id);
        }
    }

    setUniform(
        programName: string,
        uniformName: string,
        value: any,
        type: string,
    ) {
        const program = this.programs[programName];
        if (!program) return;

        let location = program.uniforms[uniformName];
        if (location === undefined) {
            location = this.gl.getUniformLocation(program.id, uniformName);
            program.uniforms[uniformName] = location;
        }
        if (!location) return;

        switch (type) {
            case "1f":
                this.gl.uniform1f(location, value);
                break;
            case "2f":
                this.gl.uniform2f(location, value[0], value[1]);
                break;
            case "3f":
                this.gl.uniform3f(location, value[0], value[1], value[2]);
                break;
            case "1i":
                this.gl.uniform1i(location, value);
                break;
            case MAT4:
                this.gl.uniformMatrix4fv(location, false, value);
                break;
        }
    }
}

// パーティクルシステムクラス
class ParticleSystem {
    gl: WebGLRenderingContext;
    manager: M;
    isIOS: boolean;
    side: number;
    size: number;

    constructor(gl: WebGLRenderingContext, options: { gpu?: string }) {
        this.gl = gl;
        this.manager = new M(gl);

        const device = detectDevice();
        this.isIOS = detectGPU(options);

        // パーティクル数の設定
        if (device.platform.type === "desktop") {
            this.side = 256;
        } else {
            this.side = 128;
        }
        this.size = this.side * this.side;

        this.initialize();
    }

    initialize() {
        // シェーダープログラムの作成
        this.manager.createProgram("main", VERTEX_SHADER, FRAGMENT_SHADER);

        // テクスチャの初期化
        const type = this.isIOS
            ? this.gl.FLOAT
            : (this.gl as any).HALF_FLOAT_OES;
        [POSITION0, POSITION1, VELOCITY0, VELOCITY1, LIFE0, LIFE1].forEach(
            (name) => {
                this.manager.initTexture(name, this.side, this.side, type);
                this.manager.initFramebufferForTexture(
                    name,
                    this.side,
                    this.side,
                );
            },
        );
    }

    render(width: number, height: number) {
        this.gl.viewport(0, 0, width, height);
        this.manager.setProgram("main");
        // レンダリングロジック
    }
}

export { M as WebGLManager, ParticleSystem };
