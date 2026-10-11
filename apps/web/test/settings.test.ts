import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, withDefaults } from '../src/lib/settings';

describe('withDefaults', () => {
  it('fills in everything when nothing was saved', () => {
    expect(withDefaults(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(withDefaults('nonsense')).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid saved values and repairs the rest', () => {
    const settings = withDefaults({
      speech: { voice: 'Samantha|en-US', rate: 9, speakEachWord: false },
      touch: { holdMs: 600, selectOnRelease: 'yes' },
      display: { labelPosition: 'above', buttonGap: -4 },
    });
    expect(settings.speech).toEqual({
      voice: 'Samantha|en-US',
      rate: 2,
      pitch: 1,
      speakEachWord: false,
    });
    expect(settings.touch).toEqual({ holdMs: 600, selectOnRelease: false, ignoreRepeatMs: 0 });
    expect(settings.display).toEqual({ labelPosition: 'above', showSymbols: true, buttonGap: 0 });
  });
});
