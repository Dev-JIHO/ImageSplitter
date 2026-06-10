import { describe, expect, test } from 'vitest';
import { createManualGridPlan } from './geometry';
import { createPosterLayout, type CropFocus, type FitMode } from './posterLayout';

/**
 * 회귀 테스트: "이미지가 잘리는 현상" 피드백 검증.
 *
 * 보고된 설정(빈칸 없이 채우기 / 풀칠 10mm / 여백 없음 / DPI 200)을 포함한
 * 다양한 조합에서, 페이지 슬라이스들의 소스 영역이 빈틈·중복 없이
 * 전체 크롭 영역(sourceRect)을 정확히 타일링하는지 확인한다.
 * 타일링이 깨지면 이어붙였을 때 이미지 일부가 누락(=잘림)된다.
 */

const EPSILON = 1e-6;

interface Case {
  imageWidthPx: number;
  imageHeightPx: number;
  rows: number;
  columns: number;
  overlapMm: number;
  printerMarginMm: number;
  fitMode: FitMode;
  cropFocus?: CropFocus;
  imageScale?: number;
  uniformTabs?: boolean;
}

function verifyContinuity(c: Case) {
  const plan = createManualGridPlan({
    orientation: 'portrait',
    rows: c.rows,
    columns: c.columns,
    overlapMm: c.overlapMm,
    printerMarginMm: c.printerMarginMm,
    uniformTabs: c.uniformTabs,
  });
  const layout = createPosterLayout(plan, {
    image: { widthPx: c.imageWidthPx, heightPx: c.imageHeightPx },
    fitMode: c.fitMode,
    cropFocus: c.cropFocus,
    imageScale: c.imageScale,
  });

  expect(layout.slices.length).toBeGreaterThan(0);

  // 1) 소스 크롭 영역이 원본 이미지 밖으로 나가지 않아야 한다.
  expect(layout.sourceX).toBeGreaterThanOrEqual(-EPSILON);
  expect(layout.sourceY).toBeGreaterThanOrEqual(-EPSILON);
  expect(layout.sourceX + layout.sourceWidth).toBeLessThanOrEqual(
    c.imageWidthPx + EPSILON,
  );
  expect(layout.sourceY + layout.sourceHeight).toBeLessThanOrEqual(
    c.imageHeightPx + EPSILON,
  );

  // 2) 슬라이스 소스 영역들이 전체 크롭 영역(sourceRect)을 빈틈·중복 없이
  //    타일링해야 한다. (탭 재분배로 마지막 두 열이 벽돌 패턴이 되어도 성립하는
  //    2차원 불변식: 면적 합 일치 + 쌍별 무중복 + 프레임 내부)
  const frameArea = layout.sourceWidth * layout.sourceHeight;
  let areaSum = 0;
  layout.slices.forEach((s) => {
    areaSum += s.sourceWidth * s.sourceHeight;
    expect(s.sourceX).toBeGreaterThanOrEqual(layout.sourceX - 1e-6);
    expect(s.sourceY).toBeGreaterThanOrEqual(layout.sourceY - 1e-6);
    expect(s.sourceX + s.sourceWidth).toBeLessThanOrEqual(
      layout.sourceX + layout.sourceWidth + 1e-6,
    );
    expect(s.sourceY + s.sourceHeight).toBeLessThanOrEqual(
      layout.sourceY + layout.sourceHeight + 1e-6,
    );
  });
  expect(Math.abs(areaSum - frameArea) / frameArea).toBeLessThan(1e-9);

  for (let i = 0; i < layout.slices.length; i += 1) {
    for (let j = i + 1; j < layout.slices.length; j += 1) {
      const a = layout.slices[i];
      const b = layout.slices[j];
      const overlapW = Math.max(
        0,
        Math.min(a.sourceX + a.sourceWidth, b.sourceX + b.sourceWidth) -
          Math.max(a.sourceX, b.sourceX),
      );
      const overlapH = Math.max(
        0,
        Math.min(a.sourceY + a.sourceHeight, b.sourceY + b.sourceHeight) -
          Math.max(a.sourceY, b.sourceY),
      );
      expect((overlapW * overlapH) / frameArea).toBeLessThan(1e-9);
    }
  }

  // 3) cover 모드에서는 행/열별 이미지 폭·높이 합이 콘텐츠 크기와 일치해야 한다.
  if (c.fitMode === 'cover') {
    const rows = [...new Set(layout.slices.map((s) => s.row))];
    const columns = [...new Set(layout.slices.map((s) => s.column))];
    rows.forEach((row) => {
      const rowSlices = layout.slices.filter((s) => s.row === row);
      const totalWidth = rowSlices.reduce((sum, s) => sum + s.destWidthMm, 0);
      expect(totalWidth).toBeCloseTo(plan.contentWidthMm, 4);
    });
    columns.forEach((column) => {
      const columnSlices = layout.slices.filter((s) => s.column === column);
      const totalHeight = columnSlices.reduce((sum, s) => sum + s.destHeightMm, 0);
      expect(totalHeight).toBeCloseTo(plan.contentHeightMm, 4);
    });
  }
}

describe('slice continuity (이미지 잘림 회귀)', () => {
  test('보고된 설정: cover, 풀칠 10mm, 여백 없음, 2x2', () => {
    verifyContinuity({
      imageWidthPx: 4000,
      imageHeightPx: 3000,
      rows: 2,
      columns: 2,
      overlapMm: 10,
      printerMarginMm: 0,
      fitMode: 'cover',
    });
  });

  test('이미지 크기/그리드/풀칠/여백/초점/확대 조합 전수 검사', () => {
    const imageSizes: Array<[number, number]> = [
      [4000, 3000],
      [3000, 4000],
      [1654, 2339], // A4 200dpi 비율
      [1000, 1414],
      [123, 4567], // 극단적 세로
      [5000, 800], // 극단적 가로
      [410, 584], // 콘텐츠 비율과 거의 일치
    ];
    const grids: Array<[number, number]> = [
      [1, 2],
      [2, 1],
      [2, 2],
      [2, 3],
      [3, 3],
    ];
    const focuses: CropFocus[] = [
      { x: 0.5, y: 0.5 },
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 0.25, y: 0.8 },
    ];

    imageSizes.forEach(([imageWidthPx, imageHeightPx]) => {
      grids.forEach(([rows, columns]) => {
        [0, 10, 20].forEach((overlapMm) => {
          [0, 3, 5].forEach((printerMarginMm) => {
            [false, true].forEach((uniformTabs) => {
              focuses.forEach((cropFocus) => {
                [1, 1.37, 2].forEach((imageScale) => {
                  verifyContinuity({
                    imageWidthPx,
                    imageHeightPx,
                    rows,
                    columns,
                    overlapMm,
                    printerMarginMm,
                    fitMode: 'cover',
                    cropFocus,
                    imageScale,
                    uniformTabs,
                  });
                });
              });
              verifyContinuity({
                imageWidthPx,
                imageHeightPx,
                rows,
                columns,
                overlapMm,
                printerMarginMm,
                fitMode: 'fit',
                uniformTabs,
              });
            });
          });
        });
      });
    });
  });
});
