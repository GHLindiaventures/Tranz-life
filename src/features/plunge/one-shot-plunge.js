// TranzLife Biosciences - "The One-Shot Plunge" Cinematic Scrollytelling Engine
// Continuous one-shot camera plunge: Soil/Roots -> Dewdrop/DNA -> Altar/Formulations
import { $ } from '../../utils/dom.js';

export function initOneShotPlunge() {
  const cinema = $('#home');
  if (!cinema) return null;

  const stage = cinema.querySelector('.plunge-stage');
  const act1 = cinema.querySelector('.plunge-act-1');
  const act2 = cinema.querySelector('.plunge-act-2');
  const act3 = cinema.querySelector('.plunge-act-3');
  const portal = cinema.querySelector('.plunge-portal');
  const copy1 = cinema.querySelector('.plunge-copy-1');
  const copy2 = cinema.querySelector('.plunge-copy-2');
  const copy3 = cinema.querySelector('.plunge-copy-3');
  const timelineSteps = cinema.querySelectorAll('.plunge-timeline-step');
  const timelineFills = cinema.querySelectorAll('.step-fill');
  const audioBtn = $('#plungeAudioBtn');
  const audioState = $('#audioState');
  const dnaCanvas = $('#plungeDnaCanvas');

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --------------------------------------------------------------------------
  // 1. PARTICLES ENGINE (Act II Golden DNA Motes)
  // --------------------------------------------------------------------------
  let ctx = null;
  let particles = [];
  if (dnaCanvas && !prefersReduced) {
    ctx = dnaCanvas.getContext('2d');
    function resizeCanvas() {
      if (!dnaCanvas) return;
      dnaCanvas.width = window.innerWidth;
      dnaCanvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    const count = 35;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 1.2 + Math.random() * 2.8,
        vy: -0.4 - Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.4,
        alpha: 0.2 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function drawParticles(act2Visible) {
    if (!ctx || !dnaCanvas || !act2Visible || prefersReduced) return;
    ctx.clearRect(0, 0, dnaCanvas.width, dnaCanvas.height);
    const w = dnaCanvas.width;
    const h = dnaCanvas.height;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y += p.vy;
      p.x += p.vx + Math.sin(p.phase) * 0.3;
      p.phase += 0.02;

      if (p.y < -10) p.y = h + 10;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
      grad.addColorStop(0, `rgba(255, 248, 200, ${p.alpha})`);
      grad.addColorStop(0.5, `rgba(227, 162, 26, ${p.alpha * 0.7})`);
      grad.addColorStop(1, 'rgba(227, 162, 26, 0)');

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  // --------------------------------------------------------------------------
  // 2. AMBIENT SOUNDSCAPE ENGINE (Pure Web Audio API Synthesizer)
  // --------------------------------------------------------------------------
  let audioCtx = null;
  let masterGain = null;
  let subOsc = null;
  let padOsc1 = null;
  let padOsc2 = null;
  let filter = null;
  let isAudioPlaying = false;

  function initAudio() {
    if (audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioCtx = new AudioContext();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);

    // Warm Sub-Bass drone (45Hz)
    subOsc = audioCtx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(45, audioCtx.currentTime);
    const subGain = audioCtx.createGain();
    subGain.gain.setValueAtTime(0.35, audioCtx.currentTime);
    subOsc.connect(subGain);
    subGain.connect(masterGain);

    // Ethereal Resonant Pad (432Hz fundamental + warm fifth)
    filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, audioCtx.currentTime);
    filter.Q.setValueAtTime(3, audioCtx.currentTime);

    padOsc1 = audioCtx.createOscillator();
    padOsc1.type = 'triangle';
    padOsc1.frequency.setValueAtTime(216, audioCtx.currentTime);

    padOsc2 = audioCtx.createOscillator();
    padOsc2.type = 'sine';
    padOsc2.frequency.setValueAtTime(324, audioCtx.currentTime);

    const padGain = audioCtx.createGain();
    padGain.gain.setValueAtTime(0.18, audioCtx.currentTime);

    padOsc1.connect(filter);
    padOsc2.connect(filter);
    filter.connect(padGain);
    padGain.connect(masterGain);

    masterGain.connect(audioCtx.destination);

    subOsc.start();
    padOsc1.start();
    padOsc2.start();
  }

  function toggleAudio() {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    isAudioPlaying = !isAudioPlaying;
    if (audioBtn) audioBtn.classList.toggle('is-active', isAudioPlaying);
    if (audioState) audioState.textContent = isAudioPlaying ? 'On' : 'Off';

    const t = audioCtx.currentTime;
    if (isAudioPlaying) {
      masterGain.gain.cancelScheduledValues(t);
      masterGain.gain.setValueAtTime(masterGain.gain.value, t);
      masterGain.gain.exponentialRampToValueAtTime(0.45, t + 1.2);
    } else {
      masterGain.gain.cancelScheduledValues(t);
      masterGain.gain.setValueAtTime(masterGain.gain.value, t);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    }
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', toggleAudio);
  }

  function updateAudioFilter(p) {
    if (!isAudioPlaying || !filter || !audioCtx) return;
    const t = audioCtx.currentTime;
    // Cellular dive opens up the resonant filter cutoff
    let targetFreq = 280;
    if (p > 0.3 && p < 0.7) {
      targetFreq = 580 + (p - 0.3) * 400; // Liquid shimmer
    } else if (p >= 0.7) {
      targetFreq = 420; // Altar calm
    }
    filter.frequency.setTargetAtTime(targetFreq, t, 0.2);
  }

  // --------------------------------------------------------------------------
  // 3. CAMERA INTERPOLATION & PROGRESS ENGINE
  // --------------------------------------------------------------------------
  let targetProgress = 0;
  let currentProgress = 0;
  let isTicking = false;

  function calculateTargetProgress() {
    const rect = cinema.getBoundingClientRect();
    const scrollDist = cinema.offsetHeight - window.innerHeight;
    if (scrollDist <= 0) return 0;
    const rawProgress = -rect.top / scrollDist;
    return Math.max(0, Math.min(1, rawProgress));
  }

  function renderFrame() {
    // Lerp damping for cinematic momentum
    currentProgress += (targetProgress - currentProgress) * 0.085;
    const p = currentProgress;

    // A. ACT I: THE PRIMORDIAL ROOTS (0.00 -> 0.38)
    // Camera pushes smoothly into the banyan roots toward the bottom dewdrop
    if (act1) {
      const zoom1 = 1 + p * 0.95;
      const transY1 = -p * 60;
      act1.style.transform = `scale(${zoom1.toFixed(4)}) translate3d(0, ${transY1.toFixed(2)}px, 0)`;

      // Fade out Act I as Act II portal expands
      const act1Alpha = p < 0.28 ? 1 : Math.max(0, 1 - (p - 0.28) / 0.12);
      act1.style.opacity = act1Alpha.toFixed(3);
    }

    if (copy1) {
      const c1Alpha = p < 0.20 ? 1 : Math.max(0, 1 - (p - 0.20) / 0.10);
      const c1Y = p * -40;
      copy1.style.opacity = c1Alpha.toFixed(3);
      copy1.style.transform = `translate3d(0, ${c1Y.toFixed(2)}px, 0)`;
      copy1.style.pointerEvents = c1Alpha > 0.2 ? 'auto' : 'none';
    }

    // B. ACT II: THE CELLULAR DIVE (0.28 -> 0.72)
    // Portal expands from dewdrop (located around 50% X, 68% Y on Act I leaf)
    if (portal && act2) {
      let portalRadius = 0;
      let act2Alpha = 0;

      if (p >= 0.26 && p <= 0.76) {
        act2Alpha = p < 0.36 ? (p - 0.26) / 0.10 : (p > 0.66 ? Math.max(0, 1 - (p - 0.66) / 0.08) : 1);
        // Dewdrop portal expansion
        if (p < 0.44) {
          const tPort = (p - 0.26) / 0.18; // 0 to 1
          portalRadius = Math.pow(tPort, 2.2) * 140; // 0% to 140%
        } else {
          portalRadius = 150; // completely open
        }
      }

      act2.style.opacity = act2Alpha.toFixed(3);
      portal.style.clipPath = `circle(${portalRadius.toFixed(1)}% at 50% 68%)`;

      // Slow 3D spiral into the DNA helix
      const zoom2 = 1.25 - (p - 0.32) * 0.35;
      const rot2 = (p - 0.32) * -3.5;
      act2.style.transform = `scale(${Math.max(1, zoom2).toFixed(4)}) rotate(${rot2.toFixed(3)}deg)`;
    }

    if (copy2) {
      let c2Alpha = 0;
      if (p >= 0.34 && p <= 0.64) {
        c2Alpha = p < 0.42 ? (p - 0.34) / 0.08 : (p > 0.56 ? Math.max(0, 1 - (p - 0.56) / 0.08) : 1);
      }
      const c2Y = (0.50 - p) * 30;
      copy2.style.opacity = c2Alpha.toFixed(3);
      copy2.style.transform = `translate3d(0, ${c2Y.toFixed(2)}px, 0)`;
      copy2.style.pointerEvents = c2Alpha > 0.2 ? 'auto' : 'none';
    }

    // Draw DNA motes while Act II is active
    drawParticles(p >= 0.28 && p <= 0.72);

    // C. ACT III: THE PRODUCT SANCTUARY (0.64 -> 1.00)
    // Camera pulls back to reveal the dark obsidian altar with golden rim light
    if (act3) {
      const act3Alpha = p < 0.64 ? 0 : Math.min(1, (p - 0.64) / 0.12);
      const zoom3 = 1.15 - (p - 0.64) * 0.15;
      const transY3 = (1 - p) * 45;
      act3.style.opacity = act3Alpha.toFixed(3);
      act3.style.transform = `scale(${Math.max(1, zoom3).toFixed(4)}) translate3d(0, ${transY3.toFixed(2)}px, 0)`;
    }

    if (copy3) {
      const c3Alpha = p < 0.68 ? 0 : Math.min(1, (p - 0.68) / 0.12);
      const c3Y = (1 - p) * 35;
      copy3.style.opacity = c3Alpha.toFixed(3);
      copy3.style.transform = `translate3d(0, ${c3Y.toFixed(2)}px, 0)`;
      copy3.style.pointerEvents = c3Alpha > 0.2 ? 'auto' : 'none';
    }

    // D. TIMELINE SCRUBBER HUD SYNC
    let activeIndex = 0;
    if (p >= 0.33 && p < 0.66) activeIndex = 1;
    else if (p >= 0.66) activeIndex = 2;

    timelineSteps.forEach((step, idx) => {
      step.classList.toggle('is-active', idx === activeIndex);
    });

    if (timelineFills && timelineFills.length >= 2) {
      // Step 0 -> 1 line fill
      const line1 = Math.max(0, Math.min(1, (p - 0.05) / 0.35));
      timelineFills[0].style.transform = `scaleX(${line1.toFixed(3)})`;
      // Step 1 -> 2 line fill
      const line2 = Math.max(0, Math.min(1, (p - 0.40) / 0.35));
      timelineFills[1].style.transform = `scaleX(${line2.toFixed(3)})`;
    }

    // Dynamic Soundscape modulation
    updateAudioFilter(p);

    // Continue loop if target not yet reached
    if (Math.abs(targetProgress - currentProgress) > 0.0008) {
      requestAnimationFrame(renderFrame);
    } else {
      isTicking = false;
    }
  }

  function onScroll() {
    targetProgress = calculateTargetProgress();
    if (!isTicking && !prefersReduced) {
      isTicking = true;
      requestAnimationFrame(renderFrame);
    } else if (prefersReduced) {
      currentProgress = targetProgress;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --------------------------------------------------------------------------
  // 4. TIMELINE SCRUBBER CLICK CONTROLLER
  // --------------------------------------------------------------------------
  timelineSteps.forEach((btn) => {
    btn.addEventListener('click', () => {
      const stepIdx = parseInt(btn.getAttribute('data-step') || '0', 10);
      const scrollDist = cinema.offsetHeight - window.innerHeight;
      const targets = [0.05, 0.48, 0.88];
      const targetY = cinema.offsetTop + scrollDist * (targets[stepIdx] || 0);

      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    });
  });

  // --------------------------------------------------------------------------
  // 5. INTERACTIVE PRODUCT HOTSPOTS ON ALTAR (Act III)
  // --------------------------------------------------------------------------
  const hotspots = cinema.querySelectorAll('.plunge-spot');
  const previewCard = cinema.querySelector('#plungePreviewCard');

  hotspots.forEach(spot => {
    spot.addEventListener('mouseenter', () => {
      if (!previewCard) return;
      const title = spot.getAttribute('data-name');
      const active = spot.getAttribute('data-active');
      const bio = spot.getAttribute('data-bio');
      const href = spot.getAttribute('data-link');

      const titleEl = previewCard.querySelector('.pp-title');
      const activeEl = previewCard.querySelector('.pp-active');
      const bioEl = previewCard.querySelector('.pp-bio');
      const linkEl = previewCard.querySelector('.pp-link');

      if (titleEl) titleEl.textContent = title;
      if (activeEl) activeEl.textContent = active;
      if (bioEl) bioEl.textContent = bio;
      if (linkEl) linkEl.setAttribute('href', href);

      previewCard.classList.add('is-open');
    });

    spot.addEventListener('mouseleave', () => {
      if (!previewCard) return;
      previewCard.classList.remove('is-open');
    });
  });

  return {
    destroy() {
      window.removeEventListener('scroll', onScroll);
      if (audioCtx) {
        try { audioCtx.close(); } catch (e) {}
      }
    }
  };
}
