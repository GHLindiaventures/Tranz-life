// The page's scrollbar, drawn over the page: a slim thumb with no track, so it blends into every section (dark or
// light). On Windows a native scrollbar sits in its own strip, which no CSS can make see-through, hence this.
// Only for mouse/trackpad devices (styles/base/global.css hides the native bar there); phones keep their own
// overlay scrollbars. The thumb shows where you are and can be dragged; wheel, keys and touch scroll as normal.
import { state } from '../app/state.js';

const fine = matchMedia('(hover: hover) and (pointer: fine)');
const MIN = 44;   // shortest thumb, px

function initPageScrollbar(){
  if (document.getElementById('pageThumb')) return;
  const thumb = document.createElement('div');
  thumb.id = 'pageThumb'; thumb.className = 'page-thumb'; thumb.setAttribute('aria-hidden', 'true');
  document.body.appendChild(thumb);

  let h = MIN, range = 1, track = 1, raf = 0;
  const root = document.documentElement;
  function measure(){
    const vh = window.innerHeight, doc = Math.max(root.scrollHeight, document.body.scrollHeight);
    range = Math.max(0, doc - vh);
    h = Math.max(MIN, Math.round(vh * vh / Math.max(vh, doc)));
    track = Math.max(1, vh - h - 8);
    thumb.style.height = h + 'px';
    thumb.classList.toggle('is-none', range < 2);
    place();
  }
  function place(){
    raf = 0;
    const y = 4 + (range ? window.scrollY / range : 0) * track;
    thumb.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
  }
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(place); };

  // dragging: the thumb follows the pointer and the page follows the thumb
  let dragFrom = 0, scrollFrom = 0;
  thumb.addEventListener('pointerdown', e => {
    e.preventDefault();
    dragFrom = e.clientY; scrollFrom = window.scrollY;
    thumb.setPointerCapture(e.pointerId); thumb.classList.add('is-drag'); root.classList.add('is-thumb-drag');
  });
  thumb.addEventListener('pointermove', e => {
    if (!thumb.classList.contains('is-drag')) return;
    const y = Math.min(range, Math.max(0, scrollFrom + (e.clientY - dragFrom) / track * range));
    if (state.lenis) state.lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
  });
  const end = e => { thumb.classList.remove('is-drag'); root.classList.remove('is-thumb-drag'); if (thumb.hasPointerCapture?.(e.pointerId)) thumb.releasePointerCapture(e.pointerId); };
  thumb.addEventListener('pointerup', end);
  thumb.addEventListener('pointercancel', end);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);   // sections that pin, load or grow
  measure();
}

function start(){ if (fine.matches) initPageScrollbar(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
fine.addEventListener?.('change', start);
