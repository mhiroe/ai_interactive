# 3Dアイステキスト流体ダイナミクス効果の実装手順

## 概要
この文書では、Three.jsとDenoを使用して3D氷のようなテキストと流体ダイナミクス効果を実装するための具体的な手順を説明します。実装はReactベースで行い、ユーザーがダブルクリックでテキストを編集できる機能も追加します。

## 前提条件
- Denoがインストールされていること
- 基本的なTypeScriptとReact、Three.jsの知識
- WebGLの基礎知識

## 開発環境のセットアップ

### 1. プロジェクト初期化
```bash
# プロジェクトディレクトリの作成
mkdir ice-text-effect
cd ice-text-effect

# ディレクトリ構造の作成
mkdir -p src/assets/textures
mkdir -p src/assets/fonts
mkdir -p src/shaders
mkdir -p src/components
mkdir -p .github/workflows
```

### 2. Denoの設定ファイル作成
`deno.json`ファイルを作成:
```json
{
  "tasks": {
    "dev": "deno run --allow-net --allow-read --allow-env server.ts",
    "build": "deno run --allow-read --allow-write --allow-env build.ts",
    "deploy": "deno run --allow-read --allow-write --allow-env --allow-run deploy.ts"
  },
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext", "deno.ns"],
    "jsx": "react-jsx",
    "strict": true
  },
  "imports": {
    "react": "https://esm.sh/react@18.2.0",
    "react-dom": "https://esm.sh/react-dom@18.2.0",
    "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
    "three": "https://esm.sh/three@0.154.0",
    "three/examples/": "https://esm.sh/three@0.154.0/examples/",
    "three/addons/": "https://esm.sh/three@0.154.0/examples/jsm/",
    "@react-three/fiber": "https://esm.sh/@react-three/fiber@8.15.12",
    "@react-three/drei": "https://esm.sh/@react-three/drei@9.92.5"
  }
}
```

### 3. 開発サーバーの作成
`server.ts`ファイルを作成:
```typescript
import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
import { serveDir } from "https://deno.land/std@0.220.1/http/file_server.ts";

const port = 8000;

console.log(`HTTPサーバーを起動します: http://localhost:${port}`);

await serve((req) => {
  return serveDir(req, {
    fsRoot: "src",
    urlRoot: "",
    showIndex: true,
    showDirListing: false
  });
}, { port });
```

## 実装手順

### ステップ1: Reactアプリケーション構造のセットアップ

1. **`src/index.html`の作成**:
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>3D氷テキスト効果</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; }
    #root { width: 100vw; height: 100vh; }
    .text-editor {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 8px;
      padding: 16px;
      display: none;
      z-index: 100;
    }
    .text-editor.visible {
      display: block;
    }
    .text-editor input {
      font-size: 18px;
      padding: 8px;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      color: white;
      width: 200px;
    }
    .text-editor button {
      margin-left: 8px;
      padding: 8px 16px;
      background: rgba(196, 245, 252, 0.3);
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
    }
    .text-editor button:hover {
      background: rgba(196, 245, 252, 0.5);
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <div class="text-editor" id="textEditor">
    <input type="text" id="textInput" placeholder="テキストを入力..." />
    <button id="applyText">適用</button>
  </div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

2. **`src/main.tsx`の作成**:
```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const root = createRoot(rootElement);
root.render(<App />);
```

3. **`src/App.tsx`の作成**:
```tsx
import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import IceText from "./components/IceText";

