import { describe, expect, test } from 'vitest';
import { resolveTargetSize } from './targetSize';

describe('resolveTargetSize', () => {
  test('입력한 가로·세로를 그대로 반환한다', () => {
    expect(resolveTargetSize({ widthMm: 1200, heightMm: 800 })).toEqual({
      widthMm: 1200,
      heightMm: 800,
    });
  });

  test('양수가 아니면 오류를 던진다', () => {
    expect(() => resolveTargetSize({ widthMm: 0, heightMm: 800 })).toThrow();
    expect(() => resolveTargetSize({ widthMm: 800, heightMm: -1 })).toThrow();
  });
});
