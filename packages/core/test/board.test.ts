import { describe, expect, it } from 'vitest';
import {
  behaviorOf,
  cells,
  compactBoardId,
  createBoard,
  partOfSpeech,
  parseObf,
  placeButton,
  renameOldFields,
  spokenText,
} from '../src';

describe('renameOldFields', () => {
  it('upgrades boards saved while the app was called Open AAC', () => {
    const old = {
      id: 'b',
      ext_openaac_compact_board: 'b-phone',
      ext_other_app_field: 1,
      buttons: [{ id: '1', ext_openaac_part_of_speech: 'verb' }],
      images: [
        {
          id: 'i',
          data: 'data:image/svg+xml,…',
          license: {
            type: 'CC BY-SA 4.0',
            author_name: 'Open AAC contributors',
            source_url: 'https://github.com/tks98/open-aac',
          },
        },
      ],
    };
    expect(renameOldFields(old)).toEqual({
      id: 'b',
      ext_anyaac_compact_board: 'b-phone',
      ext_other_app_field: 1,
      buttons: [{ id: '1', ext_anyaac_part_of_speech: 'verb' }],
      images: [
        {
          id: 'i',
          data: 'data:image/svg+xml,…',
          license: {
            type: 'CC BY-SA 4.0',
            author_name: 'Any AAC contributors',
            source_url: 'https://github.com/tks98/any-aac',
          },
        },
      ],
    });
  });

  it('upgrades old boards when a file is read', () => {
    const { board } = parseObf({
      format: 'open-board-0.1',
      id: 'b',
      buttons: [{ id: '1', label: 'want', ext_openaac_part_of_speech: 'verb' }],
      grid: { rows: 1, columns: 1, order: [['1']] },
    });
    expect(partOfSpeech(board.buttons[0]!)).toBe('verb');
  });

  it('leaves files and other values alone', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    expect(renameOldFields(bytes)).toBe(bytes);
    expect(renameOldFields('ext_openaac_x')).toBe('ext_openaac_x');
  });
});

describe('compactBoardId', () => {
  it('reads the phone layout a board points to', () => {
    const board = createBoard({ id: 'b', name: 'B', rows: 1, columns: 1 });
    expect(compactBoardId(board)).toBeUndefined();
    expect(compactBoardId({ ...board, ext_anyaac_compact_board: 'b-phone' })).toBe('b-phone');
    expect(compactBoardId({ ...board, ext_anyaac_compact_board: 7 })).toBeUndefined();
  });
});

describe('cells', () => {
  it('lists every cell row by row', () => {
    let board = createBoard({ id: 'b', name: 'B', rows: 2, columns: 2 });
    board = placeButton(board, 1, 0, { id: 'x', label: 'x' });
    expect(cells(board).map((c) => [c.row, c.column, c.button?.id ?? null])).toEqual([
      [0, 0, null],
      [0, 1, null],
      [1, 0, 'x'],
      [1, 1, null],
    ]);
  });
});

describe('placeButton', () => {
  it('replaces whatever was in the cell and leaves the original board alone', () => {
    const empty = createBoard({ id: 'b', name: 'B', rows: 1, columns: 1 });
    const one = placeButton(empty, 0, 0, { id: 'a' }, { id: 'img', url: 'a.png' });
    const two = placeButton(one, 0, 0, { id: 'b' });
    expect(empty.buttons).toEqual([]);
    expect(two.buttons.map((b) => b.id)).toEqual(['b']);
    expect(two.images.map((i) => i.id)).toEqual(['img']);
    expect(two.grid.order).toEqual([['b']]);
  });

  it('rejects cells outside the grid and duplicate ids', () => {
    const board = placeButton(createBoard({ id: 'b', name: 'B', rows: 1, columns: 2 }), 0, 0, {
      id: 'a',
    });
    expect(() => placeButton(board, 3, 0, { id: 'z' })).toThrow(RangeError);
    expect(() => placeButton(board, 0, 1, { id: 'a' })).toThrow(/already/);
  });
});

describe('behaviorOf', () => {
  it('tells words, folders, special actions and suffixes apart', () => {
    expect(behaviorOf({ id: '1', label: 'go' })).toEqual({ kind: 'word' });
    expect(behaviorOf({ id: '2', load_board: { id: 'food' } })).toEqual({
      kind: 'navigate',
      target: { id: 'food' },
    });
    expect(behaviorOf({ id: '3', action: ':clear' })).toEqual({ kind: 'special', action: 'clear' });
    expect(behaviorOf({ id: '4', actions: [':backspace'] })).toEqual({
      kind: 'special',
      action: 'backspace',
    });
    expect(behaviorOf({ id: '5', action: '+s' })).toEqual({ kind: 'append', text: 's' });
    expect(behaviorOf({ id: '6', action: ':unknown-thing', label: 'x' })).toEqual({ kind: 'word' });
  });
});

describe('spokenText and partOfSpeech', () => {
  it('speaks the vocalization when there is one', () => {
    expect(spokenText({ id: '1', label: 'hi', vocalization: 'hello there' })).toBe('hello there');
    expect(spokenText({ id: '2', label: ' hi ' })).toBe('hi');
    expect(spokenText({ id: '3' })).toBe('');
  });

  it('only accepts known word types', () => {
    expect(partOfSpeech({ id: '1', ext_anyaac_part_of_speech: 'verb' })).toBe('verb');
    expect(partOfSpeech({ id: '2', ext_anyaac_part_of_speech: 'banana' })).toBeUndefined();
    expect(partOfSpeech({ id: '3' })).toBeUndefined();
  });
});
