import { boardName, buttonWords, setLanguages } from '@open-aac/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { starterOf, starterSet } from '../src/lib/starter';

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

describe('Spanish-first starter boards', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('are chosen in Spanish, with English translations', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    const set = await starterSet('es');
    const core = set.boards.find((board) => board.id === set.rootId)!;
    expect(core.locale).toBe('es');
    expect(boardName(core)).toBe('Palabras básicas');
    expect(boardName(core, 'en')).toBe('Core words');
    expect(setLanguages(set)).toEqual(['en', 'es']);
    for (const board of set.boards) {
      expect(boardName(board, 'en'), board.id).not.toBe(board.name);
      for (const button of board.buttons) {
        expect(buttonWords(button, 'en').label, button.label).not.toBe('');
      }
    }
    const labels = core.buttons.map((b) => b.label);
    // Verbs in the forms young speakers use, articles, and "no" only once.
    expect(labels).toEqual(
      expect.arrayContaining(['quiero', 'me gusta', 'dame', 'el', 'la', 'un']),
    );
    expect(labels.filter((l) => l === 'no')).toHaveLength(1);
    // Articles are shown as words alone.
    expect(core.buttons.find((b) => b.label === 'el')!.image_id).toBeUndefined();
    expect(starterOf(set)).toBe('es');
  });

  it('give each board a phone layout that fits', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    const set = await starterSet('es');
    const phone = set.boards.find((board) => board.id === 'core-phone')!;
    expect(phone.grid.order.flat().filter(Boolean)).toHaveLength(28);
  });
});
