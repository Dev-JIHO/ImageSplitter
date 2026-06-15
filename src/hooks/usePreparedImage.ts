import { useMemo } from 'react';
import type { LoadedImage } from '../lib/imageLoader';
import { createRotatedImageSource, type PreparedImage } from '../lib/imageSource';

/** 회전이 적용된 미리보기/내보내기용 이미지 소스를 만든다. */
export function usePreparedImage(
  loadedImage: LoadedImage | null,
  rotationDeg: number,
): PreparedImage | null {
  return useMemo(() => {
    if (!loadedImage) return null;
    return createRotatedImageSource(loadedImage.image, rotationDeg);
  }, [loadedImage, rotationDeg]);
}
