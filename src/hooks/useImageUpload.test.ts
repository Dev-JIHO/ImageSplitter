import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useImageUpload } from './useImageUpload';

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 800;
  naturalHeight = 600;
  private _src = '';
  set src(value: string) {
    this._src = value;
    queueMicrotask(() => this.onload?.());
  }
  get src() {
    return this._src;
  }
}

function makeFile(name: string, type: string) {
  return new File(['fake-image-bytes'], name, { type });
}

beforeEach(() => {
  vi.stubGlobal('Image', FakeImage);
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useImageUpload', () => {
  it('이미지를 불러오면 loadedImage를 채우고 onLoaded를 호출한다', async () => {
    const onLoaded = vi.fn();
    const { result } = renderHook(() => useImageUpload(onLoaded));

    await act(async () => {
      await result.current.handleFileChange(makeFile('photo.jpg', 'image/jpeg'));
    });

    expect(result.current.loadedImage?.name).toBe('photo.jpg');
    expect(result.current.loadedImage?.size).toEqual({ widthPx: 800, heightPx: 600 });
    expect(result.current.imageError).toBe('');
    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  it('지원하지 않는 파일 형식이면 에러 메시지를 채우고 loadedImage는 비워둔다', async () => {
    const onLoaded = vi.fn();
    const { result } = renderHook(() => useImageUpload(onLoaded));

    await act(async () => {
      await result.current.handleFileChange(makeFile('note.txt', 'text/plain'));
    });

    expect(result.current.loadedImage).toBeNull();
    expect(result.current.imageError).toMatch(/이미지 파일을 선택해주세요/);
    expect(onLoaded).not.toHaveBeenCalled();
  });

  it('용량 상한을 넘는 파일은 거부한다', async () => {
    const onLoaded = vi.fn();
    const { result } = renderHook(() => useImageUpload(onLoaded));
    const oversized = makeFile('big.jpg', 'image/jpeg');
    Object.defineProperty(oversized, 'size', { value: 51 * 1024 * 1024 });

    await act(async () => {
      await result.current.handleFileChange(oversized);
    });

    expect(result.current.loadedImage).toBeNull();
    expect(result.current.imageError).toMatch(/파일 크기/);
  });
});
