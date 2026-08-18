import { afterEach, describe, expect, it } from 'vitest';
import { pushAdUnit } from './adsenseLoader';

describe('pushAdUnit', () => {
  afterEach(() => {
    window.adsbygoogle = undefined;
  });

  it('같은 요소에 대해 한 번만 push한다', () => {
    const el = document.createElement('ins');

    pushAdUnit(el);
    pushAdUnit(el);
    pushAdUnit(el);

    expect(window.adsbygoogle).toHaveLength(1);
  });

  it('서로 다른 요소는 각각 push한다', () => {
    const first = document.createElement('ins');
    const second = document.createElement('ins');

    pushAdUnit(first);
    pushAdUnit(second);

    expect(window.adsbygoogle).toHaveLength(2);
  });
});
