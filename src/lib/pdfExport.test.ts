import { describe, expect, test } from 'vitest';
import { mmToPixels } from './pdfExport';

describe('PDF export raster sizing', () => {
  test('converts millimeters to pixels at the selected DPI', () => {
    expect(mmToPixels(25.4, 150)).toBe(150);
    expect(mmToPixels(25.4, 300)).toBe(300);
  });

  test('keeps tiny slices at least one pixel wide', () => {
    expect(mmToPixels(0, 300)).toBe(1);
    expect(mmToPixels(0.01, 150)).toBe(1);
  });
});
