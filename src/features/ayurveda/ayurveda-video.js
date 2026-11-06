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

  // Render a specific frame to canvas
  function drawFrame(index) {
    const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(index)));
    const img = frames[idx];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      lastDrawnIndex = idx;
      return true;
    }
    // If target frame not loaded yet, fallback to last drawn or frame 0
    if (lastDrawnIndex >= 0 && frames[lastDrawnIndex]?.complete) {
      return false;
    }
    if (frames[0]?.complete && frames[0].naturalWidth > 0) {
      ctx.drawImage(frames[0], 0, 0, canvas.width, canvas.height);
      lastDrawnIndex = 0;
    }
    return false;
  }

  // Preload frame 0 immediately for instant zero-latency display
  const frame0 = new Image();
  frame0.src = './frames/ayurveda/frame_000.webp';
  frame0.onload = () => {
    frames[0] = frame0;
    loadedCount++;
    drawFrame(0);
  };
  frames[0] = frame0;

  // Asynchronously preload all remaining frames
  function preloadRemaining() {
    for (let i = 1; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const pad = String(i).padStart(3, '0');
      img.src = `./frames/ayurveda/frame_${pad}.webp`;
      img.onload = () => {
        frames[i] = img;
        loadedCount++;
      };
      frames[i] = img;
    }
  }

  // Defer preloading rest until initial idle/paint
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(preloadRemaining, { timeout: 1200 });
  } else {
    setTimeout(preloadRemaining, 100);
  }

  // Scroll tracking state
  let curP = 0;
  let targetP = 0;
  let lastTime = performance.now();
  let livingIdx = LIVING_START_FRAME;
  let livingDir = 1;
  let lastLivingStep = performance.now();

  function tick(now) {
    requestAnimationFrame(tick);

    const rect = root.getBoundingClientRect();
    const vh = window.innerHeight;

    // Sleep when completely out of viewport
    if (rect.bottom < -vh * 0.2 || rect.top > vh * 1.2) {
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

      power.style.opacity = alpha.toFixed(3);
      if (isMobile) {
        power.style.transform = `translate(-50%, -50%) translateY(${shift.toFixed(1)}px)`;
      } else {
        power.style.transform = `translateY(-50%) translateX(${shift.toFixed(1)}px)`;
      }
      power.style.pointerEvents = alpha > 0.05 ? 'auto' : 'none';
      power.setAttribute('aria-hidden', alpha < 0.05);
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
        hint.style.opacity = Math.max(0, 1 - curP * 4).toFixed(3);
      }
    } else {
      // Phase 2: Frame completed! Reveal Ayurveda quote & play continuous living breeze animation
      if (!content.classList.contains('is-visible')) {
        content.classList.add('is-visible');
      }
      if (hint) {
        hint.style.opacity = '0';
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
      pin.style.opacity = (1 - exitProgress * 0.92).toFixed(3);
      pin.style.transform = `translateY(${(-exitProgress * 30).toFixed(1)}px)`;
    } else {
      pin.style.opacity = '1';
      pin.style.transform = 'none';
    }
  }

  requestAnimationFrame(tick);

  return {
    redraw: () => drawFrame(lastDrawnIndex >= 0 ? lastDrawnIndex : 0)
  };
}

export { initAyurveda };

