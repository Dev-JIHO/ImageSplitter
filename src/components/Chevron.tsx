export function Chevron({ dir }: { dir: 'left' | 'right' }) {
  // 삼중 셰브론(«‹ / ›»). flex 중앙정렬 안에서 viewBox 기준으로 항상 정중앙.
  const d =
    dir === 'left'
      ? 'M6 3 L2 8 L6 13 M11 3 L7 8 L11 13 M16 3 L12 8 L16 13'
      : 'M12 3 L16 8 L12 13 M7 3 L11 8 L7 13 M2 3 L6 8 L2 13';
  return (
    <svg viewBox="0 0 18 16" width="16" height="16" aria-hidden focusable="false">
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
