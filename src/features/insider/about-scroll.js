// "Know more" in "You deserve the best": opens the company story full screen. The story card grows out to fill
// the screen, then six full-screen scenes play like motion graphics: scrolling flies the camera forward, so the
// current scene's words, numbers and rings zoom past you and blur away while the next scene's layers zoom in from
// far off and the backgrounds cross-fade. The wheel, a drag, the arrow keys, the arrows and the dots all move it,
// and it follows the scroll, so scrolling back plays it in reverse.
import { gsap } from '../../lib/gsap.js';
import { state } from '../../app/state.js';
import { $, $$ } from '../../utils/dom.js';
import { reduce } from '../../utils/media.js';

const pad = n => String(n).padStart(2, '0');
const clamp01 = v => Math.max(0, Math.min(1, v));
const smooth = t => t * t * (3 - 2 * t); // ease in and out between 0 and 1

function initAboutScroll(){
  const box = $('#about'), opener = $('#aboutOpen');
  if (!box || !opener) return;
  const view = $('#abView', box), cards = $$('.ab-scene', box);
  const dots = $('#abDots', box), now = $('#abNow', box), bar = $('#abBar', box), source = $('#insider .in-copy');
  const last = cards.length - 1;
  $('#abAll', box).textContent = pad(cards.length);
  dots.innerHTML = cards.map((c, i) => `<button type="button" data-ab-go="${i}" aria-label="${i + 1}: ${$('.ab-no', c).textContent.replace(/^\d+ · /, '')}"></button>`).join('');
  const dotEls = $$('button', dots);
  cards.forEach((c, i) => {
    // each content layer zooms at its own depth (later lines further back), so they separate as they fly
    [...c.children].forEach((el, k) => el.style.setProperty('--depth', (1 + k * .22).toFixed(2)));
    // motion-graphic layers behind the words: a giant outlined scene number and a ring
    c.insertAdjacentHTML('afterbegin', `<span class="ab-big" aria-hidden="true">${pad(i + 1)}</span><span class="ab-ring" aria-hidden="true"></span>`);
  });

  // position is measured in scenes: 0 = first scene on screen, 1 = second, and so on
  let cur = 0, target = 0, active = -1, raf = 0, open = false, idle = 0, lastFocus = null;
  const clamp = v => Math.max(0, Math.min(last, v));
  const go = i => { target = clamp(Math.round(i)); kick(); };
  const snap = () => go(target);

  const render = () => {
    cards.forEach((c, i) => {
      const d = i - cur; // > 0: still to come, < 0: already passed
      let o, zf;
      if (d >= 0){
        // coming in: the layers start far away (small) and zoom in towards you; the scene fades in underneath
        const g = smooth(clamp01(d));
        zf = .3 * g;
        o = 1 - smooth(clamp01((d - .15) * 1.5));
      } else {
        // going out: the layers keep zooming, rush past the camera and blur away; the scene fades out on top
        const g = smooth(clamp01(-d));
        zf = -.75 * g;
        o = 1 - smooth(clamp01(-d * 1.3));
      }
      c.style.opacity = o.toFixed(3);
      c.style.visibility = o < .01 ? 'hidden' : '';
      c.style.zIndex = String(cards.length - i); // the scene you are leaving stays on top while it dissolves
      c.style.setProperty('--zf', zf.toFixed(4));
      c.style.setProperty('--a', reduce ? '0' : clamp01(Math.abs(d)).toFixed(3));
    });
    const i = Math.round(clamp(cur));
    if (i !== active){
      active = i; now.textContent = pad(i + 1);
      box.dataset.tone = cards[i].dataset.tone || 'light';
      cards.forEach((c, j) => { c.inert = j !== i; c.classList.toggle('on', j === i); });
      dotEls.forEach((b, j) => b.setAttribute('aria-current', j === i ? 'true' : 'false'));
    }
    bar.style.transform = `scaleX(${clamp01(cur / (last || 1))})`;
  };
  const tick = () => {
    cur += (target - cur) * (reduce ? 1 : .085);
    if (Math.abs(target - cur) < .0008) cur = target;
    render();
    raf = cur === target ? 0 : requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const perCard = () => Math.max(420, view.clientWidth * .55); // pixels of scrolling or dragging per card

  // wheel or trackpad: up/down or sideways both play the deck, then it settles on the nearest card
  view.addEventListener('wheel', e => {
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? view.clientWidth : 1;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    target = clamp(target + delta * unit / perCard());
    kick(); clearTimeout(idle); idle = setTimeout(snap, 200);
  }, { passive:false });

  // drag or swipe, with a little throw at the end
  let drag = null;
  view.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('a,button')) return;
    clearTimeout(idle);
    drag = { x:e.clientX, t:target, vx:0, lx:e.clientX, lt:performance.now() };
    view.setPointerCapture(e.pointerId);
  });
  view.addEventListener('pointermove', e => {
    if (!drag) return;
    const t = performance.now(), dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) view.classList.add('drag');
    drag.vx = (e.clientX - drag.lx) / Math.max(t - drag.lt, 1); drag.lx = e.clientX; drag.lt = t;
    target = clamp(drag.t - dx / (perCard() * .8)); kick();
  });
  const endDrag = () => {
    if (!drag) return;
    view.classList.remove('drag');
    const fling = -drag.vx * 220 / perCard(), moved = target - drag.t;
    drag = null;
    // a short flick still moves one whole card
    if (Math.abs(moved + fling) > .15 && Math.abs(moved + fling) < .5) go(Math.round(target - moved) + Math.sign(moved + fling));
    else go(target + fling);
  };
  view.addEventListener('pointerup', endDrag); view.addEventListener('pointercancel', endDrag);

  const clipOf = (fallback) => {
    const r = source ? source.getBoundingClientRect() : null, vw = innerWidth, vh = innerHeight;
    return r && r.bottom > 0 && r.top < vh ? `inset(${r.top}px ${vw - r.right}px ${vh - r.bottom}px ${r.left}px round 30px)` : fallback;
  };

  const show = () => {
    if (open) return; open = true; lastFocus = document.activeElement;
    box.hidden = false; document.documentElement.classList.add('ab-lock');
    if (state.lenis) state.lenis.stop();
    active = -1;
    cur = reduce ? 0 : -.9; target = 0; // the first card grows in from the right
    render();
    if (!reduce){
      gsap.fromTo(box, { clipPath:clipOf('inset(8% 8% 8% 8% round 30px)') }, { clipPath:'inset(0px 0px 0px 0px round 0px)', duration:.9, ease:'power3.inOut', onComplete:() => { box.style.clipPath = ''; } });
      gsap.fromTo($$('.ab-top, .ab-nav', box), { opacity:0, y:-14 }, { opacity:1, y:0, duration:.6, delay:.45, stagger:.08, ease:'power2.out' });
      setTimeout(kick, 260);
    } else kick();
    view.focus({ preventScroll:true });
  };
  const hide = () => {
    if (!open) return; open = false;
    const done = () => {
      box.hidden = true; box.style.clipPath = ''; document.documentElement.classList.remove('ab-lock');
      if (state.lenis) state.lenis.start();
    };
    if (reduce) done();
    else gsap.to(box, { clipPath:clipOf('inset(50% 50% 50% 50% round 30px)'), duration:.7, ease:'power3.inOut', onComplete:done });
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll:true });
  };

  opener.addEventListener('click', show);
  box.addEventListener('click', e => {
    const to = e.target.closest('[data-ab-go]'), st = e.target.closest('[data-ab-step]'), x = e.target.closest('[data-ab-close]');
    if (to) go(+to.dataset.abGo);
    else if (st) go(Math.round(target) + +st.dataset.abStep);
    else if (x){
      hide();
      // "Shop now": close first, then let the page scroll to the shop
      const href = x.getAttribute('href');
      if (href && href.startsWith('#')){ e.preventDefault(); setTimeout(() => { const el = $(href); if (!el) return; if (state.lenis) state.lenis.scrollTo(el); else el.scrollIntoView({ behavior:reduce ? 'auto' : 'smooth' }); }, reduce ? 0 : 720); }
    }
  });
  document.addEventListener('keydown', e => {
    if (!open) return;
    const i = Math.round(target);
    if (e.key === 'Escape') hide();
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); go(i + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); go(i - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(last); }
    else if (e.key === 'Tab'){
      // keep focus inside the dialog
      const f = $$('button,a[href],[tabindex="0"]', box).filter(el => !el.closest('[inert]') && el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], end = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !box.contains(document.activeElement))){ e.preventDefault(); end.focus(); }
      else if (!e.shiftKey && document.activeElement === end){ e.preventDefault(); first.focus(); }
    }
  });
  addEventListener('resize', () => { if (open) render(); });
}

export { initAboutScroll };
