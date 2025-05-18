import {
    BaseGLRenderer,
    CursorBuffers,
    WebGLBufferWithLocation,
} from "./gl/base.ts";
import {
    CURSOR_FRAGMENT_SHADER,
    CURSOR_VERTEX_SHADER,
    FRAGMENT_SHADER,
    OUTLINE_FRAGMENT_SHADER,
    OUTLINE_VERTEX_SHADER,
    VERTEX_SHADER,
} from "./gl/shaders.ts";
import {
    createBuffer,
    createIndexBuffer,
    createProgram,
    detectDevice,
    getUniforms,
} from "./gl/utils.ts";

// WebGLマネージャークラス
class WebGLManager extends BaseGLRenderer {
    protected textures: { [key: string]: WebGLTexture } = {};
    protected frameBuffers: { [key: string]: WebGLFramebuffer } = {};
    protected vbos: { position: { [key: string]: WebGLBuffer } } = {
        position: {},
    };

    constructor(gl: WebGLRenderingContext) {
        super(gl);
        this.reset();
    }

    public reset(): void {
        this.textures = {};
        this.frameBuffers = {};
        this.vbos = { position: {} };
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
}

// カーソルクラス
class CursorRenderer extends BaseGLRenderer {
    private buffers!: CursorBuffers;
    private opacity: number = 0;
    private isEnabled: boolean = true;
    private isMousedown: boolean = false;
    private scale: number = 1;
    private rad: number = 30;

    constructor(gl: WebGLRenderingContext) {
        super(gl);
        this.program = createProgram(
            this.gl,
            CURSOR_VERTEX_SHADER,
            CURSOR_FRAGMENT_SHADER,
        )!;
        this.uniforms = getUniforms(this.gl, this.program, [
            "uMouse",
            "uWindow",
            "uRad",
            "uCircleWidth",
            "uOpacity",
            "uScale",
        ]);
        this.initBuffers();
    }

    private initBuffers(): void {
        const positions: number[] = [];
        const directions: number[] = [];
        const indices: number[] = [];

        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            positions.push(cos, sin, cos, sin);
            directions.push(-1, 1);
        }

        for (let i = 0; i < 30; i++) {
            const i2 = i * 2;
            const i2p1 = i2 + 1;
            const i2p2 = (i2 + 2) % 60;
            const i2p3 = (i2 + 3) % 60;
            indices.push(i2, i2p1, i2p3, i2, i2p3, i2p2);
        }

        this.buffers = {
            position: createBuffer(
                this.gl,
                this.program,
                new Float32Array(positions),
                "position",
            ),
            direction: createBuffer(
                this.gl,
                this.program,
                new Float32Array(directions),
                "direction",
            ),
            index: createIndexBuffer(this.gl, new Uint16Array(indices)),
        };
    }

    public render(
        mouse: [number, number],
        velocity: [number, number],
        windowSize: [number, number],
    ): void {
        if (this.opacity === 0) return;

        this.gl.useProgram(this.program);

        // バッファのバインド
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position.buffer);
        this.gl.vertexAttribPointer(
            this.buffers.position.location,
            2,
            this.gl.FLOAT,
            false,
            0,
            0,
        );
        this.gl.enableVertexAttribArray(this.buffers.position.location);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.direction.buffer);
        this.gl.vertexAttribPointer(
            this.buffers.direction.location,
            1,
            this.gl.FLOAT,
            false,
            0,
            0,
        );
        this.gl.enableVertexAttribArray(this.buffers.direction.location);

        this.gl.bindBuffer(
            this.gl.ELEMENT_ARRAY_BUFFER,
            this.buffers.index.buffer,
        );

        // ユニフォーム変数の設定
        this.gl.uniform1f(this.uniforms.uOpacity, this.opacity);
        this.gl.uniform1f(
            this.uniforms.uScale,
            Math.sqrt(velocity[0] * velocity[0] + velocity[1] * velocity[1]),
        );
        this.gl.uniform2f(this.uniforms.uWindow, windowSize[0], windowSize[1]);
        this.gl.uniform2f(this.uniforms.uMouse, mouse[0], mouse[1]);

        // 描画
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_COLOR);
        this.gl.blendFuncSeparate(
            this.gl.SRC_ALPHA,
            this.gl.ONE,
            this.gl.ONE,
            this.gl.ONE_MINUS_SRC_ALPHA,
        );

        this.gl.drawElements(
            this.gl.TRIANGLES,
            this.buffers.index.cnt,
            this.gl.UNSIGNED_SHORT,
            0,
        );
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
        this.isMousedown = true;
        this.opacity = 1;
        this.scale = 0.8;
        this.rad = 24;
    }

    public mouseup(): void {
        this.isMousedown = false;
        if (this.isEnabled) {
            this.opacity = 0.6;
            this.scale = 1;
            this.rad = 20;
        }
    }
}

