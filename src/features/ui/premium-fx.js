// Premium Finish: Water-Droplet Badges, Headline Light-Sweep, and Logo & Nav Polish.
import { gsap, hasGsap } from '../../lib/gsap.js';
import { $, $$ } from '../../utils/dom.js';
import { reduce } from '../../utils/media.js';

const CONFIG = {
  sweepInterval: 6.4,
  bandWidth: 0.16,
  dropletBlur: 8,
  displacementScale: 7,
  wobbleAmplitude: 1.06,
  morphSpeed: 7.5
};

// 1. Inject SVG refraction filter defs once into DOM
function injectFilterDefs() {
  if (document.getElementById('droplet-filters')) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'droplet-filters';
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.style.width = '0';
  svg.style.height = '0';
  svg.style.pointerEvents = 'none';
  svg.style.overflow = 'hidden';

  svg.innerHTML = `
    <defs>
      <filter id="drop-refract" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.038" numOctaves="1" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="${CONFIG.displacementScale}" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  `;
  document.body.appendChild(svg);

  // Runtime detection: Chromium supports SVG filters inside backdrop-filter
  const isChromium = !!window.chrome && (navigator.userAgent.indexOf('Chrome') > -1 || navigator.userAgent.indexOf('Chromium') > -1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isChromium && !isSafari) {
    document.documentElement.classList.add('has-svg-refract');
  }
}

// 2. Set exact data-text attribute on each line of the headline
function setupHeadlineShine() {
  const lines = $$('.hero__title .ln');
  lines.forEach(line => {
    const txt = line.textContent.trim().replace(/\s+/g, ' ');
    line.setAttribute('data-text', txt);
  });
}

// 3. Setup Water-Droplet Badges interactive tactile effects
function setupDropletBadges() {
  const badges = $$('.facts .fact');
  if (!badges.length) return;

  badges.forEach(badge => {
    // Add micro glint bar element if not present
    if (!badge.querySelector('.drop-glint-bar')) {
      const glint = document.createElement('div');
      glint.className = 'drop-glint-bar';
      glint.setAttribute('aria-hidden', 'true');
      badge.appendChild(glint);
    }

    if (reduce) return;

    // Hover ripple effect & elastic wobble
    badge.addEventListener('pointerenter', () => {
      // Create expanding water ripples
      const r1 = document.createElement('div');
      r1.className = 'droplet-ripple';
      r1.setAttribute('aria-hidden', 'true');

      const r2 = document.createElement('div');
      r2.className = 'droplet-ripple r2';
      r2.setAttribute('aria-hidden', 'true');

      badge.appendChild(r1);
      badge.appendChild(r2);

      setTimeout(() => {
        r1.remove();
        r2.remove();
      }, 950);

      // Soft elastic wobble (animates --drop-scale without clobbering base arc transform)
      if (hasGsap) {
        gsap.killTweensOf(badge);
        gsap.fromTo(
          badge,
          { '--drop-scale': 1 },
          {
            '--drop-scale': CONFIG.wobbleAmplitude,
            duration: 0.16,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1,
            onComplete: () => {
              gsap.to(badge, {
                '--drop-scale': 1,
                duration: 0.4,
                ease: 'elastic.out(1, 0.4)'
              });
            }
          }
        );
      }
    });

    // Press squish & spring back
    badge.addEventListener('pointerdown', () => {
      if (hasGsap) {
        gsap.to(badge, {
          '--drop-sx': 1.06,
          '--drop-sy': 0.93,
          duration: 0.12,
          ease: 'power1.out'
        });
      }
    });

    const releaseSquish = () => {
      if (hasGsap) {
        gsap.to(badge, {
          '--drop-sx': 1,
          '--drop-sy': 1,
          duration: 0.45,
          ease: 'elastic.out(1.2, 0.4)'
        });
      }
    };

    badge.addEventListener('pointerup', releaseSquish);
    badge.addEventListener('pointerleave', releaseSquish);
    badge.addEventListener('pointercancel', releaseSquish);
  });
}

// 4. Subtle pointer-tracking shift for headline shine and visibility pausing
function setupShineControls() {
  const heroStage = $('#home');
  if (!heroStage) return;

  // Track pointer X across hero for slight shine band nudge
  let targetX = 0, currentX = 0, rafId = 0;
  const updateShinePointer = () => {
    currentX += (targetX - currentX) * 0.08;
    heroStage.style.setProperty('--headline-shine-shift', currentX.toFixed(3));
    if (Math.abs(targetX - currentX) > 0.001) {
      rafId = requestAnimationFrame(updateShinePointer);
    } else {
      rafId = 0;
    }
  };

  heroStage.addEventListener('pointermove', e => {
    targetX = (e.clientX / window.innerWidth) - 0.5;
    if (!rafId) rafId = requestAnimationFrame(updateShinePointer);
  }, { passive: true });

  // Pause sweep animations when hero is scrolled out of view or tab is hidden
  const togglePause = (shouldPause) => {
    if (shouldPause) {
      document.body.classList.add('hero-shine-paused');
    } else {
      document.body.classList.remove('hero-shine-paused');
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      togglePause(!entry.isIntersecting);
    }, { threshold: 0.05 });
    observer.observe(heroStage);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      togglePause(true);
    } else {
      togglePause(false);
    }
  });
}

// Master initialization
function initPremiumFx() {
  injectFilterDefs();
  setupHeadlineShine();
  setupDropletBadges();
  setupShineControls();
}

export { CONFIG, initPremiumFx };
