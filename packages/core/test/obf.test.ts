import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanBoard,
  isColor,
  MAX_GRID_COLUMNS,
  MAX_GRID_ROWS,
  OBF_FORMAT,
  ObfError,
  parseObf,
  serializeObf,
  type ObfBoard,
} from '../src';

afterEach(() => {
  vi.unstubAllGlobals();
});

const ids = () => {
  let n = 0;
  return (kind: string) => `${kind}-${++n}`;
};

describe('parseObf', () => {
  it('reads a minimal board', () => {
    const { board, issues } = parseObf({
      format: OBF_FORMAT,
      id: 'home',
      name: 'Home',
      buttons: [{ id: 'b1', label: 'hi' }],
      grid: { rows: 1, columns: 2, order: [['b1', null]] },
    });
    expect(issues).toEqual([]);
    expect(board.id).toBe('home');
    expect(board.images).toEqual([]);
    expect(board.sounds).toEqual([]);
    expect(board.grid.order).toEqual([['b1', null]]);
  });

  it('accepts JSON text', () => {
    const { board } = parseObf(
      JSON.stringify({ format: OBF_FORMAT, id: 'x', buttons: [], grid: { rows: 1, columns: 1 } }),
    );
    expect(board.id).toBe('x');
  });

  it('turns numeric ids into strings everywhere', () => {
    const { board } = parseObf({
      format: OBF_FORMAT,
      id: 7,
      buttons: [{ id: 1, label: 'go', image_id: 3, load_board: { id: 9 } }],
      images: [{ id: 3, url: 'https://example.org/go.png' }],
      grid: { rows: 1, columns: 1, order: [[1]] },
    });
    expect(board.id).toBe('7');
    expect(board.buttons[0]).toMatchObject({ id: '1', image_id: '3', load_board: { id: '9' } });
    expect(board.images[0]?.id).toBe('3');
    expect(board.grid.order).toEqual([['1']]);
  });

  it('accepts buttons and images keyed by id', () => {
    const { board } = parseObf({
      format: OBF_FORMAT,
      id: 'b',
      buttons: { a: { label: 'yes' }, b: { id: 'b', label: 'no' } },
      images: { img: { url: 'x.png' } },
      grid: { rows: 1, columns: 2, order: [['a', 'b']] },
    });
    expect(board.buttons.map((b) => [b.id, b.label])).toEqual([
      ['a', 'yes'],
      ['b', 'no'],
    ]);
    expect(board.images[0]?.id).toBe('img');
  });

  it('keeps fields it does not understand, including other apps’ ext_ fields', () => {
    const input = {
      format: OBF_FORMAT,
      id: 'b',
      ext_coughdrop_settings: { private: true },
      background: { color: 'rgb(0,0,0)' },
      buttons: [
        { id: 'a', label: 'a', ext_other_app_flag: 1, translations: { es: { label: 'a' } } },
      ],
      grid: { rows: 1, columns: 1, order: [['a']], ext_grid_note: 'x' },
    };
    const { board } = parseObf(input);
    expect(board.ext_coughdrop_settings).toEqual({ private: true });
    expect(board.background).toEqual({ color: 'rgb(0,0,0)' });
    expect(board.buttons[0]?.ext_other_app_flag).toBe(1);
    expect(board.buttons[0]?.translations).toEqual({ es: { label: 'a' } });
    expect(board.grid.ext_grid_note).toBe('x');
  });

  it('round-trips through JSON unchanged once normalized', () => {
    const { board } = parseObf({
      format: OBF_FORMAT,
      id: 'b',
      ext_x: [1, 2],
      buttons: [{ id: 'a', label: 'a', action: ':clear' }],
      grid: { rows: 1, columns: 1, order: [['a']] },
    });
    expect(parseObf(serializeObf(board)).board).toEqual(board);
  });

  it('repairs a grid that does not match its size', () => {
    const { board, issues } = parseObf({
      format: OBF_FORMAT,
      id: 'b',
      buttons: [{ id: 'a' }, { id: 'c' }],
      grid: { rows: 2, columns: 2, order: [['a', 'missing', 'c']] },
    });
    expect(board.grid.order).toEqual([
      ['a', null],
      [null, null],
    ]);
    expect(issues.map((i) => i.message)).toEqual([
      'Some buttons sat outside the grid and were left out.',
      'The grid points to a missing button "missing".',
    ]);
  });

  it('works out the grid size from the order when rows and columns are missing', () => {
    const { board } = parseObf({
      format: OBF_FORMAT,
      id: 'b',
      buttons: [{ id: 'a' }],
      grid: { order: [['a', null, null]] },
    });
    expect(board.grid.rows).toBe(1);
    expect(board.grid.columns).toBe(3);
  });

  it('gives missing ids new ones and drops duplicates', () => {
    const { board, issues } = parseObf(
      {
        buttons: [{ label: 'one' }, { id: 'x', label: 'two' }, { id: 'x', label: 'three' }],
        grid: { rows: 1, columns: 1 },
      },
      { makeId: ids() },
    );
    expect(board.format).toBe(OBF_FORMAT);
    expect(board.id).toBe('board-1');
    expect(board.buttons.map((b) => b.id)).toEqual(['button-2', 'x']);
    expect(issues).toHaveLength(4);
  });

  it('can make ids without crypto.randomUUID, which plain http:// pages lack', () => {
    const real = globalThis.crypto;
    vi.stubGlobal('crypto', {
      getRandomValues: (array: Uint8Array<ArrayBuffer>) => real.getRandomValues(array),
    });
    const { board } = parseObf({ format: OBF_FORMAT, buttons: [], grid: { rows: 1, columns: 1 } });
    expect(board.id).toMatch(/^board-[0-9a-f]{32}$/);
  });

  it('warns when a button uses an image that is not there', () => {
    const { issues } = parseObf({
      format: OBF_FORMAT,
      id: 'b',
      buttons: [{ id: 'a', image_id: 'nope' }],
      grid: { rows: 1, columns: 1, order: [['a']] },
    });
    expect(issues[0]?.message).toContain('missing image "nope"');
  });

  it('rejects things that are not boards', () => {
    expect(() => parseObf('not json')).toThrow(ObfError);
    expect(() => parseObf([1, 2])).toThrow(ObfError);
    expect(() => parseObf(null)).toThrow(ObfError);
  });
});

