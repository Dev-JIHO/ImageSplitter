export interface ResolveTargetSizeInput {
  widthMm: number;
  heightMm: number;
}

export interface ResolvedTargetSize {
  widthMm: number;
  heightMm: number;
}

/** 완성 크기 한 변의 입력 상한(mm). 이보다 크면 필요한 A4 장수가 비현실적으로 많아진다. */
export const MAX_TARGET_SIZE_MM = 10000;

/** 완성 크기: 입력한 가로·세로(mm)를 그대로 사용한다(영역 고정, cover 배치). */
export function resolveTargetSize(
  input: ResolveTargetSizeInput,
): ResolvedTargetSize {
  assertPositive(input.widthMm, '완성 가로');
  assertPositive(input.heightMm, '완성 세로');
  return { widthMm: input.widthMm, heightMm: input.heightMm };
}

function assertPositive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label}은(는) 0보다 큰 숫자여야 합니다.`);
  }
  if (value > MAX_TARGET_SIZE_MM) {
    throw new Error(`${label}은(는) ${MAX_TARGET_SIZE_MM}mm를 넘을 수 없습니다.`);
  }
}