export default function App() {
  const [text, setText] = useState("ICE TEXT");
  const [isEditing, setIsEditing] = useState(false);

  const handleCanvasDoubleClick = () => {
    setIsEditing(true);
    const textEditor = document.getElementById("textEditor");
    const textInput = document.getElementById("textInput") as HTMLInputElement;
    
    if (textEditor && textInput) {
      textEditor.classList.add("visible");
      textInput.value = text;
      textInput.focus();
    }
  };

  React.useEffect(() => {
    const applyButton = document.getElementById("applyText");
    const textEditor = document.getElementById("textEditor");
    const textInput = document.getElementById("textInput") as HTMLInputElement;

    const handleApply = () => {
      if (textInput && textInput.value.trim() !== "") {
        setText(textInput.value);
      }
      if (textEditor) {
        textEditor.classList.remove("visible");
      }
      setIsEditing(false);
    };

    applyButton?.addEventListener("click", handleApply);

    return () => {
      applyButton?.removeEventListener("click", handleApply);
    };
  }, []);

  return (
    <div onDoubleClick={handleCanvasDoubleClick} style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={[0x111111]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <IceText text={text} isEditing={isEditing} />
        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  );
}
```

### ステップ2: テキストコンポーネントの作成

1. **`src/components/IceText.tsx`の作成**:
```tsx
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Text3D, useTexture } from "@react-three/drei";
import { FluidSimulation } from "../utils/fluidSimulation";

interface IceTextProps {
  text: string;
  isEditing: boolean;
}

export default function IceText({ text, isEditing }: IceTextProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const fluidSimRef = useRef<FluidSimulation | null>(null);
  const { gl } = useThree();
  
  const envMap = useTexture("/assets/textures/environment.hdr", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
  });
  
  const normalMap = useTexture("/assets/textures/ice_normal_map.jpg");
  
  useEffect(() => {
    if (!fluidSimRef.current && gl) {
      fluidSimRef.current = new FluidSimulation(gl, {
        simResolution: 128,
        viscosity: 0.95,
        force: 0.5
      });
    }
    
    return () => {
      fluidSimRef.current?.dispose();
    };
  }, [gl]);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
      
      if (fluidSimRef.current && materialRef.current) {
        const fluidTexture = fluidSimRef.current.compute(state.clock.elapsedTime);
        materialRef.current.transmissionMap = fluidTexture;
        materialRef.current.displacementMap = fluidTexture;
        materialRef.current.needsUpdate = true;
      }
    }
  });
  
  return (
    <Text3D
      ref={meshRef}
      font="/assets/fonts/helvetiker_bold.typeface.json"
      size={isEditing ? 0.1 : 0.8}
      height={0.2}
      curveSegments={12}
      bevelEnabled={true}
      bevelThickness={0.03}
      bevelSize={0.02}
      bevelSegments={5}
    >
      {text}
      <meshPhysicalMaterial
        ref={materialRef}
        color={0xc4f5fc}
        metalness={0.1}
        roughness={0.2}
        transmission={0.95}
        thickness={0.5}
        ior={1.5}
        envMap={envMap}
        envMapIntensity={1.0}
        clearcoat={0.5}
        clearcoatRoughness={0.1}
        transparent={true}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.15, 0.15)}
        displacementScale={0.05}
      />
    </Text3D>
  );
}
```

### ステップ3: 流体シミュレーションの実装

1. **`src/shaders/velocity.glsl`の作成**:
```glsl
uniform float time;
uniform float viscosity;
uniform float force;
uniform vec3 mousePos;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  // 現在の位置と速度を取得
  vec4 velocity = texture2D(textureVelocity, uv);
  
  // 近隣のセルからの速度影響を計算
  vec2 cellSize = 1.0 / resolution.xy;
  vec4 n = texture2D(textureVelocity, uv + vec2(0.0, cellSize.y));
  vec4 s = texture2D(textureVelocity, uv - vec2(0.0, cellSize.y));
  vec4 e = texture2D(textureVelocity, uv + vec2(cellSize.x, 0.0));
  vec4 w = texture2D(textureVelocity, uv - vec2(cellSize.x, 0.0));
  
  // 粘度に基づいて速度を更新
  velocity.xy = mix(velocity.xy, (n.xy + s.xy + e.xy + w.xy) * 0.25, viscosity);
  
  // マウス相互作用
  vec3 mouseDelta = vec3(uv, 0.0) - mousePos;
  float mouseDistance = length(mouseDelta);
  float mouseInfluence = max(0.0, 1.0 - mouseDistance * 10.0);
  
  if (mouseInfluence > 0.0) {
    vec2 mouseForce = normalize(mouseDelta.xy) * force * mouseInfluence;
    velocity.xy += mouseForce;
  }
  
  // 速度の減衰
  velocity.xy *= 0.995;
  
  gl_FragColor = velocity;
}
```

2. **`src/shaders/position.glsl`の作成**:
```glsl
uniform float time;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  // 現在の位置と速度を取得
  vec4 position = texture2D(texturePosition, uv);
  vec4 velocity = texture2D(textureVelocity, uv);
  
  // 位置を速度で更新
  position.xy += velocity.xy * 0.01;
  
  gl_FragColor = position;
}
```

3. **`src/utils/fluidSimulation.ts`の作成**:
```typescript
import * as THREE from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";

