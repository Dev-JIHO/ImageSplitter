import { describe, expect, test } from 'vitest';
import { resolveTargetSize } from './targetSize';

describe('target size helpers', () => {
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
