import { describe, expect, it } from 'vitest';
import { phonemeIds, separateSentences } from '../src/lib/voice/piper';

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
