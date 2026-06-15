import { normalizeRotation } from './num';

export interface PreparedImage {
  source: CanvasImageSource;
  size: { widthPx: number; heightPx: number };
}

/**
 * 회전이 적용된 이미지 소스를 만든다.
 * 캔버스 크기 계산이 90도 단위를 전제로 하므로 가장 가까운 90도 값으로 맞춘다.
 */
export function createRotatedImageSource(
  image: HTMLImageElement,
  rotationDeg: number,
): PreparedImage {
  const rotation = normalizeRotation(Math.round(rotationDeg / 90) * 90);
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;

  if (rotation === 0) {
    return {
      source: image as CanvasImageSource,
      size: { widthPx: sourceWidth, heightPx: sourceHeight },
    };
  }

  const canvas = document.createElement('canvas');
  const swapsAxes = rotation === 90 || rotation === 270;
  canvas.width = swapsAxes ? sourceHeight : sourceWidth;
  canvas.height = swapsAxes ? sourceWidth : sourceHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('이미지를 회전할 수 없습니다.');
  }

  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(image, -sourceWidth / 2, -sourceHeight / 2);

  return {
    source: canvas as CanvasImageSource,
    size: { widthPx: canvas.width, heightPx: canvas.height },
  };
}
