import { describe, expect, it } from 'vitest';
import { pickDefaultVoice, rankVoices, type RawVoice } from '../src/lib/speech';

const voice = (name: string, lang: string, localService = true, isDefault = false): RawVoice => ({
  name,
  lang,
  localService,
  default: isDefault,
});

const VOICES = [
  voice('Google US English', 'en-US', false),
  voice('Bells', 'en-US'),
  voice('Samantha', 'en-US'),
  voice('Ava (Premium)', 'en-US'),
  voice('Daniel', 'en-GB'),
  voice('Monica', 'es-ES'),
  voice('Zoe (Enhanced)', 'en-US'),
];

describe('rankVoices', () => {
  it('puts the app language first, then better quality, then names', () => {
    expect(rankVoices(VOICES, 'en-US').map((v) => v.name)).toEqual([
      'Ava (Premium)',
      'Zoe (Enhanced)',
      'Bells',
      'Daniel',
      'Google US English',
      'Samantha',
      'Monica',
    ]);
  });

  it('drops voices the browser lists twice', () => {
    const ranked = rankVoices([voice('Samantha', 'en-US'), voice('Samantha', 'en-US')], 'en-US');
    expect(ranked.map((v) => v.key)).toEqual(['Samantha|en-US']);
  });

  it('flags novelty voices and network voices', () => {
    const ranked = rankVoices(VOICES, 'en-US');
    expect(ranked.find((v) => v.name === 'Bells')?.novelty).toBe(true);
    expect(ranked.find((v) => v.name === 'Samantha')?.novelty).toBe(false);
    expect(ranked.find((v) => v.name === 'Google US English')?.local).toBe(false);
  });
});

describe('pickDefaultVoice', () => {
  it('prefers a good on-device voice in the exact language', () => {
    expect(pickDefaultVoice(VOICES, 'en-US')?.name).toBe('Ava (Premium)');
  });

  it('never picks a novelty voice, and falls back across regions', () => {
    expect(
      pickDefaultVoice([voice('Bells', 'en-US'), voice('Daniel', 'en-GB')], 'en-US')?.name,
    ).toBe('Daniel');
  });

  it('prefers on-device voices over network ones, so speech works offline', () => {
    expect(
      pickDefaultVoice(
        [voice('Google US English', 'en-US', false), voice('Fred', 'en-US')],
        'en-US',
      )?.name,
    ).toBe('Fred');
  });

  it('returns null when nothing speaks the language', () => {
    expect(pickDefaultVoice([voice('Monica', 'es-ES')], 'en-US')).toBeNull();
  });
});
