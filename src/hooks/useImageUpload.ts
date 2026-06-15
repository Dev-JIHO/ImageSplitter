import { useEffect, useState } from 'react';
import { loadImageFile, type LoadedImage } from '../lib/imageLoader';

/**
 * 이미지 파일 로딩과 에러 상태를 관리한다.
 * 이미지가 교체되거나 컴포넌트가 사라질 때 이전 objectURL을 해제한다.
 */
export function useImageUpload(onLoaded: () => void) {
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    if (!loadedImage) return;
    const { url } = loadedImage;
    return () => URL.revokeObjectURL(url);
  }, [loadedImage]);

  async function handleFileChange(file: File | undefined) {
    setImageError('');
    if (!file) return;

    try {
      const nextImage = await loadImageFile(file);
      setLoadedImage(nextImage);
      onLoaded();
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : '이미지를 불러올 수 없습니다.',
      );
    }
  }

  return { loadedImage, imageError, handleFileChange };
}
