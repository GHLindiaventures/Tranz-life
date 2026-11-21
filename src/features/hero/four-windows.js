// Home hero, "Four Windows, One Story": four vertical films side by side (01 Root, 02 Lab, 03 Formula, 04 You).
// - Opening: on start() (after the loader) each panel opens from a slit of light, left to right (CSS, .is-open).
// - Headlines: three lines take turns, word by word. They are drawn on one canvas: the letters are filled with the
//   films behind them, sharp and bright, while the panels themselves are soft and dim, so the type reads as windows.
//   The real text is in the <h1> for screen readers and search.
// - Desktop hover: the panel under the pointer widens and comes into focus (CSS).
// - Scroll: the panels part like curtains and the copy lifts away (--sp, 0..1 over the hero's height); the roots below
//   grow down out of the night below (root-map.js).
// - Phones (< 900px): story mode, one film at a time full screen, with a four-part progress bar; tap to skip.
// - Reduced motion or data saver: posters only; reduced motion also shows the first headline as plain text.
import { $, $$ } from '../../utils/dom.js';
import { clamp, ease } from '../../utils/math.js';
import { reduce } from '../../utils/media.js';

const LINES = [
  ['Where nature', 'meets science'],
  ['Rooted in nature.', 'Backed by science.'],
  ['From root', 'to ritual.'],
];
const HOLD = 4.2;      // seconds each headline is fully on screen
const WORD_IN = .85;   // seconds for one word to rise into place
const STAGGER = .16;   // seconds between words
const OUT = .7;        // seconds to dissolve a headline
const FIRST = 1.15;    // seconds after start() before the first headline
const STORY = 7.6;     // phones: seconds per film

