export function Chevron({ dir }: { dir: 'left' | 'right' }) {
  // 더블 셰브론(«/»). flex 중앙정렬 컨테이너 안에서 viewBox 기준으로 항상 정중앙에 그려진다.
  const d =
    dir === 'left'
      ? 'M9 3 L5 8 L9 13 M13 3 L9 8 L13 13'
      : 'M7 3 L11 8 L7 13 M3 3 L7 8 L3 13';
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden focusable="false">
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
