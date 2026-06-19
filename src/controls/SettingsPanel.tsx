import { useState, type KeyboardEvent, type ReactElement } from 'react';
import { AdvancedHelpModal } from '../components/AdvancedHelpModal';
import { Chevron } from '../components/Chevron';
import { InfoHint } from '../components/InfoHint';
import type { LoadedImage } from '../lib/imageLoader';
import type { ResolvedPrintScale } from '../lib/printScale';
import type { LayoutState, LeftView } from '../types';
import { DisplayOptionsSection } from './DisplayOptionsSection';
import { FitAndOverlapSection } from './FitAndOverlapSection';
import { ImageUploadSection } from './ImageUploadSection';
import { PrintOptionsSection } from './PrintOptionsSection';
import { SeamTestSection } from './SeamTestSection';
import { SizingModeSection } from './SizingModeSection';

function PhotoIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden focusable="false">
      <rect x="2" y="3" width="12" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="6" cy="6.5" r="1.1" fill="currentColor" />
      <path d="M3 12L6.5 8.5L9 11L11 9.5L13 11.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden focusable="false">
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.6" fill="none" stroke="currentColor" strokeWidth={1.5} />
      <path d="M8 2.5V13.5M2.5 8H13.5" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden focusable="false">
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
  const [advHelpOpen, setAdvHelpOpen] = useState(false);

  const tabs: Array<{ id: LeftView; label: string; icon: ReactElement }> = [
    { id: 'upload', label: '사진 선택', icon: <PhotoIcon /> },
    { id: 'poster', label: '포스터 설정', icon: <GridIcon /> },
    { id: 'advanced', label: '고급 설정', icon: <SlidersIcon /> },
  ];
  const viewLabel = tabs.find((tab) => tab.id === view)?.label ?? '';

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1;
    let next = -1;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    if (next < 0) return;
    event.preventDefault();
    onViewChange(tabs[next].id);
    const target = event.currentTarget.parentElement?.children[next];
    if (target instanceof HTMLElement) target.focus();
  }

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
        <span className="panel-toggle-label">{collapsed ? '펼치기' : '접기'}</span>
      </button>
      <div className="panel-view-tabs" role="tablist" aria-label="설정 화면 전환" data-tour="views">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            className="panel-view-tab"
            data-active={view === tab.id}
            role="tab"
            aria-selected={view === tab.id}
            aria-controls="settings-view-panel"
            tabIndex={view === tab.id ? 0 : -1}
            onClick={() => {
              onViewChange(tab.id);
              if (collapsed) onToggleCollapse();
            }}
            onKeyDown={(event) => handleTabKey(event, index)}
            title={tab.label}
          >
            {tab.icon}
            <span className="panel-view-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="panel-scroll">
        <div className="title-block">
          <h1>한  장  공  방</h1>
          <p className="title-credit">feat. 굥쌤</p>
          <button
            type="button"
            className="help-button"
            onClick={onStartTour}
            aria-label="사용법 안내 다시 보기"
            title="사용법 안내"
          >
            ?
          </button>
          <p>A4 용지뿐인데 저더러 그 커다란 걸 뽑으라구요..?</p>
        </div>

        {view === 'upload' ? (
          <div className="test-print-callout" data-tour="testprint">
            <div className="test-print-callout-text">
              <strong>인쇄 전, 테스트부터!</strong>
              <p>
                A4 2장만 먼저 인쇄해 크기를 확인하면 종이 낭비를 막아요
                <InfoHint>
                  100mm 사각형과 이음새가 잘 맞는지 확인할 수 있어요. 흑백·초안 모드로
                  인쇄하면 잉크도 절약됩니다.
                </InfoHint>
              </p>
            </div>
            <div className="test-print-callout-actions">
              <button
                type="button"
                className="export-button"
                onClick={() => {
                  onExportSeamTest();
                  onViewChange('advanced');
                }}
              >
                테스트 PDF 받기 (A4 2장)
              </button>
            </div>
          </div>
        ) : null}

        <div
          className="view-panel"
          id="settings-view-panel"
          role="tabpanel"
          aria-label={viewLabel}
        >
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
                <span className={settingsReady ? 'done' : ''}>{settingsReady ? '✓' : ''}</span>
                <strong>포스터 설정</strong>
              </div>
              <SizingModeSection />
            </>
          ) : null}

          {view === 'advanced' ? (
            <>
              <div className="advanced-heading">
                <div className="advanced-heading-top">
                  <strong>고급 설정</strong>
                  <button
                    type="button"
                    className="adv-help-button"
                    onClick={() => setAdvHelpOpen(true)}
                    aria-label="고급 설정 설명 보기"
                    title="고급 설정 설명"
                  >
                    ?
                  </button>
                </div>
                <span>프린터 테스트 · 풀칠 · 인쇄 품질 · 표시 (선택)</span>
              </div>
              <SeamTestSection
                printScale={printScale}
                hasSeamTestExported={hasSeamTestExported}
                onExportSeamTest={onExportSeamTest}
              />
              <FitAndOverlapSection />
              <PrintOptionsSection />
              <DisplayOptionsSection />
            </>
          ) : null}
        </div>

        <p className="print-note">
          인쇄는 “실제 크기(100%)”로, “용지에 맞춤”은 꺼주세요.
        </p>

        <p className="hint-text export-hint">
          오른쪽 도구의 “PDF 내보내기”로 저장해요
          <InfoHint>모바일에서는 아래 “미리보기” 탭에서 내보냅니다.</InfoHint>
        </p>
      </div>

      {advHelpOpen ? <AdvancedHelpModal onClose={() => setAdvHelpOpen(false)} /> : null}
    </section>
  );
}
