import { describe, expect, test } from 'vitest';
import { alignedSliceRect, mmToPixels } from './pdfExport';

describe('PDF export raster sizing', () => {
  test('converts millimeters to pixels at the selected DPI', () => {
    expect(mmToPixels(25.4, 150)).toBe(150);
    expect(mmToPixels(25.4, 300)).toBe(300);
  });

  test('keeps tiny slices at least one pixel wide', () => {
    expect(mmToPixels(0, 300)).toBe(1);
    expect(mmToPixels(0.01, 150)).toBe(1);
  });

  test('aligns slice pixel bounds from absolute preview coordinates', () => {
    expect(
      alignedSliceRect(
        {
          previewXmm: 210,
          previewYmm: 0,
          previewWidthMm: 210,
          previewHeightMm: 297,
        },
        200,
      ),
    ).toEqual({
      x: 1653,
      y: 0,
      width: 1655,
      height: 2339,
    });
  });
});
