import { boardName, buttonWords, setLanguages, type BoardSet, type ObfBoard } from '@any-aac/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BOARD_SIZES, sizeOf, starterOf, starterSet } from '../src/lib/starter';

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

describe('starter boards in three sizes', () => {
  afterEach(() => vi.unstubAllGlobals());

  const root = (set: BoardSet) => set.boards.find((board) => board.id === set.rootId)!;
  const board = (set: BoardSet, id: string) => set.boards.find((b) => b.id === id)!;

  /** Each word's cell: its centre and size, as fractions of the board's width and height. */
  function places(of: ObfBoard) {
    const { rows, columns, order } = of.grid;
    const byId = new Map(of.buttons.map((button) => [String(button.id), button]));
    const out = new Map<string, { x: number; y: number; w: number; h: number }>();
    order.forEach((row, r) =>
      row.forEach((id, c) => {
        const label = id === null ? undefined : byId.get(String(id))?.label;
        if (label) {
          out.set(label, {
            x: (c + 0.5) / columns,
            y: (r + 0.5) / rows,
            w: 1 / columns,
            h: 1 / rows,
          });
        }
      }),
    );
    return out;
  }

  for (const id of ['en', 'es'] as const) {
    it(`keep every word in the same part of the screen (${id})`, async () => {
      vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
      const [small, medium, large] = await Promise.all([
        starterSet(id, 'small'),
        starterSet(id, 'medium'),
        starterSet(id, 'large'),
      ]);
      expect(root(small).grid).toMatchObject({ rows: 4, columns: 6 });
      expect(root(medium).grid).toMatchObject({ rows: 6, columns: 8 });
      expect(root(large).grid).toMatchObject({ rows: 7, columns: 12 });
      expect([small, medium, large].map(sizeOf)).toEqual(['small', 'medium', 'large']);

      const mediumPlaces = places(root(medium));
      // Large: every medium word, within half a cell of where it was.
      const largePlaces = places(root(large));
      expect(largePlaces.size).toBe(84);
      for (const [label, was] of mediumPlaces) {
        const is = largePlaces.get(label);
        expect(is, label).toBeDefined();
        expect(Math.abs(is!.x - was.x), label).toBeLessThanOrEqual(is!.w / 2 + 1e-9);
        expect(Math.abs(is!.y - was.y), label).toBeLessThanOrEqual(is!.h / 2 + 1e-9);
      }
      // Small: each word in the cell that covers its medium place.
      for (const [label, is] of places(root(small))) {
        const was = mediumPlaces.get(label);
        if (!was) continue; // the folder to the other words
        expect(Math.abs(is.x - was.x), label).toBeLessThanOrEqual(is.w / 2 + 1e-9);
        expect(Math.abs(is.y - was.y), label).toBeLessThanOrEqual(is.h / 2 + 1e-9);
      }
      // …and every medium word is still there: on the small board, the board
      // of the other words, or (who) People.
      const reachable = new Set(
        [root(small), board(small, 'more-words'), board(small, 'people')].flatMap((b) =>
          b.buttons.map((button) => button.label),
        ),
      );
      for (const label of mediumPlaces.keys()) expect(reachable.has(label), label).toBe(true);
    });
  }

  it('reach every board from the core board in each size', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    for (const [id, size] of (['en', 'es'] as const).flatMap((id) =>
      BOARD_SIZES.map((size) => [id, size] as const),
    )) {
      const set = await starterSet(id, size);
      const seen = new Set([set.rootId]);
      const queue = [set.rootId];
      while (queue.length > 0) {
        for (const button of board(set, queue.shift()!).buttons) {
          const next = button.load_board?.id;
          if (next && !seen.has(next)) {
            expect(board(set, next), `${id} ${size}: ${next}`).toBeDefined();
            seen.add(next);
            queue.push(next);
          }
        }
      }
      const tabletBoards = set.boards
        .map((b) => b.id)
        .filter((b) => !b.endsWith('-phone') && b !== 'phrases');
      expect([...seen].sort(), `${id} ${size}`).toEqual(tabletBoards.sort());
    }
  });
});