export interface SimulationParams {
  simResolution: number;
  viscosity: number;
  force: number;
}

export class FluidSimulation {
  private gpuCompute: GPUComputationRenderer;
  private velocityVariable: any;
  private positionVariable: any;
  private renderer: THREE.WebGLRenderer;
  private params: SimulationParams;
  private mousePos: THREE.Vector3;
  private disposed: boolean = false;
  
  constructor(renderer: THREE.WebGLRenderer, params: SimulationParams) {
    this.renderer = renderer;
    this.params = params;
    this.mousePos = new THREE.Vector3(0, 0, 0);
    this.initialize();
    
    // マウス移動イベントをキャプチャ
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
  }
  
  private async initialize(): Promise<void> {
    const { simResolution, viscosity, force } = this.params;
    
    // GPUComputationRendererの作成
    this.gpuCompute = new GPUComputationRenderer(simResolution, simResolution, this.renderer);
    
    // テクスチャの初期化
    const initVelocityTexture = this.gpuCompute.createTexture();
    const initPositionTexture = this.gpuCompute.createTexture();
    
    this.initTextureData(initVelocityTexture, initPositionTexture);
    
    // シェーダーファイルの読み込み
    const velocityShader = await this.loadShader("./shaders/velocity.glsl");
    const positionShader = await this.loadShader("./shaders/position.glsl");
    
    // 変数の追加
    this.velocityVariable = this.gpuCompute.addVariable('textureVelocity', velocityShader, initVelocityTexture);
    this.positionVariable = this.gpuCompute.addVariable('texturePosition', positionShader, initPositionTexture);
    
    // 依存関係の設定
    this.gpuCompute.setVariableDependencies(this.velocityVariable, [this.positionVariable, this.velocityVariable]);
    this.gpuCompute.setVariableDependencies(this.positionVariable, [this.positionVariable, this.velocityVariable]);
    
    // ユニフォームの設定
    const velocityUniforms = this.velocityVariable.material.uniforms;
    velocityUniforms.time = { value: 0.0 };
    velocityUniforms.viscosity = { value: viscosity };
    velocityUniforms.force = { value: force };
    velocityUniforms.mousePos = { value: this.mousePos };
    
    const positionUniforms = this.positionVariable.material.uniforms;
    positionUniforms.time = { value: 0.0 };
    
    // 初期化
    const error = this.gpuCompute.init();
    if (error !== null) {
      console.error(error);
    }
  }
  
