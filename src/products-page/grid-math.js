// Pure helpers for the statement page and the products grid (no DOM, so they can be unit tested).
import { clamp } from '../utils/math.js';

// Position of card i in the entrance order: the product that was shown in the showcase comes first.
const entranceOrder = (i, first, n) => ((i - first) % n + n) % n;

// Entrance progress (0..1) of the card at `order`, from the grid's overall entrance progress u (0..1).
// Each card runs for `span` of u; the last card finishes exactly at u = 1.
function cardEntrance(u, order, n = 5, span = 0.55) {
  const delay = n > 1 ? order * (1 - span) / (n - 1) : 0;
  return clamp((u - delay) / span, 0, 1);
}

// Which card holds the highlight at scroll progress p (0..1) through the grid.
// It starts on `first` and walks through every card in order; `lead` is a short hold on the first card.
function highlightIndex(p, n, first = 0, lead = 0.05) {
  const q = clamp((p - lead) / (1 - lead), 0, 0.999999);
  return (first + Math.floor(q * n)) % n;
}

// Statement words: word i of `count` rises one after another as p goes 0..1.
function wordProgress(p, i, count, start = 0.04, end = 0.62, dur = 0.16) {
  const step = count > 1 ? (end - start - dur) / (count - 1) : 0;
  return clamp((p - start - i * step) / dur, 0, 1);
}

// Progress (0..1) of a tall section through the viewport while its inner pin is stuck.
const pinProgress = (rectTop, rectHeight, vh) => clamp(-rectTop / Math.max(1, rectHeight - vh), 0, 1);

export { entranceOrder, cardEntrance, highlightIndex, wordProgress, pinProgress };