// アウトラインクラス
class OutlineRenderer extends BaseGLRenderer {
    private position!: WebGLBufferWithLocation;
    private alpha: number = 0;
    private browser: ReturnType<typeof detectDevice>;

    constructor(gl: WebGLRenderingContext) {
        super(gl);
        this.program = createProgram(
            this.gl,
            OUTLINE_VERTEX_SHADER,
            OUTLINE_FRAGMENT_SHADER,
        )!;
        this.uniforms = getUniforms(this.gl, this.program, [
            "uTopLeft",
            "uBotRight",
            "uAlpha",
            "velocity",
        ]);
        this.browser = detectDevice();
        this.initBuffers();
    }

    private initBuffers(): void {
        const positions: number[] = [];
        const count = this.browser.platform.type === "desktop" ? 40 : 1;

        for (let i = 0; i < count; i++) {
            const t = i / count;
            positions.push(
                Math.cos(t * Math.PI * 2),
                Math.sin(t * Math.PI * 2),
            );
        }

        this.position = createBuffer(
            this.gl,
            this.program,
            new Float32Array(positions),
            "position",
        );
    }

    public render(
        topLeft: [number, number],
        botRight: [number, number],
        velocityTexture: WebGLTexture,
    ): void {
        this.gl.useProgram(this.program);

        // バッファのバインド
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.position.buffer);
        this.gl.vertexAttribPointer(
            this.position.location,
            2,
            this.gl.FLOAT,
            false,
            0,
            0,
        );
        this.gl.enableVertexAttribArray(this.position.location);

        // ユニフォーム変数の設定
        this.gl.uniform2f(this.uniforms.uTopLeft, topLeft[0], topLeft[1]);
        this.gl.uniform2f(this.uniforms.uBotRight, botRight[0], botRight[1]);
        this.gl.uniform1f(this.uniforms.uAlpha, this.alpha);

        // テクスチャのバインド
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, velocityTexture);
        this.gl.uniform1i(this.uniforms.velocity, 0);

        // 描画
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFuncSeparate(
            this.gl.SRC_ALPHA,
            this.gl.ONE,
            this.gl.ONE,
            this.gl.ONE_MINUS_SRC_ALPHA,
        );

        this.gl.drawArrays(this.gl.LINES, 0, this.position.location);
    }

    public animatein(): void {
        this.alpha = this.browser.platform.type === "desktop"
            ? 0.3
            : this.browser.platform.type === "tablet"
            ? 0.2
            : 0.15;
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

        this.init();
    }

    private init(): void {
        this.mainProgram = createProgram(
            this.gl,
            VERTEX_SHADER,
            FRAGMENT_SHADER,
        );
        if (!this.mainProgram) {
            throw new Error("Failed to initialize particle system");
        }

        for (let i = 0; i < this.size; i++) {
            this.resetParticle(i);
        }
    }

    private resetParticle(index: number): void {
        // 位置をランダムに設定
        this.positions[index * 4] = (Math.random() - 0.5) * 2;
        this.positions[index * 4 + 1] = (Math.random() - 0.5) * 2;
        this.positions[index * 4 + 2] = (Math.random() - 0.5) * 2;
        this.positions[index * 4 + 3] = 1;

        // UV座標
        const x = (index % this.size) / this.size;
        const y = Math.floor(index / this.size) / this.size;
        this.uvs[index * 2] = x;
        this.uvs[index * 2 + 1] = y;

        // ライフタイム
        this.lifes[index * 4] = Math.random() * -4; // 現在の時間
        this.lifes[index * 4 + 1] = Math.random() * 5 + 1; // 持続時間
        this.lifes[index * 4 + 2] = 0;
        this.lifes[index * 4 + 3] = 1;
    }

    public render(width: number, height: number): void {
        if (!this.mainProgram) return;

        // ビューポートの設定
        this.gl.viewport(0, 0, width, height);

        // パーティクルの更新と描画
        this.gl.useProgram(this.mainProgram);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.drawArrays(this.gl.POINTS, 0, this.size);
    }
}

export { CursorRenderer, OutlineRenderer, ParticleSystem, WebGLManager };
