/** 소수점 한 자리로 반올림 (표시용). */
export function round(value: number) {
  return Math.round(value * 10) / 10;
}

/** 소수점 세 자리로 반올림 (입력 스텝 계산용). */
export function roundNumber(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** 숫자 입력 초안 정규화: 숫자와 소수점만 남기고 선행 0을 정리한다. */
export function normalizeNumberDraft(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '');
  if (cleaned === '') return '';

  const [integerPart, ...decimalParts] = cleaned.split('.');
  const integer = integerPart.replace(/^0+(?=\d)/, '') || '0';
  const decimal = decimalParts.join('');
  return cleaned.includes('.') ? `${integer}.${decimal}` : integer;
}

/** 회전 각도를 0~359 범위로 정규화한다. */
export function normalizeRotation(value: number) {
  return ((value % 360) + 360) % 360;
}
