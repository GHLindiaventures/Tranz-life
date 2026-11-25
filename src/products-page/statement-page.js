// Statement page (#statement) and the grid heading, driven by the scroll position (nothing here is pinned):
//  - the statement text drifts slightly slower than the page, the gold pill draws behind its word when it comes into
//    view, and the line-art and round icon turn and drift with --p
//  - the grid heading's two halves rise out of their masks as it comes into view, and the sunburst between them
//    turns once (0 to 360 degrees) over the whole approach, tied to the scroll
// Reads layout once per frame; writes transform and CSS variables only.
import { $, $$ } from '../utils/dom.js';
import { clamp, ease } from '../utils/math.js';
import { reduce } from '../utils/media.js';
import { state } from '../app/state.js';
import { makeScheduler } from './frame-scheduler.js';

function initStatementPage() {
  const sec = $('#statement'), title = $('#stmTitle');
  const head = $('#luHead'), sun = $('.lu-sun');
  if (!sec || !title) return null;

  const pill = $('.stw-hl', title);
  const headWords = head ? $$('.stw-i', head) : [];
  const small = matchMedia('(max-width:767px)');
  let lastP = -1, lastH = -1, lastR = -1, lastHill = -1;
  const hillsSvg = sec.querySelector('.stm-hills');   // (their grain <image> is filled by grain.js)

  function applyStatement(p) {
    sec.style.setProperty('--p', p.toFixed(4));
    // slightly slower than the page while it passes (about 60px each way at 1440)
    const ty = (0.5 - p) * 2 * innerWidth * 0.043;
    title.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0)`;
    if (pill) {
      const hl = ease.out(clamp((p - 0.36) / 0.2, 0, 1));
      pill.style.setProperty('--hl', hl.toFixed(3));
      pill.classList.toggle('on', hl > 0.25);
    }
  }
  function applyHead(t) {
    headWords.forEach((w, i) => {
      const e = ease.out(clamp((t - i * 0.15) / 0.55, 0, 1));
      w.style.transform = `translate3d(0, ${((1 - e) * 115).toFixed(1)}%, 0)`;
    });
  }

  if (reduce) {
    applyStatement(0.7); applyHead(1);
    headWords.forEach(w => { w.style.transform = 'none'; });
    title.style.transform = 'none';
    return null;
  }

  // Performance (products page): dhina-dev ran this loop on every frame for the life of the page and measured layout
  // each time (and read the grain token with getComputedStyle until it existed; grain.js already hands the tile to
  // the hills' <image> itself). Here it runs only while the statement or the grid heading is near the screen, and
  // positions come from page offsets measured on resize (neither element is transformed or sticky), so a frame never
  // forces a layout.
  const docTop = el => { let y = 0, n = el; while (n) { y += n.offsetTop; n = n.offsetParent; } return y; };
  const geo = {};
  const measure = () => {
    geo.secTop = docTop(sec); geo.secH = sec.offsetHeight;
    if (head) { geo.headTop = docTop(head); geo.headH = head.offsetHeight; }
  };
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  const scrollPos = () => (state.lenis ? state.lenis.scroll : window.scrollY);
  let near = false, rafId = 0;
  const schedule = makeScheduler();                     // after Lenis in the same frame (frame-scheduler.js)
  const watch = new IntersectionObserver(entries => {
    entries.forEach(e => { e.target._near = e.isIntersecting; });
    near = [sec, head].some(el => el && el._near);
    if (near && !rafId) rafId = schedule(frame);
  }, { rootMargin: '30% 0px' });
  [sec, head].forEach(el => { if (el) watch.observe(el); });

  function frame() {
    rafId = near ? schedule(frame) : 0;
    if (!near) return;
    const vh = innerHeight, sy = scrollPos();
    const r = { top: geo.secTop - sy, height: geo.secH }; r.bottom = r.top + r.height;
    // the hills: while the curtain rises (its top from the bottom of the screen to the top), the back hills lag a
    // little behind the page (moved down in the hills' own units, out of 240), which gives the edge depth
    if (hillsSvg && r.top < vh * 1.3 && r.bottom > 0) {
      const t = clamp((vh - r.top) / vh, 0, 1);
      if (Math.abs(t - lastHill) > 0.001) {
        lastHill = t;
        hillsSvg.style.setProperty('--hb', (t * 84).toFixed(1) + 'px');
        hillsSvg.style.setProperty('--hm', (t * 40).toFixed(1) + 'px');
      }
    }
    if (r.bottom > -vh * 0.2 && r.top < vh * 1.2) {
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      if (Math.abs(p - lastP) > 0.0005) { lastP = p; applyStatement(p); }
    }
    if (head) {
      const hr = { top: geo.headTop - sy }; hr.bottom = hr.top + geo.headH;
      if (hr.top < vh * 1.2 && hr.bottom > -vh * 0.2) {
        const t = clamp((vh * 0.95 - hr.top) / (vh * 0.3), 0, 1);
        if (Math.abs(t - lastH) > 0.0005) { lastH = t; applyHead(t); }
      }
      // sunburst: 0 deg when the heading is about 2.6 screens below, a full turn when it is near the top
      if (sun && !small.matches) {
        const a = 360 * clamp((vh * 2.6 - hr.top) / (vh * 2.3), 0, 1);
        if (Math.abs(a - lastR) > 0.05) { lastR = a; sun.style.transform = `rotate(${a.toFixed(1)}deg)`; }
      }
    }
  }
  return null;
}

export { initStatementPage };
