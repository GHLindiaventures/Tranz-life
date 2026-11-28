// Reusable image zoom and drag-to-pan helper for product design views.
import { clamp } from './math.js';

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.5;

const roundZoom = z => Math.round(z * 100) / 100;

/**
 * Clamp pan offsets so a zoomed image stays within its viewport bounds.
 */
function clampPan({ zoom, panX, panY, stageW, stageH, imgW, imgH }){
  const maxX = Math.max(0, (imgW * zoom - stageW) / 2);
  const maxY = Math.max(0, (imgH * zoom - stageH) / 2);
  return {
    x: clamp(panX, -maxX, maxX) || 0,
    y: clamp(panY, -maxY, maxY) || 0
  };
}

/**
 * Compute next zoom and clamped pan offsets keeping `(cx, cy)` (relative to stage centre) anchored.
 */
function zoomAtPoint({ zoom, nextZoom, panX, panY, cx = 0, cy = 0, stageW, stageH, imgW, imgH, min = ZOOM_MIN, max = ZOOM_MAX }){
  const z = roundZoom(clamp(nextZoom, min, max));
  const ratio = zoom > 0 ? z / zoom : 1;
  const clamped = clampPan({
    zoom: z,
    panX: cx - (cx - panX) * ratio,
    panY: cy - (cy - panY) * ratio,
    stageW, stageH, imgW, imgH
  });
  return { zoom: z, panX: clamped.x, panY: clamped.y };
}

/**
 * Attach zoom (+ / - / reset / wheel / double-click) and pointer-drag panning to an image stage.
 */
function createZoomPan({ stage, img, controls = null, onChange = null, min = ZOOM_MIN, max = ZOOM_MAX, step = ZOOM_STEP, wheel = false }){
  let zoom = min, panX = 0, panY = 0;
  let dragId = null, startX = 0, startY = 0, baseX = 0, baseY = 0;

  const inBtn = controls ? controls.querySelector('[data-zoom="in"]') : null;
  const outBtn = controls ? controls.querySelector('[data-zoom="out"]') : null;
  const resetBtn = controls ? controls.querySelector('[data-zoom="reset"]') : null;

  const size = () => ({
    stageW: stage.clientWidth || 1,
    stageH: stage.clientHeight || 1,
    imgW: img.offsetWidth || stage.clientWidth || 1,
    imgH: img.offsetHeight || stage.clientHeight || 1
  });

  const render = () => {
    img.style.transform = zoom === min && panX === 0 && panY === 0
      ? ''
      : `translate3d(${panX.toFixed(1)}px, ${panY.toFixed(1)}px, 0) scale(${zoom})`;
    stage.classList.toggle('is-zoomed', zoom > min);
    if (inBtn) inBtn.disabled = zoom >= max;
    if (outBtn) outBtn.disabled = zoom <= min;
    if (resetBtn) {
      resetBtn.textContent = `${Math.round(zoom * 100)}%`;
      resetBtn.disabled = zoom <= min;
    }
    if (onChange) onChange({ zoom, min, max, canIn: zoom < max, canOut: zoom > min });
  };

  const applyZoom = (nextZoom, cx = 0, cy = 0) => {
    const next = zoomAtPoint({ zoom, nextZoom, panX, panY, cx, cy, ...size(), min, max });
    zoom = next.zoom; panX = next.panX; panY = next.panY;
    render();
  };

  const panBy = (dx, dy) => {
    if (zoom <= min) return;
    const clamped = clampPan({ zoom, panX: panX + dx, panY: panY + dy, ...size() });
    panX = clamped.x; panY = clamped.y;
    render();
  };

  const reset = () => {
    dragId = null;
    stage.classList.remove('is-panning');
    zoom = min; panX = 0; panY = 0;
    render();
  };

  const onPointerDown = e => {
    if (zoom <= min || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (e.target.closest && e.target.closest('[data-zoom]')) return;
    e.preventDefault();
    dragId = e.pointerId;
    startX = e.clientX; startY = e.clientY;
    baseX = panX; baseY = panY;
    stage.classList.add('is-panning');
    if (stage.setPointerCapture) {
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
    }
  };

  const onPointerMove = e => {
    if (e.pointerId !== dragId) return;
    const clamped = clampPan({
      zoom,
      panX: baseX + (e.clientX - startX),
      panY: baseY + (e.clientY - startY),
      ...size()
    });
    panX = clamped.x; panY = clamped.y;
    render();
  };

  const onPointerEnd = e => {
    if (e.pointerId !== dragId) return;
    dragId = null;
    stage.classList.remove('is-panning');
    if (stage.releasePointerCapture) {
      try { stage.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  };

  const stageOffset = e => {
    const r = stage.getBoundingClientRect();
    return { cx: e.clientX - (r.left + r.width / 2), cy: e.clientY - (r.top + r.height / 2) };
  };

  const onDblClick = e => {
    if (img.hidden) return;
    if (e.target.closest && e.target.closest('[data-zoom]')) return;
    if (zoom > min) { reset(); return; }
    const { cx, cy } = stageOffset(e);
    applyZoom(Math.min(max, min + step * 2), cx, cy);
  };

  const onWheel = e => {
    if (!wheel || img.hidden || !e.deltaY) return;
    e.preventDefault();
    const { cx, cy } = stageOffset(e);
    applyZoom(zoom + (e.deltaY < 0 ? step : -step), cx, cy);
  };

  const onControlClick = e => {
    const btn = e.target.closest('[data-zoom]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const action = btn.dataset.zoom;
    if (action === 'in') applyZoom(zoom + step);
    else if (action === 'out') applyZoom(zoom - step);
    else if (action === 'reset') reset();
  };

  const onResize = () => {
    if (zoom <= min) return;
    const clamped = clampPan({ zoom, panX, panY, ...size() });
    panX = clamped.x; panY = clamped.y;
    render();
  };

  const onDragStart = e => e.preventDefault();

  img.addEventListener('dragstart', onDragStart);
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerEnd);
  stage.addEventListener('pointercancel', onPointerEnd);
  stage.addEventListener('dblclick', onDblClick);
  if (wheel) stage.addEventListener('wheel', onWheel, { passive: false });
  if (controls) controls.addEventListener('click', onControlClick);
  window.addEventListener('resize', onResize);

  render();

  return {
    zoomIn: () => applyZoom(zoom + step),
    zoomOut: () => applyZoom(zoom - step),
    setZoom: applyZoom,
    panBy,
    reset,
    refresh: onResize,
    getZoom: () => zoom,
    destroy: () => {
      img.removeEventListener('dragstart', onDragStart);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerEnd);
      stage.removeEventListener('pointercancel', onPointerEnd);
      stage.removeEventListener('dblclick', onDblClick);
      if (wheel) stage.removeEventListener('wheel', onWheel);
      if (controls) controls.removeEventListener('click', onControlClick);
      window.removeEventListener('resize', onResize);
    }
  };
}

export { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, clampPan, zoomAtPoint, createZoomPan };
