import { describe, expect, test } from 'vitest';
import { createManualGridPlan, recommendTargetGrid } from './geometry';
import {
  createPosterLayout,
  getActivePageWindow,
  getGlueMarks,
  getPhysicalPrintableFrame,
  getPreviewPageLabelPosition,
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

  test('reserves internal overlap as a blank glue tab without duplicating image content', () => {
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
    expect(left.destWidthMm).toBe(200);
    expect(right.destXmm).toBe(0);
    expect(left.sourceX + left.sourceWidth).toBeCloseTo(right.sourceX, 6);
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
      (plan.contentWidthMm - 500) / 2,
      6,
    );
    expect(layout.outputFrameMm.y).toBeCloseTo(
      (plan.contentHeightMm - 300) / 2,
      6,
    );
    expect(layout.outputFrameMm.x).toBeCloseTo(
      (plan.contentWidthMm - 500) / 2,
      6,
    );
  });

  test('keeps printer-margin compensated content in logical assembled coordinates', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 4,
      columns: 4,
      overlapMm: 0,
      printerMarginMm: 5,
    });

    const layout = createPosterLayout(plan, {
      image: { widthPx: 1000, heightPx: 1000 },
      fitMode: 'cover',
    });

    expect(layout.outputFrameMm.x).toBe(0);
    expect(layout.outputFrameMm.y).toBe(0);
    expect(layout.outputFrameMm.x + layout.outputFrameMm.width / 2).toBeCloseTo(
      plan.contentWidthMm / 2,
      6,
    );
    expect(layout.outputFrameMm.y + layout.outputFrameMm.height / 2).toBeCloseTo(
      plan.contentHeightMm / 2,
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

  test('빈 공간이 전혀 없으면 페이지 번호를 표시하지 않는다(showLabel=false)', () => {
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
    expect(layout.slices[0].showLabel).toBe(false);
  });

  test('places page labels on the bottom glue tab when available', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 2,
      columns: 1,
      overlapMm: 12,
    });
    const layout = createPosterLayout(plan, {
      image: { widthPx: 800, heightPx: 1000 },
      fitMode: 'cover',
    });
    const topSlice = layout.slices.find((slice) => slice.row === 0);

    expect(topSlice).toBeDefined();
    expect(topSlice!.labelYmm).toBeGreaterThan(
      topSlice!.destYmm + topSlice!.destHeightMm,
    );
    expect(topSlice!.labelYmm).toBeLessThanOrEqual(plan.page.heightMm - 4);
  });

  test('places page labels on the right glue tab when bottom glue is unavailable', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 1,
      columns: 2,
      overlapMm: 12,
    });
    const layout = createPosterLayout(plan, {
      image: { widthPx: 1000, heightPx: 500 },
      fitMode: 'cover',
    });
    const leftSlice = layout.slices.find((slice) => slice.column === 0);

    expect(leftSlice).toBeDefined();
    expect(leftSlice!.labelXmm).toBeGreaterThanOrEqual(
      leftSlice!.destXmm + leftSlice!.destWidthMm,
    );
  });

  test('converts page-local label positions to preview-global positions', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 2,
      columns: 2,
      overlapMm: 0,
    });
    const layout = createPosterLayout(plan, {
      image: { widthPx: 800, heightPx: 1000 },
      fitMode: 'cover',
    });
    const slice = layout.slices.find((item) => item.row === 1 && item.column === 1);

    expect(slice).toBeDefined();
    // 풀칠 0mm의 마지막 장은 번호를 표시하지 않지만 라벨 좌표 변환 자체는 동작한다.
    expect(slice!.showLabel).toBe(false);
    expect(getPreviewPageLabelPosition(plan, slice!)).toEqual({
      x: 406,
      y: 592,
    });
  });

  test('calculates the active preview window from pages that actually contain image data', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 4,
      columns: 4,
      overlapMm: 10,
    });
    const layout = createPosterLayout(plan, {
      image: { widthPx: 1000, heightPx: 1000 },
      fitMode: 'cover',
      outputFrameMm: { width: 300, height: 300 },
    });
    const window = getActivePageWindow(plan, layout.slices);

    expect(window.pageCount).toBe(layout.slices.length);
    expect(window.pageCount).toBeLessThan(plan.pageCount);
    expect(window).toMatchObject({
      startRow: 1,
      endRow: 2,
      startColumn: 1,
      endColumn: 2,
      widthMm: 420,
      heightMm: 594,
    });
    expect(layout.slices[0].labelText).toBe('1-1');
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

  test('preserves the full source image when overlap and printer margin are both set', () => {
    const plan = createManualGridPlan({
      orientation: 'landscape',
      rows: 2,
      columns: 4,
      overlapMm: 10,
      printerMarginMm: 38,
    });
    const image = { widthPx: 1448, heightPx: 1161 };
    const layout = createPosterLayout(plan, {
      image,
      fitMode: 'fit',
    });
    const minSourceX = Math.min(...layout.slices.map((slice) => slice.sourceX));
    const minSourceY = Math.min(...layout.slices.map((slice) => slice.sourceY));
    const maxSourceX = Math.max(
      ...layout.slices.map((slice) => slice.sourceX + slice.sourceWidth),
    );
    const maxSourceY = Math.max(
      ...layout.slices.map((slice) => slice.sourceY + slice.sourceHeight),
    );

    expect(minSourceX).toBeCloseTo(0, 6);
    expect(minSourceY).toBeCloseTo(0, 6);
    expect(maxSourceX).toBeCloseTo(image.widthPx, 6);
    expect(maxSourceY).toBeCloseTo(image.heightPx, 6);
  });

  test('creates glue marks on blank right and bottom glue tabs', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 2,
      columns: 2,
      overlapMm: 10,
    });
    const layout = createPosterLayout(plan, {
      image: { widthPx: 1000, heightPx: 1000 },
      fitMode: 'cover',
    });

    const marks = getGlueMarks(plan, layout.slices);

    expect(marks).toEqual([
      {
        row: 0,
        column: 0,
        xMm: 200,
        yMm: 0,
        widthMm: 10,
        heightMm: 287,
        previewXmm: 200,
        previewYmm: 0,
      },
      {
        row: 0,
        column: 0,
        xMm: 0,
        yMm: 287,
        widthMm: 200,
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

  test('attaches glue marks to printed image edge when printer margin is larger than overlap', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 1,
      columns: 2,
      overlapMm: 5,
      printerMarginMm: 20,
    });
    const layout = createPosterLayout(plan, {
      image: { widthPx: 1000, heightPx: 500 },
      fitMode: 'cover',
    });
    const marks = getGlueMarks(plan, layout.slices);
    const leftSlice = layout.slices.find((slice) => slice.row === 0 && slice.column === 0);

    expect(leftSlice).toBeDefined();
    expect(marks[0]).toMatchObject({
      row: 0,
      column: 0,
      xMm: leftSlice!.destXmm + leftSlice!.destWidthMm,
      previewXmm: leftSlice!.previewXmm + leftSlice!.previewWidthMm,
      widthMm: plan.overlapMm,
    });
    expect(marks[0].xMm).toBeLessThan(plan.page.widthMm - plan.overlapMm);
  });

  test('places glue marks outside the printed image when printer margin leaves room', () => {
    const plan = createManualGridPlan({
      orientation: 'landscape',
      rows: 5,
      columns: 5,
      overlapMm: 5,
      printerMarginMm: 38,
    });
    const layout = createPosterLayout(plan, {
      image: { widthPx: 1448, heightPx: 1161 },
      fitMode: 'fit',
    });
    const marks = getGlueMarks(plan, layout.slices);
    const firstSlice = layout.slices[0];
    const firstRightMark = marks.find(
      (mark) => mark.row === firstSlice.row && mark.column === firstSlice.column && mark.widthMm === 5,
    );

    expect(firstRightMark).toBeDefined();
    expect(firstRightMark!.xMm).toBeCloseTo(firstSlice.destXmm + firstSlice.destWidthMm, 6);
    expect(firstRightMark!.xMm).toBeGreaterThanOrEqual(
      firstSlice.destXmm + firstSlice.destWidthMm,
    );
  });
});
