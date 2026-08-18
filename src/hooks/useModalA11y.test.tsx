import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useModalA11y } from './useModalA11y';

afterEach(cleanup);

function TestModal({ onClose }: { onClose: () => void }) {
  const ref = useModalA11y<HTMLDivElement>(onClose);
  return (
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true">
      <button type="button">첫번째</button>
      <button type="button">두번째</button>
      <button type="button">마지막</button>
    </div>
  );
}

describe('useModalA11y', () => {
  it('마운트 시 첫 포커스 가능 요소로 포커스를 옮긴다', () => {
    render(<TestModal onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: '첫번째' })).toHaveFocus();
  });

  it('Escape를 누르면 onClose를 호출한다', () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('마지막 요소에서 Tab을 누르면 첫 요소로 순환한다', () => {
    render(<TestModal onClose={vi.fn()} />);
    const last = screen.getByRole('button', { name: '마지막' });
    last.focus();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' });
    expect(screen.getByRole('button', { name: '첫번째' })).toHaveFocus();
  });

  it('첫 요소에서 Shift+Tab을 누르면 마지막 요소로 순환한다', () => {
    render(<TestModal onClose={vi.fn()} />);
    const first = screen.getByRole('button', { name: '첫번째' });
    first.focus();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('button', { name: '마지막' })).toHaveFocus();
  });

  it('렌더마다 onClose가 새로 생성되어도 Escape는 최신 콜백을 호출한다', () => {
    const onCloseA = vi.fn();
    const onCloseB = vi.fn();
    const { rerender } = render(<TestModal onClose={onCloseA} />);
    rerender(<TestModal onClose={onCloseB} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onCloseA).not.toHaveBeenCalled();
    expect(onCloseB).toHaveBeenCalledTimes(1);
  });
});
