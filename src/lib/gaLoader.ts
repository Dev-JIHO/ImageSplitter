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
  const dataLayer = window.dataLayer;
  // gtag.js는 실제 arguments 객체를 기대한다. 화살표 함수의 rest 파라미터로 만든 배열을 넘기면
  // 에러 없이 조용히 무시되어(collect 요청 자체가 나가지 않음) 실측 검증 전까지 알아채기 어렵다.
  const gtag: (...args: unknown[]) => void = function () {
    // eslint-disable-next-line prefer-rest-params -- gtag.js가 arguments 객체 형태를 요구함
    dataLayer.push(arguments);
  };
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId);
}
