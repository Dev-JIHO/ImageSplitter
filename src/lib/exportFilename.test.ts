import { describe, expect, test } from 'vitest';
import { createExportFilename } from './exportFilename';

describe('createExportFilename', () => {
  test('creates a manual mode filename with grid and page count', () => {
    expect(
      createExportFilename({
        originalName: 'family photo.jpg',
        rows: 3,
        columns: 5,
        pageCount: 15,
      }),
    ).toBe('family-photo-A4-3x5-15pages.pdf');
  });

  test('adds target size when available', () => {
    expect(
      createExportFilename({
        originalName: 'poster:sample.png',
        rows: 2,
        columns: 4,
        pageCount: 8,
        targetWidthMm: 1000,
        targetHeightMm: 700,
      }),
    ).toBe('poster-sample-A4-2x4-1000x700mm.pdf');
  });

  test('uses a fallback name when the original file name is empty after cleanup', () => {
    expect(
      createExportFilename({
        originalName: '///.jpg',
        rows: 1,
        columns: 2,
        pageCount: 2,
      }),
    ).toBe('image-A4-1x2-2pages.pdf');
  });
});