  private async loadShader(path: string): Promise<string> {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`シェーダーの読み込みに失敗しました: ${path}`);
    }
    return await response.text();
  }
  
  private initTextureData(velocityTexture: THREE.Texture, positionTexture: THREE.Texture): void {
    const velocityData = velocityTexture.image.data;
    const positionData = positionTexture.image.data;
    
    for (let i = 0; i < velocityData.length; i += 4) {
      velocityData[i] = Math.random() * 0.001 - 0.0005; // x方向の速度
      velocityData[i + 1] = Math.random() * 0.001 - 0.0005; // y方向の速度
      velocityData[i + 2] = 0;
      velocityData[i + 3] = 1;
      
      positionData[i] = 0;
      positionData[i + 1] = 0;
      positionData[i + 2] = 0;
      positionData[i + 3] = 1;
    }
  }
  
  private onMouseMove(event: MouseEvent): void {
    if (this.disposed) return;
    // 正規化されたデバイス座標に変換 (-1 to +1)
    this.mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.mousePos.z = 0;
  }
  
  private onTouchMove(event: TouchEvent): void {
    if (this.disposed) return;
    event.preventDefault();
    
    const touch = event.touches[0];
    this.mousePos.x = (touch.clientX / window.innerWidth) * 2 - 1;
    this.mousePos.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    this.mousePos.z = 0;
  }
  
  public compute(time: number): THREE.Texture {
    if (this.disposed) {
      return new THREE.Texture();
    }
    
    this.velocityVariable.material.uniforms.time.value = time;
    this.positionVariable.material.uniforms.time.value = time;
    
    this.gpuCompute.compute();
    
    return this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture;
  }
  
  public dispose(): void {
    this.disposed = true;
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('touchmove', this.onTouchMove.bind(this));
    
    if (this.gpuCompute) {
      // ここでGPUComputationRendererのリソースをクリーンアップ
      // 実際のクリーンアップメソッドはThree.jsのバージョンによって異なる場合がある
    }
  }
}
```

### ステップ4: ビルドプロセスの設定

1. **ビルドスクリプトの作成**:
`build.ts`ファイルを作成:
```typescript
import { copy } from "https://deno.land/std@0.220.1/fs/copy.ts";
import { ensureDir } from "https://deno.land/std@0.220.1/fs/ensure_dir.ts";
import { walk } from "https://deno.land/std@0.220.1/fs/walk.ts";

// ビルド出力ディレクトリ
const distDir = "./dist";

async function build() {
  console.log("ビルドを開始します...");
  
  // 出力ディレクトリを準備
  await ensureDir(distDir);
  
  // ソースファイルをコピー
  await copy("./src", distDir, { overwrite: true });
  
  // サブディレクトリをコピー
  console.log("アセットをコピーしています...");
  
  console.log("ビルド完了！");
}

await build();
```

2. **GitHub Actionsの設定**:
`.github/workflows/deploy.yml`ファイルを作成:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x
      - name: Build
        run: deno task build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## テスト手順

1. **各ステップ後のテスト**:
   - 各ステップの実装後に開発サーバーを起動して動作確認します
   - ブラウザのコンソールでエラーがないか確認します

2. **テキスト編集機能のテスト**:
   - 3Dシーンをダブルクリックし、テキスト編集ボックスが表示されることを確認
   - 新しいテキストを入力して適用ボタンをクリックし、3Dテキストが更新されることを確認
   - エディタが非表示になることを確認

3. **流体シミュレーションのテスト**:
   - マウス/タッチ操作で流体効果が変化することを確認
   - 異なるデバイスでのパフォーマンスを確認

## デプロイ手順

1. **ビルド**:
```bash
deno task build
```

2. **サーバーへのデプロイ**:
```bash
deno task deploy
```

## 完了基準

- Reactを使用して3Dシーンが実装されている
- テキストが氷のような半透明の外観で表示される
- ダブルクリックでテキスト編集ボックスが表示される
- 入力したテキストが3Dテキストに反映される
- 流体シミュレーションがリアルタイムで動作する
- マウス/タッチ操作で流体が動く
- 複数のブラウザとデバイスで正常に動作する

## トラブルシューティング

- **WebGLエラー**: シェーダーコンパイルエラーの場合、コンソールで詳細を確認し、シェーダーコードを修正
- **パフォーマンス問題**: シミュレーション解像度を下げるか、更新頻度を調整
- **テクスチャが表示されない**: パスの確認やクロスオリジン制約の確認を行う
- **React関連のエラー**: コンポーネントのライフサイクルやフックの使用法を確認
- **GPGPU初期化エラー**: WebGL2対応ブラウザであることを確認し、拡張機能のサポート状況をチェック
- **Denoランタイムエラー**: import文の正確性を確認し、必要な権限フラグが設定されているか確認 