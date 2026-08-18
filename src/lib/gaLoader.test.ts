import { afterEach, describe, expect, it } from 'vitest';
import { loadGoogleAnalytics } from './gaLoader';

afterEach(() => {
  document.querySelectorAll('script[data-ga-id]').forEach((el) => el.remove());
  window.dataLayer = undefined;
  window.gtag = undefined;
});

describe('loadGoogleAnalytics', () => {
  it('측정 ID가 비어 있으면 아무것도 하지 않는다', () => {
    loadGoogleAnalytics('');
    expect(document.querySelector('script[data-ga-id]')).toBeNull();
    expect(window.gtag).toBeUndefined();
  });

  it('측정 ID가 있으면 gtag 스크립트를 삽입하고 초기화한다', () => {
    loadGoogleAnalytics('G-TEST123');

    const script = document.querySelector('script[data-ga-id="G-TEST123"]');
    expect(script).not.toBeNull();
    expect(script?.getAttribute('src')).toContain('id=G-TEST123');
    expect(window.gtag).toBeTypeOf('function');
    expect(window.dataLayer).toHaveLength(2);
  });

  it('dataLayer에 arguments 객체를 push한다 (배열로 바꾸면 gtag.js가 조용히 무시하고 실제 전송이 안 됨)', () => {
    loadGoogleAnalytics('G-TEST123');

    const [firstCall] = window.dataLayer as unknown as ArrayLike<unknown>[];
    // 실제 배열이었다면 Array.isArray가 true였을 것 — arguments 객체는 false여야 한다.
    expect(Array.isArray(firstCall)).toBe(false);
    expect(firstCall).toHaveLength(2);
    expect(Array.from(firstCall)).toEqual(['js', expect.any(Date)]);
  });

  it('같은 ID로 다시 호출해도 스크립트를 중복 삽입하지 않는다', () => {
    loadGoogleAnalytics('G-TEST123');
    loadGoogleAnalytics('G-TEST123');

    expect(document.querySelectorAll('script[data-ga-id="G-TEST123"]')).toHaveLength(1);
  });
});
