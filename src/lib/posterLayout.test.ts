import { describe, expect, test } from 'vitest';
import { createManualGridPlan, recommendTargetGrid } from './geometry';
import { createPosterLayout, getPhysicalPrintableFrame } from './posterLayout';

describe('poster layout', () => {
  test('cover mode fills the content area and crops from the center', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 1,
      columns: 1,
      marginMm: 0,
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
      marginMm: 0,
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
      marginMm: 0,
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
      marginMm: 0,
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
      marginMm: 10,
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
    expect(layout.imageFrameMm.width).toBe(190);
    expect(layout.imageFrameMm.height).toBe(95);
    expect(layout.imageFrameMm.x).toBe(10);
    expect(layout.imageFrameMm.y).toBe(101);
  });

  test('creates one slice per grid cell with page-local PDF placement', () => {
    const plan = createManualGridPlan({
      orientation: 'landscape',
      rows: 2,
      columns: 3,
      marginMm: 10,
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
      destXmm: 10,
      destYmm: 10,
    });
    expect(layout.slices[5]).toMatchObject({
      row: 1,
      column: 2,
      pageNumber: 6,
    });
  });

  test('keeps outer margin visible in a single-page PDF slice', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 1,
      columns: 1,
      marginMm: 12,
      overlapMm: 0,
    });

    const layout = createPosterLayout(plan, {
      image: { widthPx: 800, heightPx: 1000 },
      fitMode: 'cover',
    });

    expect(layout.slices[0]).toMatchObject({
      destXmm: 12,
      destYmm: 12,
      destWidthMm: 186,
      destHeightMm: 273,
    });
  });

  test('extends internal page slices by overlap without changing page count', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 1,
      columns: 2,
      marginMm: 0,
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
      marginMm: 10,
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
      plan.marginMm + (plan.totalWidthMm - plan.marginMm * 2 - 500) / 2,
      6,
    );
    expect(layout.outputFrameMm.y).toBeCloseTo(
      plan.marginMm + (plan.totalHeightMm - plan.marginMm * 2 - 300) / 2,
      6,
    );
    expect(layout.outputFrameMm.x).toBeCloseTo(
      plan.marginMm + (plan.totalWidthMm - plan.marginMm * 2 - 500) / 2,
      6,
    );
  });

  test('uses physical printable frame for preview margins when overlap is set', () => {
    const plan = recommendTargetGrid({
      targetWidthMm: 1288.5,
      targetHeightMm: 1000,
      marginMm: 5,
      overlapMm: 10,
    });

    const frame = getPhysicalPrintableFrame(plan);

    expect(frame).toEqual({
      x: 5,
      y: 5,
      width: plan.totalWidthMm - 10,
      height: plan.totalHeightMm - 10,
    });
    expect(frame.width).toBeGreaterThan(plan.contentWidthMm);
  });

  test('places page labels in page margin when margin has enough room', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 1,
      columns: 1,
      marginMm: 12,
      overlapMm: 0,
    });

    const layout = createPosterLayout(plan, {
      image: { widthPx: 800, heightPx: 1000 },
      fitMode: 'cover',
    });

    expect(layout.slices[0].labelText).toBe('1-1');
    expect(layout.slices[0].labelYmm).toBeGreaterThan(
      layout.slices[0].destYmm + layout.slices[0].destHeightMm,
    );
  });
});
