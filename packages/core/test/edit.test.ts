import { describe, expect, it } from 'vitest';
import {
  addButton,
  addEmptyBoard,
  boardName,
  buttonAt,
  buttonWords,
  clearCell,
  createBoard,
  linkableBoards,
  linkedLayout,
  placeButton,
  replaceBoard,
  setTranslatedLabel,
  setTranslatedName,
  swapCells,
  uniqueId,
  updateButton,
  without,
  withoutUnusedFiles,
  type BoardSet,
} from '../src';

const board = () => {
  let b = createBoard({ id: 'core', name: 'Core', rows: 2, columns: 2 });
  b = placeButton(b, 0, 0, { id: 'want', label: 'want', image_id: 'img-want' }, { id: 'img-want' });
  b = placeButton(b, 0, 1, { id: 'more', label: 'more' });
  return b;
};

describe('uniqueId', () => {
  it('makes a readable id that is not taken', () => {
    expect(uniqueId('Ice cream!', [])).toBe('ice-cream');
    expect(uniqueId('Ice cream', ['ice-cream', 'ice-cream-2'])).toBe('ice-cream-3');
    expect(uniqueId('mamá', [])).toBe('mama');
    expect(uniqueId('?!', [])).toBe('item');
  });
});

describe('editing buttons', () => {
  it('changes a button and drops images nothing uses', () => {
    const edited = updateButton(board(), 'want', (b) => ({
      ...without(b, 'image_id'),
      label: 'need',
    }));
    expect(buttonAt(edited, { row: 0, column: 0 })?.label).toBe('need');
    expect(edited.images).toEqual([]);
    expect(board().images).toHaveLength(1);
  });

  it('adds a button to an empty cell, with a unique id', () => {
    const edited = addButton(board(), { row: 1, column: 1 }, { label: 'more' }, { id: 'img-2' });
    const added = buttonAt(edited, { row: 1, column: 1 });
    expect(added).toEqual({ id: 'more-2', label: 'more' });
    expect(edited.images.map((i) => i.id)).toEqual(['img-want', 'img-2']);
    expect(() => addButton(edited, { row: 0, column: 0 }, { label: 'x' })).toThrow();
  });

  it('clears a cell and forgets its button', () => {
    const edited = clearCell(board(), { row: 0, column: 0 });
    expect(edited.grid.order[0]).toEqual([null, 'more']);
    expect(edited.buttons.map((b) => b.id)).toEqual(['more']);
    expect(edited.images).toEqual([]);
  });

  it('swaps two cells, empty or not', () => {
    const edited = swapCells(board(), { row: 0, column: 0 }, { row: 1, column: 1 });
    expect(edited.grid.order).toEqual([
      [null, 'more'],
      [null, 'want'],
    ]);
  });
});

describe('translations', () => {
  it('sets and removes a label in another language', () => {
    const button = { id: 'want', label: 'want' };
    const spanish = setTranslatedLabel(button, 'es', 'quiero');
    expect(buttonWords(spanish, 'es').label).toBe('quiero');
    expect(setTranslatedLabel(spanish, 'es-MX', 'yo quiero').translations).toEqual({
      es: { label: 'yo quiero' },
    });
    expect(setTranslatedLabel(spanish, 'es', '')).toEqual(button);
  });

  it('sets a board name in another language', () => {
    expect(boardName(setTranslatedName(board(), 'es', 'Básicas'), 'es')).toBe('Básicas');
  });
});

describe('boards in a set', () => {
  const set = (): BoardSet => {
    const core = {
      ...board(),
      ext_openaac_compact_board: 'core-phone',
      ext_openaac_placeholder: true,
    };
    const phone = createBoard({ id: 'core-phone', name: 'Core (phone)', rows: 1, columns: 1 });
    return { rootId: 'core', boards: [core, phone], files: {} };
  };

  it('finds the other layout of a board, both ways', () => {
    const s = set();
    expect(linkedLayout(s, s.boards[0]!)?.id).toBe('core-phone');
    expect(linkedLayout(s, s.boards[1]!)?.id).toBe('core');
    expect(linkableBoards(s).map((b) => b.id)).toEqual(['core']);
  });

  it('marks edited boards as no longer placeholders', () => {
    const s = set();
    const edited = replaceBoard(s, { ...s.boards[0]!, name: 'Mine' });
    expect(edited.boards[0]!.name).toBe('Mine');
    expect(edited.boards[0]!.ext_openaac_placeholder).toBeUndefined();
  });

  it('adds an empty board the same size as another', () => {
    const { set: s, board: added } = addEmptyBoard(set(), 'Core', board());
    expect(added.id).toBe('core-2');
    expect(added.grid.order).toEqual([
      [null, null],
      [null, null],
    ]);
    expect(s.boards).toHaveLength(3);
  });
});

describe('withoutUnusedFiles', () => {
  it('keeps only files that images use', () => {
    const b = { ...board(), images: [{ id: 'img-want', path: 'images/want.svg' }] };
    const files = { 'images/want.svg': new Uint8Array([1]), 'images/old.jpg': new Uint8Array([2]) };
    const set = withoutUnusedFiles({ rootId: 'core', boards: [b], files });
    expect(Object.keys(set.files)).toEqual(['images/want.svg']);
  });
});
