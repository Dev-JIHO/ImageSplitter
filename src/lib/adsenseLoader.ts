declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_SCRIPT_SRC = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';

let scriptLoadPromise: Promise<void> | null = null;

/** 애드센스 스크립트를 지연 로드한다. 여러 번 호출해도 스크립트 태그는 한 번만 삽입된다. */
export function loadAdsenseScript(clientId: string): Promise<void> {
  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `${ADSENSE_SCRIPT_SRC}?client=${encodeURIComponent(clientId)}`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('애드센스 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  }
  return scriptLoadPromise;
}

/**
 * 하나의 광고 요소에 대해 한 번만 push한다.
 * React StrictMode의 이중 렌더나 재호출로 인한 중복 push를 막기 위한 가드.
 */
export function pushAdUnit(el: HTMLElement): void {
  if (el.dataset.adsensePushed === 'true') return;
  el.dataset.adsensePushed = 'true';
  (window.adsbygoogle = window.adsbygoogle || []).push({});
}
