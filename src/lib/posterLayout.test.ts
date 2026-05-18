import { describe, expect, test } from 'vitest';
import { createManualGridPlan, recommendTargetGrid } from './geometry';
import {
  createPosterLayout,
  getGlueMarks,
  getPhysicalPrintableFrame,
} from './posterLayout';

describe('poster layout', () => {
  test('cover mode fills the content area and crops from the center', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 1,
      columns: 1,
      overlapMm: 0,
    });

    const layout = createPosterLayout(plan, {
      image: { widthPx: 1000, heightPx: 500 },
      fitMode: 'cover',
    });

    expect(layout.sourceWidth).toBeCloseTo(353.535, 3);
    expect(layout.sourceHeight).toBe(500);
    expect(layout.sourceX).toBeCloseTo(323.232, 3);
    expect(layout.sourceY).toBe(0);
    expect(layout.imageFrameMm).toEqual({
      x: 0,
      y: 0,
      width: 210,
      height: 297,
    });
  });

  test('cover mode can focus the cropped source toward the left edge', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 1,
      columns: 1,
      overlapMm: 0,
    });

    const layout = createPosterLayout(plan, {
      image: { widthPx: 1000, heightPx: 500 },
      fitMode: 'cover',
      cropFocus: { x: 0, y: 0.5 },
    });

    expect(layout.sourceX).toBe(0);
    expect(layout.sourceY).toBe(0);
    expect(layout.sourceWidth).toBeCloseTo(353.535, 3);
  });

  test('cover crop focus is clamped inside the source image', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 1,
      columns: 1,
      overlapMm: 0,
    });

    const layout = createPosterLayout(plan, {
      image: { widthPx: 1000, heightPx: 500 },
      fitMode: 'cover',
      cropFocus: { x: 2, y: -1 },
    });

    expect(layout.sourceX).toBeCloseTo(646.465, 3);
    expect(layout.sourceY).toBe(0);
  });

  test('cover image scale zooms into the focused source area', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 1,
      columns: 1,
      overlapMm: 0,
    });

    const layout = createPosterLayout(plan, {
      image: { widthPx: 1000, heightPx: 500 },
      fitMode: 'cover',
      cropFocus: { x: 0.5, y: 0.5 },
      imageScale: 2,
    });

    expect(layout.sourceWidth).toBeCloseTo(176.768, 3);
    expect(layout.sourceHeight).toBe(250);
    expect(layout.sourceX).toBeCloseTo(411.616, 3);
    expect(layout.sourceY).toBe(125);
  });

  test('fit mode keeps the full source image visible inside the content area', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 1,
      columns: 1,
      overlapMm: 0,
    });

    const layout = createPosterLayout(plan, {
      image: { widthPx: 1000, heightPx: 500 },
      fitMode: 'fit',
    });

    expect(layout.sourceX).toBe(0);
    expect(layout.sourceY).toBe(0);
    expect(layout.sourceWidth).toBe(1000);
    expect(layout.sourceHeight).toBe(500);
    expect(layout.imageFrameMm.width).toBe(210);
    expect(layout.imageFrameMm.height).toBe(105);
    expect(layout.imageFrameMm.x).toBe(0);
    expect(layout.imageFrameMm.y).toBe(96);
  });

  test('creates one slice per grid cell with page-local PDF placement', () => {
    const plan = createManualGridPlan({
      orientation: 'landscape',
      rows: 2,
      columns: 3,
      overlapMm: 0,
    });

    const layout = createPosterLayout(plan, {
      image: { widthPx: 1200, heightPx: 800 },
      fitMode: 'cover',
    });

    expect(layout.slices).toHaveLength(6);
    expect(layout.slices[0]).toMatchObject({
      row: 0,
      column: 0,
      pageNumber: 1,
      destXmm: 0,
      destYmm: 0,
    });
    expect(layout.slices[5]).toMatchObject({
      row: 1,
      column: 2,
      pageNumber: 6,
    });
  });

  test('single-page PDF slice uses the full A4 page when no printer margin is set', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 1,
      columns: 1,
      overlapMm: 0,
    });

    const layout = createPosterLayout(plan, {
      image: { widthPx: 800, heightPx: 1000 },
      fitMode: 'cover',
    });

    expect(layout.slices[0]).toMatchObject({
      destXmm: 0,
      destYmm: 0,
      destWidthMm: 210,
      destHeightMm: 297,
    });
  });

  test('extends internal page slices by overlap without changing page count', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 1,
      columns: 2,
      overlapMm: 10,
    });

    const layout = createPosterLayout(plan, {
      image: { widthPx: 1000, heightPx: 707 },
      fitMode: 'cover',
    });
    const [left, right] = layout.slices;

    expect(layout.slices).toHaveLength(2);
    expect(left.destWidthMm).toBeGreaterThan(210);
    expect(right.destXmm).toBeLessThan(0);
  });

  test('centers a target output frame inside the available A4 palette', () => {
    const plan = recommendTargetGrid({
      targetWidthMm: 500,
      targetHeightMm: 300,
      overlapMm: 12,
    });

    const layout = createPosterLayout(plan, {
      image: { widthPx: 1000, heightPx: 600 },
      fitMode: 'cover',
      outputFrameMm: { width: 500, height: 300 },
    });

    expect(layout.outputFrameMm.width).toBe(500);
    expect(layout.outputFrameMm.height).toBe(300);
    expect(layout.outputFrameMm.x).toBeCloseTo(
      (plan.totalWidthMm - 500) / 2,
      6,
    );
    expect(layout.outputFrameMm.y).toBeCloseTo(
      (plan.totalHeightMm - 300) / 2,
      6,
    );
    expect(layout.outputFrameMm.x).toBeCloseTo(
      (plan.totalWidthMm - 500) / 2,
      6,
    );
  });

  test('uses physical printable frame for preview margins when overlap is set', () => {
    const plan = recommendTargetGrid({
      targetWidthMm: 1288.5,
      targetHeightMm: 1000,
      overlapMm: 10,
    });

    const frame = getPhysicalPrintableFrame(plan);

    expect(frame).toEqual({
      x: 0,
      y: 0,
      width: plan.totalWidthMm,
      height: plan.totalHeightMm,
    });
    expect(frame.width).toBeGreaterThan(plan.contentWidthMm);
  });

  test('places page labels near the page bottom when no separate margin exists', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 1,
      columns: 1,
      overlapMm: 0,
    });

    const layout = createPosterLayout(plan, {
      image: { widthPx: 800, heightPx: 1000 },
      fitMode: 'cover',
    });

    expect(layout.slices[0].labelText).toBe('1-1');
    expect(layout.slices[0].labelYmm).toBe(293);
  });

  test('keeps compensated page slices inside the page printable area', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 1,
      columns: 1,
      overlapMm: 0,
      printerMarginMm: 5,
    });

    const layout = createPosterLayout(plan, {
      image: { widthPx: 800, heightPx: 1000 },
      fitMode: 'cover',
    });

    expect(layout.slices[0]).toMatchObject({
      destXmm: 5,
      destYmm: 5,
      destWidthMm: 200,
      destHeightMm: 287,
    });
  });

  test('creates glue marks on right and bottom overlap tabs', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 2,
      columns: 2,
      overlapMm: 10,
    });

    const marks = getGlueMarks(plan);

    expect(marks).toEqual([
      {
        row: 0,
        column: 0,
        xMm: 200,
        yMm: 0,
        widthMm: 10,
        heightMm: 297,
        previewXmm: 200,
        previewYmm: 0,
      },
      {
        row: 0,
        column: 0,
        xMm: 0,
        yMm: 287,
        widthMm: 210,
        heightMm: 10,
        previewXmm: 0,
        previewYmm: 287,
      },
      {
        row: 0,
        column: 1,
        xMm: 0,
        yMm: 287,
        widthMm: 210,
        heightMm: 10,
        previewXmm: 210,
        previewYmm: 287,
      },
      {
        row: 1,
        column: 0,
        xMm: 200,
        yMm: 0,
        widthMm: 10,
        heightMm: 297,
        previewXmm: 200,
        previewYmm: 297,
      },
    ]);
  });
});
