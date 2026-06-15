import { describe, expect, test } from 'vitest';
import { createManualGridPlan } from './geometry';
import { createPosterLayout, type PageSlice } from './posterLayout';

function makeLayout(rows: number, columns: number, overlapMm = 10, printerMarginMm = 5) {
  const plan = createManualGridPlan({
    orientation: 'portrait',
    rows,
    columns,
    overlapMm,
    printerMarginMm,
  });
  const layout = createPosterLayout(plan, {
    image: { widthPx: 4000, heightPx: 3000 },
    fitMode: 'cover',
  });
  return { plan, layout };
}

function labelOnImage(slice: PageSlice) {
  const insideX =
    slice.labelXmm > slice.destXmm &&
    slice.labelXmm < slice.destXmm + slice.destWidthMm;
  const insideY =
    slice.labelYmm - 5 > slice.destYmm &&
    slice.labelYmm < slice.destYmm + slice.destHeightMm;
  return insideX && insideY;
}

describe('페이지 번호 배치', () => {
  test('풀칠 10mm: 마지막 장만 번호 미표시, 나머지는 이미지 밖(풀칠 탭)에 표시', () => {
    for (const [rows, columns] of [[2, 2], [2, 3], [3, 3], [1, 3], [3, 1]] as const) {
      const { plan, layout } = makeLayout(rows, columns);
      layout.slices.forEach((slice) => {
        const isLast =
          slice.row === plan.rows - 1 && slice.column === plan.columns - 1;
        if (isLast) {
          // 최하단·최우측 모서리 장은 탭이 없어 번호를 표시하지 않는다.
          expect(slice.showLabel, `${slice.labelText}`).toBe(false);
        } else {
          expect(slice.showLabel, `${slice.labelText}`).toBe(true);
          expect(labelOnImage(slice), `${slice.labelText} 라벨이 이미지 위에 있음`).toBe(
            false,
          );
        }
      });
    }
  });

  test('풀칠 0mm: 탭이 전혀 없어 모든 번호가 표시되지 않는다', () => {
    const { layout } = makeLayout(2, 2, 0);
    expect(layout.slices.length).toBe(4);
    layout.slices.forEach((slice) => {
      expect(slice.showLabel).toBe(false);
    });
  });

  test('fit 모드에서 이미지 주변에 빈 공간이 있으면 번호는 빈 공간에 표시된다', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 2,
      columns: 2,
      overlapMm: 10,
      printerMarginMm: 5,
    });
    // 매우 가로로 긴 이미지: fit 시 상하에 큰 빈 공간이 생긴다.
    const layout = createPosterLayout(plan, {
      image: { widthPx: 8000, heightPx: 1000 },
      fitMode: 'fit',
    });
    layout.slices.forEach((slice) => {
      expect(slice.showLabel).toBe(true);
      expect(labelOnImage(slice)).toBe(false);
    });
  });

  test('번호는 인쇄 가능 영역 안에 있다 (프린터 여백 침범 금지)', () => {
    for (const margin of [0, 3, 5]) {
      const { plan, layout } = makeLayout(3, 3, 10, margin);
      layout.slices.forEach((slice) => {
        expect(slice.labelXmm).toBeGreaterThanOrEqual(margin - 1e-6);
        expect(slice.labelYmm).toBeLessThanOrEqual(plan.page.heightMm - margin + 1e-6);
        expect(slice.labelYmm - 5).toBeGreaterThanOrEqual(margin - 5 - 1e-6);
      });
    }
  });
});
