import { NumberField } from '../components/NumberField';
import { useSettings } from '../SettingsContext';

export function PrintOptionsSection() {
  const { settings, updateSetting } = useSettings();

  return (
    <details className="options-group">
      <summary>인쇄 옵션 (여백 · 해상도 · 표시 항목)</summary>
      <div className="options-group-body">
        <fieldset className="segmented segmented-three">
          <legend>여백 설정</legend>
          {[5, 3, 0].map((margin) => (
            <button
              key={margin}
              type="button"
              className={settings.printerMarginMm === margin ? 'active' : ''}
              onClick={() => updateSetting('printerMarginMm', margin)}
            >
              {margin === 0 ? '없음(전체인쇄용)' : `${margin}mm${margin === 5 ? ' (권장)' : ''}`}
            </button>
          ))}
        </fieldset>
        <NumberField
          label="직접 입력(mm)"
          value={settings.printerMarginMm}
          min={0}
          step={1}
          onChange={(value) => updateSetting('printerMarginMm', value)}
        />
        <p className="hint-text">
          프린터가 종이 가장자리에 인쇄하지 못하는 영역입니다. 일반 프린터는 3~5mm를 권장합니다.
        </p>
        {settings.printerMarginMm <= 0 ? (
          <p className="warning-text" role="alert">
            여백이 없으면 일반 프린터에서는 가장자리 3~5mm가 잘린 채 인쇄됩니다. 테두리
            없는 인쇄(전체 인쇄)를 지원하는 프린터에서만 사용하세요. 잘 모르겠다면 5mm를
            선택해주세요.
          </p>
        ) : null}

        <fieldset className="segmented segmented-three">
          <legend>출력 해상도</legend>
          {[150, 200, 300].map((dpi) => (
            <button
              key={dpi}
              type="button"
              className={settings.exportDpi === dpi ? 'active' : ''}
              onClick={() => updateSetting('exportDpi', dpi)}
            >
              {dpi} DPI
            </button>
          ))}
        </fieldset>
        <p className="hint-text">
          300 DPI는 더 선명하지만 PDF 생성이 느려질 수 있습니다.
        </p>

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
        <label className="check-field">
          <input
            type="checkbox"
            checked={settings.showGlueMarks}
            onChange={(event) => updateSetting('showGlueMarks', event.target.checked)}
          />
          <span>풀칠 영역 표시</span>
        </label>
      </div>
    </details>
  );
}
