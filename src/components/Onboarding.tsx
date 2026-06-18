import { useEffect, useState, type CSSProperties } from 'react';
import type { LeftView } from '../types';

type Art = 'intro' | 'upload' | 'size' | 'preview' | 'tools' | 'tip';

interface Step {
  kind: 'modal' | 'spot' | 'tip';
  target?: string;
  art: Art;
  title: string;
  body: string;
  /** 이 단계에서 좌측 패널을 이 화면으로 전환한다. */
  view?: LeftView;
}

const STEPS: Step[] = [
  {
    kind: 'modal',
    art: 'intro',
    title: 'A4 이미지 분할에 오신 걸 환영해요',
    body: '사진 한 장 → 여러 장의 A4로 분할 → 번호 순서대로 이어 붙이면 큰 포스터!',
  },
  {
    kind: 'spot',
    target: 'views',
    art: 'intro',
    title: '1. 화면 전환 탭',
    body: '왼쪽의 세 탭으로 “사진 선택 · 포스터 설정 · 고급 설정” 화면을 오갈 수 있어요.',
    view: 'upload',
  },
  {
    kind: 'spot',
    target: 'upload',
    art: 'upload',
    title: '2. 이미지 올리기',
    body: '사진을 선택하거나, 미리보기로 끌어다 놓거나, Ctrl+V로 붙여넣으세요.',
    view: 'upload',
  },
  {
    kind: 'spot',
    target: 'size',
    art: 'size',
    title: '3. 포스터 크기 정하기',
    body: '“A4 장수”로 직접 정하거나, “완성 크기(mm)”로 정확히 — 둘 중 선택.',
    view: 'poster',
  },
  {
    kind: 'spot',
    target: 'preview',
    art: 'preview',
    title: '4. 미리보기로 확인·조정',
    body: '분할 결과를 실시간 확인. 휠·슬라이더로 확대, 드래그로 위치를 맞춰요.',
  },
  {
    kind: 'spot',
    target: 'tools',
    art: 'tools',
    title: '5. 도구와 PDF 내보내기',
    body: '오른쪽 도구에서 회전·확대·위치를 조정하고 “PDF 내보내기”로 저장.',
  },
  {
    kind: 'tip',
    art: 'tip',
    title: '인쇄·조립 팁',
    body: '인쇄는 반드시 100%로! 1-1부터 풀칠(빗금) 영역 위에 겹쳐 순서대로 붙이세요.',
    view: 'upload',
  },
];

const sheet = {
  fill: 'var(--c-surface)',
  stroke: 'var(--c-border-2)',
  strokeWidth: 2,
} as const;

function MiniScene({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <circle cx={x + w * 0.28} cy={y + h * 0.3} r={Math.min(w, h) * 0.1} fill="var(--c-warn)" />
      <path d={`M${x} ${y + h} L${x + w * 0.4} ${y + h * 0.45} L${x + w * 0.7} ${y + h} Z`} fill="var(--c-brand)" />
      <path d={`M${x + w * 0.45} ${y + h} L${x + w * 0.75} ${y + h * 0.6} L${x + w} ${y + h} Z`} fill="var(--c-accent)" />
    </g>
  );
}

