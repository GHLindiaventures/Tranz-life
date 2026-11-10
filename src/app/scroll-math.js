// Pure helpers for the Palmo-style scroll extras (no DOM, unit-tested).

const clamp01 = v => Math.min(1, Math.max(0, v));
const smoothstep = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

// Story badge k of a product whose glide window progress is t (0..1):
// it rises in from below, holds near its spot while the product turns, then lifts away and fades.
// Returns y offset in vh (0 = resting spot), opacity and a small scale.
function badgeState(t, k){
  const enter = smoothstep(k * .07, k * .07 + .3, t);
  const exit = smoothstep(.55 + k * .04, .8, t);
  const y = (1 - enter) * 70 - exit * 45 - (t - .5) * 8;   // a slow drift even while resting
  return { y, o: Math.min(1, enter * 2.5) * (1 - exit), s: .8 + .2 * enter };
}

// 0..100 progress as a three-digit counter: 7 -> "007"
function pad3(v){ return String(Math.round(Math.min(100, Math.max(0, v)))).padStart(3, '0'); }

// Badge spot for product i: the layout is designed for products with the jar right of centre (even i);
// odd products mirror it horizontally.
function badgeSpot(spot, i){ return { x: i % 2 ? 100 - spot[0] : spot[0], y: spot[1] }; }

export { badgeState, pad3, badgeSpot, smoothstep };
