import { describe, expect, it } from 'vitest';
import {
  isHeicFile,
  MAX_FILE_SIZE_BYTES,
  MAX_IMAGE_PIXELS,
  validateFileSize,
  validateImagePixels,
} from './imageLoader';

describe('isHeicFile', () => {
  it('MIME 타입으로 판정한다', () => {
    expect(isHeicFile({ type: 'image/heic', name: 'photo.dat' })).toBe(true);
    expect(isHeicFile({ type: 'image/heif', name: 'photo.dat' })).toBe(true);
  });

  it('MIME 타입이 비어있어도 확장자로 판정한다', () => {
    expect(isHeicFile({ type: '', name: 'IMG_0001.HEIC' })).toBe(true);
    expect(isHeicFile({ type: '', name: 'photo.heif' })).toBe(true);
  });

  it('일반 이미지는 HEIC이 아니다', () => {
    expect(isHeicFile({ type: 'image/jpeg', name: 'photo.jpg' })).toBe(false);
  });
});

describe('validateFileSize', () => {
  it('상한 이하는 통과시킨다', () => {
    expect(validateFileSize(MAX_FILE_SIZE_BYTES)).toBeNull();
  });

  it('상한을 넘으면 에러 메시지를 반환한다', () => {
    expect(validateFileSize(MAX_FILE_SIZE_BYTES + 1)).toMatch(/파일 크기/);
  });
});

describe('validateImagePixels', () => {
  it('상한 이하는 통과시킨다', () => {
    expect(validateImagePixels(8000, 7500)).toBeNull();
  });

  it('상한을 넘으면 에러 메시지를 반환한다', () => {
    const over = Math.ceil(Math.sqrt(MAX_IMAGE_PIXELS)) + 1000;
    expect(validateImagePixels(over, over)).toMatch(/해상도/);
  });
});
