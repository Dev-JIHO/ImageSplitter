import { InfoHint } from '../components/InfoHint';
import { NumberField } from '../components/NumberField';
import { useSettings } from '../SettingsContext';

export function SizingModeSection() {
  const { settings, updateSetting, setSettings } = useSettings();

  return (
    <>
      <fieldset className="segmented segmented-float" data-tour="size">
        <legend>어떻게 만들까요?</legend>
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
          <fieldset className="segmented segmented-float">
            <legend>용지 방향</legend>
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
          <fieldset className="segmented segmented-float">
            <legend>용지 방향</legend>
            <button
              type="button"
              className={settings.targetOrientation === 'portrait' ? 'active' : ''}
              onClick={() => updateSetting('targetOrientation', 'portrait')}
            >
              세로
            </button>
            <button
              type="button"
              className={settings.targetOrientation === 'landscape' ? 'active' : ''}
              onClick={() => updateSetting('targetOrientation', 'landscape')}
            >
              가로
            </button>
          </fieldset>
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
            원하는 완성 크기(mm)를 입력하세요
            <InfoHint>
              입력한 가로·세로(mm) 크기로 정확히 만들어집니다(게시판 등). 사진이 영역을
              가득 채우고, 비율이 다르면 넘치는 부분은 잘립니다(미리보기에서 드래그로 위치
              조정).
            </InfoHint>
          </p>
        </>
      )}
    </>
  );
}
