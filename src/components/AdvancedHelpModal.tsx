import { useState, type ReactNode } from 'react';

const sheet = { fill: 'var(--c-surface)', stroke: 'var(--c-border-2)', strokeWidth: 2 } as const;

function Arrow({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y} h22 m-7 -6 l7 6 -7 6`}
      fill="none"
      stroke="var(--c-muted)"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function TestArt() {
  return (
    <svg className="help-art-svg" viewBox="0 0 360 150" role="img" aria-hidden focusable="false">
      <rect x={14} y={18} width={92} height={112} rx={8} {...sheet} />
      <rect x={34} y={42} width={52} height={44} fill="none" stroke="var(--c-brand-strong)" strokeWidth={2.5} />
      <text x={60} y={68} textAnchor="middle" fontSize={12} fill="var(--c-text-2)">100mm</text>
      <rect x={30} y={98} width={60} height={14} rx={2} fill="var(--c-warn)" opacity={0.5} />
      <path d="M36 98v14M46 98v14M56 98v14M66 98v14M76 98v14M86 98v14" stroke="var(--c-text-2)" strokeWidth={1} />
      <Arrow x={114} y={72} />
      <text x={205} y={50} textAnchor="middle" fontSize={13} fill="var(--c-muted)">잰 길이 적기</text>
      <rect x={150} y={58} width={110} height={38} rx={9} fill="var(--c-surface)" stroke="var(--c-border-2)" strokeWidth={2} />
      <text x={205} y={83} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--c-text)">98 mm</text>
      <Arrow x={270} y={76} />
      <g className="onb-anim-zoom">
        <circle cx={325} cy={76} r={22} fill="var(--c-success)" opacity={0.22} />
        <path d="M314 76l7 7 13-14" fill="none" stroke="var(--c-text)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <text x={325} y={116} textAnchor="middle" fontSize={12} fill="var(--c-muted)">딱 맞게!</text>
    </svg>
  );
}

function GlueArt() {
  return (
    <svg className="help-art-svg" viewBox="0 0 360 150" role="img" aria-hidden focusable="false">
      <defs>
        <pattern id="glueHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0,0,0,0.45)" strokeWidth={1.2} />
        </pattern>
      </defs>
      {/* 왼쪽 장: 오른쪽 가장자리에 풀칠(빗금) 영역 */}
      <rect x={40} y={24} width={96} height={100} rx={8} {...sheet} />
      <rect x={114} y={24} width={22} height={100} fill="var(--c-warn)" opacity={0.28} />
      <rect x={114} y={24} width={22} height={100} fill="url(#glueHatch)" />
      {/* 오른쪽 장(겹쳐 붙임) — 간격 넓힘 */}
      <g className="onb-anim-slide">
        <rect x={214} y={24} width={96} height={100} rx={8} {...sheet} />
      </g>
      <text x={180} y={142} textAnchor="middle" fontSize={12} fill="var(--c-muted)">왼쪽 장의 빗금이 풀칠 자리예요</text>
    </svg>
  );
}

function QualityArt() {
  return (
    <svg className="help-art-svg" viewBox="0 0 360 150" role="img" aria-hidden focusable="false">
      <rect x={26} y={22} width={96} height={106} rx={8} {...sheet} />
      <rect x={38} y={34} width={72} height={82} fill="none" stroke="var(--c-accent)" strokeWidth={1.5} strokeDasharray="5 4" />
      <text x={74} y={142} textAnchor="middle" fontSize={12} fill="var(--c-muted)">여백(끝 안 잘리게)</text>
      <text x={250} y={36} textAnchor="middle" fontSize={12} fill="var(--c-muted)">해상도</text>
      <text x={205} y={92} textAnchor="middle" fontSize={40} fontWeight={800} fill="var(--c-faint)" opacity={0.6}>A</text>
      <text x={205} y={110} textAnchor="middle" fontSize={11} fill="var(--c-muted)">흐림</text>
      <Arrow x={232} y={80} />
      <text x={300} y={92} textAnchor="middle" fontSize={40} fontWeight={800} fill="var(--c-brand-strong)">A</text>
      <text x={300} y={110} textAnchor="middle" fontSize={11} fill="var(--c-muted)">또렷</text>
    </svg>
  );
}

function MarksArt() {
  const cells = [
    { x: 120, y: 18, label: '1-1' },
    { x: 196, y: 18, label: '1-2' },
    { x: 120, y: 78, label: '2-1' },
    { x: 196, y: 78, label: '2-2' },
  ];
  return (
    <svg className="help-art-svg" viewBox="0 0 360 150" role="img" aria-hidden focusable="false">
      {cells.map((c) => (
        <g key={c.label}>
          <rect x={c.x} y={c.y} width={76} height={60} fill="var(--c-surface)" stroke="var(--c-border-2)" strokeWidth={2} />
          <text x={c.x + 11} y={c.y + 18} fontSize={13} fontWeight={700} fill="var(--c-text-2)">{c.label}</text>
        </g>
      ))}
      <line x1={196} y1={18} x2={196} y2={138} stroke="#0b5ed7" strokeWidth={2} strokeDasharray="5 4" />
      <line x1={120} y1={78} x2={272} y2={78} stroke="#0b5ed7" strokeWidth={2} strokeDasharray="5 4" />
    </svg>
  );
}

interface HelpPage {
  title: string;
  lead: string;
  steps: string[];
  art: ReactNode;
}

const PAGES: HelpPage[] = [
  {
    title: '프린터 테스트 · 크기 보정',
    lead: '큰 그림을 여러 장으로 인쇄하면 프린터마다 크기가 조금씩 달라질 수 있어요. 진짜 인쇄 전에 딱 맞는지 확인해요.',
    steps: [
      '① 시험 삼아 A4 2장만 인쇄해요.',
      '② 그림 속 네모(100mm)를 자로 재 봐요.',
      '③ 잰 길이를 적으면, 앱이 알아서 크기를 딱 맞게 고쳐줘요.',
    ],
    art: <TestArt />,
  },
  {
    title: '이어붙이기 (풀칠)',
    lead: '여러 장을 이어 붙일 때, 가장자리에 살짝 겹치는 자리를 남겨요. 그래야 풀로 붙이기 쉽고 틈이 안 생겨요.',
    steps: [
      '노란 줄무늬가 “겹쳐서 풀칠하는 자리”예요.',
      '숫자(mm)를 키우면 겹치는 부분이 넓어져요.',
      '0으로 하면 겹침 없이 딱 잘려요.',
    ],
    art: <GlueArt />,
  },
  {
    title: '인쇄 품질 (여백 · 해상도)',
    lead: '인쇄가 깔끔하게 나오도록 도와주는 설정이에요.',
    steps: [
      '여백: 프린터는 종이 끝까지 못 찍어요. 그림이 잘리지 않게 끝에 살짝 여백(3~5mm)을 둬요.',
      '해상도: 숫자가 클수록 더 또렷해요. 대신 만드는 시간이 조금 더 걸려요.',
    ],
    art: <QualityArt />,
  },
  {
    title: '표시 항목 (페이지 번호 · 경계선)',
    lead: '인쇄물을 붙이기 쉽게 도와주는 안내 표시예요.',
    steps: [
      '페이지 번호(1-1, 1-2…): 어떤 장을 어디에 붙일지 알려줘요. 번호 순서대로 붙이면 돼요.',
      '경계선: 장과 장의 경계를 점선으로 보여줘요. 인쇄물에 선이 남기 싫으면 꺼요.',
    ],
    art: <MarksArt />,
  },
];

export function AdvancedHelpModal({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(0);
  const current = PAGES[page];
  const isLast = page === PAGES.length - 1;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="help-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adv-help-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="help-modal-head">
          <h2 id="adv-help-title">{current.title}</h2>
          <button type="button" className="help-modal-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>

        <div className="help-modal-body">
          <div className="help-art">{current.art}</div>
          <p className="help-modal-lead">{current.lead}</p>
          <ul className="help-modal-steps">
            {current.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>

        <footer className="help-modal-foot">
          <div className="help-modal-dots" aria-hidden>
            {PAGES.map((p, index) => (
              <button
                key={p.title}
                type="button"
                className="help-dot"
                data-active={index === page}
                onClick={() => setPage(index)}
                aria-label={`${index + 1}페이지`}
              />
            ))}
          </div>
          <div className="help-modal-nav">
            <button
              type="button"
              className="secondary-button"
              disabled={page === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              이전
            </button>
            {isLast ? (
              <button type="button" className="export-button" onClick={onClose}>
                확인
              </button>
            ) : (
              <button
                type="button"
                className="export-button"
                onClick={() => setPage((value) => Math.min(PAGES.length - 1, value + 1))}
              >
                다음
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}
