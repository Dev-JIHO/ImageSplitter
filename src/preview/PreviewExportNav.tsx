import type { CSSProperties, RefObject } from 'react';

export function PreviewExportNav({
  position,
  exportNavRef,
  disabled,
  isExporting,
  onRequestExport,
}: {
  position: CSSProperties;
  exportNavRef: RefObject<HTMLDivElement | null>;
  disabled: boolean;
  isExporting: boolean;
  onRequestExport: () => void;
}) {
  return (
    <div
      ref={exportNavRef}
      className="preview-export-nav"
      style={position}
      aria-label="PDF 내보내기"
    >
      <button
        type="button"
        className="export-button"
        disabled={disabled}
        onClick={onRequestExport}
      >
        {isExporting ? 'PDF 생성 중' : 'PDF 내보내기'}
      </button>
      <p className="hint-text small">
        인쇄 후 1-1부터 행 순서대로, 빗금(풀칠) 영역 위에 이웃 장을 겹쳐 붙이세요.
      </p>
    </div>
  );
}
