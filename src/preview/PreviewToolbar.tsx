import type { RefObject } from 'react';
import { normalizeRotation } from '../lib/num';
import type { ToolbarPosition } from '../lib/previewToolbar';
import { useSettings } from '../SettingsContext';

export function PreviewToolbar({
  position,
  toolbarRef,
}: {
  position: ToolbarPosition;
  toolbarRef: RefObject<HTMLDivElement | null>;
}) {
  const { settings, updateSetting, setSettings } = useSettings();

  return (
    <div
      ref={toolbarRef}
      className="preview-toolbar"
      style={{ top: position.top, right: position.right }}
      aria-label="이미지 미리보기 조정"
    >
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
        왼쪽 90도
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
        오른쪽 90도
      </button>
      <label className="toolbar-range">
        <span>확대</span>
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={settings.imageScale}
          onChange={(event) => updateSetting('imageScale', Number(event.target.value))}
        />
        <strong>{Math.round(settings.imageScale * 100)}%</strong>
      </label>
      <button
        type="button"
        className="toolbar-button"
        disabled={settings.imageScale <= 1}
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
      <span className="toolbar-hint">
        기본은 잘리지 않게 배치됩니다. 휠·슬라이더로 확대하면 채우거나 자를 수 있고,
        확대 상태에서 드래그로 위치를 옮기거나 더블클릭으로 가운데로 되돌립니다.
      </span>
    </div>
  );
}
