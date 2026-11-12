// Frame scheduling for the products page loops (journey.js, statement-page.js).
// Lenis moves the page from GSAP's ticker (window.scrollTo). If a loop runs on its own requestAnimationFrame first
// and writes styles, that scrollTo has to apply them before it can scroll: a forced style + layout every frame.
// Running the loops from the same ticker, added after Lenis, keeps the order right: the page scrolls first, then
// the loops write, then the browser renders once. Without Lenis (reduced motion) it is plain requestAnimationFrame.
// Returns schedule(fn): runs fn(now) once on the next frame; returns a truthy id.
import { gsap, hasGsap } from '../lib/gsap.js';
import { state } from '../app/state.js';

function makeScheduler() {
  let pending = null, added = false;
  const tick = () => { const fn = pending; if (!fn) return; pending = null; fn(performance.now()); };
  return function schedule(fn) {
    if (hasGsap && gsap && gsap.ticker && state.lenis) {
      if (!added) { gsap.ticker.add(tick); added = true; }
      pending = fn;
      return 1;
    }
    return requestAnimationFrame(fn);
  };
}

export { makeScheduler };
