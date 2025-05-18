import { BaseGLRenderer } from "./gl/base.ts";
import { Matrix4 } from "./gl/matrix.ts";
import {
    ADVECTION_SHADER,
    CURSOR_FRAGMENT_SHADER,
    CURSOR_VERTEX_SHADER,
    DIVERGENCE_SHADER,
    FRAGMENT_SHADER,
    LIFE_SHADER,
    OUTLINE_FRAGMENT_SHADER,
    OUTLINE_VERTEX_SHADER,
    POSITION_SHADER,
    PRESSURE_SHADER,
    VELOCITY_SHADER,
    VERTEX_SHADER,
} from "./gl/shaders.ts";
import type {
    BlendMode,
    CursorBuffers,
    WebGLBufferWithLocation,
    WebGLContext,
    WebGLProg,
    WebGLTex,
} from "./gl/types.ts";
import {
    createBuffer,
    createIndexBuffer,
    createProgram,
    detectDevice,
    getUniforms,
    getWindowSize,
    isAppleDevice,
} from "./gl/utils.ts";

// テクスチャ名の定義
const TEXTURE_NAMES = {
    VELOCITY_0: "velocity0",
    VELOCITY_1: "velocity1",
    VELOCITY_DIVERGENCE: "velocityDivergence",
    PRESSURE_0: "pressure0",
    PRESSURE_1: "pressure1",
    POSITION_0: "position0",
    POSITION_1: "position1",
    POSITION: "position",
    INIT_POSITION_BASE: "initPositionBase",
    LIFE_0: "life0",
    LIFE_1: "life1",
} as const;

type TextureNames = typeof TEXTURE_NAMES[keyof typeof TEXTURE_NAMES];

// WebGLマネージャークラス
class WebGLManager extends BaseGLRenderer {
    constructor(gl: WebGLContext) {
        super(gl);
        this.reset();
    }

    public reset(): void {
        this.textures = {};
        this.frameBuffers = {};
        this.vbos = { position: {} };
    }

