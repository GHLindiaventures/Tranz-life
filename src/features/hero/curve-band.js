// The curved band at the foot of the hero, drawn like the reference: one long smooth sweep that rises from the
// bottom left, crests gently and falls away to the right, with "LIVE NATURALLY · LIVE HEALTHIER" in tall light green
// letters filling a broad dark green ribbon, and the "You deserve the best" page starting below it with a domed
// top. It is fitted to the white arc so the arc ends on it as a semicircle: the ribbon's top edge passes through both
// ends of the circle's middle line. Behind the arc the hero's green carries on down. The shape is measured from the
// arc whenever the layout changes, and the jar (features/hero/hero-jar.js) is told where the ribbon is so it can
// stand just above it. The words slide along the curve only as you scroll (backwards when you scroll back up) and
// stand still when you stop.
import { gsap } from '../../lib/gsap.js';
import { $ } from '../../utils/dom.js';
import { reduce } from '../../utils/media.js';

const UNIT = 'LIVE NATURALLY  ·  LIVE HEALTHIER  ·  ';
const RIB = 168;    // ribbon width in SVG units (matches .cb-ribbon in hero.css)

// the ribbon's top edge, in hero pixels: far out to the lower left, through both ends of the arc's middle line,
// and far out to the lower right. The outer points sit well past the screen edges, so the sweep stays long and smooth.
const pointsFor = (W, cx, cy, r) => [
  [Math.min(cx - 2.2 * r, -.05 * W), cy + .55 * r],
  [cx - r, cy],
  [cx + r, cy],
  [Math.max(cx + 2.4 * r, 1.05 * W), cy + .62 * r],
];

// a smooth curve through the points (Catmull-Rom), as cubic Bézier segments [p1, c1, c2, p2]
function segments(P){
  const out = [];
  for (let i = 0; i < P.length - 1; i++){
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    out.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]);
  }
  return out;
}
const bez = ([a, b, c, d], t) => { const u = 1 - t; return [0, 1].map(k => u*u*u*a[k] + 3*u*u*t*b[k] + 3*u*t*t*c[k] + t*t*t*d[k]); };
const toPath = segs => segs.reduce((d, [, c1, c2, p2]) => d + ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`,
  `M ${segs[0][0][0].toFixed(1)} ${segs[0][0][1].toFixed(1)}`);

function buildCurveBand(){
  const host = $('#curveBand'), stage = $('#home'), arc = $('.st-arc'), next = $('#insider');
  if (!host || !stage) return;
  host.innerHTML =
    // behind the arc: the hero's green carrying on below the hero
    `<svg class="cb-back" aria-hidden="true" focusable="false"><rect x="-200" width="1840"/></svg>` +
    // in front: the light page under the curve, the ribbon and its words
    `<svg class="cb-front" aria-hidden="true" focusable="false">
      <defs><path id="cbPath"/></defs>
      <path class="cb-fill"/>
      <use class="cb-ribbon" href="#cbPath"/>
      <text class="cb-text" dy="0.36em"><textPath href="#cbPath" id="cbText">${UNIT.repeat(6)}</textPath></text>
    </svg>`;
  const back = $('.cb-back', host), sky = $('rect', back), front = $('.cb-front', host);
  const path = $('#cbPath', host), fill = $('.cb-fill', host), tp = $('#cbText', host), text = $('.cb-text', host);
  let unit = 0, last = NaN;

  function layout(){
    const W = stage.clientWidth, heroH = stage.offsetHeight;
    const svgW = Math.max(W, 900), s = svgW / 1440, offX = (W - svgW) / 2, half = RIB / 2 * s;
    let cx = W * .5, cy = heroH, r = W * .4;
    if (arc){
      const sr = stage.getBoundingClientRect(), ar = arc.getBoundingClientRect();
      r = ar.width / 2 * .984;   // the circle's radius inside its box (r = 49.2 of 50)
      cx = ar.left + ar.width / 2 - sr.left; cy = ar.top + ar.height / 2 - sr.top;
    }
    // the ribbon's top edge in hero pixels, sampled finely to find its highest point and its height at any x
    const top = segments(pointsFor(W, cx, cy, r));
    const pts = top.flatMap(sg => Array.from({ length:40 }, (_, k) => bez(sg, k / 40))).concat([top[top.length - 1][3]]);
    const topAt = x => { for (let i = 1; i < pts.length; i++) if (pts[i][0] >= x){ const a = pts[i - 1], b = pts[i], t = (x - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * t; } return pts[pts.length - 1][1]; };
    const crest = Math.min(...pts.filter(p => p[0] >= 0 && p[0] <= W).map(p => p[1]));
    // the box starts just above the crest; inside it the ribbon's centre line runs half a ribbon below its top edge
    const y0 = crest - 10;
    const toBox = ([x, y]) => [(x - offX) / s, (y + half - y0) / s];
    const centre = top.map(sg => sg.map(toBox));
    const boxH = Math.ceil(Math.max(...pts.map(p => toBox(p)[1])) + RIB / 2 + 24);
    const curve = toPath(centre), view = `0 0 1440 ${boxH}`, ends = [centre[0][0][0], centre[centre.length - 1][3][0]];
    back.setAttribute('viewBox', view); front.setAttribute('viewBox', view);
    path.setAttribute('d', curve);
    fill.setAttribute('d', `${curve} L ${ends[1].toFixed(1)} ${boxH + 3} L ${ends[0].toFixed(1)} ${boxH + 3} Z`);
    // the hero's own green covers everything above its bottom edge; the band's green only fills in below it
    const skyTop = Math.max(-2, (heroH - y0) / s - 2);
    sky.setAttribute('y', skyTop.toFixed(1)); sky.setAttribute('height', Math.max(0, boxH - 6 - skyTop).toFixed(1));
    host.style.top = `${y0.toFixed(1)}px`;
    // the next page leaves room for whatever of the band hangs below the hero
    if (next) next.style.paddingTop = `${Math.max(0, y0 + boxH * s - heroH).toFixed(0)}px`;
    // tell the jar where the ribbon's top is under it
    window.dispatchEvent(new CustomEvent('tl:bandfit', { detail:{ topAtArc:topAt(cx) } }));
    unit = text.getComputedTextLength() / 6; last = NaN;
    update();
  }

  const update = () => {
    if (!unit) return;
    const off = reduce ? 0 : (window.scrollY * .8) % unit;   // the words move only with the scroll
    if (off !== last){ last = off; tp.setAttribute('startOffset', (-off).toFixed(1)); }
  };

  layout();
  addEventListener('resize', layout);
  addEventListener('load', layout);
  if (document.fonts) document.fonts.ready.then(layout);
  if ('ResizeObserver' in window){ let t; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(layout, 60); }).observe(stage); }
  if (!reduce) gsap.ticker.add(update);   // Lenis moves the scroll smoothly; only touch the SVG when it changed
}

export { buildCurveBand };
