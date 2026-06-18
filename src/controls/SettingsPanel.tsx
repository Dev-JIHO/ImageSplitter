import { type KeyboardEvent, type ReactElement } from 'react';
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
      </button>
      {!collapsed ? (
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
              onClick={() => onViewChange(tab.id)}
              onKeyDown={(event) => handleTabKey(event, index)}
              title={tab.label}
            >
              {tab.icon}
              <span className="panel-view-tab-label">{tab.label}</span>
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

        {view !== 'advanced' ? (
          <div className="test-print-callout" data-tour="testprint">
            <div className="test-print-callout-text">
              <strong>인쇄 전, 테스트부터!</strong>
              <p>
                A4 2장만 인쇄해 크기(100mm)와 이음새를 확인하면 수십 장 낭비를 막을 수
                있어요. 흑백·초안 모드로 인쇄하면 잉크도 절약됩니다.
              </p>
            </div>
            <div className="test-print-callout-actions">
              <button type="button" className="export-button" onClick={onExportSeamTest}>
                테스트 PDF 받기 (A4 2장)
              </button>
              <button
                type="button"
                className="link-button"
                onClick={() => onViewChange('advanced')}
              >
                측정값 입력하기 →
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
        </div>

        <p className="print-note">
          인쇄 창에서 반드시 실제 크기 또는 100%를 선택하고, 용지에 맞춤은 꺼주세요.
        </p>

        <Summary
          plan={layoutState.plan}
          layout={layoutState.layout}
          targetSize={layoutState.targetSize}
          error={layoutState.error}
        />

        <p className="hint-text export-hint">
          포스터가 준비되면 오른쪽 도구의 “PDF 내보내기”로 저장하세요. (모바일은 아래 “미리보기” 탭에서)
        </p>
      </div>
    </section>
  );
}
