import { NumberField } from '../components/NumberField';
import { useSettings } from '../SettingsContext';

export function SizingModeSection() {
  const { settings, updateSetting, setSettings } = useSettings();

  return (
    <>
      <fieldset className="segmented">
        <legend>어떻게 크게 만들까요?</legend>
        <button
          type="button"
          className={settings.mode === 'manual' ? 'active' : ''}
          onClick={() => updateSetting('mode', 'manual')}
        >
          A4 장수로 만들기
        </button>
        <button
          type="button"
          className={settings.mode === 'target' ? 'active' : ''}
          onClick={() => updateSetting('mode', 'target')}
        >
          완성 크기로 만들기
        </button>
      </fieldset>
      <p className="hint-text">
        장수를 알면 왼쪽, 원하는 포스터 크기를 알면 오른쪽을 고르세요.
      </p>

      {settings.mode === 'manual' ? (
        <>
          <fieldset className="segmented">
            <legend>A4 방향</legend>
            <button
              type="button"
              className={settings.orientation === 'portrait' ? 'active' : ''}
              onClick={() => updateSetting('orientation', 'portrait')}
            >
              세로
            </button>
            <button
              type="button"
              className={settings.orientation === 'landscape' ? 'active' : ''}
              onClick={() => updateSetting('orientation', 'landscape')}
            >
              가로
            </button>
          </fieldset>
          <div className="field-grid">
            <NumberField
              label="행"
              value={settings.rows}
              min={1}
              step={1}
              onChange={(value) => updateSetting('rows', Math.round(value))}
            />
            <NumberField
              label="열"
              value={settings.columns}
              min={1}
              step={1}
              onChange={(value) => updateSetting('columns', Math.round(value))}
            />
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              setSettings((current) => ({
                ...current,
                rows: current.columns,
                columns: current.rows,
              }))
            }
          >
            행/열 바꾸기
          </button>
        </>
      ) : (
        <>
          <fieldset className="segmented">
            <legend>크기 기준</legend>
            <button
              type="button"
              className={settings.targetSizeMode === 'width' ? 'active' : ''}
              onClick={() => updateSetting('targetSizeMode', 'width')}
            >
              가로 기준
            </button>
            <button
              type="button"
              className={settings.targetSizeMode === 'height' ? 'active' : ''}
              onClick={() => updateSetting('targetSizeMode', 'height')}
            >
              세로 기준
            </button>
          </fieldset>
          <div className="field-grid">
            {settings.targetSizeMode === 'width' ? (
              <NumberField
                label="완성 가로(mm)"
                value={settings.targetWidthMm}
                min={1}
                step={1}
                onChange={(value) => updateSetting('targetWidthMm', value)}
              />
            ) : (
              <NumberField
                label="완성 세로(mm)"
                value={settings.targetHeightMm}
                min={1}
                step={1}
                onChange={(value) => updateSetting('targetHeightMm', value)}
              />
            )}
          </div>
          <p className="hint-text">
            기준 변 길이만 입력하면 나머지 변은 이미지 비율에 맞춰 자동 계산됩니다. 이미지가
            어색하게 잘리지 않습니다.
          </p>
        </>
      )}
    </>
  );
}
