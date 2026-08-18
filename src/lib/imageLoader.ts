import type { ImageSize } from './posterLayout';

export interface LoadedImage {
  image: HTMLImageElement;
  url: string;
  size: ImageSize;
  name: string;
}

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 60_000_000;

/** HEIC/HEIF 여부 판정. 일부 브라우저는 이 형식의 file.type을 빈 문자열로 준다. */
export function isHeicFile(file: Pick<File, 'type' | 'name'>): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  );
}

export function validateFileSize(sizeBytes: number): string | null {
  if (sizeBytes <= MAX_FILE_SIZE_BYTES) return null;
  return `파일 크기가 너무 큽니다 (최대 ${Math.floor(MAX_FILE_SIZE_BYTES / 1024 / 1024)}MB).`;
}

export function validateImagePixels(widthPx: number, heightPx: number): string | null {
  if (widthPx * heightPx <= MAX_IMAGE_PIXELS) return null;
  return `이미지 해상도가 너무 큽니다 (최대 약 ${(MAX_IMAGE_PIXELS / 10000).toLocaleString('ko-KR')}만 픽셀).`;
}

/** heic2any는 라이브러리 용량이 커서(변환용 WASM 포함) HEIC 파일을 실제로 선택했을 때만 동적으로 불러온다. */
async function resolveImageBlob(file: File): Promise<Blob> {
  if (!isHeicFile(file)) return file;
  try {
    const { default: heic2any } = await import('heic2any');
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
    return Array.isArray(converted) ? converted[0] : converted;
  } catch {
    throw new Error('HEIC 이미지를 변환하지 못했습니다. 다른 형식으로 저장한 뒤 다시 시도해주세요.');
  }
}

export async function loadImageFile(file: File): Promise<LoadedImage> {
  if (!file.type.startsWith('image/') && !isHeicFile(file)) {
    throw new Error('이미지 파일을 선택해주세요.');
  }

  const sizeError = validateFileSize(file.size);
  if (sizeError) throw new Error(sizeError);

  const blob = await resolveImageBlob(file);
  const url = URL.createObjectURL(blob);
  const image = new Image();

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const widthPx = image.naturalWidth;
      const heightPx = image.naturalHeight;
      const pixelError = validateImagePixels(widthPx, heightPx);
      if (pixelError) {
        URL.revokeObjectURL(url);
        reject(new Error(pixelError));
        return;
      }
      resolve({ image, url, size: { widthPx, heightPx }, name: file.name });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 읽을 수 없습니다.'));
    };
    image.src = url;
  });
}
