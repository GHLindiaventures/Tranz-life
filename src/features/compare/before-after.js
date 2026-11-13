// Before / after comparison slider (product details page). Two aligned illustrations are stacked; the "after" layer is
// clipped from the handle's position to the right, so dragging the handle reveals one and hides the other.
//  - pointer: drag anywhere on the picture (touch-action: pan-y keeps vertical page scrolling on phones);
//    the handle eases towards the pointer every frame, so a tap glides there instead of jumping
//  - keyboard: the handle is a slider (arrows, Shift + arrows, Home / End)
//  - first time the section comes into view, the handle sweeps once to show it can be dragged (not with
//    reduced motion, and never after the visitor has touched it)
// Performance: the picture is measured once per drag (not per move), the position is one CSS variable on the
// stage, and the frame loop only runs while the handle is still moving.
import '../../styles/sections/before-after.css';
import { COMPARE } from '../../data/compare.js';
import { reduce } from '../../utils/media.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const ICONS = {
  drop: '<path d="M12 3c4 3 6 6.5 6 10a6 6 0 0 1-12 0c0-3.5 2-7 6-10z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  spark: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M5 19l2.8-2.8M16.2 7.8 19 5"/>',
  cycle: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4h-4"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  lungs: '<path d="M12 3v8"/><path d="M12 11c-1.5 1-3 1.5-3 1.5"/><path d="M12 11c1.5 1 3 1.5 3 1.5"/><path d="M8.5 7C5 8 3 13 3 17c0 2 1 3 3 3 3 0 3-3 3-6V8.5a1.5 1.5 0 0 0-.5-1.5z"/><path d="M15.5 7C19 8 21 13 21 17c0 2-1 3-3 3-3 0-3-3-3-6V8.5a1.5 1.5 0 0 1 .5-1.5z"/>',
  leaf: '<path d="M5 19C6 10 12 5 20 4c-.5 9-6 14-15 15z"/><path d="M5 19 14 10"/>',
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7"/>'
};
const DEFAULT_ICONS = ['drop', 'shield', 'spark', 'cycle', 'bolt'];
const LEAF = '<path d="M6 54C10 26 30 8 58 4c-2 30-22 50-52 50z"/><path d="M6 54 40 20"/>';

