import { describe, expect, it } from 'vitest';
import { calculatePreviewToolbarPosition } from './previewToolbar';

describe('calculatePreviewToolbarPosition', () => {
  it('places the toolbar outside the canvas with right edges aligned', () => {
    expect(
      calculatePreviewToolbarPosition(
        { top: 50, right: 1300 },
        { top: 120, right: 1100 },
        { height: 40 },
      ),
    ).toEqual({ top: 22, right: 200 });
  });

  it('keeps a minimum inset when the canvas reaches the panel edge', () => {
    expect(
      calculatePreviewToolbarPosition(
        { top: 50, right: 1300 },
        { top: 50, right: 1300 },
        { height: 40 },
      ),
    ).toEqual({ top: 12, right: 0 });
  });
});
