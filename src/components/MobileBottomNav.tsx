import type { MobilePanel } from '../types';

export function MobileBottomNav({
  activePanel,
  hasImage,
  onSelect,
}: {
  activePanel: MobilePanel;
  hasImage: boolean;
  onSelect: (panel: MobilePanel) => void;
}) {
  const items: Array<[MobilePanel, string]> = [
    ['settings', hasImage ? '설정 ✓' : '설정'],
    ['preview', '미리보기'],
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="모바일 단계 이동">
      {items.map(([panel, label]) => (
        <button
          key={panel}
          type="button"
          className={activePanel === panel ? 'active' : ''}
          onClick={() => onSelect(panel)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
