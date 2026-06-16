export interface ResolveTargetSizeInput {
  widthMm: number;
  heightMm: number;
}

export interface ResolvedTargetSize {
  widthMm: number;
  heightMm: number;
}

/** 완성 크기: 입력한 가로·세로(mm)를 그대로 사용한다(영역 고정, cover 배치). */
export function resolveTargetSize(
  input: ResolveTargetSizeInput,
): ResolvedTargetSize {
  assertPositive(input.widthMm, 'Target width');
  assertPositive(input.heightMm, 'Target height');
  return { widthMm: input.widthMm, heightMm: input.heightMm };
}

function assertPositive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }
}
