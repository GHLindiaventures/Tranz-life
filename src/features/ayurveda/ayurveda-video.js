// Scroll-driven botanical video transformation & living Ayurveda wisdom frame (Page 3)
import { $ } from '../../utils/dom.js';
import { clamp, lerp } from '../../utils/math.js';
import { reduce } from '../../utils/media.js';

const TOTAL_FRAMES = 201; // frames 0 to 200
const TRANS_END_FRAME = 112; // frame where rectangular border finishes forming
const LIVING_START_FRAME = 113; // first frame of living breeze sequence
const LIVING_END_FRAME = 200; // last frame of living breeze sequence
const TRANS_SCROLL_THRESHOLD = 0.65; // scroll progress where transformation completes

function initAyurveda() {
  const root = $('#ayurSeq');
  const pin = $('#ayurPin');
  const canvas = $('#ayurCanvas');
  const power = $('#ayurPower');
  const content = $('#ayurContent');
  const hint = $('#ayurHint');

  if (!root || !canvas) return null;

  const ctx = canvas.getContext('2d', { alpha: false });
  const frames = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let lastDrawnIndex = -1;

  // Frames are fetched as compressed Blobs and decoded with createImageBitmap(blob), which runs off the
  // main thread. A small rolling window of decoded, GPU-ready bitmaps is kept around the frame on screen.
  // Before: all 201 frames (~740 MB decoded) were held as <img> elements; the browser kept discarding the
  // decoded pixels and drawImage re-decoded synchronously on the main thread (40-70 ms stalls per frame).
  // (createImageBitmap(<img>) is no better: Chrome decodes that on the main thread too, hence Blobs.)
  const useBitmaps = typeof createImageBitmap === 'function' && typeof fetch === 'function';
  const loaded = i => frames[i] !== undefined; // frames[i]: Blob (bitmap mode) or <img> (fallback)
  const bitmaps = new Map(); // index -> ImageBitmap
  const decoding = new Set();
  const AHEAD = 16, BEHIND = 6, KEEP = 26;
  let travel = 1; // +1 while frames advance, -1 while they rewind
  let wanted = 0;

  function warmWindow(center) {
    if (!useBitmaps) return;
    for (let k = -BEHIND; k <= AHEAD; k++) {
      const i = center + k * travel;
      if (i < 0 || i >= TOTAL_FRAMES || bitmaps.has(i) || decoding.has(i) || !loaded(i)) continue;
      if (decoding.size >= 4) break;
      decoding.add(i);
      createImageBitmap(frames[i]).then(bmp => {
        decoding.delete(i);
        if (Math.abs(i - wanted) > KEEP) { if (bmp.close) bmp.close(); return; }
        bitmaps.set(i, bmp);
        drawFrame(wanted); // shows it if it is the frame (or nearer to the frame) we want; no-op otherwise
        warmWindow(wanted); // keep the decode queue full
      }, () => decoding.delete(i));
    }
    // release decoded frames that have fallen well outside the window
    for (const [i, bmp] of bitmaps) if (Math.abs(i - center) > KEEP) { if (bmp.close) bmp.close(); bitmaps.delete(i); }
  }

  // Render a specific frame to canvas (skips redundant redraws if already displaying target frame).
  // If the exact frame is not ready yet, draw the nearest one that is, so the motion never freezes.
  function drawFrame(index) {
    const want = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(index)));
    if (want !== wanted) { travel = want > wanted ? 1 : -1; wanted = want; }
    const has = useBitmaps ? (i => bitmaps.has(i)) : (i => loaded(i) && frames[i].naturalWidth > 0);
    if (useBitmaps) warmWindow(want);
    let idx = -1;
    for (let d = 0; d < TOTAL_FRAMES && idx < 0; d++) {
      if (want - d >= 0 && has(want - d)) idx = want - d;
      else if (want + d < TOTAL_FRAMES && has(want + d)) idx = want + d;
    }
    if (idx < 0) return false;
    if (idx === lastDrawnIndex) return idx === want;
    ctx.drawImage(useBitmaps ? bitmaps.get(idx) : frames[idx], 0, 0, canvas.width, canvas.height);
    lastDrawnIndex = idx;
    return idx === want;
  }

  // Frame loading (~17 MB in total). It used to start on page load and competed with the hero for
  // bandwidth. Now it starts only when the section is ~2 screens away and loads coarse-to-fine
  // (every 16th frame first, then the gaps) with limited concurrency.
  const frameUrl = i => `./frames/ayurveda/frame_${String(i).padStart(3, '0')}.webp`;
  const order = [];
  {
    const seen = new Set();
    for (const step of [16, 8, 4, 2, 1]) {
      for (let i = 0; i < TOTAL_FRAMES; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    }
    if (!seen.has(TOTAL_FRAMES - 1)) order.push(TOTAL_FRAMES - 1);
  }
  let started = false;
  function loadFrames() {
    if (started) return;
    started = true;
    let next = 0;
    const arrived = i => {
      loadedCount++;
      if (useBitmaps) { if (lastDrawnIndex < 0 || Math.abs(i - wanted) <= AHEAD) warmWindow(wanted); }
      else if (lastDrawnIndex < 0 || Math.abs(i - wanted) <= 2) drawFrame(wanted);
    };
    const pump = () => {
      if (next >= order.length) return;
      const i = order[next++];
      if (useBitmaps) {
        fetch(frameUrl(i))
          .then(r => (r.ok ? r.blob() : null))
          .then(blob => { if (blob) { frames[i] = blob; arrived(i); } }, () => {})
          .finally(pump);
      } else {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => { frames[i] = img; arrived(i); pump(); };
        img.onerror = pump;
        img.src = frameUrl(i);
      }
    };
    for (let k = 0; k < 6; k++) pump();
  }
  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { loadFrames(); near.disconnect(); }
    }, { rootMargin: '200% 0px' });
    near.observe(root);
  } else {
    loadFrames();
  }

  // style writes only when a value actually changes (each write would restyle the pinned frame every frame)
  const styleCache = new WeakMap();
  const setStyle = (el, prop, value) => {
    let c = styleCache.get(el); if (!c) { c = {}; styleCache.set(el, c); }
    if (c[prop] === value) return;
    c[prop] = value;
    el.style[prop] = value;
  };

  // Scroll tracking state
  let curP = 0;
  let targetP = 0;
  let lastTime = performance.now();
  let livingIdx = LIVING_START_FRAME;
  let livingDir = 1;
  let lastLivingStep = performance.now();

  let isVisible = false;
  let rafId = null;

  function tick(now) {
    if (!isVisible) {
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(tick);

    const rect = root.getBoundingClientRect();
    const vh = window.innerHeight;

    // Fast bounds check
    if (rect.bottom < 0 || rect.top > vh) {
      lastTime = now;
      return;
    }

    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    // Calculate normalized scroll target for ayurSeq (0 to 1)
    const travel = Math.max(1, rect.height - vh);
    targetP = clamp(-rect.top / travel, 0, 1);

    // Smooth scroll interpolation
    const easeRate = reduce ? 60 : 12;
    curP += (targetP - curP) * (1 - Math.exp(-dt * easeRate));
    if (Math.abs(targetP - curP) < 1e-4) curP = targetP;

    // --------------------------------------------------------------------------
    // Left-Side Text Overlay: "Power of NATURE in Every Products"
    // Starts at 100% opacity from the very beginning (curP = 0)
    // Gradually fades out to 0% as user scrolls down (curP: 0.0 -> 0.32)
    // --------------------------------------------------------------------------
    if (power) {
      const isMobile = window.innerWidth <= 860;
      const fadeThreshold = 0.32;
      const alpha = clamp(1 - (curP / fadeThreshold), 0, 1);
      const shift = (1 - alpha) * (isMobile ? -24 : -36);

      setStyle(power, 'opacity', alpha.toFixed(3));
      if (isMobile) {
        setStyle(power, 'transform', `translate(-50%, -50%) translateY(${shift.toFixed(1)}px)`);
      } else {
        setStyle(power, 'transform', `translateY(-50%) translateX(${shift.toFixed(1)}px)`);
      }
      setStyle(power, 'pointerEvents', alpha > 0.05 ? 'auto' : 'none');
      const hiddenNow = String(alpha < 0.05);
      if (power.getAttribute('aria-hidden') !== hiddenNow) power.setAttribute('aria-hidden', hiddenNow);
    }

    // Phase 1: Meditating Woman -> Rectangular Tree-Root Border (Scroll-Controlled)
    if (curP < TRANS_SCROLL_THRESHOLD) {
      const transProgress = curP / TRANS_SCROLL_THRESHOLD;
      const targetFrame = Math.round(transProgress * TRANS_END_FRAME);
      drawFrame(targetFrame);

      // Hide text, reveal hint
      if (content.classList.contains('is-visible')) {
        content.classList.remove('is-visible');
      }
      if (hint) {
        setStyle(hint, 'opacity', Math.max(0, 1 - curP * 4).toFixed(3));
      }
    } else {
      // Phase 2: Frame completed! Reveal Ayurveda quote & play continuous living breeze animation
      if (!content.classList.contains('is-visible')) {
        content.classList.add('is-visible');
      }
      if (hint) {
        setStyle(hint, 'opacity', '0');
      }

      // Living natural movement: ping-pong between frame 113 and 200 (~20fps)
      if (now - lastLivingStep >= 48) {
        lastLivingStep = now;
        livingIdx += livingDir;
        if (livingIdx >= LIVING_END_FRAME) {
          livingIdx = LIVING_END_FRAME;
          livingDir = -1;
        } else if (livingIdx <= LIVING_START_FRAME) {
          livingIdx = LIVING_START_FRAME;
          livingDir = 1;
        }
      }
      drawFrame(livingIdx);
    }

    // Smooth exit transition towards the product story (seq) at the end of ayurSeq
    if (curP > 0.92) {
      const exitProgress = clamp((curP - 0.92) / 0.08, 0, 1);
      setStyle(pin, 'opacity', (1 - exitProgress * 0.92).toFixed(3));
      setStyle(pin, 'transform', `translateY(${(-exitProgress * 30).toFixed(1)}px)`);
    } else {
      setStyle(pin, 'opacity', '1');
      setStyle(pin, 'transform', 'none');
    }
  }

  // IntersectionObserver to pause tick RAF when out of view
  const observer = new IntersectionObserver(
    entries => {
      const entry = entries[0];
      isVisible = entry.isIntersecting;
      if (isVisible) {
        lastTime = performance.now();
        if (!rafId) rafId = requestAnimationFrame(tick);
      }
    },
    { rootMargin: '150px 0px' }
  );

  observer.observe(root);

  return {
    redraw: () => drawFrame(lastDrawnIndex >= 0 ? lastDrawnIndex : 0),
    destroy: () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    }
  };
}

export { initAyurveda };

