import type { GridPlan } from '../lib/geometry';
import { round } from '../lib/num';
import type { PosterLayout } from '../lib/posterLayout';
import type { Settings } from '../types';

export function ExportConfirmModal({
  plan,
  layout,
  settings,
  printScaleFactor = 1,
  onCancel,
  onConfirm,
  isExporting,
}: {
  plan: GridPlan;
  layout: PosterLayout;
  settings: Settings;
  printScaleFactor?: number;
  onCancel: () => void;
  onConfirm: () => void;
  isExporting: boolean;
}) {
  const zoomed = settings.imageScale > 1;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="export-title">
        <h2 id="export-title">PDF 만들기 전 확인</h2>
        <dl className="confirm-list">
          <div>
            <dt>A4 방향</dt>
            <dd>{plan.orientation === 'portrait' ? '세로' : '가로'}</dd>
          </div>
          <div>
            <dt>총 장수</dt>
            <dd>{layout.slices.length}장</dd>
          </div>
          <div>
            <dt>이미지 배치 크기</dt>
            <dd>{round(layout.imageFrameMm.width)} x {round(layout.imageFrameMm.height)}mm</dd>
          </div>
          <div>
            <dt>페이지 번호</dt>
            <dd>{settings.showPageNumbers ? '표시' : '숨김'}</dd>
          </div>
          <div>
            <dt>풀칠 영역 표시</dt>
            <dd>{settings.showGlueMarks ? `${settings.overlapMm}mm 표시` : `${settings.overlapMm}mm, 표시 숨김`}</dd>
          </div>
          <div>
            <dt>회전</dt>
            <dd>{settings.rotationDeg}도</dd>
          </div>
          <div>
            <dt>확대</dt>
            <dd>{Math.round(settings.imageScale * 100)}%</dd>
          </div>
          <div>
            <dt>출력 해상도</dt>
            <dd>{settings.exportDpi} DPI</dd>
          </div>
          <div>
            <dt>여백 설정</dt>
            <dd>{settings.printerMarginMm > 0 ? `${settings.printerMarginMm}mm` : '없음'}</dd>
          </div>
          <div>
            <dt>인쇄 배율 보정</dt>
            <dd>
              {printScaleFactor !== 1
                ? `${Math.round(printScaleFactor * 1000) / 10}% (실측 ${settings.measuredSquareMm}mm)`
                : '없음'}
            </dd>
          </div>
        </dl>
        {zoomed ? (
          <p className="modal-warning">
            확대({Math.round(settings.imageScale * 100)}%) 상태라 팔레트 밖으로 넘치는
            가장자리는 잘립니다. 잘림을 없애려면 확대를 원래대로(100%) 되돌리세요.
          </p>
        ) : null}
        <p className="modal-warning">
          인쇄 창에서 실제 크기 또는 100%를 선택하고, 용지에 맞춤은 꺼야 완성 크기가 유지됩니다.
        </p>
        {settings.printerMarginMm <= 0 ? (
          <p className="modal-warning">
            여백 설정이 없음입니다. 대부분의 프린터는 종이 가장자리 3~5mm를 인쇄하지 못해
            이미지 가장자리가 잘릴 수 있습니다. 잘림이 발생하면 여백을 3mm 이상으로 설정해주세요.
          </p>
        ) : null}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            다시 확인하기
          </button>
          <button type="button" className="export-button" onClick={onConfirm} disabled={isExporting}>
            {isExporting ? 'PDF 생성 중' : '확인하고 PDF 만들기'}
          </button>
        </div>
      </section>
    </div>
  );
}
