import type { GridPlan } from '../lib/geometry';
import { round } from '../lib/num';
import { getActivePageWindow, type PosterLayout } from '../lib/posterLayout';
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

  const activeWindow = getActivePageWindow(plan, layout.slices);
  const activeRows = activeWindow.endRow - activeWindow.startRow + 1;
  const activeColumns = activeWindow.endColumn - activeWindow.startColumn + 1;

  return (
    <dl className="summary">
      <div>
        <dt>추천/설정</dt>
        <dd>{plan.orientation === 'portrait' ? 'A4 세로' : 'A4 가로'} · {activeRows}행 x {activeColumns}열</dd>
      </div>
      <div>
        <dt>PDF</dt>
        <dd>{layout.slices.length}장</dd>
      </div>
      <div>
        <dt>팔레트</dt>
        <dd>{round(activeWindow.widthMm)} x {round(activeWindow.heightMm)}mm</dd>
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
