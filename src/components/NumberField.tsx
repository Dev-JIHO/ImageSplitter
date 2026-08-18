import { useEffect, useRef, useState } from 'react';
import { normalizeNumberDraft, roundNumber } from '../lib/num';

export function NumberField(props: {
  label: string;
  value: number;
  min: number;
  max?: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(props.value));
  const isFocusedRef = useRef(false);

  useEffect(() => {
    // 입력 중에는 외부 값으로 덮어쓰지 않는다.
    // (입력 도중 최소값 클램프 → draft 재동기화가 일어나면
    //  예: min 50에서 "9" 입력 → 50으로 바뀐 뒤 "7"이 붙어 507이 되는 버그)
    if (!isFocusedRef.current) {
      setDraft(String(props.value));
    }
  }, [props.value]);

  function commitDraft(nextDraft: string) {
    const normalized = normalizeNumberDraft(nextDraft);
    setDraft(normalized);
    if (normalized === '') return;

    const nextValue = Number(normalized);
    // 입력 도중에는 최소값 미만이어도 강제로 올리지 않고, 확정은 blur에서 한다.
    if (
      Number.isFinite(nextValue) &&
      nextValue >= props.min &&
      (props.max === undefined || nextValue <= props.max)
    ) {
      props.onChange(nextValue);
    }
  }

  function handleBlur() {
    isFocusedRef.current = false;
    if (draft === '' || !Number.isFinite(Number(draft))) {
      setDraft(String(props.value));
      return;
    }
    const clamped = clampToRange(Number(draft));
    setDraft(String(clamped));
    props.onChange(clamped);
  }

  function stepDraft(direction: 1 | -1) {
    const base = draft === '' || !Number.isFinite(Number(draft)) ? props.value : Number(draft);
    const nextValue = clampToRange(roundNumber(base + props.step * direction));
    setDraft(String(nextValue));
    props.onChange(nextValue);
  }

  function clampToRange(value: number) {
    const withMin = Math.max(props.min, value);
    return props.max === undefined ? withMin : Math.min(props.max, withMin);
  }

  return (
    <label className="field">
      <span>{props.label}</span>
      <div className="number-input-control">
        <input
          type="text"
          inputMode="decimal"
          min={props.min}
          max={props.max}
          step={props.step}
          value={draft}
          disabled={props.disabled}
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onChange={(event) => commitDraft(event.target.value)}
          onBlur={handleBlur}
          onKeyDown={(event) => {
            if (props.disabled) return;
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              stepDraft(1);
            } else if (event.key === 'ArrowDown') {
              event.preventDefault();
              stepDraft(-1);
            }
          }}
        />
        <div className="number-stepper" aria-hidden={props.disabled}>
          <button
            type="button"
            disabled={props.disabled}
            aria-label={`${props.label} 증가`}
            onClick={() => stepDraft(1)}
          >
            +
          </button>
          <button
            type="button"
            disabled={props.disabled}
            aria-label={`${props.label} 감소`}
            onClick={() => stepDraft(-1)}
          >
            -
          </button>
        </div>
      </div>
    </label>
  );
}
