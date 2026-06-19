import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * 평소엔 작은 ⓘ 아이콘만, 누르면 작은 말풍선으로 자세한 설명을 보여준다.
 * 말풍선은 화면 기준(position: fixed)으로 띄워 패널의 overflow에 잘리지 않게 한다.
 */
export function InfoHint({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bubble = bubbleRef.current;
    const bw = bubble ? bubble.offsetWidth : 240;
    const bh = bubble ? bubble.offsetHeight : 120;
    const left = Math.min(Math.max(8, rect.left), vw - bw - 8);
    let top = rect.bottom + 6;
    if (top + bh > vh - 8) top = Math.max(8, rect.top - 6 - bh);
    setPos({ left, top });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (btnRef.current?.contains(target) || bubbleRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <span className="info-hint">
      <button
        ref={btnRef}
        type="button"
        className="info-hint-btn"
        aria-label="자세히 보기"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden focusable="false">
          <circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" strokeWidth={1.4} />
          <circle cx="8" cy="5" r="0.95" fill="currentColor" />
          <path d="M8 7.4v4" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <span
          ref={bubbleRef}
          className="info-hint-bubble"
          role="tooltip"
          style={pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden' }}
        >
          {children}
        </span>
      ) : null}
    </span>
  );
}
