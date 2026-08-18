/**
 * 애드센스 계정 승인 후 발급받는 값으로 채워야 하는 설정.
 * 승인 전까지는 빈 문자열로 두면 AdSlot이 아무것도 렌더링하지 않는다.
 */
export const ADSENSE_CLIENT_ID = '';

/** ca-pub-... 형태의 게시자 ID에서 slot별 광고 단위 ID. 콘텐츠 페이지별로 발급받아 채운다. */
export const ADSENSE_SLOTS = {
  guide: '',
  faq: '',
  about: '',
} as const;

/**
 * 자동 광고는 끈 상태를 유지한다 (앱 화면에 임의로 앵커/전면 광고가 삽입되는 것을 막기 위함).
 * 애드센스 콘솔의 "자동 광고" 설정도 별도로 꺼야 한다 — 이 상수는 코드 쪽 의도를 문서화하는 용도.
 */
export const AUTO_ADS_ENABLED = false;
