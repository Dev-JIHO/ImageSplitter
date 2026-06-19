import { useState } from 'react';
import { NumberField } from '../components/NumberField';
import { useSettings } from '../SettingsContext';

export function FitAndOverlapSection() {
  const { settings, updateSetting } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <details
      className="options-group"
      open={open}
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>이어붙이기 (풀칠)</summary>
      <div className="options-group-body">
        <div className="field-grid">
          <NumberField
            label="풀칠 영역(mm)"
            value={settings.overlapMm}
            min={0}
            step={1}
            onChange={(value) => updateSetting('overlapMm', value)}
          />
        </div>
        <label className="check-field">
          <input
            type="checkbox"
            checked={settings.showGlueMarks}
            onChange={(event) => updateSetting('showGlueMarks', event.target.checked)}
          />
          <span>풀칠 영역 표시(빗금)</span>
        </label>
        <p className="hint-text">
          이어붙일 가장자리에 남길 빈 탭 크기입니다. 0mm로 두면 풀칠 탭 없이 사진만
          나뉩니다. 풀칠 탭이 없는 최하단·최우측 모서리 장에는 페이지 번호가 표시되지
          않습니다.
        </p>
      </div>
    </details>
  );
}
