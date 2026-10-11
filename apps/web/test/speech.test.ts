import { afterEach, describe, expect, it, vi } from 'vitest';
import { pickDefaultVoice, rankVoices, WebSpeech, type RawVoice } from '../src/lib/speech';

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

/**
 * A stand-in for iOS's speechSynthesis: speech only starts inside a tap's
 * touchend or click until it has started once; before that it's dropped.
 */
function iosSpeech() {
  class Utterance extends EventTarget {
    lang = '';
    rate = 1;
    pitch = 1;
    volume = 1;
    voice: unknown = null;
    constructor(readonly text: string) {
      super();
    }
  }
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
  const said: string[] = [];
  let inGesture = false;
  let unlocked = false;
  const synth = {
    speaking: false,
    pending: false,
    speak(utterance: Utterance) {
      if (!inGesture && !unlocked) return;
      unlocked = true;
      said.push(utterance.volume === 0 ? '(silent)' : utterance.text);
      utterance.dispatchEvent(new Event('start'));
    },
    cancel() {},
    getVoices: () => [],
    addEventListener() {},
    removeEventListener() {},
  };
  const events = new EventTarget();
  const speech = new WebSpeech('en', synth as unknown as SpeechSynthesis, events);
  /** A tap: the word is chosen on pointerdown, and the tap ends with touchend. */
  const tap = (word?: string) => {
    if (word) speech.speak(word);
    inGesture = true;
    events.dispatchEvent(new Event('touchend'));
    inGesture = false;
  };
  return { speech, synth, said, tap };
}

describe('WebSpeech on iOS', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('says the first word from the end of the tap, then speaks straight away', () => {
    const { said, tap } = iosSpeech();
    tap('I');
    expect(said).toEqual(['I']);
    tap('want');
    expect(said).toEqual(['I', 'want']);
  });

  it('unlocks speech with silence when a tap has nothing to say', () => {
    const { speech, said, tap } = iosSpeech();
    tap();
    expect(said).toEqual(['(silent)']);
    speech.speak('more');
    expect(said).toEqual(['(silent)', 'more']);
  });

  it("doesn't repeat a word that is already being said", () => {
    const { synth, said, tap } = iosSpeech();
    synth.speaking = true;
    tap('go');
    expect(said).toEqual([]);
  });

  it("doesn't say an old word that never started on a later tap", () => {
    vi.useFakeTimers();
    const { speech, said, tap } = iosSpeech();
    speech.speak('stop');
    vi.advanceTimersByTime(5000);
    tap();
    expect(said).toEqual(['(silent)']);
  });
});
