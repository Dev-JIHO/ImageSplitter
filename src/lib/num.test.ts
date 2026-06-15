import { describe, expect, it } from 'vitest';
import {
  clamp,
  normalizeNumberDraft,
  normalizeRotation,
  round,
  roundNumber,
} from './num';

describe('round', () => {
  it('소수점 한 자리로 반올림한다', () => {
    expect(round(1.24)).toBe(1.2);
    expect(round(1.25)).toBe(1.3);
  });
});

describe('roundNumber', () => {
  it('소수점 세 자리로 반올림한다', () => {
    expect(roundNumber(1.23456)).toBe(1.235);
  });
});

describe('clamp', () => {
  it('범위 안으로 제한한다', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe('normalizeNumberDraft', () => {
  it('숫자/소수점만 남긴다', () => {
    expect(normalizeNumberDraft('12a3')).toBe('123');
    expect(normalizeNumberDraft('abc')).toBe('');
  });

  it('선행 0을 정리한다', () => {
    expect(normalizeNumberDraft('007')).toBe('7');
    expect(normalizeNumberDraft('0')).toBe('0');
  });

  it('소수점을 보존한다', () => {
    expect(normalizeNumberDraft('1.5')).toBe('1.5');
    expect(normalizeNumberDraft('1.2.3')).toBe('1.23');
  });
});

describe('normalizeRotation', () => {
  it('0~359 범위로 정규화한다', () => {
    expect(normalizeRotation(0)).toBe(0);
    expect(normalizeRotation(360)).toBe(0);
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
  });
});
