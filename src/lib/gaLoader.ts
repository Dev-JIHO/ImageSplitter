declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** GA_MEASUREMENT_ID가 비어 있으면(승인 전) 아무것도 하지 않는다. 같은 ID로 중복 호출해도 스크립트는 한 번만 삽입된다. */
export function loadGoogleAnalytics(measurementId: string): void {
  if (!measurementId) return;
  if (document.querySelector(`script[data-ga-id="${measurementId}"]`)) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.gaId = measurementId;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  const gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId);
}
