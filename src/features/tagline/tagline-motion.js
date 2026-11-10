// Subtle nature & science background motion canvas for the TranzLife Tagline Section
import { $ } from '../../utils/dom.js';
import { reduce } from '../../utils/media.js';

function initTaglineMotion() {
  const canvas = $('#inMotionCanvas');
  const section = $('#insider');
  if (!canvas || !section || reduce) return null;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return null;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let isVisible = false;
  let rafId = null;

  // Particle motes (botanical spores & science bio-sparks)
  const PARTICLE_COUNT = 24;
  const particles = [];

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * (width || window.innerWidth),
        y: Math.random() * (height || window.innerHeight),
        radius: 1.2 + Math.random() * 2.2,
        speedY: -(0.18 + Math.random() * 0.35),
        speedX: (Math.random() - 0.5) * 0.25,
        alpha: 0.15 + Math.random() * 0.45,
        baseAlpha: 0.15 + Math.random() * 0.45,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseAngle: Math.random() * Math.PI * 2,
        // Alternate between leaf green and science bioluminescent emerald/gold
        colorType: i % 3 === 0 ? 'gold' : (i % 3 === 1 ? 'science' : 'nature')
      });
    }
  }

  // Mouse parallax interaction (attached to section with cached dimensions to avoid layout thrashing)
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  function onPointerMove(e) {
    if (!isVisible) return;
    const h = height || window.innerHeight;
    mouse.targetX = ((e.clientX / window.innerWidth) - 0.5) * 35;
    mouse.targetY = ((e.offsetY / h) - 0.5) * 25;
  }
  function onPointerLeave() {
    mouse.targetX = 0;
    mouse.targetY = 0;
  }
  section.addEventListener('pointermove', onPointerMove, { passive: true });
  section.addEventListener('pointerleave', onPointerLeave, { passive: true });

  function resize() {
    const rect = section.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    if (particles.length === 0) initParticles();
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Wave definitions (representing botanical roots & scientific quantum/DNA waves)
  const waves = [
    { yFraction: 0.78, amplitude: 22, wavelength: 0.0035, speed: 0.0012, color: 'rgba(36, 80, 42, 0.05)', stroke: 'rgba(36, 80, 42, 0.12)' },
    { yFraction: 0.84, amplitude: 28, wavelength: 0.0028, speed: -0.0009, color: 'rgba(59, 177, 130, 0.04)', stroke: 'rgba(59, 177, 130, 0.10)' },
    { yFraction: 0.90, amplitude: 34, wavelength: 0.0022, speed: 0.0016, color: 'rgba(217, 159, 54, 0.035)', stroke: 'rgba(217, 159, 54, 0.08)' }
  ];

  let time = 0;

  function draw(now) {
    if (!isVisible) {
      rafId = null;
      return;
    }

    time = now;
    ctx.clearRect(0, 0, width, height);

    // Damped mouse tracking
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // 1. Draw organic flowing waves (Roots & DNA field)
    for (let w = 0; w < waves.length; w++) {
      const wave = waves[w];
      const baseY = height * wave.yFraction + mouse.y * (w + 1) * 0.3;

      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, baseY);

      for (let x = 0; x <= width; x += 16) {
        const offset = Math.sin(x * wave.wavelength + time * wave.speed + w) * wave.amplitude +
                       Math.cos(x * wave.wavelength * 0.6 - time * wave.speed * 0.8) * (wave.amplitude * 0.4);
        ctx.lineTo(x, baseY + offset);
      }

      ctx.lineTo(width, height);
      ctx.closePath();

      ctx.fillStyle = wave.color;
      ctx.fill();

      ctx.strokeStyle = wave.stroke;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // 2. Draw drifting botanical spores & scientific motes
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.y += p.speedY;
      p.x += p.speedX + Math.sin(time * 0.001 + i) * 0.15;
      p.pulseAngle += p.pulseSpeed;
      p.alpha = p.baseAlpha + Math.sin(p.pulseAngle) * 0.15;

      // Wrap around seamlessly
      if (p.y < -20) {
        p.y = height + 20;
        p.x = Math.random() * width;
      }
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;

      const px = p.x + mouse.x * 0.4;
      const py = p.y + mouse.y * 0.4;

      ctx.beginPath();
      ctx.arc(px, py, p.radius, 0, Math.PI * 2);

      let fillCol;
      let glowCol;
      if (p.colorType === 'gold') {
        fillCol = `rgba(217, 159, 54, ${p.alpha})`;
        glowCol = `rgba(217, 159, 54, ${p.alpha * 0.4})`;
      } else if (p.colorType === 'science') {
        fillCol = `rgba(45, 184, 132, ${p.alpha})`;
        glowCol = `rgba(45, 184, 132, ${p.alpha * 0.4})`;
      } else {
        fillCol = `rgba(62, 148, 79, ${p.alpha})`;
        glowCol = `rgba(62, 148, 79, ${p.alpha * 0.4})`;
      }

      ctx.fillStyle = fillCol;
      ctx.shadowColor = glowCol;
      ctx.shadowBlur = p.radius * 3;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    rafId = requestAnimationFrame(draw);
  }

  // IntersectionObserver to sleep the animation when out of view
  const observer = new IntersectionObserver(
    entries => {
      const entry = entries[0];
      isVisible = entry.isIntersecting;
      if (isVisible && !rafId) {
        rafId = requestAnimationFrame(draw);
      }
    },
    { rootMargin: '100px 0px' }
  );

  observer.observe(section);

  return {
    destroy: () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      section.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('pointerleave', onPointerLeave);
      if (rafId) cancelAnimationFrame(rafId);
    }
  };
}

export { initTaglineMotion };
