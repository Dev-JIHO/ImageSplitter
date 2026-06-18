export function AdvancedHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adv-help-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="adv-help-title">고급 설정 안내</h2>
        <p className="hint-text">필요할 때만 건드리면 되는 선택 항목입니다.</p>
        <dl className="confirm-list">
          <div>
            <dt>프린터 테스트 · 크기 보정</dt>
            <dd>
              A4 2장을 먼저 인쇄해 100mm 사각형을 자로 재고 그 값을 입력하면, 실제 크기에
              맞게 모든 PDF가 자동 보정됩니다. 용지·잉크 낭비를 막는 가장 확실한 방법이에요.
            </dd>
          </div>
          <div>
            <dt>이어붙이기 (풀칠)</dt>
            <dd>
              이웃한 장이 겹치도록 가장자리에 남기는 여백 탭 크기입니다. 0mm면 겹침 없이 딱
              나뉘고, 값을 키우면 풀칠해 붙이기 쉬워집니다.
            </dd>
          </div>
          <div>
            <dt>인쇄 품질</dt>
            <dd>
              프린터 여백(가장자리 비인쇄 영역, 보통 3~5mm)과 출력 해상도(DPI)를 정합니다.
              해상도가 높을수록 선명하지만 PDF 생성이 느려질 수 있어요.
            </dd>
          </div>
          <div>
            <dt>표시 항목</dt>
            <dd>
              미리보기·PDF에 페이지 번호와 경계선을 표시할지 정합니다. 인쇄물에 선을 남기고
              싶지 않으면 경계선을 꺼주세요.
            </dd>
          </div>
        </dl>
        <div className="modal-actions">
          <button type="button" className="export-button" onClick={onClose}>
            확인
          </button>
        </div>
      </section>
    </div>
  );
}
