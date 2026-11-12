// Matte finish: a fine, static grain over the page backgrounds (CSS: .page:not(#home)::after in global.css).
// The grain is drawn once at start-up, in our own code: a tile of WHITE pixels, each with its own random transparency
// (one-pixel grain, every pixel independent). Over a flat colour at low opacity it only lightens it a touch, pixel by
// pixel, which reads as a printed, matte surface rather than a grey, cloudy veil. The tile is handed to CSS through the
// shared --grain token; until it is ready the token is "none", so nothing changes if this ever fails.

const TILE = 496;          // px, repeats seamlessly (every pixel is independent, so there is no seam to see)
const ALPHA_MEAN = 102;    // average transparency of a speck, 0..255 (about 40%)
const ALPHA_SD = 42;       // spread of the transparency

// small, fast, well-distributed PRNG (mulberry32): the same tile on every visit
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// the pixel data of the tile: white, alpha from a normal distribution (Box-Muller), clamped to 0..255. Pure.
function grainPixels(size = TILE, seed = 24, mean = ALPHA_MEAN, sd = ALPHA_SD) {
  const rnd = mulberry32(seed), px = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const u = Math.max(1e-9, rnd()), v = rnd();
    const n = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    const k = i * 4;
    px[k] = 255; px[k + 1] = 255; px[k + 2] = 255;
    px[k + 3] = Math.round(mean + n * sd);
  }
  return px;
}

// Performance (products page): the tile (246k random pixels) is drawn when the browser is idle, not during start-up,
// so it never delays the first frames. Until then --grain is "none" and the pages are simply flat.
function initGrain() {
  if (typeof document === 'undefined') return;
  if ('requestIdleCallback' in window) requestIdleCallback(drawGrain, { timeout: 2000 }); else setTimeout(drawGrain, 300);
}
function drawGrain() {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = TILE;
    const g = c.getContext('2d');
    if (!g) return;
    g.putImageData(new ImageData(grainPixels(), TILE, TILE), 0, 0);
    const set = url => {
      document.documentElement.style.setProperty('--grain', `url("${url}")`);
      document.querySelectorAll('image.grain-img').forEach(img => img.setAttribute('href', url));   // the hills edges
    };
    if (c.toBlob) c.toBlob(b => { if (b) set(URL.createObjectURL(b)); }, 'image/png');
    else set(c.toDataURL('image/png'));
  } catch (err) { /* keep the page without grain */ }
}

export { initGrain, grainPixels, TILE };
