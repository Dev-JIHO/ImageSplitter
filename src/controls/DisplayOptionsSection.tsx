import { useSettings } from '../SettingsContext';

export function DisplayOptionsSection() {
  const { settings, updateSetting } = useSettings();

  return (
    <details className="options-group">
      <summary>표시 항목 (페이지 번호 · 경계선)</summary>
      <div className="options-group-body">
        <label className="check-field">
          <input
            type="checkbox"
            checked={settings.showPageNumbers}
            onChange={(event) => updateSetting('showPageNumbers', event.target.checked)}
          />
          <span>페이지 번호 표시</span>
        </label>
        <label className="check-field">
          <input
            type="checkbox"
            checked={settings.showPageBoundaries}
            onChange={(event) => updateSetting('showPageBoundaries', event.target.checked)}
          />
          <span>페이지 경계선 표시</span>
        </label>
        <p className="hint-text">
          미리보기와 PDF에 보이는 안내 표시입니다. 인쇄물에 선이 남지 않게 하려면 경계선을
          꺼주세요.
        </p>
      </div>
    </details>
  );
}
