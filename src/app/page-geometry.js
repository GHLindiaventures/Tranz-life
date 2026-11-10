// Page geometry that does not depend on scroll position.
// Sticky sections (.sheet-stack) report their *stuck* offsetTop while the page is scrolled, so section
// tops are built from heights and margins instead, which sticky positioning never changes.

// start: document y of the first page's margin box (top of <main>);
// boxes: [{ h, mt, mb }] per page (offsetHeight, margin-top, margin-bottom). Returns each page's top.
function cumulativeTops(start, boxes){
  const tops = []; let y = start;
  for (const b of boxes){ y += b.mt || 0; tops.push(y); y += (b.h || 0) + (b.mb || 0); }
  return tops;
}

export { cumulativeTops };
