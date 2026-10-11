import { boardName, buttonWords, setLanguages } from '@open-aac/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { starterSet } from '../src/lib/starter';

describe('starter boards', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('come in English and Spanish, with every word and board translated', async () => {
    // Offline: symbols fall back to placeholders, which is all this test needs.
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    const set = await starterSet();
    expect(setLanguages(set)).toEqual(['en', 'es']);
    for (const board of set.boards) {
      expect(boardName(board, 'es')).not.toBe(board.name);
      for (const button of board.buttons) {
        expect(buttonWords(button, 'es').label, button.label).not.toBe('');
      }
    }
    const core = set.boards.find((board) => board.id === set.rootId)!;
    const want = core.buttons.find((button) => button.label === 'want')!;
    expect(buttonWords(want, 'es')).toEqual({ label: 'quiero', text: 'quiero' });
    expect(boardName(core, 'es')).toBe('Palabras básicas');
  });
});
