import { normalizeRotation } from '../lib/num';
import { useSettings } from '../SettingsContext';

const MAX_ZOOM = 8;

export function PreviewSidebar({
  active,
  collapsed,
  onToggleCollapse,
  ready,
  canPan,
  isExporting,
  onRequestExport,
}: {
  active: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  ready: boolean;
  canPan: boolean;
  isExporting: boolean;
  onRequestExport: () => void;
}) {
  const { settings, updateSetting, setSettings } = useSettings();

  return (
    <section
      className="tools-panel"
      data-collapsed={collapsed}
      data-mobile-active={active}
      data-tour="tools"
      aria-label="미리보기 도구"
    >
      <button
        type="button"
        className="panel-collapse-toggle"
        onClick={onToggleCollapse}
        aria-label={collapsed ? '도구 패널 펼치기' : '도구 패널 접기'}
        title={collapsed ? '펼치기' : '접기'}
      >
        {collapsed ? '◀' : '▶'}
      </button>
      <div className="tools-panel-body">
        {ready ? (
          <>
            <div className="tool-group">
              <span className="tool-label">회전</span>
              <div className="tool-row">
                <button
                  type="button"
                  className="toolbar-button"
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      rotationDeg: normalizeRotation(current.rotationDeg - 90),
                      cropFocus: { x: 0.5, y: 0.5 },
                    }))
                  }
                >
                  왼쪽 90°
                </button>
                <button
                  type="button"
                  className="toolbar-button"
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      rotationDeg: normalizeRotation(current.rotationDeg + 90),
                      cropFocus: { x: 0.5, y: 0.5 },
                    }))
                  }
                >
                  오른쪽 90°
                </button>
              </div>
            </div>

            <label className="toolbar-range">
              <span>확대</span>
              <input
                type="range"
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={settings.imageScale}
                onChange={(event) => updateSetting('imageScale', Number(event.target.value))}
              />
              <strong>{Math.round(settings.imageScale * 100)}%</strong>
            </label>
            <div className="tool-row">
              <button
                type="button"
                className="toolbar-button"
                disabled={!canPan}
                onClick={() => updateSetting('cropFocus', { x: 0.5, y: 0.5 })}
              >
                위치 가운데
              </button>
              <button
                type="button"
                className="toolbar-button"
                disabled={settings.imageScale === 1}
                onClick={() => updateSetting('imageScale', 1)}
              >
                확대 원래대로
              </button>
            </div>
            <p className="hint-text small">
              확대 상태에서는 미리보기를 드래그해 위치를 옮기고, 더블클릭으로 가운데로
              되돌립니다.
            </p>

            <button
              type="button"
              className="export-button"
              data-tour="export"
              disabled={!ready || isExporting}
              onClick={onRequestExport}
            >
              {isExporting ? 'PDF 생성 중' : 'PDF 내보내기'}
            </button>
            <p className="hint-text small">
              인쇄 후 1-1부터 행 순서대로, 빗금(풀칠) 영역 위에 이웃 장을 겹쳐 붙이세요.
            </p>
          </>
        ) : (
          <p className="hint-text">
            이미지를 올리면 회전·확대·내보내기 도구가 여기에 표시됩니다.
          </p>
        )}
      </div>
    </section>
  );
}
