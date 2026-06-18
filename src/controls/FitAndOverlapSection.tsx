import { NumberField } from '../components/NumberField';
import { useSettings } from '../SettingsContext';

export function FitAndOverlapSection() {
  const { settings, updateSetting } = useSettings();

  return (
    <>
      <p className="hint-text">
        사진은 기본적으로 잘리지 않게 포스터 영역에 맞춰 배치됩니다. 회전·확대·위치 조정은
        오른쪽 미리보기의 작은 도구에서 할 수 있습니다.
      </p>

      <div className="field-grid">
        <NumberField
          label="풀칠 영역(mm)"
          value={settings.overlapMm}
          min={0}
          step={1}
          onChange={(value) => updateSetting('overlapMm', value)}
        />
      </div>
      <p className="hint-text">
        이어붙일 가장자리에 남길 빈 탭 크기입니다. 0mm로 두면 풀칠 탭 없이 이미지만 나뉩니다.
        풀칠 탭이 없는 최하단·최우측 모서리 장에는 페이지 번호가 표시되지 않습니다.
      </p>
    </>
  );
}
