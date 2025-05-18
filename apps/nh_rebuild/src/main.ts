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

// 定数
const MAT4 = "mat4";
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
class WebGLManager {
    private gl: WebGLRenderingContext;
    private programs: {
        [key: string]: {
            id: WebGLProgram;
            uniforms: { [key: string]: WebGLUniformLocation | null };
        };
    };
    private textures: { [key: string]: WebGLTexture };
    private frameBuffers: { [key: string]: WebGLFramebuffer };
    private vbos: { position: { [key: string]: WebGLBuffer } };
    private mvMatrix: Float32Array;
    private projectionMatrix: Float32Array;
    private mvpMatrix: Float32Array;
    private targetMouse: [number, number];
    private lastMouse: [number, number];
    private mouseVelocity: [number, number];

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        this.programs = {};
        this.textures = {};
        this.frameBuffers = {};
        this.vbos = { position: {} };
        this.mvMatrix = new Float32Array(16);
        this.projectionMatrix = new Float32Array(16);
        this.mvpMatrix = new Float32Array(16);
        this.targetMouse = [0, 0];
        this.lastMouse = [0, 0];
        this.mouseVelocity = [0, 0];

        this.reset();
        this.createMatrix();
        this.initShaders();
    }

    reset(): void {
        this.programs = {};
        this.frameBuffers = {};
        this.textures = {};
        this.vbos = { position: {} };
    }

    createMatrix(): void {
        const fov = Math.PI * 0.25;
        const aspect = window.innerWidth / window.innerHeight;

        // 射影行列の設定
        const f = 1.0 / Math.tan(fov / 2);
        this.projectionMatrix[0] = f / aspect;
        this.projectionMatrix[5] = f;
        this.projectionMatrix[10] = -1;
        this.projectionMatrix[11] = -1;
        this.projectionMatrix[14] = -2;

        // モデルビュー行列の設定
        this.mvMatrix[0] = 1;
        this.mvMatrix[5] = 1;
        this.mvMatrix[10] = 1;
        this.mvMatrix[15] = 1;
        this.mvMatrix[14] = -10; // カメラ位置

        // MVP行列の計算
        this.multiply(this.mvpMatrix, this.projectionMatrix, this.mvMatrix);
    }

    multiply(out: Float32Array, a: Float32Array, b: Float32Array): void {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[4];
        b1 = b[5];
        b2 = b[6];
        b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[8];
        b1 = b[9];
        b2 = b[10];
        b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[12];
        b1 = b[13];
        b2 = b[14];
        b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    }

    initShaders(): void {
        // メインシェーダー
        this.createProgram("main", VERTEX_SHADER, FRAGMENT_SHADER);

        // 速度シェーダー
        this.createProgram(
            "velocity",
            VERTEX_SHADER,
            `
            precision highp float;
            uniform sampler2D pressure;
            uniform sampler2D velocity;
            uniform float scale;
            uniform vec2 px;
            varying vec2 uv;

            void main() {
                float x0 = texture2D(pressure, uv-vec2(px.x, 0)).r;
                float x1 = texture2D(pressure, uv+vec2(px.x, 0)).r;
                float y0 = texture2D(pressure, uv-vec2(0, px.y)).r;
                float y1 = texture2D(pressure, uv+vec2(0, px.y)).r;
                vec2 v = texture2D(velocity, uv).xy;
                vec4 v2 = vec4((v-(vec2(x1, y1)-vec2(x0, y0))*0.5)*scale, 1.0, 1.0);
                v2 = v2 * 0.99;
                gl_FragColor = v2;
            }
        `,
        );

        // 圧力シェーダー
        this.createProgram(
            "pressure",
            VERTEX_SHADER,
            `
            precision highp float;
            uniform sampler2D pressure;
            uniform sampler2D divergence;
            uniform float alpha;
            uniform float beta;
            uniform vec2 px;
            varying vec2 uv;

            void main() {
                float x0 = texture2D(pressure, uv-vec2(px.x, 0)).r;
                float x1 = texture2D(pressure, uv+vec2(px.x, 0)).r;
                float y0 = texture2D(pressure, uv-vec2(0, px.y)).r;
                float y1 = texture2D(pressure, uv+vec2(0, px.y)).r;
                float d = texture2D(divergence, uv).r;
                float relaxed = (x0 + x1 + y0 + y1 + alpha * d) * beta;
                gl_FragColor = vec4(relaxed);
            }
        `,
        );
    }

    createProgram(
        name: string,
        vertexSource: string,
        fragmentSource: string,
    ): WebGLProgram | null {
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

    initFramebuffer(name: string, width: number, height: number): void {
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

    run(
        name: string,
        inputs: string[],
        output: string,
        blendMode = "normal",
    ): void {
        const program = this.programs[name];
        if (!program) return;

        this.gl.useProgram(program.id);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffers[output]);

        // テクスチャのバインド
        for (let i = 0; i < inputs.length; i++) {
            this.gl.activeTexture(this.gl.TEXTURE0 + i);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[inputs[i]]);
        }

        // ブレンドモードの設定
        this.setBlendMode(blendMode as "normal" | "add");

        // 描画
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    setBlendMode(mode: "normal" | "add"): void {
        if (mode === "add") {
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFuncSeparate(
                this.gl.SRC_ALPHA,
                this.gl.ONE,
                this.gl.ONE,
                this.gl.ONE_MINUS_SRC_ALPHA,
            );
        } else {
            this.gl.disable(this.gl.BLEND);
        }
    }

    swapTextures(name1: string, name2: string): void {
        const tempTex = this.textures[name1];
        this.textures[name1] = this.textures[name2];
        this.textures[name2] = tempTex;

        const tempFB = this.frameBuffers[name1];
        this.frameBuffers[name1] = this.frameBuffers[name2];
        this.frameBuffers[name2] = tempFB;
    }
}

