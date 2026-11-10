// Hero: brush reveal of the moss-covered rock. Where the pointer moves over the stone, the green moss
// version (same framing as the stone image, stacked exactly on top of it) shows through a soft brush,
// then slowly fades back to bare stone.
import { $ } from '../../utils/dom.js';

const RES = { w: 960, h: 540 };   // drawing size of the reveal (the image itself is 1920x1080)
const BRUSH = 74;                 // brush radius in drawing pixels
const FADE = 0.75;                // how fast revealed moss fades back (per second)

function initMossReveal(){
  const view = $('#slabMoss');
  if (!view) return null;
  const ctx = view.getContext('2d');
  view.width = RES.w; view.height = RES.h;

  const mask = document.createElement('canvas'); mask.width = RES.w; mask.height = RES.h;
  const mctx = mask.getContext('2d');

  const moss = new Image(); moss.decoding = 'async';
  let ready = false; moss.onload = () => { ready = true; }; moss.src = '/layered-depth-slab-set-moss.webp'; // main rock + the three side rocks, mossy

  const dab = (x, y) => {
    const g = mctx.createRadialGradient(x, y, 0, x, y, BRUSH);
    g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(.55, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    mctx.fillStyle = g; mctx.beginPath(); mctx.arc(x, y, BRUSH, 0, Math.PI*2); mctx.fill();
  };

  let running = false, last = 0, idle = 0, lx = null, ly = null;
  const frame = now => {
    const dt = Math.min(.05, (now - last)/1000); last = now; idle += dt;
    // fade the revealed area back towards bare stone
    mctx.globalCompositeOperation = 'destination-out';
    mctx.fillStyle = `rgba(0,0,0,${(1 - Math.exp(-dt*FADE)).toFixed(4)})`;
    mctx.fillRect(0, 0, RES.w, RES.h);
    mctx.globalCompositeOperation = 'source-over';
    // moss shows only where the mask is
    ctx.clearRect(0, 0, RES.w, RES.h);
    if (ready){
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = 'source-in';
      ctx.drawImage(moss, 0, 0, RES.w, RES.h);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (idle < 6) requestAnimationFrame(frame);
    else { running = false; mctx.clearRect(0, 0, RES.w, RES.h); ctx.clearRect(0, 0, RES.w, RES.h); }
  };
  const kick = () => { idle = 0; if (!running){ running = true; last = performance.now(); requestAnimationFrame(frame); } };

  view.addEventListener('pointermove', e => {
    const w = view.clientWidth || RES.w, h = view.clientHeight || RES.h;
    const x = (e.offsetX / w) * RES.w, y = (e.offsetY / h) * RES.h;
    // paint a smooth stroke from the last point, not just separate dots
    if (lx !== null){
      const d = Math.hypot(x - lx, y - ly), steps = Math.min(40, Math.ceil(d/(BRUSH*.35)));
      for (let i = 1; i <= steps; i++) dab(lx + (x - lx)*i/steps, ly + (y - ly)*i/steps);
    } else dab(x, y);
    lx = x; ly = y; kick();
  }, { passive: true });

  view.addEventListener('pointerleave', () => { lx = ly = null; }, { passive: true });

  return {};
}

export { initMossReveal };
