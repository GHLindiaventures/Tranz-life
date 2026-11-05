// MotionSites Layered Depth: Bird video state machine + multi-plane scroll & mouse parallax.
import { $ } from '../../utils/dom.js';

function initLayeredDepth() {
  const stage = $('#home');
  const slab = $('#slab');
  const brand = $('.hero__brand');
  const panels = $('#panels');
  const bg = $('.hero__bg');
  if (!stage) return null;

  // 1. Bird animation state machine (enter -> idle1 <-> idle2; leave on scroll)
  const enter = $('#bird-enter');
  const idle1 = $('#bird-idle1');
  const idle2 = $('#bird-idle2');
  const leave = $('#bird-leave');
  const birds = [enter, idle1, idle2, leave].filter(Boolean);

  let birdState = 'hidden';
  const showBird = (el) => {
    birds.forEach(v => {
      v.style.display = (v === el) ? 'block' : 'none';
    });
  };

  const playBird = (el) => {
    if (!el) return;
    try {
      el.currentTime = 0;
      if (el.readyState >= 2) {
        const p = el.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        const onCanPlay = () => {
          el.removeEventListener('canplay', onCanPlay);
          const p = el.play();
          if (p && p.catch) p.catch(() => {});
        };
        el.addEventListener('canplay', onCanPlay);
      }
    } catch (e) {}
  };

  const setBirdState = (next) => {
    birdState = next;
    if (next === 'hidden') {
      showBird(null);
      return;
    }
    const map = { enter, idle1, idle2, leave };
    const target = map[next];
    if (target) {
      showBird(target);
      playBird(target);
    }
  };

  if (enter && idle1 && idle2 && leave) {
    birds.forEach(v => { try { v.load(); } catch (e) {} });
    enter.addEventListener('ended', () => { if (birdState === 'enter') setBirdState('idle1'); });
    idle1.addEventListener('ended', () => { if (birdState === 'idle1') setBirdState('idle2'); });
    idle2.addEventListener('ended', () => { if (birdState === 'idle2') setBirdState('idle1'); });

    // Start bird sequence
    setTimeout(() => setBirdState('enter'), 400);

    // Scroll trigger for bird taking flight / returning
    const SCROLL_THRESHOLD = 15;
    window.addEventListener('scroll', () => {
      const y = window.scrollY || window.pageYOffset;
      if (y > SCROLL_THRESHOLD) {
        if (birdState !== 'leave' && birdState !== 'hidden') {
          [enter, idle1, idle2].forEach(v => { try { v.pause(); v.currentTime = 0; } catch (e) {} });
          setBirdState('leave');
        }
      } else {
        if (birdState === 'leave') {
          try { leave.pause(); leave.currentTime = 0; } catch (e) {}
          setBirdState('enter');
        }
      }
    }, { passive: true });
  }

  // 2. Multi-plane scroll parallax
  const onScroll = () => {
    const y = window.scrollY || window.pageYOffset;
    const slabY = `${(-y * 0.28).toFixed(1)}px`;
    const brandY = `${(y * 0.15).toFixed(1)}px`;

    if (slab) {
      slab.style.setProperty('--slab-y', slabY);
    }
    const birdsEl = $('#birds');
    if (birdsEl) {
      birdsEl.style.setProperty('--slab-y', slabY);
    }
    if (panels && window.innerWidth >= 768) {
      panels.style.setProperty('--panel-offset', `${Math.max(-80, -y * 0.35).toFixed(1)}px`);
    }
    if (brand) {
      brand.style.setProperty('--brand-y', brandY);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 3. Pointer-driven depth parallax (lerped, fine pointer only)
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (canHover && !reduceMotion) {
    let tx = 0, ty = 0, cx = 0, cy = 0, rafId = 0;

    const renderParallax = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;

      stage.style.setProperty('--mx', cx.toFixed(4));
      stage.style.setProperty('--my', cy.toFixed(4));

      if (Math.abs(tx - cx) > 0.0005 || Math.abs(ty - cy) > 0.0005) {
        rafId = requestAnimationFrame(renderParallax);
      } else {
        rafId = 0;
      }
    };

    window.addEventListener('pointermove', (e) => {
      tx = (e.clientX / window.innerWidth) - 0.5;
      ty = (e.clientY / window.innerHeight) - 0.5;
      if (!rafId) rafId = requestAnimationFrame(renderParallax);
    }, { passive: true });
  }

  return {
    start() {
      if (enter && birdState === 'hidden') setBirdState('enter');
    }
  };
}

export { initLayeredDepth };
