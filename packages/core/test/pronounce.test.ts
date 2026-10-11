import { describe, expect, it } from 'vitest';
import { applyPronunciations } from '../src';

describe('applyPronunciations', () => {
  const entries = [
    { word: 'Siobhan', sayAs: 'shiv-awn' },
    { word: 'ice', sayAs: 'eyes' },
    { word: 'ice cream', sayAs: 'icecream' },
    { word: 'Zoë', sayAs: 'zo-ee' },
    { word: '', sayAs: 'nothing' },
  ];

  it('replaces whole words, ignoring case', () => {
    expect(applyPronunciations('I want siobhan', entries)).toBe('I want shiv-awn');
    expect(applyPronunciations('nice price', entries)).toBe('nice price');
  });

  it('prefers the longest match', () => {
    expect(applyPronunciations('ice cream and ice', entries)).toBe('icecream and eyes');
  });

  it('works with accented letters', () => {
    expect(applyPronunciations('Zoë, hi', entries)).toBe('zo-ee, hi');
  });

  it('leaves text alone without entries', () => {
    expect(applyPronunciations('a+b (c)', [])).toBe('a+b (c)');
    expect(applyPronunciations('a+b (c)', [{ word: 'a+b', sayAs: 'a plus b' }])).toBe(
      'a plus b (c)',
    );
  });
});
