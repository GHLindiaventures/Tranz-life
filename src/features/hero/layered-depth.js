// MotionSites Layered Depth: Bird video state machine + multi-plane scroll & mouse parallax.
import { $ } from '../../utils/dom.js';
import { BIRD_WALK, BIRD_WALK_FPS } from './bird-walk.js';

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

    // the stone and its moss-covered twin (stacked on it) move together
    stage.querySelectorAll('.hero__slab').forEach(el => el.style.setProperty('--slab-y', slabY));
    const birdsEl = $('#birds');
    if (birdsEl) {
      birdsEl.style.setProperty('--slab-y', slabY);
      birdsEl.style.setProperty('--brand-y', brandY); // the bird perches on the headline, so it shares its scroll offset
    }
    if (panels && window.innerWidth >= 768) {
      panels.style.setProperty('--panel-offset', `${Math.max(-80, -y * 0.35).toFixed(1)}px`);
    }
    if (brand) {
      brand.style.setProperty('--brand-y', brandY);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // videos cost decode time every frame: pause them while the hero is off screen
  if ('IntersectionObserver' in window) {
    const vids = [bg, ...stage.querySelectorAll('.birds video')].filter(Boolean);
    new IntersectionObserver(([entry]) => {
      vids.forEach(v => {
        if (!entry.isIntersecting) { if (!v.paused) { v.dataset.wasPlaying = '1'; v.pause(); } }
        else if (v.dataset.wasPlaying === '1' && v.style.display !== 'none') { delete v.dataset.wasPlaying; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      });
    }, { threshold: 0 }).observe(stage);
  }
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

  // 4. Perch the bird on the first letter of "SCIENCE" in the headline.
  // The bird videos are full-frame (3840x2160, object-fit: cover) with the bird's feet at FEET;
  // we measure the S on screen and shift the bird layer (--bird-dx / --bird-dy) so the feet land on its top.
  const birdsEl = $('#birds');
  const title = $('.hero__title');
  const FEET = { x: 2328 / 3840, y: 1082 / 2160 };
  const translation = el => { const m = getComputedStyle(el).transform; if (!m || m === 'none') return [0, 0]; const v = new DOMMatrixReadOnly(m); return [v.m41, v.m42]; };
  const capTop = (el) => {
    // distance from the top of the text's content box to the top of a capital letter, from the font metrics
    const cs = getComputedStyle(el), ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = ctx.measureText('S');
    return (m.fontBoundingBoxAscent || parseFloat(cs.fontSize) * .95) - (m.actualBoundingBoxAscent || parseFloat(cs.fontSize) * .72);
  };
  const placeBird = () => {
    if (!birdsEl || !title) return;
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    let node, at = -1;
    while ((node = walker.nextNode())) { at = node.textContent.toLowerCase().indexOf('science'); if (at >= 0) break; }
    if (!node || at < 0) return;
    const range = document.createRange(); range.setStart(node, at); range.setEnd(node, at + 1);
    const s = range.getBoundingClientRect(), st = stage.getBoundingClientRect();
    if (!s.width) return;
    // where the S sits with the headline at rest (undo the parallax / intro offsets on the brand and title)
    const [bx, by] = translation(brand), [tx, ty] = translation(title);
    const target = { x: s.left - st.left - bx - tx + s.width * .5, y: s.top - st.top - by - ty + capTop(title) };
    // where the feet are in the bird layer before its own transform
    const W = birdsEl.offsetWidth, H = birdsEl.offsetHeight, sc = Math.max(W / 3840, H / 2160);
    const fx = (W - 3840 * sc) / 2 + FEET.x * 3840 * sc, fy = (H - 2160 * sc) / 2 + FEET.y * 2160 * sc;
    const [ox, oy] = getComputedStyle(birdsEl).transformOrigin.split(' ').map(parseFloat);
    const k = parseFloat(getComputedStyle(stage).getPropertyValue('--bird-k')) || 0.74;
    stage.style.setProperty('--bird-dx', (target.x - (ox + k * (fx - ox))).toFixed(1) + 'px');
    stage.style.setProperty('--bird-dy', (target.y - (oy + k * (fy - oy))).toFixed(1) + 'px');
  };
  // 5. Keep the feet planted: in the idle clips the bird shuffles sideways a little. Shift each idle
  // clip by the opposite of that drift, frame by frame, so the bird moves but its feet stay on the S.
  const pinFeet = (video, table) => {
    if (!video || !table) return;
    const apply = t => {
      const p = table[Math.min(table.length - 1, Math.max(0, Math.round(t*BIRD_WALK_FPS)))];
      const W = birdsEl.offsetWidth, H = birdsEl.offsetHeight, sc = Math.max(W/1920, H/1080);
      video.style.transform = `translate3d(${(-p[0]*sc).toFixed(1)}px, ${(-p[1]*sc).toFixed(1)}px, 0)`;
    };
    if ('requestVideoFrameCallback' in video) {
      const onFrame = (now, meta) => { apply(meta.mediaTime); video.requestVideoFrameCallback(onFrame); };
      video.requestVideoFrameCallback(onFrame);
    } else {
      const loop = () => { if (!video.paused) apply(video.currentTime); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
    video.addEventListener('seeked', () => apply(video.currentTime));
  };
  pinFeet($('#bird-idle1'), BIRD_WALK.idle1);
  pinFeet($('#bird-idle2'), BIRD_WALK.idle2);

  placeBird();
  window.addEventListener('resize', placeBird);
  // re-measure whenever the headline itself changes size (late font load, wrapping)
  if (title && 'ResizeObserver' in window) new ResizeObserver(() => placeBird()).observe(title);
  window.addEventListener('load', placeBird);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeBird);
  [600, 2500, 4500].forEach(t => setTimeout(placeBird, t));

  return {
    start() {
      setTimeout(placeBird, 50);
      if (enter && birdState === 'hidden') setBirdState('enter');
    }
  };
}

export { initLayeredDepth };
