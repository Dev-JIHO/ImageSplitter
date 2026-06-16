import type { GridPlan } from '../lib/geometry';
import { round } from '../lib/num';
import type { PosterLayout } from '../lib/posterLayout';
import type { ResolvedTargetSize } from '../lib/targetSize';

export function Summary({
  plan,
  layout,
  targetSize,
  error,
}: {
  plan: GridPlan | null;
  layout: PosterLayout | null;
  targetSize: ResolvedTargetSize | null;
  error: string;
}) {
  if (error) {
    return <p className="error-text">{error}</p>;
  }

  if (!plan || !layout) {
    return <p className="hint-text">이미지를 업로드하고 설정을 입력해주세요.</p>;
  }

  const totalPages = plan.rows * plan.columns;
  const printedPages = layout.slices.length;

  return (
    <dl className="summary">
      <div>
        <dt>추천/설정</dt>
        <dd>{plan.orientation === 'portrait' ? 'A4 세로' : 'A4 가로'} · {plan.rows}행 x {plan.columns}열</dd>
      </div>
      <div>
        <dt>PDF</dt>
        <dd>
          {printedPages}장 인쇄
          {printedPages < totalPages ? ` (빈 ${totalPages - printedPages}장 제외)` : ''}
        </dd>
      </div>
      <div>
        <dt>팔레트</dt>
        <dd>{round(plan.totalWidthMm)} x {round(plan.totalHeightMm)}mm</dd>
      </div>
      <div>
        <dt>이미지 배치</dt>
        <dd>{round(layout.imageFrameMm.width)} x {round(layout.imageFrameMm.height)}mm</dd>
      </div>
      {targetSize ? (
        <div>
          <dt>요청 크기</dt>
          <dd>{round(targetSize.widthMm)} x {round(targetSize.heightMm)}mm</dd>
        </div>
      ) : null}
    </dl>
  );
}
