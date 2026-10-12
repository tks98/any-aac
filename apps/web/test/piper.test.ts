import { describe, expect, it, vi } from 'vitest';
import { CALLS_PER_INSTANCE, Espeak, phonemeIds, separateSentences } from '../src/lib/voice/piper';

const MAP: Record<string, number[]> = {
  _: [0],
  '^': [1],
  $: [2],
  ' ': [3],
  h: [20],
  ə: [59],
  l: [24],
  ˈ: [120],
  o: [27],
  ʊ: [100],
};

describe('phonemeIds', () => {
  it('follows Piper: start, each phoneme then a pad, end', () => {
    expect(phonemeIds('həlˈoʊ', MAP)).toEqual([
      1, 0, 20, 0, 59, 0, 24, 0, 120, 0, 27, 0, 100, 0, 2,
    ]);
  });

  it('skips phonemes the voice does not know', () => {
    expect(phonemeIds('h?l', MAP)).toEqual([1, 0, 20, 0, 24, 0, 2]);
  });

  it('keeps spaces between words', () => {
    expect(phonemeIds('h h', MAP)).toEqual([1, 0, 20, 0, 3, 0, 20, 0, 2]);
  });
});

describe('separateSentences', () => {
  it('adds a pause after a sentence end that runs into the next sentence', () => {
    expect(separateSentences(['h', 'i', '.', 'h', 'o', '?'])).toEqual([
      'h',
      'i',
      '.',
      ' ',
      'h',
      'o',
      '?',
    ]);
    expect(separateSentences(['a', '.', ' ', 'b'])).toEqual(['a', '.', ' ', 'b']);
  });

  it('accepts phonemes already split into tokens', () => {
    expect(phonemeIds(['h', 'ə'], MAP)).toEqual([1, 0, 20, 0, 59, 0, 2]);
  });
});

/** A stand-in piper-phonemize that, like the real one, breaks after 80 calls. */
const fakePhonemizer = vi.hoisted(() => ({ instances: 0, breakAfter: 80 }));
vi.mock('../src/lib/voice/phonemizer/piper_phonemize.js', () => ({
  default: async (options: { print: (line: string) => void }) => {
    fakePhonemizer.instances++;
    let calls = 0;
    return {
      callMain(args: string[]) {
        if (++calls > fakePhonemizer.breakAfter)
          throw new Error('null function or function signature mismatch');
        const text = (JSON.parse(args[3]!) as { text: string }[])[0]!.text;
        options.print(JSON.stringify({ phonemes: [...text] }));
      },
    };
  },
}));

describe('Espeak', () => {
  it('stays working past the point where piper-phonemize breaks', async () => {
    fakePhonemizer.instances = 0;
    const espeak = await Espeak.start();
    for (let i = 0; i < 300; i++) {
      expect(await espeak.phonemize('hi', 'en')).toEqual(['h', 'i']);
    }
    // Renewed every 50 calls, so it never reaches the break.
    expect(fakePhonemizer.instances).toBe(Math.ceil(300 / CALLS_PER_INSTANCE));
  });

  it('renews and retries when a call fails anyway', async () => {
    fakePhonemizer.instances = 0;
    fakePhonemizer.breakAfter = 3;
    const espeak = await Espeak.start();
    for (let i = 0; i < 5; i++) expect(await espeak.phonemize('ok', 'es')).toEqual(['o', 'k']);
    expect(fakePhonemizer.instances).toBe(2);
    fakePhonemizer.breakAfter = 80;
  });
});
