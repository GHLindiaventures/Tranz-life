// The product display's hero atmosphere: live smoky light in the product's colours, drawn by one small WebGL shader
// on its own canvas (the reference uses a pre-rendered fog video; this is our own, generated in real time).
//   - a mirrored light burst: soft white wisps are born near the centre and stream outwards to the left and right,
//     smeared along their path (radial motion blur) and fanning up and down like a flame
//   - thin streaks rising and falling through the dark middle; the band behind the name is kept a touch calmer
//   - dark top and bottom edges (vignette, darkest straight above / below the centre), a faint flicker and film grain
//   - it fades in from dark when the display opens (intro), and the canvas fades away as the hero is scrolled past
// Rendered at half resolution (it is all soft) and only while the hero is on screen.

const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime, uIntro;
uniform vec3 uDeep, uBase, uLight;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = m * p; a *= .5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
  float t = uTime;
  // A mirrored light burst (as on the reference): soft white wisps are born near the centre and stream outwards to the
  // left and right edges, stretched along the way they travel like a zoom blur, fanning up and down like a flame.
  // Mirrored about the vertical centre line, worked in polar coordinates around the middle of the screen.
  vec2 m = vec2(abs(p.x), p.y + .02);
  float rr = length(m) + 1e-4;
  float th = atan(m.y, m.x);                          // 0: straight out sideways, +-1.57: straight up / down
  float lr = log(rr);
  th += .045 * sin(lr * 3. - t * 1.1) + .02 * sin(lr * 7. + t * .6);   // the wisps bend a little as they go
  float flow = lr * 1.2 - t * .5;                      // features move outwards (faster further out, like perspective)
  // big soft puffs travelling outwards, smeared back along their path (a radial motion blur: six samples)
  float puffs = 0.;
  for (int k = 0; k < 6; k++) puffs += fbm(vec2(th * 2. + 1.3, (flow - float(k) * .07) * 1.4));
  puffs /= 6.;
  // streaks stretched along the travel
  float streaks = noise(vec2(th * 13., flow * .35)) * .6 + noise(vec2(th * 29. + 7., flow * .5 + 3.)) * .4;
  float smoke = smoothstep(.3, .7, puffs) * (.4 + .95 * streaks);
  // brightest where it flows sideways, fading towards straight up / down; born just off the centre
  float side = pow(max(cos(th), 0.), 1.4);
  float born = smoothstep(.04, .42, rr);
  float light = smoke * side * born;
  // faint thin streaks rising and falling through the dark middle (the reference's centre flames)
  float midS = exp(-m.x * m.x * 26.) * (noise(vec2(m.x * 40., m.y * 2.2 - t * .8)) * .5 + .15) * smoothstep(.05, .5, abs(m.y));
  light += midS * .35;
  // the name sits across the middle of the screen: a touch calmer there so the letters still read
  float textZone = exp(-pow((p.y + .03) * 3.2, 2.)) * exp(-p.x * p.x * .6);
  light *= 1. - .28 * textZone;
  // vignette: dark top and bottom, darkest straight above and below the centre (the burst's dark core)
  float vig = smoothstep(-.02, .24, uv.y) * smoothstep(1.02, .72, uv.y);
  vig *= 1. - .3 * pow(length((uv - .5) * vec2(1.1, .8)), 2.);
  vig *= 1. - .55 * exp(-m.x * m.x * 5.) * smoothstep(.02, .55, m.y) - .3 * exp(-m.x * m.x * 5.) * smoothstep(-.02, -.55, m.y);
  vec3 col = mix(uDeep, uBase, clamp(vig * (.85 + .3 * puffs), 0., 1.));
  col = mix(col, uLight, clamp(light * 1.3, 0., .82) * vig);
  col += vec3(1.) * pow(clamp(light * 1.1, 0., 1.), 2.) * .28 * vig;       // softer white wisps
  col *= 1. - .12 * textZone;
  col *= 0.82;                                                              // gently dimmed for deep luxury contrast
  col *= .96 + .06 * noise(vec2(t * 1.7, 3.1));                             // a faint flicker
  col = mix(uDeep * .3, col, uIntro);                                       // in from dark
  col += (hash(gl_FragCoord.xy + fract(t) * 91.) - .5) * .03;               // subtle film grain
  gl_FragColor = vec4(col, 1.);
}`;

const hexRgb = h => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
// more saturated and a touch brighter (the reference's colours are vivid)
function vivid(rgb, sat, lift) {
  const l = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  return rgb.map(c => Math.min(1, Math.max(0, l + (c - l) * sat) * lift));
}
const mixC = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

function createHeroSmoke(host) {
  const canvas = document.createElement('canvas');
  canvas.className = 'fx-gl';
  host.insertBefore(canvas, host.firstChild);
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  if (!gl) { canvas.remove(); return null; }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  try { gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); } catch (e) { console.warn('Hero smoke unavailable:', e); canvas.remove(); return null; }
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aLoc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(aLoc); gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(prog, n);
  const u = { res: U('uRes'), time: U('uTime'), intro: U('uIntro'), deep: U('uDeep'), base: U('uBase'), light: U('uLight') };
  const SCALE = 0.5;
  let w = 0, h = 0;
  function resize() {
    const W = Math.max(2, Math.round(innerWidth * SCALE)), H = Math.max(2, Math.round(innerHeight * SCALE));
    if (W === w && H === h) return;
    w = canvas.width = W; h = canvas.height = H; gl.viewport(0, 0, W, H);
  }
  // colours from the product's three gradient stops [top, middle, bottom]
  function setColors([a, b, c]) {
    const A = hexRgb(a), B = hexRgb(b), C = hexRgb(c);
    // the background a step darker than the product's colour, so the bright name stands out against it
    const deep = mixC(vivid(C, 1.3, 1), [0.03, 0.015, 0.01], 0.66);
    const base = mixC(vivid(B, 1.6, 1.0), deep, 0.2), light = mixC(mixC(vivid(A, 1.3, 1.0), [1, 1, 1], 0.15), base, 0.25);
    gl.uniform3fv(u.deep, deep); gl.uniform3fv(u.base, base); gl.uniform3fv(u.light, light);
    // the name's colour: a much brighter, saturated tint of the background (as on the reference)
    const name = mixC(vivid(B, 1.7, 1.3), [1, 1, 1], 0.3).map(v => Math.round(Math.min(1, v) * 255));
    const shade = deep.map(v => Math.round(v * 255));
    return { name: 'rgb(' + name.join(',') + ')', shade: 'rgb(' + shade.join(',') + ')' };
  }
  function render(time, intro) {
    resize();
    gl.uniform2f(u.res, w, h); gl.uniform1f(u.time, time); gl.uniform1f(u.intro, intro);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  return { canvas, setColors, render };
}

export { createHeroSmoke };
