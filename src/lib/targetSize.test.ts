import { describe, expect, test } from 'vitest';
import { resolveTargetSize } from './targetSize';

describe('target size helpers', () => {
  test('keeps both dimensions when both are provided', () => {
    expect(
      resolveTargetSize({
        mode: 'both',
        widthMm: 600,
        heightMm: 400,
        image: { widthPx: 1200, heightPx: 800 },
      }),
    ).toEqual({ widthMm: 600, heightMm: 400 });
  });

  test('derives height from width and source image ratio', () => {
    expect(
      resolveTargetSize({
        mode: 'width',
        widthMm: 900,
        heightMm: 1,
        image: { widthPx: 3000, heightPx: 2000 },
      }),
    ).toEqual({ widthMm: 900, heightMm: 600 });
  });

  test('derives width from height and source image ratio', () => {
    expect(
      resolveTargetSize({
        mode: 'height',
        widthMm: 1,
        heightMm: 600,
        image: { widthPx: 3000, heightPx: 2000 },
      }),
    ).toEqual({ widthMm: 900, heightMm: 600 });
  });
});