describe('values that are not text', () => {
  it('turns numbers into words and leaves out anything else, so the board still shows', () => {
    const { board, issues } = parseObf({
      format: OBF_FORMAT,
      id: 'root',
      name: 12,
      locale: 5,
      buttons: [
        { id: 'a', label: 5 },
        { id: 'b', label: 'ok', vocalization: { say: 'x' } },
        { id: 'c', label: null, vocalization: 'hi' },
        { id: 'd', label: 'cat', translations: { es: { label: 3, vocalization: [] }, fr: 9 } },
        { id: 'e', label: 'dog', translations: 'nope' },
      ],
      grid: { rows: 1, columns: 5, order: [['a', 'b', 'c', 'd', 'e']] },
    });
    expect(board.name).toBe('12');
    expect(board.locale).toBe('5');
    expect(board.buttons.map((b) => [b.label, b.vocalization])).toEqual([
      ['5', undefined],
      ['ok', undefined],
      [undefined, 'hi'],
      ['cat', undefined],
      ['dog', undefined],
    ]);
    expect(board.buttons[1]).not.toHaveProperty('vocalization');
    expect(board.buttons[3]?.translations).toEqual({ es: { label: '3' } });
    expect(board.buttons[4]).not.toHaveProperty('translations');
    expect(issues.map((i) => i.message)).toEqual([
      "Some words or names weren't text; numbers were kept as words and anything else was left out.",
    ]);
  });

  it('leaves out nulls quietly', () => {
    const { board, issues } = parseObf({
      format: OBF_FORMAT,
      id: 'x',
      buttons: [{ id: 'a', label: 'a', vocalization: null, background_color: null }],
      grid: { rows: 1, columns: 1, order: [['a']] },
    });
    expect(issues).toEqual([]);
    expect(board.buttons[0]).toEqual({ id: 'a', label: 'a' });
  });

  it('cleans licence fields', () => {
    const { board, issues } = parseObf({
      format: OBF_FORMAT,
      id: 'x',
      license: { type: 4, author_name: { evil: true } },
      buttons: [],
      images: [
        { id: 'i', url: 'x.png', license: { type: 'CC BY', author_url: ['https://a'] } },
        { id: 'j', url: 'y.png', license: 'CC0' },
      ],
      grid: { rows: 1, columns: 1 },
    });
    expect(board.license).toEqual({ type: '4' });
    expect(board.images[0]?.license).toEqual({ type: 'CC BY' });
    expect(board.images[1]).not.toHaveProperty('license');
    expect(issues).toHaveLength(1);
  });
});

