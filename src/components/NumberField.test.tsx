import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NumberField } from './NumberField';

afterEach(cleanup);

describe('NumberField', () => {
  it('ArrowUp/ArrowDown으로 값을 증감한다', () => {
    const onChange = vi.fn();
    render(<NumberField label="행" value={2} min={1} max={10} step={1} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenLastCalledWith(3);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it('min을 벗어나지 않도록 클램프한다', () => {
    const onChange = vi.fn();
    render(<NumberField label="행" value={1} min={1} max={2} step={1} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('disabled 상태에서는 화살표 키가 동작하지 않는다', () => {
    const onChange = vi.fn();
    render(
      <NumberField label="행" value={2} min={1} max={10} step={1} disabled onChange={onChange} />,
    );

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('스테퍼 버튼이 Tab으로 접근 가능하다(tabIndex=-1이 아님)', () => {
    render(<NumberField label="행" value={2} min={1} max={10} step={1} onChange={vi.fn()} />);

    const increment = screen.getByRole('button', { name: '행 증가' });
    expect(increment).not.toHaveAttribute('tabindex', '-1');
  });
});
