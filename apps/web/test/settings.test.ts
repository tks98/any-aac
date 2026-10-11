import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, withDefaults } from '../src/lib/settings';

describe('withDefaults', () => {
  it('fills in everything when nothing was saved', () => {
    expect(withDefaults(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(withDefaults('nonsense')).toEqual(DEFAULT_SETTINGS);
  });

  it('reads voices chosen per language', () => {
    const settings = withDefaults({
      speech: {
        engine: 'openaac',
        openaacVoices: { en: 'en_US-joe-medium', es: 'es_MX-ald-medium', 'not a lang': 'x' },
        deviceVoices: { es: 'Paulina|es-MX', en: 42 },
      },
    });
    expect(settings.speech.engine).toBe('openaac');
    expect(settings.speech.openaacVoices).toEqual({
      en: 'en_US-joe-medium',
      es: 'es_MX-ald-medium',
    });
    expect(settings.speech.deviceVoices).toEqual({ es: 'Paulina|es-MX' });
    expect(withDefaults({ speech: { engine: 'robot' } }).speech.engine).toBe('device');
  });

  it('carries over the single voices saved by older versions', () => {
    const settings = withDefaults({
      speech: { voice: 'Samantha|en-US', openaacVoice: 'en_US-joe-medium' },
    });
    expect(settings.speech.deviceVoices).toEqual({ en: 'Samantha|en-US' });
    expect(settings.speech.openaacVoices).toEqual({ en: 'en_US-joe-medium' });
  });

  it('reads language choices and rejects malformed ones', () => {
    const settings = withDefaults({
      language: { primary: 'en', second: 'es', usingSecond: true, app: 'es' },
    });
    expect(settings.language).toEqual({
      primary: 'en',
      second: 'es',
      usingSecond: true,
      app: 'es',
    });
    expect(withDefaults({ language: { second: 'Spanish', app: 'xx' } }).language).toEqual(
      DEFAULT_SETTINGS.language,
    );
  });

  it('keeps valid saved values and repairs the rest', () => {
    const settings = withDefaults({
      speech: { rate: 9, speakEachWord: false },
      touch: { holdMs: 600, selectOnRelease: 'yes' },
      display: { labelPosition: 'above', buttonGap: -4 },
    });
    expect(settings.speech.rate).toBe(2);
    expect(settings.speech.speakEachWord).toBe(false);
    expect(settings.touch).toEqual({ holdMs: 600, selectOnRelease: false, ignoreRepeatMs: 0 });
    expect(settings.display).toEqual({
      theme: 'light',
      colorStyle: 'fill',
      labelScale: 1,
      labelPosition: 'above',
      showSymbols: true,
      buttonGap: 0,
      showWordForms: true,
      showShare: false,
    });
  });

  it('keeps pronunciations and volume, dropping malformed entries', () => {
    const settings = withDefaults({
      speech: {
        volume: 7,
        pronunciations: [{ word: 'Siobhan', sayAs: 'shiv-awn' }, { word: 3 }, 'x'],
      },
    });
    expect(settings.speech.volume).toBe(1);
    expect(settings.speech.pronunciations).toEqual([{ word: 'Siobhan', sayAs: 'shiv-awn' }]);
  });
});
