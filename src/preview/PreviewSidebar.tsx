import { Chevron } from '../components/Chevron';
import { Summary } from '../controls/Summary';
import { clamp, normalizeRotation } from '../lib/num';
import { useSettings } from '../SettingsContext';
import type { LayoutState } from '../types';

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.25;

export function PreviewSidebar({
  active,
  collapsed,
  onToggleCollapse,
  ready,
  canPan,
  isExporting,
  onRequestExport,
  layoutState,
}: {
  active: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  ready: boolean;
  canPan: boolean;
  isExporting: boolean;
  onRequestExport: () => void;
  layoutState: LayoutState;
}) {
  const { settings, updateSetting, setSettings } = useSettings();
  const pageCount = layoutState.layout?.slices.length ?? 0;
  const zoomPercent = Math.round(settings.imageScale * 100);

  function rotate(delta: number) {
    setSettings((current) => ({
      ...current,
      rotationDeg: normalizeRotation(current.rotationDeg + delta),
      cropFocus: { x: 0.5, y: 0.5 },
    }));
  }

  function zoomBy(delta: number) {
    setSettings((current) => {
      const next = clamp(Math.round((current.imageScale + delta) * 100) / 100, MIN_ZOOM, MAX_ZOOM);
      return next === current.imageScale ? current : { ...current, imageScale: next };
    });
  }

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
        className="panel-toggle"
        onClick={onToggleCollapse}
        aria-label={collapsed ? '도구 패널 펼치기' : '도구 패널 접기'}
        title={collapsed ? '펼치기' : '접기'}
      >
        {collapsed ? <Chevron dir="left" /> : <Chevron dir="right" />}
        <span className="panel-toggle-label">{collapsed ? '펼치기' : '접기'}</span>
      </button>
      <div className="tools-panel-body">
        {ready ? (
          <>
            <div className="tool-group">
              <span className="tool-label">미리보기 조정</span>

              <div className="tool-row">
                <button type="button" className="toolbar-button" onClick={() => rotate(-90)}>
                  ↺ 왼쪽
                </button>
                <button type="button" className="toolbar-button" onClick={() => rotate(90)}>
                  오른쪽 ↻
                </button>
              </div>

              <div className="zoom-control">
                <button
                  type="button"
                  className="toolbar-button zoom-step"
                  aria-label="축소"
                  disabled={settings.imageScale <= MIN_ZOOM}
                  onClick={() => zoomBy(-ZOOM_STEP)}
                >
                  −
                </button>
                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={0.01}
                  value={settings.imageScale}
                  aria-label="확대"
                  onChange={(event) => updateSetting('imageScale', Number(event.target.value))}
                />
                <button
                  type="button"
                  className="toolbar-button zoom-step"
                  aria-label="확대"
                  disabled={settings.imageScale >= MAX_ZOOM}
                  onClick={() => zoomBy(ZOOM_STEP)}
                >
                  +
                </button>
              </div>
              <p className="zoom-readout">확대 {zoomPercent}%</p>

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
                  확대 100%
                </button>
              </div>
              <p className="hint-text small">
                미리보기를 직접 드래그해 위치를 옮기고, 휠로 확대, 더블클릭으로 가운데로
                되돌릴 수도 있어요.
              </p>
            </div>

            <div className="tool-group">
              <span className="tool-label">요약</span>
              <Summary
                plan={layoutState.plan}
                layout={layoutState.layout}
                targetSize={layoutState.targetSize}
                error={layoutState.error}
              />
            </div>

            <div className="tool-group export-group">
              <button
                type="button"
                className="export-button export-primary"
                data-tour="export"
                disabled={!ready || isExporting}
                onClick={onRequestExport}
              >
                {isExporting ? 'PDF 생성 중…' : `PDF 내보내기 (${pageCount}장)`}
              </button>
              <p className="hint-text small">
                인쇄 후 1-1부터 행 순서대로, 빗금(풀칠) 영역 위에 이웃 장을 겹쳐 붙이세요.
              </p>
            </div>
          </>
        ) : (
          <p className="hint-text">
            사진을 올리면 회전·확대·내보내기 도구가 여기에 표시됩니다.
          </p>
        )}
      </div>
    </section>
  );
}
