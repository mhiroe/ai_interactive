import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import { TextGeometry } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/FontLoader.js";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js";

// シーンの設定
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);

// カメラの設定
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

// レンダラーの設定
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// コントロールの設定
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;

// シーンの照明設定
const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

const pointLight = new THREE.PointLight(0x89cff0, 2, 10);
pointLight.position.set(0, 0, 5);
scene.add(pointLight);

// 流体シミュレーションのパラメータ
let time = 0;
let turbulence = 0.5;
let freezeLevel = 0.0;

// 氷テキストのマテリアル
const iceMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    turbulence: { value: turbulence },
    freezeLevel: { value: freezeLevel },
    opacity: { value: 0.8 },
    color1: { value: new THREE.Color(0xadd8e6) }, // 薄い青
    color2: { value: new THREE.Color(0xf0f8ff) }, // 白に近い青
  },
  vertexShader: `
    uniform float time;
    uniform float turbulence;
    uniform float freezeLevel;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float n = i.x + i.y * 157.0 + 113.0 * i.z;
      return mix(
        mix(
          mix(sin(n * 0.013), sin((n + 1.0) * 0.013), f.x),
          mix(sin((n + 157.0) * 0.013), sin((n + 158.0) * 0.013), f.x),
          f.y
        ),
        mix(
          mix(sin((n + 113.0) * 0.013), sin((n + 114.0) * 0.013), f.x),
          mix(sin((n + 270.0) * 0.013), sin((n + 271.0) * 0.013), f.x),
          f.y
        ),
        f.z
      );
    }
    
    void main() {
      vUv = uv;
      vNormal = normal;
      vPosition = position;
      
      // 流体の動きをシミュレーション
      vec3 pos = position;
      if (freezeLevel < 1.0) {
        float noiseScale = 0.3;
        float noiseAmount = (1.0 - freezeLevel) * turbulence;
        float noiseTime = time * 0.5;
        
        float nx = noise(vec3(pos.x * noiseScale, pos.y * noiseScale, noiseTime));
        float ny = noise(vec3(pos.y * noiseScale, pos.z * noiseScale, noiseTime + 100.0));
        float nz = noise(vec3(pos.z * noiseScale, pos.x * noiseScale, noiseTime + 200.0));
        
        pos.x += normal.x * nx * noiseAmount;
        pos.y += normal.y * ny * noiseAmount;
        pos.z += normal.z * nz * noiseAmount;
      }
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform float freezeLevel;
    uniform float opacity;
    uniform vec3 color1;
    uniform vec3 color2;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      // 光の屈折を模倣
      vec3 norm = normalize(vNormal);
      float fresnel = dot(norm, vec3(0.0, 0.0, 1.0));
      fresnel = pow(abs(fresnel), 2.0);
      
      // 色のブレンド
      vec3 color = mix(color1, color2, fresnel);
      
      // 氷の結晶化エフェクト
      float crystalPattern = sin(vPosition.x * 10.0) * sin(vPosition.y * 10.0) * sin(vPosition.z * 10.0);
      crystalPattern = smoothstep(-0.2, 0.2, crystalPattern) * 0.5 + 0.5;
      color = mix(color, color2, crystalPattern * freezeLevel);
      
      gl_FragColor = vec4(color, opacity);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide,
});

// フォントローダーとテキストの設定
const fontLoader = new FontLoader();
let textMesh;

fontLoader.load(
  "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
  function (font) {
    const textGeometry = new TextGeometry("氷", {
      font: font,
      size: 1.5,
      height: 0.4,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.05,
      bevelOffset: 0,
      bevelSegments: 5,
    });

    textGeometry.center();

    textMesh = new THREE.Mesh(textGeometry, iceMaterial);
    scene.add(textMesh);

    // 読み込み完了
    document.getElementById("loading").classList.add("hidden");
  }
);

// 後処理の設定
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// 輝きエフェクト
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5, // 強度
  0.4, // 半径
  0.85 // 閾値
);
composer.addPass(bloomPass);

// カスタムシェーダーパス（氷の光沢効果）
const customShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      
      // 小さな歪み効果
      float distortionAmount = 0.003;
      uv.x += sin(uv.y * 20.0 + time) * distortionAmount;
      uv.y += cos(uv.x * 20.0 + time) * distortionAmount;
      
      vec4 color = texture2D(tDiffuse, uv);
      
      // 光の輝きを追加
      float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      float highlight = smoothstep(0.7, 0.8, brightness);
      color.rgb += highlight * 0.5;
      
      gl_FragColor = color;
    }
  `,
};

const customPass = new ShaderPass(customShader);
composer.addPass(customPass);

// ウィンドウサイズ変更イベントリスナー
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// コントロールボタン
document.getElementById("resetBtn").addEventListener("click", () => {
  turbulence = 0.5;
  freezeLevel = 0.0;
  updateUniforms();
});

document.getElementById("turbulenceBtn").addEventListener("click", () => {
  turbulence = Math.min(turbulence + 0.2, 1.0);
  updateUniforms();
});

document.getElementById("freezeBtn").addEventListener("click", () => {
  freezeLevel = Math.min(freezeLevel + 0.2, 1.0);
  updateUniforms();
});

function updateUniforms() {
  if (iceMaterial) {
    iceMaterial.uniforms.turbulence.value = turbulence;
    iceMaterial.uniforms.freezeLevel.value = freezeLevel;
  }
}

// アニメーション
function animate() {
  requestAnimationFrame(animate);

  time += 0.01;

  if (iceMaterial) {
    iceMaterial.uniforms.time.value = time;
  }

  if (customPass) {
    customPass.uniforms.time.value = time;
  }

  controls.update();
  composer.render();
}

animate();
