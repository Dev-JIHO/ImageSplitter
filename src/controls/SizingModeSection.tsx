import { NumberField } from '../components/NumberField';
import { useSettings } from '../SettingsContext';

export function SizingModeSection() {
  const { settings, updateSetting, setSettings } = useSettings();

  return (
    <>
      <fieldset className="segmented" data-tour="size">
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
          <div className="field-grid">
            <NumberField
              label="완성 가로(mm)"
              value={settings.targetWidthMm}
              min={1}
              step={1}
              onChange={(value) => updateSetting('targetWidthMm', value)}
            />
            <NumberField
              label="완성 세로(mm)"
              value={settings.targetHeightMm}
              min={1}
              step={1}
              onChange={(value) => updateSetting('targetHeightMm', value)}
            />
          </div>
          <p className="hint-text">
            완성될 가로·세로(mm)를 입력하면 그 크기로 정확히 만들어집니다(게시판 등). 이미지가
            영역을 가득 채우며, 비율이 다르면 넘치는 부분이 잘립니다(드래그로 위치 조정).
          </p>
        </>
      )}
    </>
  );
}
