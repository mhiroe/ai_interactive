/// <reference lib="dom" />

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

const GLOW_SHADER = `
precision highp float;
uniform sampler2D uTexture;
uniform float uIntensity;
varying vec2 vUv;

void main() {
    vec4 color = texture2D(uTexture, vUv);
    vec3 glow = color.rgb * uIntensity;
    gl_FragColor = vec4(color.rgb + glow, color.a);
}`;

// インタラクション管理クラス
class InteractionManager {
    private isMouseDown: boolean = false;
    private isEnabled: boolean = true;
    private mouseVelocity: number = 0;
    private targetX: number = 0;
    private targetY: number = 0;
    private scale: number = 1;
    private opacity: number = 0.6;
    private gl: WebGLRenderingContext;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
    }

    public setEnable(enabled: boolean): void {
        this.isEnabled = enabled;
        if (!enabled) {
            this.opacity = 0;
        }
    }

    public mouseenter(): void {
        if (this.isEnabled) {
            this.opacity = 0.6;
        }
    }

    public mouseleave(): void {
        if (this.isEnabled) {
            this.opacity = 0;
        }
    }

    public mousedown(): void {
        if (!this.isEnabled) return;
        this.isMouseDown = true;
        this.opacity = 1;
        this.scale = 0.8;
    }

    public mouseup(): void {
        if (!this.isEnabled) return;
        this.isMouseDown = false;
        this.opacity = 0.6;
        this.scale = 1;
    }

    public mousemove(event: { x: number; y: number }): void {
        const prevX = this.targetX;
        const prevY = this.targetY;
        this.targetX = event.x;
        this.targetY = event.y;

        const dx = this.targetX - prevX;
        const dy = this.targetY - prevY;
        this.mouseVelocity = dx * dx + dy * dy;
    }

    public getOpacity(): number {
        return this.opacity;
    }

    public getScale(): number {
        return this.scale;
    }

    public getVelocity(): number {
        return this.mouseVelocity;
    }
}

// WebGLマネージャークラス
class WebGLManager {
    protected gl: WebGLRenderingContext;
    protected programs: {
        [key: string]: {
            id: WebGLProgram;
            uniforms: { [key: string]: WebGLUniformLocation | null };
        };
    };
    protected textures: { [key: string]: WebGLTexture };
    protected frameBuffers: { [key: string]: WebGLFramebuffer };
    protected vbos: { position: { [key: string]: WebGLBuffer } };

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        this.programs = {};
        this.textures = {};
        this.frameBuffers = {};
        this.vbos = { position: {} };
        this.initShaders();
    }

    protected initShaders(): void {
        this.createProgram("main", VERTEX_SHADER, FRAGMENT_SHADER);
        this.createProgram("glow", VERTEX_SHADER, GLOW_SHADER);
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

    public createProgram(
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

    public setBlendMode(mode: "normal" | "add" | "multiply"): void {
        switch (mode) {
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
                this.gl.blendFunc(
                    this.gl.SRC_ALPHA,
                    this.gl.ONE_MINUS_SRC_ALPHA,
                );
                break;
        }
    }

    public getProgram(name: string): WebGLProgram | null {
        return this.programs[name]?.id || null;
    }

    public getTexture(name: string): WebGLTexture | null {
        return this.textures[name] || null;
    }
}

// パーティクルシステムクラス
class ParticleSystem {
    private gl: WebGLRenderingContext;
    private manager: WebGLManager;
    private size: number;
    private positions: Float32Array;
    private uvs: Float32Array;
    private lifes: Float32Array;
    private isInit: boolean = true;
    private mainProgram: WebGLProgram | null = null;

    constructor(gl: WebGLRenderingContext, size: number) {
        this.gl = gl;
        this.manager = new WebGLManager(gl);
        this.size = size;

        // バッファの初期化
        this.positions = new Float32Array(size * 4);
        this.uvs = new Float32Array(size * 2);
        this.lifes = new Float32Array(size * 4);

        this.initialize();
    }

    private initialize(): void {
        this.mainProgram = this.manager.getProgram("main");
        if (!this.mainProgram) {
            throw new Error("Failed to initialize particle system");
        }

        for (let i = 0; i < this.size; i++) {
            this.resetParticle(i);
        }
    }

    private updateLifecycle(): void {
        for (let i = 0; i < this.size; i++) {
            // 現在の時間を更新
            this.lifes[i * 4] += 1 / 60;

            // 寿命を超えたパーティクルをリセット
            if (this.lifes[i * 4] > this.lifes[i * 4 + 1]) {
                this.resetParticle(i);
            }
        }
    }

    private resetParticle(index: number): void {
        // 位置をランダムに設定
        this.positions[index * 4] = (Math.random() - 0.5) * 2;
        this.positions[index * 4 + 1] = (Math.random() - 0.5) * 2;
        this.positions[index * 4 + 2] = (Math.random() - 0.5) * 2;
        this.positions[index * 4 + 3] = 1;

        // ライフタイムをリセット
        this.lifes[index * 4] = Math.random() * -4; // 現在の時間
        this.lifes[index * 4 + 1] = Math.random() * 5 + 1; // 持続時間
        this.lifes[index * 4 + 2] = 0;
        this.lifes[index * 4 + 3] = 1;
    }

    private updateParticles(): void {
        if (!this.mainProgram) return;

        // パーティクルの更新処理
        this.gl.useProgram(this.mainProgram);
        // [パーティクル更新の実装]
    }

    private draw(): void {
        if (!this.mainProgram) return;

        // パーティクルの描画処理
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.drawArrays(this.gl.POINTS, 0, this.size);
    }

    public render(width: number, height: number): void {
        // ビューポートの設定
        this.gl.viewport(0, 0, width, height);

        // パーティクルの更新
        this.updateParticles();
        this.updateLifecycle();

        // パーティクルの描画
        this.draw();
    }
}

export { InteractionManager, ParticleSystem, WebGLManager };