describe('colours', () => {
  it.each([
    '#fff',
    '#ffff',
    '#ffffff',
    '#FFFFFF80',
    'rgb(68,68,68)',
    'rgb(187, 222, 251)',
    'rgba(0, 0, 0, 0.5)',
    'rgb(100% 50% 0% / 50%)',
  ])('accepts %s', (color) => {
    expect(isColor(color)).toBe(true);
  });

  it.each([
    'red; position: fixed; inset: 0',
    'red',
    '#ffg',
    '#fffff',
    'rgb(1,2,3);color:red',
    'rgb(1,2,3)) url(x',
    'rgb(var(--x),1,2)',
    'url("data:image/svg+xml,x")',
    'rgb("1",2,3)',
    'rgb(1)',
    '',
    5,
    null,
  ])('rejects %s', (color) => {
    expect(isColor(color)).toBe(false);
  });

  it('leaves out button colours that are not plain colours', () => {
    const { board, issues } = parseObf({
      format: OBF_FORMAT,
      id: 'x',
      buttons: [
        {
          id: 'a',
          label: 'a',
          background_color: 'red; position: fixed; inset: 0; z-index: 99999',
          border_color: 'rgb(0, 0, 255)',
        },
      ],
      grid: { rows: 1, columns: 1, order: [['a']] },
    });
    expect(board.buttons[0]).toEqual({ id: 'a', label: 'a', border_color: 'rgb(0, 0, 255)' });
    expect(issues.map((i) => i.message)).toEqual([
      "Some button colours weren't valid colours and were left out.",
    ]);
  });
});

describe('grid size', () => {
  const board = (rows: unknown, columns: unknown, order?: unknown) => ({
    format: OBF_FORMAT,
    id: 'x',
    buttons: [],
    grid: { rows, columns, order },
  });

  it('reads the largest grid allowed', () => {
    const { board: b } = parseObf(board(MAX_GRID_ROWS, MAX_GRID_COLUMNS));
    expect(b.grid.order).toHaveLength(MAX_GRID_ROWS);
  });

  it('refuses grids too big to show, with a clear message', () => {
    expect(() => parseObf(board(3000, 3000))).toThrow(ObfError);
    expect(() => parseObf(board(1, MAX_GRID_COLUMNS + 1))).toThrow(
      /at most 30 rows and 30 columns/,
    );
    // No rows or columns given: the order's size counts.
    const order = Array.from({ length: MAX_GRID_ROWS + 1 }, () => [null]);
    expect(() => parseObf(board(undefined, undefined, order))).toThrow(ObfError);
  });
});

describe('cleanBoard', () => {
  it('returns the same board when nothing needs changing', () => {
    const { board } = parseObf({
      format: OBF_FORMAT,
      id: 'x',
      buttons: [{ id: 'a', label: 'a', background_color: '#fff' }],
      grid: { rows: 1, columns: 1, order: [['a']] },
    });
    expect(cleanBoard(board)).toEqual({ board, issues: [] });
    expect(cleanBoard(board).board).toBe(board);
  });

  it('gives a stored board missing its buttons, images or sounds empty lists', () => {
    const board = {
      format: OBF_FORMAT,
      id: 'x',
      grid: { rows: 1, columns: 1, order: [[null]] },
    } as unknown as ObfBoard;
    const cleaned = cleanBoard(board).board;
    expect(cleaned.buttons).toEqual([]);
    expect(cleaned.images).toEqual([]);
    expect(cleaned.sounds).toEqual([]);
  });

  it('leaves out buttons that are not objects', () => {
    const board = {
      format: OBF_FORMAT,
      id: 'x',
      buttons: [null, { id: 'a', label: 'a' }],
      images: [],
      sounds: [],
      grid: { rows: 1, columns: 1, order: [['a']] },
    } as unknown as ObfBoard;
    expect(cleanBoard(board).board.buttons).toEqual([{ id: 'a', label: 'a' }]);
  });
});
