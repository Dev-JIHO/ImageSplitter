import type { ImageSize } from './posterLayout';

export interface LoadedImage {
  image: HTMLImageElement;
  url: string;
  size: ImageSize;
  name: string;
}

export function loadImageFile(file: File): Promise<LoadedImage> {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('이미지 파일을 선택해주세요.'));
  }

  const url = URL.createObjectURL(file);
  const image = new Image();

  return new Promise((resolve, reject) => {
    image.onload = () => {
      resolve({
        image,
        url,
        size: {
          widthPx: image.naturalWidth,
          heightPx: image.naturalHeight,
        },
        name: file.name,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 읽을 수 없습니다.'));
    };
    image.src = url;
  });
}
