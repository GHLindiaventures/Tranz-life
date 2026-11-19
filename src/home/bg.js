// The film's living background: one full-screen WebGL shader behind every stage (plain WebGL, no library).
// Each stage sets a "look" and the shader eases between looks:
//   top / bottom / glow  a vertical gradient with a soft radial glow rising from below (the loader's mint water light)
//   caustic              light rippling on water (the loader)
//   streak               vertical bands of light, like stage curtains (the red "we forgot")
//   vignette             dark corners (the chalk-dark and black stages)
// Film grain is always on, very light. Falls back to a CSS gradient when WebGL is unavailable.
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `
precision mediump float;
uniform vec2 uRes; uniform float uT;
uniform vec3 uTop, uBot, uGlow;
uniform float uCaustic, uStreak, uVig, uGlowAmt;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float caustic(vec2 uv, float t){
  vec2 p = uv * 7.0 - 250.0; vec2 i = p; float c = 1.0, inten = .005;
  for (int n = 0; n < 4; n++){
    float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 4.0; c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 8.0);
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; float asp = uRes.x / uRes.y;
  vec3 col = mix(uBot, uTop, smoothstep(0.0, 1.0, uv.y));
  // a soft glow rising from below the screen
  vec2 g = vec2((uv.x - .5) * asp * .8, uv.y + .3);
  col = mix(col, uGlow, uGlowAmt * smoothstep(1.25, .1, length(g)));
  if (uCaustic > .001){
    vec2 cu = vec2(uv.x * asp, uv.y) * .55;
    float c = caustic(cu, uT * .35);
    col += vec3(.75, 1.0, .9) * clamp(c, 0.0, 1.0) * .55 * uCaustic * (.4 + .6 * uv.y);
  }
  if (uStreak > .001){
    float s = pow(.5 + .5 * sin(uv.x * 13.0 + sin(uv.x * 2.7 + uT * .15) * 2.4), 7.0);
    s += .6 * pow(.5 + .5 * sin(uv.x * 31.0 - uT * .08), 14.0);
    col += vec3(1.0, .55, .45) * s * .28 * uStreak * (.35 + .65 * uv.y);
  }
  float v = length((uv - .5) * vec2(asp, 1.0) * .9);
  col *= 1.0 - uVig * smoothstep(.35, 1.05, v);
  col += (hash(uv * uRes + fract(uT) * 91.0) - .5) * .045;
  gl_FragColor = vec4(col, 1.0);
}`;

const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const LOOKS = {
  water:  { top: '#1c4839', bot: '#9fd2bf', glow: '#d4f6eb', glowAmt: .9, caustic: 1, streak: 0, vig: .15 },
  mint:   { top: '#f6fbf8', bot: '#d9eee5', glow: '#ffffff', glowAmt: .6, caustic: .12, streak: 0, vig: 0 },
  red:    { top: '#3c0303', bot: '#b0141a', glow: '#e3242b', glowAmt: .5, caustic: 0, streak: 1, vig: .55 },
  chalk:  { top: '#07130d', bot: '#1d3a2b', glow: '#2e5a43', glowAmt: .55, caustic: 0, streak: 0, vig: .9 },
  black:  { top: '#050806', bot: '#0d1612', glow: '#163126', glowAmt: .35, caustic: 0, streak: 0, vig: .8 },
  cloud:  { top: '#ffffff', bot: '#eef4f0', glow: '#ffffff', glowAmt: .4, caustic: 0, streak: 0, vig: 0 },
  dawn:   { top: '#fff7e8', bot: '#f3e2bd', glow: '#fff4d6', glowAmt: .8, caustic: 0, streak: 0, vig: 0 }
};

function initBg(canvas){
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
  const cur = toLook(LOOKS.water), want = toLook(LOOKS.water);
  let speed = 2.2;
  if (!gl){
    canvas.style.background = 'linear-gradient(#1c4839,#9fd2bf)';
    return { set(name){ const L = LOOKS[name]; if (L) canvas.style.background = `linear-gradient(${L.top},${L.bot})`; }, frame(){}, resize(){} };
  }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr); gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n);
  const u = { res: U('uRes'), t: U('uT'), top: U('uTop'), bot: U('uBot'), glow: U('uGlow'), c: U('uCaustic'), s: U('uStreak'), v: U('uVig'), g: U('uGlowAmt') };
  let W = 1, H = 1;
  function resize(){
    const d = Math.min(devicePixelRatio || 1, innerWidth < 800 ? 1 : 1.25);
    W = Math.round(innerWidth * d); H = Math.round(innerHeight * d);
    canvas.width = W; canvas.height = H; gl.viewport(0, 0, W, H);
  }
  resize(); addEventListener('resize', resize);
  return {
    set(name, rate = 2.2){ const L = LOOKS[name]; if (L){ Object.assign(want, toLook(L)); speed = rate; } },
    frame(t, dt){
      const k = 1 - Math.exp(-dt * speed);
      for (const key of Object.keys(cur)){
        if (Array.isArray(cur[key])) cur[key] = cur[key].map((v, i) => v + (want[key][i] - v) * k);
        else cur[key] += (want[key] - cur[key]) * k;
      }
      gl.uniform2f(u.res, W, H); gl.uniform1f(u.t, t);
      gl.uniform3fv(u.top, cur.top); gl.uniform3fv(u.bot, cur.bot); gl.uniform3fv(u.glow, cur.glow);
      gl.uniform1f(u.c, cur.caustic); gl.uniform1f(u.s, cur.streak); gl.uniform1f(u.v, cur.vig); gl.uniform1f(u.g, cur.glowAmt);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    resize
  };
}
function toLook(L){ return { top: hex(L.top), bot: hex(L.bot), glow: hex(L.glow), glowAmt: L.glowAmt, caustic: L.caustic, streak: L.streak, vig: L.vig }; }

export { initBg };
