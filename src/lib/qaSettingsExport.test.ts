import { describe, expect, test } from 'vitest';
import { createManualGridPlan } from './geometry';
import { createPosterLayout, getActivePageWindow } from './posterLayout';
import { createQaSettingsFilename, createQaSettingsSnapshot } from './qaSettingsExport';

describe('QA settings export', () => {
  test('captures settings and calculated active page values', () => {
    const plan = createManualGridPlan({
      orientation: 'portrait',
      rows: 4,
      columns: 4,
      overlapMm: 10,
      printerMarginMm: 38,
    });
    const layout = createPosterLayout(plan, {
      image: { widthPx: 1000, heightPx: 700 },
      fitMode: 'cover',
      outputFrameMm: { width: 1000, height: 700 },
    });
    const activeWindow = getActivePageWindow(plan, layout.slices);
    const snapshot = createQaSettingsSnapshot({
      appVersion: 'test',
      exportedAt: '2026-05-18T00:00:00.000Z',
      originalName: 'sample.png',
      imageSize: { widthPx: 1000, heightPx: 700 },
      settings: { mode: 'target', overlapMm: 10, printerMarginMm: 38 },
      plan,
      layout,
      activeWindow,
      targetSize: { widthMm: 1000, heightMm: 700 },
      previewCanvas: { widthPx: 1000, heightPx: 600 },
      userAgent: 'test-agent',
    });

    expect(snapshot.settings).toEqual({
      mode: 'target',
      overlapMm: 10,
      printerMarginMm: 38,
    });
    expect(snapshot.calculated.exportedPages).toBe(layout.slices.length);
    expect(snapshot.calculated.plannedPages).toBe(plan.pageCount);
    expect(snapshot.slices).toHaveLength(layout.slices.length);
    expect(snapshot.previewCanvas).toEqual({ widthPx: 1000, heightPx: 600 });
  });

  test('creates a stable QA filename from the uploaded image name', () => {
    expect(createQaSettingsFilename('cat photo.avif')).toBe('cat-photo-qa-settings.json');
    expect(createQaSettingsFilename()).toBe('image-qa-settings.json');
  });
});
