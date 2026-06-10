import { describe, expect, test } from 'vitest';
import { createManualGridPlan, isUniformTabsActive } from './geometry';
import { createPosterLayout, getPageTabs } from './posterLayout';

function makePlan(rows: number, columns: number, overlapMm = 10, uniformTabs = true) {
  return createManualGridPlan({
    orientation: 'portrait',
    rows,
    columns,
    overlapMm,
    printerMarginMm: 5,
    uniformTabs,
  });
}

describe('균일 예약 방식 (모든 장에 풀칠 탭)', () => {
  test('2x2 이상에서만 활성화된다', () => {
    expect(isUniformTabsActive(makePlan(2, 2))).toBe(true);
    expect(isUniformTabsActive(makePlan(5, 3))).toBe(true);
    expect(isUniformTabsActive(makePlan(1, 3))).toBe(false);
    expect(isUniformTabsActive(makePlan(3, 1))).toBe(false);
    expect(isUniformTabsActive(makePlan(2, 2, 0))).toBe(false);
    expect(isUniformTabsActive(makePlan(2, 2, 10, false))).toBe(false);
  });

  test('콘텐츠 크기: 페이지당 (인쇄폭-풀칠폭)으로 일정하다', () => {
    const uniform = makePlan(2, 2);
    // 세로 A4, 여백 5mm: 인쇄영역 200x287, 풀칠 10mm
    expect(uniform.contentWidthMm).toBe(2 * 190);
    expect(uniform.contentHeightMm).toBe(2 * 277);

    const legacy = makePlan(2, 2, 10, false);
    expect(legacy.contentWidthMm).toBe(200 + 190);
    expect(legacy.contentHeightMm).toBe(287 + 277);
  });

  test('모든 이음새는 정확히 한쪽 페이지가 소유한다', () => {
    for (let rows = 2; rows <= 5; rows += 1) {
      for (let columns = 2; columns <= 5; columns += 1) {
        const plan = makePlan(rows, columns);
        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < columns - 1; c += 1) {
            const leftPage = getPageTabs(plan, r, c);
            const rightPage = getPageTabs(plan, r, c + 1);
            expect(Number(leftPage.right) + Number(rightPage.left)).toBe(1);
          }
        }
        for (let c = 0; c < columns; c += 1) {
          for (let r = 0; r < rows - 1; r += 1) {
            const topPage = getPageTabs(plan, r, c);
            const bottomPage = getPageTabs(plan, r + 1, c);
            expect(Number(topPage.bottom) + Number(bottomPage.top)).toBe(1);
          }
        }
      }
    }
  });

  test('모든 페이지가 최소 1개의 탭을 갖고, 방향별 최대 1개만 갖는다', () => {
    for (let rows = 2; rows <= 5; rows += 1) {
      for (let columns = 2; columns <= 5; columns += 1) {
        const plan = makePlan(rows, columns);
        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < columns; c += 1) {
            const tabs = getPageTabs(plan, r, c);
            expect(
              tabs.left || tabs.right || tabs.top || tabs.bottom,
              `${rows}x${columns} (${r},${c}) 탭 없음`,
            ).toBe(true);
            // 종이 공간 제약: 가로 1개, 세로 1개 이하
            expect(Number(tabs.left) + Number(tabs.right)).toBeLessThanOrEqual(1);
            expect(Number(tabs.top) + Number(tabs.bottom)).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });

  test('마지막 장을 포함해 모든 페이지 번호가 이미지 밖에 있다', () => {
    for (const [rows, columns] of [[2, 2], [2, 3], [3, 2], [4, 4]] as const) {
      const plan = makePlan(rows, columns);
      const layout = createPosterLayout(plan, {
        image: { widthPx: 4000, heightPx: 3000 },
        fitMode: 'cover',
      });
      expect(layout.slices.length).toBe(rows * columns);
      layout.slices.forEach((slice) => {
        expect(slice.labelSubtle, `${slice.labelText} subtle`).toBe(false);
        const insideX =
          slice.labelXmm > slice.destXmm &&
          slice.labelXmm < slice.destXmm + slice.destWidthMm;
        const insideY =
          slice.labelYmm - 5 > slice.destYmm &&
          slice.labelYmm < slice.destYmm + slice.destHeightMm;
        expect(insideX && insideY, `${slice.labelText} 라벨이 이미지 위`).toBe(false);
      });
    }
  });

  test('이미지 영역이 종이 인쇄 가능 영역을 벗어나지 않는다', () => {
    const plan = makePlan(3, 3);
    const layout = createPosterLayout(plan, {
      image: { widthPx: 4000, heightPx: 3000 },
      fitMode: 'cover',
    });
    layout.slices.forEach((slice) => {
      expect(slice.destXmm).toBeGreaterThanOrEqual(plan.printerMarginMm - 1e-9);
      expect(slice.destYmm).toBeGreaterThanOrEqual(plan.printerMarginMm - 1e-9);
      expect(slice.destXmm + slice.destWidthMm).toBeLessThanOrEqual(
        plan.page.widthMm - plan.printerMarginMm + 1e-9,
      );
      expect(slice.destYmm + slice.destHeightMm).toBeLessThanOrEqual(
        plan.page.heightMm - plan.printerMarginMm + 1e-9,
      );
    });
  });
});
