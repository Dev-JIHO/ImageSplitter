import { describe, expect, test } from 'vitest';
import {
  createManualGridPlan,
  getA4Size,
  recommendTargetGrid,
} from './geometry';

describe('geometry', () => {
  test('returns A4 dimensions for portrait and landscape', () => {
    expect(getA4Size('portrait')).toEqual({ widthMm: 210, heightMm: 297 });
    expect(getA4Size('landscape')).toEqual({ widthMm: 297, heightMm: 210 });
  });

  test('creates a manual grid plan from full A4 pages without outer margin', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 2,
      columns: 3,
      overlapMm: 5,
    });

    expect(plan).toMatchObject({
      orientation: 'portrait',
      rows: 2,
      columns: 3,
      page: { widthMm: 210, heightMm: 297 },
      totalWidthMm: 630,
      totalHeightMm: 594,
      contentWidthMm: 620,
      contentHeightMm: 589,
      pageCount: 6,
      marginMm: 0,
      overlapMm: 5,
    });
  });

  test('rejects impossible manual grid values', () => {
    expect(() =>
      createManualGridPlan({
        orientation: 'portrait',
        rows: 0,
        columns: 1,
        overlapMm: 0,
      }),
    ).toThrow('Rows and columns must be positive integers.');

    expect(() =>
      createManualGridPlan({
        orientation: 'portrait',
        rows: 1,
        columns: 1,
        overlapMm: 210,
      }),
    ).toThrow('Overlap must be smaller than both page dimensions.');
  });

  test('recommends the fewest A4 sheets for a target size', () => {
    const plan = recommendTargetGrid({
      targetWidthMm: 500,
      targetHeightMm: 400,
      overlapMm: 10,
    });

    expect(plan).toMatchObject({
      orientation: 'landscape',
      rows: 2,
      columns: 2,
      pageCount: 4,
    });
    expect(plan.contentWidthMm).toBeGreaterThanOrEqual(500);
    expect(plan.contentHeightMm).toBeGreaterThanOrEqual(400);
  });

  test('uses printer margin compensation when recommending target grids', () => {
    const uncompensated = recommendTargetGrid({
      targetWidthMm: 202,
      targetHeightMm: 280,
      overlapMm: 0,
      printerMarginMm: 0,
    });
    const compensated = recommendTargetGrid({
      targetWidthMm: 202,
      targetHeightMm: 280,
      overlapMm: 0,
      printerMarginMm: 5,
    });

    expect(uncompensated.pageCount).toBe(1);
    expect(compensated.pageCount).toBeGreaterThan(1);
    expect(compensated.printerMarginMm).toBe(5);
  });

  test('uses aspect ratio as a tie breaker after page count and unused area', () => {
    const plan = recommendTargetGrid({
      targetWidthMm: 290,
      targetHeightMm: 250,
      overlapMm: 0,
    });

    expect(plan).toMatchObject({
      orientation: 'portrait',
      rows: 1,
      columns: 2,
      pageCount: 2,
    });
  });
  test('완성 크기 모드에서 용지 방향을 지정하면 그 방향으로만 격자를 만든다', () => {
    const portrait = recommendTargetGrid({
      targetWidthMm: 600,
      targetHeightMm: 400,
      overlapMm: 10,
      printerMarginMm: 5,
      orientation: 'portrait',
    });
    expect(portrait.orientation).toBe('portrait');

    const landscape = recommendTargetGrid({
      targetWidthMm: 600,
      targetHeightMm: 400,
      overlapMm: 10,
      printerMarginMm: 5,
      orientation: 'landscape',
    });
    expect(landscape.orientation).toBe('landscape');
  });

});
