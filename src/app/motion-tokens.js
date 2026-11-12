// Motion Design Tokens: Unified animation parameters across the site.
export const MOTION = {
  dur: {
    fast: 0.25,
    base: 0.6,
    slow: 1.0
  },
  ease: {
    entrance: 'power3.out',
    move: 'power2.inOut',
    expo: 'expo.out',
    smooth: 'power2.out',
    // Lenis / JS curve matching expo.out
    easedScroll: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
  },
  stagger: {
    fast: 0.06,
    base: 0.08,
    slow: 0.12
  },
  dist: {
    sm: 16,
    md: 24,
    lg: 40
  }
};

