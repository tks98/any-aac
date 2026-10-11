import { afterEach, describe, expect, it, vi } from 'vitest';
import { OBF_FORMAT, ObfError, parseObf, serializeObf } from '../src';

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
