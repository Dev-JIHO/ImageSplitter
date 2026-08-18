import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT_ID } from '../lib/adsenseConfig';
import { loadAdsenseScript, pushAdUnit } from '../lib/adsenseLoader';

/**
 * 콘텐츠 페이지(guide/faq/about) 전용 수동 광고 유닛.
 * ADSENSE_CLIENT_ID가 비어 있으면(승인 전) 아무것도 렌더링하지 않는다.
 * 도구 화면(App.tsx)에는 사용하지 않는다 — .app-shell이 height:100vh; overflow:hidden 구조라 공간이 없다.
 */
export function AdSlot({
  slot,
  enabled = true,
  format = 'auto',
  style,
}: {
  slot: string;
  /** false면 로드/push를 건너뛴다 (예: PDF 내보내기 중 새 광고를 불러오지 않으려는 경우). */
  enabled?: boolean;
  format?: string;
  style?: React.CSSProperties;
}) {
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !ADSENSE_CLIENT_ID || !slot || pushedRef.current) return;
    const el = insRef.current;
    if (!el) return;

    pushedRef.current = true;
    loadAdsenseScript(ADSENSE_CLIENT_ID)
      .then(() => pushAdUnit(el))
      .catch(() => {
        pushedRef.current = false;
      });
  }, [enabled, slot]);

  if (!ADSENSE_CLIENT_ID || !slot) return null;

  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={style ?? { display: 'block' }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