function Arrow({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y} h20 m-6 -5 l6 5 -6 5`}
      fill="none"
      stroke="var(--c-muted)"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Illustration({ art }: { art: Art }) {
  const common = { className: 'onb-art', viewBox: '0 0 320 120', role: 'img', 'aria-hidden': true } as const;
  switch (art) {
    case 'intro':
      return (
        <svg {...common}>
          <rect x={8} y={34} width={62} height={52} rx={6} {...sheet} />
          <MiniScene x={16} y={44} w={46} h={34} />
          <Arrow x={78} y={60} />
          <rect x={112} y={40} width={38} height={26} rx={3} {...sheet} stroke="var(--c-accent)" />
          <rect x={152} y={40} width={38} height={26} rx={3} {...sheet} stroke="var(--c-accent)" />
          <rect x={112} y={66} width={38} height={26} rx={3} {...sheet} stroke="var(--c-accent)" />
          <rect x={152} y={66} width={38} height={26} rx={3} {...sheet} stroke="var(--c-accent)" />
          <Arrow x={200} y={60} />
          <rect x={236} y={26} width={76} height={70} rx={6} {...sheet} stroke="var(--c-brand-strong)" strokeWidth={2.5} />
          <MiniScene x={246} y={40} w={56} h={46} />
        </svg>
      );
    case 'upload':
      return (
        <svg {...common}>
          <rect x={92} y={20} width={136} height={84} rx={10} fill="var(--c-subtle)" stroke="var(--c-accent)" strokeWidth={2.5} strokeDasharray="7 6" />
          <g className="onb-anim-drop">
            <rect x={128} y={36} width={64} height={48} rx={6} {...sheet} />
            <MiniScene x={136} y={46} w={48} h={32} />
          </g>
          <path d="M160 92 v-10 m-5 5 l5 5 5 -5" fill="none" stroke="var(--c-brand)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'size':
      return (
        <svg {...common}>
          <rect x={14} y={28} width={40} height={28} rx={3} {...sheet} />
          <rect x={56} y={28} width={40} height={28} rx={3} {...sheet} />
          <rect x={14} y={58} width={40} height={28} rx={3} {...sheet} />
          <rect x={56} y={58} width={40} height={28} rx={3} {...sheet} />
          <text x={55} y={104} textAnchor="middle" fontSize={13} fill="var(--c-muted)">A4 장수</text>
          <rect x={196} y={28} width={96} height={58} rx={6} {...sheet} stroke="var(--c-brand-strong)" strokeWidth={2.5} />
          <path d="M196 20 h96 m-96 0 v6 m96 -6 v6" stroke="var(--c-brand)" strokeWidth={2} fill="none" />
          <path d="M188 28 v58 m0 -58 h6 m-6 58 h6" stroke="var(--c-brand)" strokeWidth={2} fill="none" />
          <text x={244} y={104} textAnchor="middle" fontSize={13} fill="var(--c-muted)">완성 크기(mm)</text>
        </svg>
      );
    case 'preview':
      return (
        <svg {...common}>
          <rect x={92} y={16} width={92} height={88} rx={6} {...sheet} />
          <MiniScene x={104} y={40} w={68} h={52} />
          <line x1={138} y1={16} x2={138} y2={104} stroke="var(--c-accent)" strokeWidth={2} strokeDasharray="5 4" />
          <line x1={92} y1={60} x2={184} y2={60} stroke="var(--c-accent)" strokeWidth={2} strokeDasharray="5 4" />
          <g className="onb-anim-zoom">
            <circle cx={196} cy={74} r={20} fill="rgba(255,255,255,0.7)" stroke="var(--c-brand-strong)" strokeWidth={3} />
            <path d="M211 89 l12 12" stroke="var(--c-brand-strong)" strokeWidth={4} strokeLinecap="round" />
            <path d="M196 66 v16 m-8 -8 h16" stroke="var(--c-brand-strong)" strokeWidth={2.5} strokeLinecap="round" />
          </g>
        </svg>
      );
    case 'tools':
      return (
        <svg {...common}>
          <rect x={104} y={12} width={112} height={96} rx={10} {...sheet} stroke="var(--c-border)" />
          <rect x={116} y={24} width={40} height={18} rx={5} fill="var(--c-subtle)" stroke="var(--c-border-2)" strokeWidth={1.5} />
          <rect x={164} y={24} width={40} height={18} rx={5} fill="var(--c-subtle)" stroke="var(--c-border-2)" strokeWidth={1.5} />
          <line x1={116} y1={54} x2={204} y2={54} stroke="var(--c-border-2)" strokeWidth={3} strokeLinecap="round" />
          <circle cx={150} cy={54} r={6} fill="var(--c-brand)" />
          <rect x={116} y={72} width={88} height={26} rx={7} fill="var(--c-brand)" />
          <path d="M160 79 v8 m-5 -3 l5 4 5 -4 M153 92 h14" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'tip':
    default:
      return (
        <svg {...common}>
          <rect x={40} y={30} width={70} height={64} rx={6} {...sheet} />
          <g className="onb-anim-slide">
            <rect x={120} y={30} width={70} height={64} rx={6} {...sheet} />
            <rect x={120} y={30} width={20} height={64} fill="var(--c-warn)" opacity={0.25} />
            <path d="M120 30 v64 M127 30 v64 M134 30 v64" stroke="rgba(0,0,0,0.4)" strokeWidth={1} />
          </g>
          <circle cx={250} cy={44} r={20} fill="var(--c-success)" opacity={0.18} />
          <text x={250} y={49} textAnchor="middle" fontSize={15} fontWeight={800} fill="var(--c-text)">100%</text>
          <text x={250} y={86} textAnchor="middle" fontSize={12} fill="var(--c-muted)">실제 크기로 인쇄</text>
        </svg>
      );
  }
}

function useTargetRect(active: boolean, step: Step | undefined, useSpotlight: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!active || !step || step.kind !== 'spot' || !useSpotlight) {
      setRect(null);
      return;
    }
    const update = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    update();
    const timer = window.setTimeout(update, 60);
    window.addEventListener('resize', update);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', update);
    };
  }, [active, step, useSpotlight]);
  return rect;
}

export function Onboarding({
  active,
  step,
  onNext,
  onPrev,
  onClose,
  onViewChange,
}: {
  active: boolean;
  step: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onViewChange: (view: LeftView) => void;
}) {
  const useSpotlight =
    typeof window !== 'undefined' && !window.matchMedia('(max-width: 860px)').matches;
  const current = STEPS[step];
  const rect = useTargetRect(active, current, useSpotlight);

  useEffect(() => {
    if (active && current?.view) onViewChange(current.view);
  }, [active, current, onViewChange]);

  if (!active || !current) return null;

  const isLast = step === STEPS.length - 1;
  const pad = 8;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const cardW = Math.min(360, vw - 24);

  const spotSteps = STEPS.filter((item) => item.kind === 'spot');
  const spotIndex = current.kind === 'spot' ? spotSteps.indexOf(current) + 1 : 0;

  const targetTall = !!rect && rect.height > vh * 0.5;
  const useCenter = !rect || targetTall;
  const spotlight = current.kind === 'spot' && rect ? rect : null;

  let cardStyle: CSSProperties = {};
  if (spotlight && !useCenter) {
    const left = Math.min(Math.max(12, spotlight.left), vw - cardW - 12);
    const spaceBelow = vh - spotlight.bottom;
    cardStyle =
      spaceBelow > 260
        ? { top: spotlight.bottom + 14, left }
        : { bottom: Math.max(12, vh - spotlight.top + 14), left };
  }

  return (
    <div className="onb-root" role="dialog" aria-modal="true" aria-label="온보딩 안내">
      <div className={`onb-backdrop ${spotlight ? '' : 'onb-backdrop-dim'}`} />
      {spotlight ? (
        <div
          className="onb-spotlight"
          style={{
            top: spotlight.top - pad,
            left: spotlight.left - pad,
            width: spotlight.width + pad * 2,
            height: spotlight.height + pad * 2,
          }}
        />
      ) : null}
      <div
        className={`onb-card ${useCenter ? 'onb-card-center' : 'onb-card-anchored'}`}
        style={cardStyle}
      >
        <Illustration art={current.art} />
        <p className="onb-step">{current.kind === 'spot' ? `${spotIndex} / ${spotSteps.length}` : '안내'}</p>
        <h2 className="onb-title">{current.title}</h2>
        <p className="onb-body">{current.body}</p>
        <div className="onb-actions">
          <button type="button" className="onb-skip" onClick={onClose}>
            건너뛰기
          </button>
          <div className="onb-nav">
            {step > 0 ? (
              <button type="button" className="secondary-button" onClick={onPrev}>
                이전
              </button>
            ) : null}
            <button type="button" className="export-button" onClick={isLast ? onClose : onNext}>
              {isLast ? '시작하기' : current.kind === 'modal' ? '둘러보기' : '다음'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
