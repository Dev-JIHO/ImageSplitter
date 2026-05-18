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

  test('creates a manual grid plan from A4 pages minus outer margin', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 2,
      columns: 3,
      marginMm: 10,
      overlapMm: 5,
    });

    expect(plan).toMatchObject({
      orientation: 'portrait',
      rows: 2,
      columns: 3,
      page: { widthMm: 210, heightMm: 297 },
      totalWidthMm: 630,
      totalHeightMm: 594,
      contentWidthMm: 610,
      contentHeightMm: 574,
      pageCount: 6,
      marginMm: 10,
      overlapMm: 5,
    });
  });

  test('rejects impossible manual grid values', () => {
    expect(() =>
      createManualGridPlan({
        orientation: 'portrait',
        rows: 0,
        columns: 1,
        marginMm: 0,
        overlapMm: 0,
      }),
    ).toThrow('Rows and columns must be positive integers.');

    expect(() =>
      createManualGridPlan({
        orientation: 'portrait',
        rows: 1,
        columns: 1,
        marginMm: 120,
        overlapMm: 0,
      }),
    ).toThrow('Margin is too large for the selected grid.');

    expect(() =>
      createManualGridPlan({
        orientation: 'portrait',
        rows: 1,
        columns: 1,
        marginMm: 0,
        overlapMm: 210,
      }),
    ).toThrow('Overlap must be smaller than both page dimensions.');
  });

  test('recommends the fewest A4 sheets for a target size', () => {
    const plan = recommendTargetGrid({
      targetWidthMm: 500,
      targetHeightMm: 400,
      marginMm: 0,
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

  test('uses aspect ratio as a tie breaker after page count and unused area', () => {
    const plan = recommendTargetGrid({
      targetWidthMm: 290,
      targetHeightMm: 250,
      marginMm: 0,
      overlapMm: 0,
    });

    expect(plan).toMatchObject({
      orientation: 'portrait',
      rows: 1,
      columns: 2,
      pageCount: 2,
    });
  });
});
