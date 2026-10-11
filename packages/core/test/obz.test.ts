import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import {
  createBoard,
  OBF_FORMAT,
  ObfError,
  placeButton,
  readObf,
  readObz,
  writeObz,
  type BoardSet,
} from '../src';

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);

function sampleSet(): BoardSet {
  let home = createBoard({ id: 'home', name: 'Home', rows: 1, columns: 2 });
  home = placeButton(
    home,
    0,
    0,
    { id: 'i', label: 'I', image_id: 'img-i', ext_openaac_part_of_speech: 'pronoun' },
    { id: 'img-i', path: 'images/i.png', content_type: 'image/png' },
  );
  home = placeButton(home, 0, 1, { id: 'food', label: 'Food', load_board: { id: 'food' } });
  let food = createBoard({ id: 'food', name: 'Food', rows: 1, columns: 1 });
  food = placeButton(food, 0, 0, { id: 'apple', label: 'apple' });
  return { rootId: 'home', boards: [home, food], files: { 'images/i.png': png } };
}

describe('writeObz and readObz', () => {
  it('round-trips a set of linked boards with images', () => {
    const original = sampleSet();
    const { set, issues } = readObz(writeObz(original));
    expect(issues).toEqual([]);
    expect(set.rootId).toBe('home');
    expect(set.boards.map((b) => b.id)).toEqual(['home', 'food']);
    expect(set.files['images/i.png']).toEqual(png);

    const home = set.boards[0]!;
    expect(home.buttons.find((b) => b.id === 'food')?.load_board).toEqual({
      id: 'food',
      path: 'boards/food.obf',
    });
    expect(home.buttons[0]?.ext_openaac_part_of_speech).toBe('pronoun');
    expect(home.images).toEqual(original.boards[0]!.images);
  });

  it('is stable when written and read twice', () => {
    const once = readObz(writeObz(sampleSet())).set;
    const twice = readObz(writeObz(once)).set;
    expect(twice).toEqual(once);
  });

  it('reads a package laid out like CoughDrop exports', () => {
    const root = {
      format: OBF_FORMAT,
      id: '1_100',
      name: 'Top',
      buttons: [
        { id: 1, label: 'more', image_id: 5 },
        { id: 2, label: 'snacks', load_board: { id: '1_200', path: 'board_1_200.obf' } },
      ],
      images: [{ id: 5, content_type: 'image/png' }],
      grid: { rows: 1, columns: 2, order: [[1, 2]] },
    };
    const child = {
      format: OBF_FORMAT,
      id: '1_200',
      name: 'Snacks',
      buttons: [{ id: 1, label: 'chips' }],
      grid: { rows: 1, columns: 1, order: [[1]] },
    };
    const manifest = {
      format: OBF_FORMAT,
      root: 'board_1_100.obf',
      paths: {
        boards: { '1_100': 'board_1_100.obf', '1_200': 'board_1_200.obf' },
        images: { '5': 'images/image_5.png' },
      },
    };
    const bytes = zipSync({
      'manifest.json': strToU8(JSON.stringify(manifest)),
      'board_1_100.obf': strToU8(JSON.stringify(root)),
      'board_1_200.obf': strToU8(JSON.stringify(child)),
      'images/image_5.png': png,
    });

    const { set, issues } = readObz(bytes);
    expect(issues).toEqual([]);
    expect(set.rootId).toBe('1_100');
    expect(set.boards.map((b) => b.name)).toEqual(['Top', 'Snacks']);
    expect(set.boards[0]?.images[0]).toEqual({
      id: '5',
      content_type: 'image/png',
      path: 'images/image_5.png',
    });
    expect(set.files['images/image_5.png']).toEqual(png);
    expect(Object.keys(set.files)).toEqual(['images/image_5.png']);
  });

  it('follows links to boards that only the manifest lists', () => {
    const bytes = zipSync({
      'manifest.json': strToU8(
        JSON.stringify({ format: OBF_FORMAT, root: 'a.obf', paths: { boards: { b: 'b.obf' } } }),
      ),
      'a.obf': strToU8(
        JSON.stringify({
          format: OBF_FORMAT,
          id: 'a',
          buttons: [{ id: 'x', load_board: { id: 'b' } }],
          grid: { rows: 1, columns: 1, order: [['x']] },
        }),
      ),
      'b.obf': strToU8(
        JSON.stringify({ format: OBF_FORMAT, id: 'b', buttons: [], grid: { rows: 1, columns: 1 } }),
      ),
    });
    const { set } = readObz(bytes);
    expect(set.boards.map((b) => b.id)).toEqual(['a', 'b']);
  });

  it('reports a linked board that is missing from the package', () => {
    const bytes = zipSync({
      'manifest.json': strToU8(JSON.stringify({ format: OBF_FORMAT, root: 'a.obf', paths: {} })),
      'a.obf': strToU8(
        JSON.stringify({
          format: OBF_FORMAT,
          id: 'a',
          buttons: [{ id: 'x', load_board: { id: 'gone', path: 'gone.obf' } }],
          grid: { rows: 1, columns: 1, order: [['x']] },
        }),
      ),
    });
    const { set, issues } = readObz(bytes);
    expect(set.boards).toHaveLength(1);
    expect(issues).toEqual([{ message: 'The package is missing gone.obf.' }]);
  });

  it('rejects files that are not OBZ packages', () => {
    expect(() => readObz(new Uint8Array([1, 2, 3]))).toThrow(ObfError);
    expect(() => readObz(zipSync({ 'x.txt': strToU8('hi') }))).toThrow(/manifest/);
    expect(() =>
      readObz(zipSync({ 'manifest.json': strToU8(JSON.stringify({ root: 'nope.obf' })) })),
    ).toThrow(/root board/);
  });

  it('refuses to write a set whose root is missing', () => {
    expect(() => writeObz({ ...sampleSet(), rootId: 'nope' })).toThrow(ObfError);
  });
});

describe('readObf', () => {
  it('wraps one board as a set', () => {
    const { set } = readObf({
      format: OBF_FORMAT,
      id: 'solo',
      buttons: [],
      grid: { rows: 1, columns: 1 },
    });
    expect(set).toMatchObject({ rootId: 'solo', files: {} });
  });
});

describe('extra files', () => {
  it('round-trip, so an app can keep its own data in a package', () => {
    const board = createBoard({ id: 'b', name: 'B', rows: 1, columns: 1 });
    const set = { rootId: 'b', boards: [board], files: {} };
    const bytes = writeObz(set, { 'app/settings.json': new TextEncoder().encode('{"a":1}') });
    const { set: read } = readObz(bytes);
    expect(new TextDecoder().decode(read.files['app/settings.json'])).toBe('{"a":1}');
  });
});