    public setBlendMode(mode: BlendMode): void {
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

    constructor(gl: WebGLContext) {
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
        this.setUniform("uOpacity", this.opacity);
        this.setUniform(
            "uScale",
            Math.sqrt(velocity[0] * velocity[0] + velocity[1] * velocity[1]),
        );
        this.setUniform("uWindow", windowSize);
        this.setUniform("uMouse", mouse);

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

    constructor(gl: WebGLContext) {
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
        velocityTexture: WebGLTex,
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
        this.setUniform("uTopLeft", topLeft);
        this.setUniform("uBotRight", botRight);
        this.setUniform("uAlpha", this.alpha);

        // テクスチャのバインド
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, velocityTexture);
        this.setUniform("velocity", 0);

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
    private gl: WebGLContext;
    private manager: WebGLManager;
    private size: number;
    private positions: Float32Array;
    private uvs: Float32Array;
    private lifes: Float32Array;
    private isInit: boolean = true;
    private mainProgram: WebGLProg | null = null;
    private mvMatrix: Matrix4;
    private projectionMatrix: Matrix4;
    private mvpMatrix: Matrix4;

    constructor(gl: WebGLContext, size: number) {
        this.gl = gl;
        this.manager = new WebGLManager(gl);
        this.size = size;

        // 行列の初期化
        this.mvMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        this.mvpMatrix = new Matrix4();

        // バッファの初期化
        this.positions = new Float32Array(size * 4);
        this.uvs = new Float32Array(size * 2);
        this.lifes = new Float32Array(size * 4);

        this.init();
    }

    private init(): void {
        this.initializeMatrices();
        this.initializeShaders();
        this.initializeBuffers();
    }

    private initializeMatrices(): void {
        // 視野角を45度に設定
        const fovy = Math.PI * 0.25;
        const { width, height } = getWindowSize();
        const aspect = width / height;

        // プロジェクション行列の設定
        this.projectionMatrix.perspective(fovy, aspect, 0.1, 100.0);

        // ビュー行列の設定
        this.mvMatrix.lookAt(
            [0, 0, 10], // カメラ位置
            [0, 0, 0], // 注視点
            [0, 1, 0], // 上方向
        );

        // MVP行列の計算
        this.mvpMatrix = this.projectionMatrix.multiply(this.mvMatrix);
    }

    private initializeShaders(): void {
        // メインプログラム
        this.mainProgram = createProgram(
            this.gl,
            VERTEX_SHADER,
            FRAGMENT_SHADER,
        );
        if (!this.mainProgram) {
            throw new Error("Failed to initialize particle system");
        }

        // シェーダープログラムの初期化
        const programs = [
            { name: "life", vertex: VERTEX_SHADER, fragment: LIFE_SHADER },
            {
                name: "velocity",
                vertex: VERTEX_SHADER,
                fragment: VELOCITY_SHADER,
            },
            {
                name: "position",
                vertex: VERTEX_SHADER,
                fragment: POSITION_SHADER,
            },
            {
                name: "advection",
                vertex: VERTEX_SHADER,
                fragment: ADVECTION_SHADER,
            },
            {
                name: "divergence",
                vertex: VERTEX_SHADER,
                fragment: DIVERGENCE_SHADER,
            },
            {
                name: "pressure",
                vertex: VERTEX_SHADER,
                fragment: PRESSURE_SHADER,
            },
        ];

        for (const { name, vertex, fragment } of programs) {
            this.manager.createProgram(name, vertex, fragment);
        }

        // ユニフォーム変数の設定
        this.manager.setProgram("velocity");
        this.manager.setUniform("uMVPMatrix", this.mvpMatrix.getData());
    }

    private initializeBuffers(): void {
        const isIOS = isAppleDevice({ gpu: [] });
        const type = isIOS ? this.gl.FLOAT : (this.gl as any).HALF_FLOAT_OES;

        // ライフサイクルテクスチャの初期化
        for (let i = 0; i < this.size; i++) {
            const time = Math.random() * -4;
            const duration = Math.random() * 5 + 1;
            this.lifes[i * 4] = time;
            this.lifes[i * 4 + 1] = duration;
            this.lifes[i * 4 + 2] = 0;
            this.lifes[i * 4 + 3] = 1;
        }

        // テクスチャの初期化
        [
            TEXTURE_NAMES.LIFE_0,
            TEXTURE_NAMES.LIFE_1,
        ].forEach((name) => {
            this.manager.initTexture(
                name,
                this.size,
                this.size,
                type,
                isIOS ? null : this.lifes,
            );
            this.manager.initFramebuffer(name, this.size, this.size);
        });

        [
            TEXTURE_NAMES.POSITION,
            TEXTURE_NAMES.POSITION_0,
            TEXTURE_NAMES.POSITION_1,
            TEXTURE_NAMES.VELOCITY_0,
            TEXTURE_NAMES.VELOCITY_1,
        ].forEach((name) => {
            this.manager.initTexture(name, this.size, this.size, type);
            this.manager.initFramebuffer(name, this.size, this.size);
        });
    }

    public render(width: number, height: number): void {
        if (!this.mainProgram) return;

        // パーティクルの更新
        this.updateParticles();

        // ビューポートの設定
        this.gl.viewport(0, 0, width, height);

        // パーティクルの描画
        this.gl.useProgram(this.mainProgram);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.drawArrays(this.gl.POINTS, 0, this.size);
    }

    private updateParticles(): void {
        // ライフサイクルの更新
        this.manager.setProgram("life");
        this.manager.run("life", [TEXTURE_NAMES.LIFE_0], TEXTURE_NAMES.LIFE_1);
        this.manager.swapTextures(TEXTURE_NAMES.LIFE_0, TEXTURE_NAMES.LIFE_1);

        // 速度の更新
        this.manager.setProgram("velocity");
        this.manager.run(
            "velocity",
            [TEXTURE_NAMES.VELOCITY_0],
            TEXTURE_NAMES.VELOCITY_1,
        );
        this.manager.swapTextures(
            TEXTURE_NAMES.VELOCITY_0,
            TEXTURE_NAMES.VELOCITY_1,
        );

        // 位置の更新
        this.manager.setProgram("position");
        this.manager.run("position", [
            TEXTURE_NAMES.POSITION_0,
            TEXTURE_NAMES.VELOCITY_0,
            TEXTURE_NAMES.POSITION,
            TEXTURE_NAMES.LIFE_0,
        ], TEXTURE_NAMES.POSITION_1);
        this.manager.swapTextures(
            TEXTURE_NAMES.POSITION_0,
            TEXTURE_NAMES.POSITION_1,
        );
    }
}

export {
    CursorRenderer,
    OutlineRenderer,
    ParticleSystem,
    TEXTURE_NAMES,
    WebGLManager,
};
