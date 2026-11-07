// Premium Finish: Water-Droplet Badges, Headline Light-Sweep, and Logo & Nav Polish.
import { gsap, hasGsap } from '../../lib/gsap.js';
import { $, $$ } from '../../utils/dom.js';
import { reduce } from '../../utils/media.js';

const CONFIG = {
  sweepInterval: 4.8,
  bandWidth: 0.22,
  dropletBlur: 8,
  displacementScale: 6,
  wobbleAmplitude: 1.06,
  morphSpeed: 8.0
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
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="1" result="noise" />
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

// 2. Setup Water-Droplet Badges interactive tactile effects & splash satellites
function setupDropletBadges() {
  const badges = $$('.facts .fact');
  if (!badges.length) return;

  badges.forEach((badge, idx) => {
    // 3a. Strict clipping shell: .fact-liquid keeps glints strictly inside badge
    let liquid = badge.querySelector('.fact-liquid');
    if (!liquid) {
      liquid = document.createElement('div');
      liquid.className = 'fact-liquid';
      liquid.setAttribute('aria-hidden', 'true');
      badge.appendChild(liquid);
    }

    if (!liquid.querySelector('.drop-glint-bar')) {
      const glint = document.createElement('div');
      glint.className = 'drop-glint-bar';
      glint.setAttribute('aria-hidden', 'true');
      liquid.appendChild(glint);
    }

    // 3b. Satellite micro-droplets (splash feel: "like water dropped on surface")
    if (!badge.querySelector('.micro-drop')) {
      const md1 = document.createElement('div');
      md1.className = 'micro-drop md-1';
      md1.setAttribute('aria-hidden', 'true');

      const md2 = document.createElement('div');
      md2.className = 'micro-drop md-2';
      md2.setAttribute('aria-hidden', 'true');

      badge.appendChild(md1);
      badge.appendChild(md2);

      if (idx !== 1) {
        const md3 = document.createElement('div');
        md3.className = 'micro-drop md-3';
        md3.setAttribute('aria-hidden', 'true');
        badge.appendChild(md3);
      }

      // Settle in with an ease-out when hero loads
      setTimeout(() => {
        badge.querySelectorAll('.micro-drop').forEach(md => md.classList.add('settled'));
      }, 700 + idx * 120);
    }

    if (reduce) return;

    // 3c. Hover ripple effect & elastic wobble
    badge.addEventListener('pointerenter', () => {
      // Concentric expanding water ripples
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
                duration: 0.45,
                ease: 'elastic.out(1, 0.4)'
              });
            }
          }
        );
      }
    });

    // 3d. Press squish & spring back
    badge.addEventListener('pointerdown', () => {
      if (hasGsap) {
        gsap.to(badge, {
          '--drop-sx': 1.05,
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

// 3. Visibility pausing for background and logo sweeps
function setupShineControls() {
  const heroStage = $('#home');
  if (!heroStage) return;

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
  setupDropletBadges();
  setupShineControls();
}

export { CONFIG, initPremiumFx };
