// Motion Design Tokens: Unified animation parameters across the site.
export const MOTION = {
  dur: {
    fast: 0.25,
    base: 0.6,
    slow: 1.0,
    wipe: 0.4 // each half of the split wipe (menu, back to top): 0.8s in total
  },
  ease: {
    entrance: 'power3.out',
    move: 'power2.inOut',
    expo: 'expo.out',
    smooth: 'power2.out',
    wipe: 'power3.inOut',
    // Lenis / JS curve matching expo.out
    easedScroll: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
  },
  stagger: {
    fast: 0.06,
    base: 0.08,
    slow: 0.12,
    menu: 0.07 // menu links rising one by one
  },
  dist: {
    sm: 16,
    md: 24,
    lg: 40
  }
};

