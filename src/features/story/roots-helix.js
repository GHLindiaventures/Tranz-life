// Roots to Helix: the home page's signature scroll moment (section #roots, pinned for its height).
// The banyan's roots grow down from where the hero product sank into the stone, a glowing logo forms where they meet,
// a DNA double helix grows out of it across the screen, the tagline stretches into place word by word, and finally the
// helix unwinds into a single golden thread: the timeline of "A day with TranzLife" below.
// Timing: the roots grow while the section is still scrolling into view (entry, `e`: 0 as its top edge appears, 1 when
// it reaches the top of the screen), so they emerge from the stone as the hero's product sinks, with no empty dark
// screen. Everything after the roots runs on the pinned part (`q`). One 2D canvas, drawn only while the section is on
// screen. Reduced motion: drawn once, fully formed.
import { $, $$ } from '../../utils/dom.js';
import { clamp, seeded } from '../../utils/math.js';
import { reduce } from '../../utils/media.js';

const band = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const sm = x => x * x * (3 - 2 * x);
const bez = (a, b, c, d, t) => { const u = 1 - t; return u*u*u*a + 3*u*u*t*b + 3*u*t*t*c + t*t*t*d; };

const GOLD = [231, 198, 128], LEAF = [159, 208, 122], CREAM = [238, 243, 232];
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

