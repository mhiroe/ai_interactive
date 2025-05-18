export const VERTEX_SHADER = `
attribute vec3 position;
uniform vec2 px;
varying vec2 uv;

void main() {
    uv = vec2(0.5)+(position.xy)*0.5;
    gl_Position = vec4(position, 1.0);
}`;

export const FRAGMENT_SHADER = `
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

export const CURSOR_VERTEX_SHADER = `
precision highp float;
attribute vec4 position;
attribute float direction;
uniform vec2 uMouse;
uniform vec2 uWindow;
uniform float uRad;
uniform float uScale;
uniform float uCircleWidth;
varying float vDir;
void main() {
    vec2 windowPos = uMouse + vec2(position.x, position.y * uWindow.x/uWindow.y) * ((30. - 3000. * uScale) /uWindow.x + direction/uWindow.x * 4.);
    gl_Position = vec4(windowPos, 0., 1.0);
    vDir = direction;
}`;

export const CURSOR_FRAGMENT_SHADER = `
precision highp float;
varying float vDir;
uniform float uOpacity;
void main() {
    float alpha = smoothstep(0.0, 1.0, 1.0 - abs(vDir)) * uOpacity;
    if(alpha < 0.01) discard;
    gl_FragColor = vec4(0.5, 0.5, 0.6, alpha);
}`;

export const OUTLINE_VERTEX_SHADER = `
precision highp float;
attribute vec4 position;
uniform vec2 uTopLeft;
uniform vec2 uBotRight;
uniform sampler2D velocity;
varying float vVel;
void main() {
    vec2 windowPos = mix(uTopLeft, uBotRight, position.xy);
    vec2 uv = vec2(0.5)+(windowPos.xy)*0.5;
    vec2 vel = texture2D(velocity, uv).xy * 0.05;
    vVel = length(vel * 100.);
    gl_Position = vec4(windowPos + vel, 0., 1.0);
}`;

export const OUTLINE_FRAGMENT_SHADER = `
precision highp float;
uniform float uAlpha;
varying float vVel;
const vec3 color0 = vec3(0.0,98./255., 157./255.);
void main() {
    gl_FragColor = vec4(color0, uAlpha * mix(0.1, 5.0, clamp(vVel, 0.0, 1.0)));
}`;
