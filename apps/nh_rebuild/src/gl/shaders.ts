// 基本シェーダー
export const VERTEX_SHADER = `...`; // [前のコードと同じ]
export const FRAGMENT_SHADER = `...`; // [前のコードと同じ]
export const CURSOR_VERTEX_SHADER = `...`; // [前のコードと同じ]
export const CURSOR_FRAGMENT_SHADER = `...`; // [前のコードと同じ]
export const OUTLINE_VERTEX_SHADER = `...`; // [前のコードと同じ]
export const OUTLINE_FRAGMENT_SHADER = `...`; // [前のコードと同じ]

// 流体シミュレーション用シェーダー
export const ADVECTION_SHADER = `
precision highp float;
uniform sampler2D source;
uniform sampler2D velocity;
uniform float dt;
uniform float scale;
uniform vec2 px1;
varying vec2 uv;

void main(){
    gl_FragColor = texture2D(source, uv-texture2D(velocity, uv).xy*dt*px1)*scale;
}`;

export const DIVERGENCE_SHADER = `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 px;
varying vec2 uv;

void main(){
    float x0 = texture2D(velocity, uv-vec2(px.x, 0)).x;
    float x1 = texture2D(velocity, uv+vec2(px.x, 0)).x;
    float y0 = texture2D(velocity, uv-vec2(0, px.y)).y;
    float y1 = texture2D(velocity, uv+vec2(0, px.y)).y;
    float divergence = (x1-x0 + y1-y0)*0.5;
    gl_FragColor = vec4(divergence);
}`;

export const PRESSURE_SHADER = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform float alpha;
uniform float beta;
uniform vec2 px;
varying vec2 uv;

void main(){
    float x0 = texture2D(pressure, uv-vec2(px.x, 0)).r;
    float x1 = texture2D(pressure, uv+vec2(px.x, 0)).r;
    float y0 = texture2D(pressure, uv-vec2(0, px.y)).r;
    float y1 = texture2D(pressure, uv+vec2(0, px.y)).r;
    float d = texture2D(divergence, uv).r;
    float relaxed = (x0 + x1 + y0 + y1 + alpha * d) * beta;
    gl_FragColor = vec4(relaxed);
}`;

export const VELOCITY_SHADER = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform float scale;
uniform vec2 px;
varying vec2 uv;

void main(){
    float x0 = texture2D(pressure, uv-vec2(px.x, 0)).r;
    float x1 = texture2D(pressure, uv+vec2(px.x, 0)).r;
    float y0 = texture2D(pressure, uv-vec2(0, px.y)).r;
    float y1 = texture2D(pressure, uv+vec2(0, px.y)).r;
    vec2 v = texture2D(velocity, uv).xy;
    vec4 v2 = vec4((v-(vec2(x1, y1)-vec2(x0, y0))*0.5)*scale, 1.0, 1.0);
    v2 = v2 * 0.99;
    gl_FragColor = v2;
}`;

// パーティクルライフサイクル用シェーダー
export const LIFE_SHADER = `
precision highp float;
uniform sampler2D uLife;
varying vec2 uv;

void main(){
    vec4 uLife = texture2D(uLife, uv);
    uLife.x = uLife.x + 0.016;
    if(uLife.x > uLife.y){
        uLife.x = -0.001;
    }
    gl_FragColor = uLife;
}`;

export const INIT_LIFE_SHADER = `
precision highp float;
varying vec2 uv;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main(){
    float curTime = rand(uv * 10. + 1.0) * -4.;
    float duration = rand(uv * 5. + 2.0) * 5. + 1.;
    gl_FragColor = vec4(curTime, duration, 0.0, 1.0);
}`;

// パーティクル位置更新用シェーダー
export const POSITION_SHADER = `
precision highp float;
uniform sampler2D uTexture;
uniform sampler2D uInitPositionTexture;
uniform sampler2D uVelocityTexture;
uniform sampler2D uLifeTexture;
uniform bool uIsInit;
varying vec2 uv;

void main(){
    vec4 position;
    float curTime = texture2D(uLifeTexture, uv).x;

    if(curTime < 0.){
        position = texture2D(uInitPositionTexture, uv);
    }else{
        position = texture2D(uTexture, uv);
    }
    vec4 velocity = texture2D(uVelocityTexture, uv);
    gl_FragColor = position + vec4(velocity.rgb, 0.0);
}`;