function initRoots(){
  const sec = $('#roots'), canvas = $('#rootsCanvas');
  if (!sec || !canvas) return null;
  const ctx = canvas.getContext('2d');
  const words = $$('.rl-w', sec), kicker = $('#rootsKicker'), sub = $('#rootsSub'), logo = $('#rootsLogo');

  let W = 1, H = 1, dpr = 1, roots = [], mid = 0, cx = 0;
  const phone = () => W < 768;

  function build(){
    const R = seeded(11); roots = [];
    cx = W / 2; mid = H * (phone() ? .4 : .44);
    const N = phone() ? 9 : 15, steps = 48;
    for (let i = 0; i < N; i++){
      const tx = W * (.06 + .88 * (i / (N - 1))), sx = cx + (R() - .5) * 24;
      const c1x = sx + (R() - .5) * 70, c1y = mid * (.3 + R() * .15), c2x = tx + (R() - .5) * W * .12, c2y = mid * (.68 + R() * .12);
      const pts = [];
      for (let k = 0; k <= steps; k++){
        const t = k / steps;
        pts.push([bez(sx, c1x, c2x, tx, t) + Math.sin(t * 8 + i * 1.7) * 7 * t, bez(-8, c1y, c2y, mid, t)]);
      }
      // two or three fine rootlets branching off each root
      const twigs = [];
      for (let j = 0, n = 2 + Math.floor(R() * 2); j < n; j++){
        const at = .25 + R() * .6, base = pts[Math.round(at * steps)], dir = R() < .5 ? -1 : 1, len = 30 + R() * 60, tp = [];
        for (let k = 0; k <= 12; k++){ const t = k / 12; tp.push([base[0] + dir * len * t + Math.sin(t * 5) * 4, base[1] + len * .55 * t * t]); }
        twigs.push({ at, pts: tp });
      }
      roots.push({ pts, w: 1.1 + R() * 1.9, delay: R() * .3, twigs });
    }
  }

  function resize(){
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  const line = (pts, upto, width, color) => {
    const n = Math.max(1, Math.floor(upto * (pts.length - 1)));
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k <= n; k++) ctx.lineTo(pts[k][0], pts[k][1]);
    ctx.lineWidth = width; ctx.strokeStyle = color; ctx.stroke();
  };

  function draw(e, q, time){
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // 1. roots grow down, then settle back to a quiet glow behind the helix
    // the growth front stays inside the visible part of the entering section (it reaches the helix line, 44% down,
    // a little before the section is fully on screen)
    const grow = clamp(e * 1.08, 0, 1), rootAlpha = 1 - .7 * band(q, .2, .45);
    if (grow > 0){
      ctx.shadowColor = rgba(GOLD, .6); ctx.shadowBlur = 10;
      roots.forEach(r => {
        const g = sm(clamp((grow - r.delay * .4) / (1 - r.delay * .4), 0, 1));
        if (g <= 0) return;
        line(r.pts, g, r.w, rgba(GOLD, .85 * rootAlpha));
        r.twigs.forEach(tw => { const tg = clamp((g - tw.at) / (1 - tw.at), 0, 1); if (tg > 0) line(tw.pts, tg, r.w * .55, rgba(GOLD, .5 * rootAlpha)); });
      });
      ctx.shadowBlur = 0;
    }

    // 2. the helix grows out from the centre, rotating; 3. then unwinds into a single thread
    const reveal = sm(band(q, .03, .38)), unwind = sm(band(q, .8, .96));
    if (reveal > 0){
      const x0 = W * .04, x1 = W * .96, half = (x1 - x0) / 2 * reveal;
      const amp = H * (phone() ? .05 : .075) * (1 - unwind), k = (Math.PI * 2) / (phone() ? 150 : 230), ph = time * .9 + q * 7;
      const step = phone() ? 9 : 11;
      // rungs first (behind the beads)
      for (let x = cx - half; x <= cx + half; x += step * 2){
        const a = Math.sin(k * x + ph), z = Math.cos(k * x + ph);
        const ya = mid + amp * a, yb = mid - amp * a;
        ctx.strokeStyle = rgba(CREAM, (.08 + .14 * (1 - Math.abs(z))) * (1 - unwind));
        ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, ya); ctx.lineTo(x, yb); ctx.stroke();
      }
      for (let x = cx - half; x <= cx + half; x += step){
        const a = Math.sin(k * x + ph), z = Math.cos(k * x + ph), edge = 1 - clamp((Math.abs(x - cx) - half + 60) / 60, 0, 1);
        const ya = mid + amp * a, yb = mid - amp * a;
        const ra = (2 + 1.6 * (z + 1) / 2) * (1 - unwind * .6), rb = (2 + 1.6 * (1 - z) / 2) * (1 - unwind * .6);
        ctx.fillStyle = rgba(GOLD, (.45 + .5 * (z + 1) / 2) * edge);
        ctx.beginPath(); ctx.arc(x, ya, ra, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = rgba(unwind > .5 ? GOLD : LEAF, (.4 + .5 * (1 - z) / 2) * edge);
        ctx.beginPath(); ctx.arc(x, yb, rb, 0, Math.PI * 2); ctx.fill();
      }
      if (unwind > 0){
        // the golden thread: continues down off the bottom edge into the day section
        ctx.shadowColor = rgba(GOLD, .8); ctx.shadowBlur = 14;
        ctx.strokeStyle = rgba(GOLD, unwind); ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(cx - half, mid); ctx.lineTo(cx + half, mid); ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
  }

  // DOM: the logo glows where the roots meet; the tagline stretches into place word by word
  function setDom(q){
    if (logo){
      const o = sm(band(q, 0, .1)) * (1 - sm(band(q, .26, .38)));
      logo.style.opacity = o.toFixed(3);
      logo.style.transform = `translate(-50%, -50%) scale(${(.75 + .35 * o).toFixed(3)})`;
      logo.style.top = (mid / H * 100).toFixed(2) + '%';
    }
    if (kicker) kicker.style.opacity = sm(band(q, .16, .24)).toFixed(3);
    words.forEach((w, i) => {
      const t = sm(band(q, .18 + i * .026, .27 + i * .026));
      w.style.opacity = t.toFixed(3);
      w.style.fontStretch = (62 + 38 * t).toFixed(1) + '%';
      w.style.transform = `translate3d(0, ${(18 * (1 - t)).toFixed(1)}px, 0)`;
    });
    if (sub){ const t = sm(band(q, .58, .7)); sub.style.opacity = t.toFixed(3); sub.style.transform = `translate3d(0, ${(14 * (1 - t)).toFixed(1)}px, 0)`; }
  }

  // e: entry (the section scrolling into view); q: the pinned part (the section's top above the screen's top)
  const progress = () => {
    const r = sec.getBoundingClientRect(), vh = window.innerHeight;
    return { e: clamp((vh - r.top) / vh, 0, 1), q: clamp(-r.top / Math.max(1, r.height - vh), 0, 1) };
  };

  resize();
  window.addEventListener('resize', resize);

  if (reduce){
    sec.classList.add('is-static');
    requestAnimationFrame(() => { resize(); draw(1, .8, 0); setDom(1); });
    return null;
  }

  let visible = false, raf = 0;
  const frame = now => {
    if (!visible){ raf = 0; return; }
    raf = requestAnimationFrame(frame);
    const { e, q } = progress();
    draw(e, q, now / 1000);
    setDom(q);
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  }, { rootMargin: '120px 0px' }).observe(sec);
  setDom(0);
  return { resize };
}

export { initRoots };
