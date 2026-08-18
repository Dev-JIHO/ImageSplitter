import { GA_MEASUREMENT_ID } from './lib/gaConfig';
import { loadGoogleAnalytics } from './lib/gaLoader';

/** React가 마운트되지 않는 정적 페이지(guide/faq/about/privacy/terms)와 App 양쪽에서 공유하는 분석 진입점. */
loadGoogleAnalytics(GA_MEASUREMENT_ID);