function initFourWindows(){
  const sec = $('#home'), canvas = $('#fwType');
  if (!sec || !canvas || !sec.classList.contains('fw')) return null;
  const panels = $$('.fw-panel', sec), videos = panels.map(p => $('video', p)), bars = $$('#fwBars i', sec);
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const posters = videos.map(v => { const im = new Image(); im.src = v.getAttribute('poster'); return im; });
  const phoneMq = matchMedia('(max-width: 899px)');
  let phone = phoneMq.matches;

  // the films: loaded only when motion is welcome; played only while the hero is on screen
  const load = v => { if (!v.src && v.dataset.src && !reduce && !saveData){ v.src = v.dataset.src; v.preload = 'auto'; } };
  const play = v => { load(v); if (v.src && v.paused) v.play().catch(() => {}); };

  if (reduce){
    sec.classList.add('is-open', 'is-static');
    return { start(){} };
  }

  // ---------- the panels' films, painted onto canvases ----------
  // Four <video> layers presented to the screen at once halve the frame rate on many machines (measured: 19.4 ms ->
  // 10.2 ms a frame without them), while canvases cost almost nothing. So each video keeps playing, hidden
  // (.has-films), and its current frame is painted onto a canvas in its place: same box, crop (cover), scale and
  // filters (hero.css styles .fw-film like the video). A canvas is repainted only when its film shows a new frame
  // or its size changes (the hover widen). Posters stand in until a film has a frame.
  const films = videos.map(v => {
    const c = document.createElement('canvas'); c.className = 'fw-film'; c.setAttribute('aria-hidden', 'true');
    v.after(c);
    return { c, g: c.getContext('2d'), w: 0, h: 0, t: -1, src: null };
  });
  sec.classList.add('has-films');
  function paintFilms(){
    const r = Math.min(window.devicePixelRatio || 1, 2);
    // reads first (sizes), then writes, so painting never forces an extra layout
    const sizes = films.map(f => [f.c.clientWidth, f.c.clientHeight]);
    films.forEach((f, i) => {
      if (phone && i !== story) return;   // phones show one film at a time
      const v = videos[i], src = v.readyState >= 2 ? v : (posters[i].complete && posters[i].naturalWidth ? posters[i] : null);
      if (!src) return;
      const [w, h] = sizes[i], t = src === v ? Math.floor(v.currentTime * 24) : -2;   // the film's frame (24 fps), not its clock
      if (!w || !h || (w === f.w && h === f.h && t === f.t && src === f.src)) return;
      if (w !== f.w || h !== f.h){ f.c.width = Math.round(w * r); f.c.height = Math.round(h * r); f.w = w; f.h = h; }
      f.t = t; f.src = src;
      const vw = src.videoWidth || src.naturalWidth, vh = src.videoHeight || src.naturalHeight, k = Math.max(w / vw, h / vh);
      f.g.setTransform(r, 0, 0, r, 0, 0);
      f.g.drawImage(src, (w - vw * k) / 2, (h - vh * k) / 2, vw * k, vh * k);
    });
  }

  // ---------- type canvas ----------
  const ctx = canvas.getContext('2d');
  const buf = document.createElement('canvas'), bx = buf.getContext('2d');
  const condensed = 'fontStretch' in ctx;
  let W = 1, H = 1, dpr = 1, fs = 100, cy = 0;
  const font = size => `850 ${size}px Archivo, "Arial Narrow", sans-serif`;
  const setFont = (c, size) => { c.font = font(size); if (condensed) c.fontStretch = 'extra-condensed'; };

  function resize(){
    const r = sec.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    for (const c of [canvas, buf]){ c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    phone = phoneMq.matches;
    // one size for all three headlines: the widest row fits 88% of the width (92% on phones)
    setFont(ctx, 100);
    const widest = Math.max(...LINES.flat().map(row => ctx.measureText(row.toUpperCase()).width));
    fs = Math.min((phone ? .92 : .88) * W / widest * 100, H * (phone ? .11 : .17));
    cy = H * (phone ? .44 : .5);
    sec.style.setProperty('--fs', fs.toFixed(1) + 'px');
    sec.style.setProperty('--cy', cy.toFixed(1) + 'px');
  }

  // where each film is on screen (cover-fit inside its panel), so the letters show exactly what is behind them
  function cover(src, rect, sr){
    const vw = src.videoWidth || src.naturalWidth, vh = src.videoHeight || src.naturalHeight;
    if (!vw || !vh) return;
    const k = Math.max(rect.width / vw, rect.height / vh) * 1.06;     // the panel's video is scaled 1.06 (hides blur edges)
    const w = vw * k, h = vh * k;
    bx.save(); bx.beginPath(); bx.rect(rect.left - sr.left, rect.top - sr.top, rect.width, rect.height); bx.clip();
    bx.drawImage(src, rect.left - sr.left + (rect.width - w) / 2, rect.top - sr.top + (rect.height - h) / 2, w, h);
    bx.restore();
  }

  // a headline's words in reading order, with their positions (two centred rows)
  function layout(li){
    setFont(bx, fs);
    const lh = fs * .9, out = [];
    LINES[li].forEach((row, r) => {
      const words = row.toUpperCase().split(' '), space = bx.measureText(' ').width;
      const widths = words.map(w => bx.measureText(w).width), total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
      let x = (W - total) / 2;
      const base = cy + (r - .5) * lh + fs * .36;
      words.forEach((w, k) => { out.push({ w, x, base }); x += widths[k] + space; });
    });
    return out;
  }

  let t0 = -1, drawnKey = '';
  function drawType(now){
    if (t0 < 0 || now / 1000 - t0 < 0){
      if (drawnKey !== 'clear'){ ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); drawnKey = 'clear'; }
      return;
    }
    const t = now / 1000 - t0;
    const per = LINES.map(l => (l.join(' ').split(' ').length - 1) * STAGGER + WORD_IN + HOLD + OUT);
    const cycle = per.reduce((a, b) => a + b, 0);
    let lt = t % cycle, li = 0;
    while (lt > per[li]) lt -= per[li++];
    const words = layout(li), outStart = per[li] - OUT;
    const out = clamp((lt - outStart) / OUT, 0, 1), eo = ease.inn(out);

    // Nothing to redraw while a headline holds still and the films are between frames (they change 24 times a
    // second, the screen up to 120): the canvas keeps the same picture. Anything that changes it is in this key.
    const sr = sec.getBoundingClientRect(), rects = panels.map(p => p.getBoundingClientRect());
    let key = li + '|' + W + 'x' + H + '|' + Math.round(sr.top);
    words.forEach((wd, k) => { key += '|' + ease.out(clamp((lt - k * STAGGER) / WORD_IN, 0, 1)).toFixed(3); });
    key += '|' + eo.toFixed(3);
    panels.forEach((p, i) => {
      if (phone && i !== story) return;
      const v = videos[i], r = rects[i];
      key += '|' + (v.readyState >= 2 ? Math.floor(v.currentTime * 24) : posters[i].complete ? 'p' : '-') + ',' + Math.round(r.left) + ',' + Math.round(r.width);
    });
    if (key === drawnKey) return;
    drawnKey = key;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. the letters as a mask: each word rises out of a slot under its row, then the line dissolves upwards
    bx.setTransform(dpr, 0, 0, dpr, 0, 0); bx.clearRect(0, 0, W, H);
    bx.globalCompositeOperation = 'source-over'; setFont(bx, fs); bx.fillStyle = '#fff';
    words.forEach((wd, k) => {
      const e = ease.out(clamp((lt - k * STAGGER) / WORD_IN, 0, 1));
      if (e <= 0) return;
      bx.save();
      bx.beginPath(); bx.rect(0, wd.base - fs * 1.02, W, fs * 1.2); bx.clip();
      bx.globalAlpha = e * (1 - eo);
      bx.fillText(wd.w, wd.x, wd.base + (1 - e) * fs * .95 - eo * fs * .22);
      bx.restore();
    });
    bx.globalAlpha = 1;

    // 2. fill them with the films (posters until a film has a frame), brightened a little
    bx.setTransform(1, 0, 0, 1, 0, 0); bx.scale(dpr, dpr);
    bx.globalCompositeOperation = 'source-in'; bx.fillStyle = '#efe6cf'; bx.fillRect(0, 0, W, H);
    bx.globalCompositeOperation = 'source-atop';
    if ('filter' in bx) bx.filter = 'brightness(1.4) saturate(1.12) contrast(1.06)';
    panels.forEach((p, i) => {
      if (phone && i !== story) return;
      const v = videos[i], src = v.readyState >= 2 ? v : posters[i];
      if (src === posters[i] && !posters[i].complete) return;
      cover(src, rects[i], sr);
    });
    if ('filter' in bx) bx.filter = 'none';
    bx.fillStyle = 'rgba(255, 246, 225, .2)'; bx.fillRect(0, 0, W, H);   // a warm lift keeps dark frames readable
    bx.globalCompositeOperation = 'source-over';

    // 3. onto the screen with a soft shadow, so the letters lift off the panels
    ctx.shadowColor = 'rgba(4, 14, 8, .7)'; ctx.shadowBlur = 34 * dpr; ctx.shadowOffsetY = 6 * dpr;   // the panels are fairly bright: a firmer shadow keeps the letters crisp
    ctx.drawImage(buf, 0, 0);
    ctx.shadowColor = 'transparent';
  }

  // ---------- phones: story mode ----------
  let story = 0, storyT = 0, lastNow = 0;
  function setStory(i){
    story = (i + panels.length) % panels.length; storyT = 0;
    panels.forEach((p, k) => p.classList.toggle('is-on', k === story));
    videos.forEach((v, k) => { if (k === story){ v.currentTime = 0; if (visible) play(v); } else v.pause(); });
    load(videos[(story + 1) % videos.length]);
  }
  sec.addEventListener('click', e => {
    if (!phone || e.target.closest('a, button')) return;
    setStory(story + 1);
  });

  function applyMode(){
    phone = phoneMq.matches; resize();
    if (phone){ setStory(story); }
    else { panels.forEach(p => p.classList.remove('is-on')); if (visible) videos.forEach(play); }
  }
  phoneMq.addEventListener ? phoneMq.addEventListener('change', applyMode) : phoneMq.addListener(applyMode);

  // ---------- frame loop: only while the hero is on screen ----------
  let visible = false, raf = 0, lastSp = '';
  function frame(now){
    if (!visible){ raf = 0; return; }
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.1, (now - (lastNow || now)) / 1000); lastNow = now;
    paintFilms();
    // scroll hand-off: 0 at the top, 1 when the hero has scrolled away (written only when it changes, so a still hero
    // does not restyle itself every frame)
    const r = sec.getBoundingClientRect();
    const sp = clamp(-r.top / (r.height * .85), 0, 1).toFixed(4);
    if (sp !== lastSp){ lastSp = sp; sec.style.setProperty('--sp', sp); }
    if (phone && t0 >= 0){
      storyT += dt;
      bars.forEach((b, k) => b.style.setProperty('--p', k < story ? 1 : k === story ? Math.min(1, storyT / STORY).toFixed(3) : 0));
      if (storyT >= STORY) setStory(story + 1);
    }
    drawType(now);
  }
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible){
      if (phone) play(videos[story]); else videos.forEach(play);
      lastNow = 0;
      if (!raf) raf = requestAnimationFrame(frame);
    } else videos.forEach(v => v.pause());
  }, { threshold: 0 }).observe(sec);

  window.addEventListener('resize', resize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
  resize();
  if (phone) setStory(0);

  // start: the slits open, then the first headline begins (a fallback starts it if the intro never calls)
  let started = false;
  function start(){
    if (started) return; started = true;
    sec.classList.add('is-open');
    t0 = performance.now() / 1000 + FIRST;
  }
  setTimeout(start, 6000);
  return { start, resize };
}

export { initFourWindows };
