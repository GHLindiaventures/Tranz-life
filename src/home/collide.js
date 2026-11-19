// The four films (#collide): the first thing on the page once the film over it ends, before A Day with TranzLife.
// Root, Lab, Formula and You (the client's four clips, public/videos/hero/) wait in the four corners, tilted and small,
// while "Four films. One story." stands between them. Scrolling (pinned for the section's height):
//   .08 -> .42   they rush in, faster and faster, towards the centre
//   .42          they collide: a flash of light, a shock ring, a burst of sparks, the screen shakes, an impact sound
//   .45 -> .66   they spring apart and settle side by side, one story (four columns; a 2 x 2 grid on phones)
//   .62 -> .74   each film's name and line appear
//   .74 -> .92   "From root to ritual." over the films, which dim
//   .9  -> 1     everything warms into the dawn colour "A Day" begins with, so the two sections meet without an edge
// The films load once the film over the page has ended, and play only while this section is on screen.
// Reduced motion: no pin; the four films side by side with the words.
import { state } from '../app/state.js';
import { clamp } from '../utils/math.js';
import { reduce } from '../utils/media.js';

const band = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const sm = x => x * x * (3 - 2 * x);
const backOut = x => { const c = 1.7, d = c + 1; return 1 + d * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const inCubic = x => x * x * x;

function initCollide(){
  const sec = document.getElementById('collide');
  if (!sec) return null;
  const figs = [...sec.querySelectorAll('.cl-v')], vids = figs.map(f => f.querySelector('video'));
  const stage = sec.querySelector('.cl-stage'), flash = sec.querySelector('.cl-flash'), intro = sec.querySelector('.cl-intro');
  const out = sec.querySelector('.cl-out'), dawn = sec.querySelector('.cl-dawn'), cv = sec.querySelector('#clFx'), g = cv.getContext('2d');
  const root = document.documentElement;

  // ---------- the films: loaded after the opening film, played only on screen
  let visible = false, loaded = false;
  const load = () => { if (loaded) return; loaded = true; vids.forEach(v => { v.src = v.dataset.src; v.preload = 'auto'; }); };
  const play = () => vids.forEach(v => { if (v.src && v.paused) v.play().catch(() => {}); });
  const pause = () => vids.forEach(v => v.pause());
  if (!root.classList.contains('xp-on')) load();
  document.addEventListener('tl:film-closed', () => { load(); if (visible) play(); });

  if (reduce){
    sec.classList.add('is-static');
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible){ load(); play(); } else pause(); }).observe(sec);
    return null;
  }

  // ---------- layout: where each film starts (a corner) and where it settles
  let W = 1, H = 1, phone = false, dpr = 1, slots = [], starts = [];
  function layout(){
    W = innerWidth; H = innerHeight; phone = W < 760; dpr = Math.min(devicePixelRatio || 1, 1.5);
    cv.width = W * dpr; cv.height = H * dpr;
    const gap = phone ? 8 : 12;
    let fw, fh;
    if (phone){ fw = (W - 32 - gap) / 2; fh = Math.min(fw * 1.55, (H - 200 - gap) / 2); slots = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => [a * (fw + gap) / 2, b * (fh + gap) / 2 + 10]); }
    else { fw = Math.min((W - 80 - gap * 3) / 4, (H * .74) * .5625); fh = fw / .5625; slots = [-1.5, -.5, .5, 1.5].map(k => [k * (fw + gap), 10]); }
    figs.forEach(f => { f.style.width = `${fw}px`; f.style.height = `${fh}px`; });
    starts = [[-.36, -.3, -14], [.36, -.32, 11], [-.38, .3, 9], [.37, .3, -12]].map(([x, y, r]) => [x * W, y * H, r]);
  }
  layout(); addEventListener('resize', layout);

  // ---------- the burst of sparks at the collision (time based)
  let sparks = [], ring = 0, fired = false;
  function burst(){
    const cx = W / 2, cy = H / 2;
    sparks = Array.from({ length: phone ? 70 : 140 }, () => { const a = Math.random() * Math.PI * 2, v = 200 + Math.random() * 900; return { x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, s: 1 + Math.random() * 2.5, hue: Math.random() < .5 ? '255,226,150' : '190,240,200' }; });
    ring = 1;
    state.score && (state.score.sfx('plant'), state.score.sfx('shimmer'));
  }
  let lastT = 0;
  function drawFx(now){
    const dt = Math.min(.05, (now - (lastT || now)) / 1000); lastT = now;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    if (ring > 0){
      ring = Math.max(0, ring - dt * 1.1);
      const r = (1 - ring) * Math.max(W, H) * .7;
      g.strokeStyle = `rgba(255,236,190,${(ring * .8).toFixed(3)})`; g.lineWidth = 6 * ring + 1;
      g.beginPath(); g.arc(W / 2, H / 2, r, 0, Math.PI * 2); g.stroke();
    }
    if (sparks.length){
      g.globalCompositeOperation = 'lighter';
      sparks = sparks.filter(p => (p.life -= dt * .9) > 0);
      for (const p of sparks){
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy = p.vy * .96 + 40 * dt;
        g.fillStyle = `rgba(${p.hue},${p.life.toFixed(3)})`; g.beginPath(); g.arc(p.x, p.y, p.s * p.life + .3, 0, Math.PI * 2); g.fill();
      }
      g.globalCompositeOperation = 'source-over';
    }
  }

  // ---------- the scroll
  let raf = 0, lastQ = 0;
  function frame(now){
    raf = visible ? requestAnimationFrame(frame) : 0;
    const r = sec.getBoundingClientRect(), q = clamp(-r.top / Math.max(1, r.height - H), 0, 1);
    const approach = inCubic(band(q, .08, .42)), settle = band(q, .45, .66), sb = backOut(settle);
    const impact = Math.sin(Math.PI * band(q, .4, .5));
    if (q >= .42 && lastQ < .42 && !fired){ fired = true; burst(); }
    if (q < .3) fired = false;
    lastQ = q;
    // shake on impact
    const sh = impact * 14;
    stage.style.transform = sh > .3 ? `translate(${(Math.sin(now * .09) * sh).toFixed(1)}px, ${(Math.cos(now * .11) * sh).toFixed(1)}px)` : '';
    figs.forEach((f, i) => {
      const [sx, sy, sr] = starts[i], [tx, ty] = slots[i];
      // corner -> centre (bunched, overlapping) -> its slot
      const cx = sx * (1 - approach) + (i % 2 ? 1 : -1) * W * .02 * approach, cy = sy * (1 - approach) + (i < 2 ? -1 : 1) * H * .02 * approach;
      const x = cx + (tx - cx) * sb, y = cy + (ty - cy) * sb;
      const rot = sr * (1 - approach) * (1 - settle) + (1 - settle) * impact * (i % 2 ? 6 : -6);
      const sc = (.42 + .2 * approach) * (1 - settle) + 1 * settle - impact * .06;
      f.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      f.style.zIndex = String(i === 1 || i === 2 ? 2 : 1);
      f.style.setProperty('--cap', sm(band(q, .62 + i * .025, .7 + i * .025)).toFixed(3));
      f.style.filter = q > .74 ? `brightness(${(1 - sm(band(q, .74, .84)) * .45).toFixed(3)}) saturate(${(1 - sm(band(q, .74, .84)) * .3).toFixed(3)})` : '';
    });
    flash.style.opacity = (impact * impact * .9).toFixed(3);
    intro.style.opacity = (1 - sm(band(q, .12, .3))).toFixed(3);
    intro.style.transform = `translate(-50%,-50%) scale(${(1 + sm(band(q, .12, .3)) * .2).toFixed(3)})`;
    out.style.opacity = sm(band(q, .74, .84)).toFixed(3);
    out.style.transform = `translate(-50%,-50%) translateY(${((1 - sm(band(q, .74, .86))) * 30).toFixed(1)}px)`;
    dawn.style.opacity = sm(band(q, .9, 1)).toFixed(3);
    drawFx(now);
  }
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting && !root.classList.contains('xp-on');
    if (visible){ load(); play(); if (!raf) raf = requestAnimationFrame(frame); } else pause();
  }, { rootMargin: '0px' }).observe(sec);
  document.addEventListener('tl:film-closed', () => { visible = true; load(); play(); if (!raf) raf = requestAnimationFrame(frame); });
  return { layout };
}

export { initCollide };
