import { type ReactElement } from 'react';
import { Chevron } from '../components/Chevron';
import type { LoadedImage } from '../lib/imageLoader';
import type { ResolvedPrintScale } from '../lib/printScale';
import type { LayoutState, LeftView } from '../types';
import { FitAndOverlapSection } from './FitAndOverlapSection';
import { ImageUploadSection } from './ImageUploadSection';
import { PrintOptionsSection } from './PrintOptionsSection';
import { SeamTestSection } from './SeamTestSection';
import { SizingModeSection } from './SizingModeSection';
import { Summary } from './Summary';

function PhotoIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden focusable="false">
      <rect x="2" y="3" width="12" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="6" cy="6.5" r="1.1" fill="currentColor" />
      <path d="M3 12L6.5 8.5L9 11L11 9.5L13 11.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden focusable="false">
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.6" fill="none" stroke="currentColor" strokeWidth={1.5} />
      <path d="M8 2.5V13.5M2.5 8H13.5" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden focusable="false">
      <path d="M2 4.5H14M2 8H14M2 11.5H14" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx="6" cy="4.5" r="1.9" fill="var(--c-surface)" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="10.5" cy="8" r="1.9" fill="var(--c-surface)" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="5" cy="11.5" r="1.9" fill="var(--c-surface)" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

export function SettingsPanel({
  active,
  collapsed,
  onToggleCollapse,
  view,
  onViewChange,
  onStartTour,
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
  view: LeftView;
  onViewChange: (view: LeftView) => void;
  onStartTour: () => void;
  loadedImage: LoadedImage | null;
  imageError: string;
  onFileSelected: (file: File | undefined) => void;
  layoutState: LayoutState;
  printScale: ResolvedPrintScale;
  hasSeamTestExported: boolean;
  onExportSeamTest: () => void;
}) {
  const settingsReady = !!loadedImage && !layoutState.error;

  const tabs: Array<{ id: LeftView; label: string; icon: ReactElement }> = [
    { id: 'upload', label: '사진 선택', icon: <PhotoIcon /> },
    { id: 'poster', label: '포스터 설정', icon: <GridIcon /> },
    { id: 'advanced', label: '고급 설정', icon: <SlidersIcon /> },
  ];

  return (
    <section
      className="control-panel"
      data-mobile-active={active}
      data-collapsed={collapsed}
      aria-label="분할 설정"
    >
      <button
        type="button"
        className="panel-toggle"
        onClick={onToggleCollapse}
        aria-label={collapsed ? '설정 패널 펼치기' : '설정 패널 접기'}
        title={collapsed ? '펼치기' : '접기'}
      >
        {collapsed ? <Chevron dir="right" /> : <Chevron dir="left" />}
      </button>
      {!collapsed ? (
        <div className="panel-view-tabs" role="tablist" aria-label="설정 화면 전환" data-tour="views">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="panel-view-tab"
              data-active={view === tab.id}
              role="tab"
              aria-selected={view === tab.id}
              onClick={() => onViewChange(tab.id)}
              aria-label={tab.label}
              title={tab.label}
            >
              {tab.icon}
            </button>
          ))}
        </div>
      ) : null}

      <div className="panel-scroll">
        <div className="title-block">
          <div className="title-row">
            <h1>한 장 공 방</h1>
            <button
              type="button"
              className="help-button"
              onClick={onStartTour}
              aria-label="사용법 안내 다시 보기"
              title="사용법 안내"
            >
              ?
            </button>
          </div>
          <p>A4 용지뿐인데 저더러 그 커다란 걸 뽑으라구요..?</p>
        </div>

        {view === 'upload' ? (
          <ImageUploadSection
            loadedImage={loadedImage}
            imageError={imageError}
            onFileSelected={onFileSelected}
          />
        ) : null}

        {view === 'poster' ? (
          <>
            <div className="step-heading">
              <span className={settingsReady ? 'done' : ''}>{settingsReady ? '✓' : '2'}</span>
              <strong>포스터 설정</strong>
            </div>
            <SizingModeSection />
          </>
        ) : null}

        {view === 'advanced' ? (
          <>
            <div className="advanced-heading">
              <strong>고급 설정</strong>
              <span>여백 · 풀칠 · 해상도 · 프린터 테스트 (선택)</span>
            </div>
            <FitAndOverlapSection />
            <PrintOptionsSection />
            <SeamTestSection
              printScale={printScale}
              hasSeamTestExported={hasSeamTestExported}
              onExportSeamTest={onExportSeamTest}
            />
          </>
        ) : null}

        <p className="print-note">
          인쇄 창에서 반드시 실제 크기 또는 100%를 선택하고, 용지에 맞춤은 꺼주세요.
        </p>

        <Summary
          plan={layoutState.plan}
          layout={layoutState.layout}
          targetSize={layoutState.targetSize}
          error={layoutState.error}
        />
      </div>
    </section>
  );
}