// パーティクルシステムクラス
class ParticleSystem {
    private gl: WebGLRenderingContext;
    private manager: WebGLManager;
    private isIOS: boolean;
    private side: number;
    private size: number;
    private positions: Float32Array;
    private uvs: Float32Array;
    private lifes: Float32Array;
    private isInit: boolean = true;

    constructor(gl: WebGLRenderingContext, options: { gpu?: string }) {
        this.gl = gl;
        this.manager = new WebGLManager(gl);

        const device = detectDevice();
        this.isIOS = detectGPU(options);

        // パーティクル数の設定
        this.side = device.platform.type === "desktop" ? 256 : 128;
        this.size = this.side * this.side;

        // バッファの初期化
        this.positions = new Float32Array(this.size * 4);
        this.uvs = new Float32Array(this.size * 2);
        this.lifes = new Float32Array(this.size * 4);

        this.initialize();
    }

    private initialize(): void {
        // テクスチャの初期化
        const type = this.isIOS
            ? this.gl.FLOAT
            : (this.gl as any).HALF_FLOAT_OES;

        [POSITION0, POSITION1, VELOCITY0, VELOCITY1, LIFE0, LIFE1].forEach(
            (name) => {
                this.manager.initTexture(name, this.side, this.side, type);
                this.manager.initFramebuffer(name, this.side, this.side);
            },
        );

        // 初期値の設定
        this.initializeParticles();
    }

    private initializeParticles(): void {
        for (let i = 0; i < this.size; i++) {
            const x = (i % this.side) / this.side;
            const y = Math.floor(i / this.side) / this.side;

            // 位置
            this.positions[i * 4] = (Math.random() - 0.5) * 2;
            this.positions[i * 4 + 1] = (Math.random() - 0.5) * 2;
            this.positions[i * 4 + 2] = (Math.random() - 0.5) * 2;
            this.positions[i * 4 + 3] = 1;

            // UV座標
            this.uvs[i * 2] = x;
            this.uvs[i * 2 + 1] = y;

            // ライフ
            this.lifes[i * 4] = Math.random() * -4; // 現在の時間
            this.lifes[i * 4 + 1] = Math.random() * 5 + 1; // 持続時間
            this.lifes[i * 4 + 2] = 0;
            this.lifes[i * 4 + 3] = 1;
        }
    }

    render(width: number, height: number): void {
        // ビューポートの設定
        this.gl.viewport(0, 0, width, height);

        // パーティクルの更新
        this.updateParticles();

        // パーティクルの描画
        this.draw();
    }

    private updateParticles(): void {
        // 速度の更新
        this.manager.run("velocity", [VELOCITY0, POSITION0], VELOCITY1);
        this.manager.swapTextures(VELOCITY0, VELOCITY1);

        // 位置の更新
        this.manager.run("main", [POSITION0, VELOCITY0], POSITION1);
        this.manager.swapTextures(POSITION0, POSITION1);

        // ライフの更新
        this.manager.run("life", [LIFE0], LIFE1);
        this.manager.swapTextures(LIFE0, LIFE1);
    }

    private draw(): void {
        // ブレンドモードの設定
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        // 描画
        this.gl.drawArrays(this.gl.POINTS, 0, this.size);
    }
}

export { ParticleSystem, WebGLManager };
