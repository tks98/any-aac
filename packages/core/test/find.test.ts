import { describe, expect, it } from 'vitest';
import { createBoard, findWord, placeButton, type BoardSet } from '../src';

function set(): BoardSet {
  let core = createBoard({ id: 'core', name: 'Core', rows: 2, columns: 2 });
  core = placeButton(core, 0, 0, { id: 'want', label: 'want' });
  core = placeButton(core, 0, 1, { id: 'food', label: 'Food', load_board: { id: 'food' } });
  core = placeButton(core, 1, 0, {
    id: 'apples-dup',
    label: 'more apples',
    translations: { es: { label: 'más manzanas' } },
  });
  core = { ...core, ext_anyaac_compact_board: 'core-phone' };
  let phone = createBoard({ id: 'core-phone', name: 'Core (phone)', rows: 1, columns: 2 });
  phone = placeButton(phone, 0, 0, { id: 'food', label: 'Food', load_board: { id: 'food' } });
  phone = placeButton(phone, 0, 1, { id: 'want', label: 'want' });
  let food = createBoard({ id: 'food', name: 'Food', rows: 1, columns: 2 });
  food = placeButton(food, 0, 0, {
    id: 'apple',
    label: 'apple',
    translations: { es: { label: 'manzana' } },
  });
  food = placeButton(food, 0, 1, { id: 'home', label: 'Core', load_board: { id: 'core' } });
  return { rootId: 'core', boards: [core, phone, food], files: {} };
}

describe('findWord', () => {
  it('gives the steps to a word in a folder', () => {
    const [match] = findWord(set(), 'apple');
    expect(match!.label).toBe('apple');
    expect(match!.steps.map((s) => [s.kind, s.boardId, s.button.id, s.row, s.column])).toEqual([
      ['open', 'core', 'food', 0, 1],
      ['tap', 'food', 'apple', 0, 0],
    ]);
  });

  it('puts exact matches first, then shorter paths', () => {
    expect(findWord(set(), 'apple').map((m) => m.label)).toEqual(['apple', 'more apples']);
    expect(findWord(set(), 'want')[0]!.steps).toHaveLength(1);
  });

  it('follows the phone layout on phones', () => {
    const [match] = findWord(set(), 'want', { compact: true });
    expect(match!.steps[0]).toMatchObject({ boardId: 'core-phone', row: 0, column: 1 });
  });

  it('finds words in the language shown, ignoring accents and case', () => {
    expect(findWord(set(), 'Manzana', { lang: 'es' })[0]!.label).toBe('manzana');
    expect(findWord(set(), 'mas', { lang: 'es' })[0]!.label).toBe('más manzanas');
  });

  it('finds nothing for nothing', () => {
    expect(findWord(set(), '  ')).toEqual([]);
    expect(findWord(set(), 'zebra')).toEqual([]);
  });
});
