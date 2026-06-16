import type { LoadedImage } from '../lib/imageLoader';
import type { ResolvedPrintScale } from '../lib/printScale';
import type { LayoutState } from '../types';
import { FitAndOverlapSection } from './FitAndOverlapSection';
import { ImageUploadSection } from './ImageUploadSection';
import { PrintOptionsSection } from './PrintOptionsSection';
import { SeamTestSection } from './SeamTestSection';
import { SizingModeSection } from './SizingModeSection';
import { Summary } from './Summary';

export function SettingsPanel({
  active,
  collapsed,
  onToggleCollapse,
  loadedImage,
  imageError,
  onFileSelected,
  layoutState,
  printScale,
  hasSeamTestExported,
  onExportSeamTest,
}: {
  active: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  loadedImage: LoadedImage | null;
  imageError: string;
  onFileSelected: (file: File | undefined) => void;
  layoutState: LayoutState;
  printScale: ResolvedPrintScale;
  hasSeamTestExported: boolean;
  onExportSeamTest: () => void;
}) {
  const settingsReady = !!loadedImage && !layoutState.error;

  return (
    <section
      className="control-panel"
      data-mobile-active={active}
      data-collapsed={collapsed}
      aria-label="분할 설정"
    >
      <button
        type="button"
        className="panel-collapse-toggle"
        onClick={onToggleCollapse}
        aria-label={collapsed ? '설정 패널 펼치기' : '설정 패널 접기'}
        title={collapsed ? '펼치기' : '접기'}
      >
        {collapsed ? '▶' : '◀'}
      </button>
      <div className="title-block">
        <h1>A4 이미지 분할</h1>
        <p>큰 이미지를 여러 장의 A4로 나누어 인쇄용 PDF를 만듭니다.</p>
      </div>

      <SeamTestSection
        printScale={printScale}
        hasSeamTestExported={hasSeamTestExported}
        onExportSeamTest={onExportSeamTest}
      />

      <ImageUploadSection
        loadedImage={loadedImage}
        imageError={imageError}
        onFileSelected={onFileSelected}
      />

      <div className="step-heading">
        <span className={settingsReady ? 'done' : ''}>{settingsReady ? '✓' : '2'}</span>
        <strong>포스터 설정</strong>
      </div>

      <SizingModeSection />
      <FitAndOverlapSection />
      <PrintOptionsSection />

      <p className="print-note">
        인쇄 창에서 반드시 실제 크기 또는 100%를 선택하고, 용지에 맞춤은 꺼주세요.
      </p>

      <Summary
        plan={layoutState.plan}
        layout={layoutState.layout}
        targetSize={layoutState.targetSize}
        error={layoutState.error}
      />
    </section>
  );
}
