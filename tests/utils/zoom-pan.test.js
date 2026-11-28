import { describe, expect, it } from 'vitest';
import { ZOOM_MAX, ZOOM_MIN, clampPan, zoomAtPoint } from '../../src/utils/zoom-pan.js';

describe('zoom and pan math', () => {
  it('keeps pan at zero when image fits inside the stage', () => {
    expect(clampPan({ zoom: 1, panX: 40, panY: -25, stageW: 600, stageH: 600, imgW: 600, imgH: 600 }))
      .toEqual({ x: 0, y: 0 });
  });

  it('clamps pan to the scaled overflow bounds', () => {
    expect(clampPan({ zoom: 2, panX: 500, panY: -450, stageW: 600, stageH: 600, imgW: 600, imgH: 600 }))
      .toEqual({ x: 300, y: -300 });
  });

  it('clamps zoom between min and max and resets pan at 1x', () => {
    expect(zoomAtPoint({ zoom: 3.5, nextZoom: 10, panX: 100, panY: -80, stageW: 500, stageH: 500, imgW: 500, imgH: 500 }))
      .toEqual({ zoom: ZOOM_MAX, panX: expect.closeTo(114.285, 2), panY: expect.closeTo(-91.428, 2) });

    expect(zoomAtPoint({ zoom: 2, nextZoom: 0.5, panX: 120, panY: -90, stageW: 500, stageH: 500, imgW: 500, imgH: 500 }))
      .toEqual({ zoom: ZOOM_MIN, panX: 0, panY: 0 });
  });

  it('keeps the focal point anchored when zooming in off-centre', () => {
    const res = zoomAtPoint({
      zoom: 1, nextZoom: 2, panX: 0, panY: 0,
      cx: 100, cy: -50,
      stageW: 600, stageH: 600, imgW: 600, imgH: 600
    });
    expect(res).toEqual({ zoom: 2, panX: -100, panY: 50 });
  });
});