function sectionHtml(c) {
  const tags = (list, side) => list.map((t, i) => `<li class="bac-tag bac-tag--${side}" style="--i:${i}">${esc(t)}</li>`).join('');
  const [w, h] = c.size;
  return `
    <div class="wrap">
      <div class="bac-head">
        <div>
          <p class="eyebrow drawn">${esc(c.eyebrow)}</p>
          <h2 class="h2">${esc(c.title[0])} <em>${esc(c.title[1])}</em></h2>
        </div>
        <p class="sub">${esc(c.intro)}</p>
      </div>

      <div class="bac-stage${c.fill ? ' bac-stage--fill' : ''}" style="--pos:50" aria-roledescription="before and after comparison">
        <div class="bac-layer bac-before">
          <div class="bac-bg" aria-hidden="true"><span class="bac-haze"></span></div>
          <img src="${esc(c.before.img)}" alt="${esc(c.before.alt)}" width="${w}" height="${h}" loading="lazy" decoding="async" draggable="false">
          <ul class="bac-tags" aria-label="${esc(c.before.label)}">${tags(c.before.tags, 'before')}</ul>
        </div>
        <div class="bac-layer bac-after">
          <div class="bac-bg" aria-hidden="true">
            <span class="bac-glow"></span>
            <svg class="bac-leaf bac-leaf--a" viewBox="0 0 64 64">${LEAF}</svg>
            <svg class="bac-leaf bac-leaf--b" viewBox="0 0 64 64">${LEAF}</svg>
            <svg class="bac-leaf bac-leaf--c" viewBox="0 0 64 64">${LEAF}</svg>
          </div>
          <img src="${esc(c.after.img)}" alt="${esc(c.after.alt)}" width="${w}" height="${h}" loading="lazy" decoding="async" draggable="false">
          <ul class="bac-tags" aria-label="${esc(c.after.label)}">${tags(c.after.tags, 'after')}</ul>
        </div>

        <p class="bac-label bac-label--before" aria-hidden="true"><b>${esc(c.before.label)}</b><small>${esc(c.before.sub)}</small></p>
        <p class="bac-label bac-label--after" aria-hidden="true"><b>${esc(c.after.label)}</b><small>${esc(c.after.sub)}</small></p>
        <p class="bac-concept" aria-hidden="true">Conceptual illustration</p>

        <div class="bac-handle" role="slider" tabindex="0" aria-label="Compare before and after: drag or use the arrow keys"
          aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="Half before, half after">
          <span class="bac-line" aria-hidden="true"></span>
          <span class="bac-knob" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M9 6 3 12l6 6M15 6l6 6-6 6"/></svg>
          </span>
        </div>
      </div>

      <p class="bac-caption" aria-hidden="true">Conceptual illustration · drag to compare</p>

      <ul class="bac-benefits">
        ${c.benefits.map(([t, d], i) => `<li><span class="bac-ic" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[(c.icons || DEFAULT_ICONS)[i]] || ICONS.leaf}</svg></span><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}
      </ul>

      <div class="bac-herbs">
        <p class="bac-herbs__k">${esc(c.botanicalsTitle)}</p>
        <ul>${c.botanicals.map(([n, q]) => `<li>${esc(n)} <small>${esc(q)}</small></li>`).join('')}</ul>
      </div>

      <p class="bac-note">${esc(c.note)}</p>
    </div>`;
}

function initBeforeAfter(section, productId) {
  const c = COMPARE[productId];
  if (!section || !c) return null;
  section.innerHTML = sectionHtml(c);
  section.hidden = false;

  const stage = section.querySelector('.bac-stage');
  const handle = section.querySelector('.bac-handle');
  let pos = 50, target = 50, raf = 0, rect = null, dragging = false, touched = false, demo = null;

  const write = () => {
    stage.style.setProperty('--pos', pos.toFixed(2));
    const v = Math.round(pos);
    if (handle._v !== v) {
      handle._v = v;
      handle.setAttribute('aria-valuenow', String(v));
      handle.setAttribute('aria-valuetext', v <= 2 ? 'All before' : v >= 98 ? 'All after' : `${v}% before, ${100 - v}% after`);
    }
  };
  // ease the shown position towards the target; stop once it has arrived
  const step = now => {
    raf = 0;
    if (demo) {
      const t = (now - demo.t0) / demo.ms;
      if (t >= 1) { demo = null; target = 50; }
      else target = 50 + Math.sin(t * Math.PI * 2) * -22 * (1 - t * 0.35);   // 50 -> 28 -> 72 -> 50
    }
    const k = dragging ? 0.45 : 0.22;
    pos += (target - pos) * k;
    if (Math.abs(target - pos) < 0.05 && !demo) pos = target;
    write();
    if (pos !== target || demo) raf = requestAnimationFrame(step);
  };
  const go = p => { target = clamp(p, 0, 100); if (!raf) raf = requestAnimationFrame(step); };
  const stopDemo = () => { touched = true; demo = null; };

  const fromX = x => (rect ? ((x - rect.left) / rect.width) * 100 : pos);
  stage.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    stopDemo();
    rect = stage.getBoundingClientRect();
    dragging = true;
    stage.classList.add('is-dragging');
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    go(fromX(e.clientX));
  });
  stage.addEventListener('pointermove', e => { if (dragging) go(fromX(e.clientX)); });
  const end = e => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
    try { stage.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('lostpointercapture', () => { dragging = false; stage.classList.remove('is-dragging'); });

  handle.addEventListener('keydown', e => {
    const big = e.shiftKey ? 10 : 4;
    const map = { ArrowLeft: -big, ArrowDown: -big, ArrowRight: big, ArrowUp: big };
    if (e.key in map) { e.preventDefault(); stopDemo(); go(target + map[e.key]); }
    else if (e.key === 'Home') { e.preventDefault(); stopDemo(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); stopDemo(); go(100); }
  });

  // one gentle sweep the first time it is seen, so it is obvious the picture can be dragged
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      setTimeout(() => { if (!touched) { demo = { t0: performance.now(), ms: 2400 }; go(50); } }, 450);
    }, { threshold: 0.55 });
    io.observe(stage);
  }

  write();
  return { set: p => { stopDemo(); go(p); } };
}

export { initBeforeAfter };
