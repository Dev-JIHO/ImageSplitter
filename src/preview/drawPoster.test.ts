import { describe, expect, it } from 'vitest';
import { computePreviewCanvasSize } from './drawPoster';
import type { ActivePageWindow } from '../lib/posterLayout';

function makeWindow(widthMm: number, heightMm: number): ActivePageWindow {
  return {
    startRow: 0,
    endRow: 0,
    startColumn: 0,
    endColumn: 0,
    xMm: 0,
    yMm: 0,
    widthMm,
    heightMm,
    pageCount: 1,
  };
}

describe('computePreviewCanvasSize', () => {
  it('큰 포스터는 최대 스케일(2.1)로 제한된다', () => {
    const { scale, width, height } = computePreviewCanvasSize(makeWindow(420, 594));
    expect(scale).toBeCloseTo(2.1);
    expect(width).toBe(Math.round(420 * 2.1));
    expect(height).toBe(Math.round(594 * 2.1));
  });

  it('작은 포스터는 최소 픽셀 크기(320x220) 아래로 내려가지 않는다', () => {
    const { width, height } = computePreviewCanvasSize(makeWindow(100, 50));
    expect(width).toBeGreaterThanOrEqual(320);
    expect(height).toBeGreaterThanOrEqual(220);
  });

  it('아주 넓은 포스터는 1200px 기준 스케일로 줄어든다', () => {
    const { scale } = computePreviewCanvasSize(makeWindow(2400, 1200));
    expect(scale).toBeCloseTo(0.5);
  });
});
