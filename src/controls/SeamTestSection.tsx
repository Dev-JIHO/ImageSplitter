import { useState } from 'react';
import { NumberField } from '../components/NumberField';
import type { ResolvedPrintScale } from '../lib/printScale';
import { useSettings } from '../SettingsContext';

export function SeamTestSection({
  printScale,
  hasSeamTestExported,
  onExportSeamTest,
}: {
  printScale: ResolvedPrintScale;
  hasSeamTestExported: boolean;
  onExportSeamTest: () => void;
}) {
  const { settings, updateSetting } = useSettings();
  // 기본은 닫힘. 단, 이미 테스트를 받았거나 보정값이 입력된 상태면 입력란이 보이도록 펼친다.
  const [open, setOpen] = useState(
    hasSeamTestExported || settings.measuredSquareMm !== 100,
  );

  return (
    <details
      className="options-group"
      open={open}
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>프린터 테스트 · 크기 보정 (권장)</summary>
      <div className="options-group-body">
        <p className="hint-text">
          포스터를 만들기 전에 A4 2장을 인쇄해 붙여보고, 크기가 정확한지(100mm
          사각형)와 이음새가 매끄럽게 이어지는지(눈금·원·사선)를 확인할 수
          있습니다. 사진이 없어도 만들 수 있습니다.
        </p>
        <button type="button" className="secondary-button" onClick={onExportSeamTest}>
          테스트 PDF 받기 (A4 2장)
        </button>
        {hasSeamTestExported || settings.measuredSquareMm !== 100 ? (
          <>
            <NumberField
              label="테스트 사각형 실측값(mm)"
              value={settings.measuredSquareMm}
              min={50}
              step={0.5}
              onChange={(value) => updateSetting('measuredSquareMm', value)}
            />
            <p className="hint-text">
              인쇄된 100mm 사각형이 실제 몇 mm인지 자로 재서 입력하세요. 배율을
              조절할 수 없는 인쇄 앱(예: Epson Smart Panel)에서도 실제 크기에 맞게
              PDF를 보정합니다. 정확히 100mm라면 100을 그대로 두세요.
            </p>
          </>
        ) : (
          <p className="hint-text">
            테스트를 인쇄한 뒤 다시 이곳에 오면, 측정값을 입력해 인쇄 크기를 보정할
            수 있습니다.
          </p>
        )}
        {printScale.factor !== 1 ? (
          <p className="print-note">
            인쇄 배율 보정 {Math.round(printScale.factor * 1000) / 10}%가 모든 PDF에
            적용됩니다. 보정 후 접합 테스트를 다시 인쇄해 100mm가 맞는지 확인하세요.
          </p>
        ) : null}
        {printScale.clamped ? (
          <p className="warning-text" role="alert">
            여백이 작아 필요한 보정 배율(
            {Math.round(printScale.requestedFactor * 1000) / 10}%)을 전부 적용할 수
            없습니다. 여백을 늘리면 더 정확하게 보정됩니다.
          </p>
        ) : null}
      </div>
    </details>
  );
}
