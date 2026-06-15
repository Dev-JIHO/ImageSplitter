import { describe, expect, test } from 'vitest';
import { createManualGridPlan } from './geometry';
import { createPosterLayout } from './posterLayout';

const EPS = 1e-6;

function layout(imageScale: number, cropFocus = { x: 0.5, y: 0.5 }) {
  const plan = createManualGridPlan({
    orientation: 'portrait',
    rows: 2,
    columns: 2,
    overlapMm: 10,
    printerMarginMm: 5,
  });
  return createPosterLayout(plan, {
    image: { widthPx: 4000, heightPx: 3000 },
    fitMode: 'fit',
    imageScale,
    cropFocus,
  });
}

describe('통합 이미지 배치 (contain + 줌)', () => {
  test('확대 100%면 이미지가 팔레트 안에 완전히 들어가고 잘리지 않는다', () => {
    const l = layout(1);
    const out = l.outputFrameMm;
    const f = l.imageFrameMm;
    expect(f.x).toBeGreaterThanOrEqual(out.x - EPS);
    expect(f.y).toBeGreaterThanOrEqual(out.y - EPS);
    expect(f.x + f.width).toBeLessThanOrEqual(out.x + out.width + EPS);
    expect(f.y + f.height).toBeLessThanOrEqual(out.y + out.height + EPS);
    // 소스는 원본 전체(잘림 없음)
    expect(l.sourceWidth).toBe(4000);
    expect(l.sourceHeight).toBe(3000);
  });

  test('충분히 확대하면 팔레트를 가득 채워 빈 페이지가 없다', () => {
    const l = layout(3);
    const out = l.outputFrameMm;
    expect(l.imageFrameMm.width).toBeGreaterThan(out.width);
    expect(l.imageFrameMm.height).toBeGreaterThan(out.height);
    // 2x2 모든 페이지에 이미지가 들어간다
    expect(l.slices.length).toBe(4);
  });

  test('확대 상태에서 cropFocus가 이미지 위치를 이동시킨다', () => {
    const left = layout(3, { x: 0, y: 0 });
    const right = layout(3, { x: 1, y: 1 });
    expect(left.imageFrameMm.x).toBeGreaterThan(right.imageFrameMm.x);
    expect(left.imageFrameMm.y).toBeGreaterThan(right.imageFrameMm.y);
  });
});
