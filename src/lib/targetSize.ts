import type { ImageSize } from './posterLayout';

export type TargetSizeMode = 'width' | 'height';

export interface ResolveTargetSizeInput {
  mode: TargetSizeMode;
  widthMm: number;
  heightMm: number;
  image: ImageSize;
}

export interface ResolvedTargetSize {
  widthMm: number;
  heightMm: number;
}

export function resolveTargetSize(
  input: ResolveTargetSizeInput,
): ResolvedTargetSize {
  if (input.image.widthPx <= 0 || input.image.heightPx <= 0) {
    throw new Error('Image dimensions must be positive.');
  }
  const imageRatio = input.image.widthPx / input.image.heightPx;

  if (input.mode === 'width') {
    assertPositive(input.widthMm, 'Target width');
    return {
      widthMm: input.widthMm,
      heightMm: input.widthMm / imageRatio,
    };
  }

  assertPositive(input.heightMm, 'Target height');
  return {
    widthMm: input.heightMm * imageRatio,
    heightMm: input.heightMm,
  };
}

function assertPositive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }
}
