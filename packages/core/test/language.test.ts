import { describe, expect, it } from 'vitest';
import {
  addWord,
  baseLanguage,
  boardName,
  buttonWords,
  createBoard,
  placeButton,
  setLanguages,
  spokenText,
  translatedLabel,
  translatedName,
  type ObfButton,
} from '../src';

const want: ObfButton = {
  id: 'want',
  label: 'want',
  translations: { es: { label: 'querer', vocalization: 'quiero' }, 'fr-CA': { label: 'vouloir' } },
};

describe('buttonWords', () => {
  it('uses the button’s own words without a language, or when there is no translation', () => {
    expect(buttonWords(want)).toEqual({ label: 'want', text: 'want' });
    expect(buttonWords(want, 'de')).toEqual({ label: 'want', text: 'want' });
  });

  it('shows the translated label and says the translated vocalization', () => {
    expect(buttonWords(want, 'es')).toEqual({ label: 'querer', text: 'quiero' });
    expect(spokenText(want, 'es')).toBe('quiero');
  });

  it('matches regional and base languages either way', () => {
    expect(buttonWords(want, 'es-MX').label).toBe('querer');
    expect(buttonWords(want, 'fr').label).toBe('vouloir');
    expect(buttonWords(want, 'fr').text).toBe('vouloir');
  });

  it('ignores malformed translations', () => {
    expect(buttonWords({ id: 'x', label: 'x', translations: { es: 'nope' } }, 'es').label).toBe(
      'x',
    );
    expect(buttonWords({ id: 'x', label: 'x', translations: { es: {} } }, 'es').label).toBe('x');
  });
});

describe('addWord in a language', () => {
  it('keeps the translated label and text', () => {
    expect(addWord([], want, 'core', 'es')).toEqual([
      { label: 'querer', text: 'quiero', boardId: 'core' },
    ]);
  });
});

describe('boards and sets', () => {
  it('translates board names through ext_openaac_name_translations', () => {
    const board = {
      ...createBoard({ id: 'food', name: 'Food', rows: 1, columns: 1 }),
      ext_openaac_name_translations: { es: 'Comida' },
    };
    expect(boardName(board, 'es')).toBe('Comida');
    expect(boardName(board, 'en')).toBe('Food');
    expect(boardName(board)).toBe('Food');
  });

  it('lists every language a set can be shown in', () => {
    const board = placeButton(
      createBoard({ id: 'b', name: 'B', rows: 1, columns: 1, locale: 'en-US' }),
      0,
      0,
      want,
    );
    expect(setLanguages({ rootId: 'b', boards: [board], files: {} })).toEqual(['en', 'es', 'fr']);
    expect(baseLanguage('pt_BR')).toBe('pt');
  });
});

describe('translatedLabel and translatedName', () => {
  it('give only a real translation, never the fallback', () => {
    const button = { id: 'pizza', label: 'pizza', translations: { es: { label: 'pizza' } } };
    expect(translatedLabel(button, 'es-MX')).toBe('pizza');
    expect(translatedLabel(button, 'fr')).toBeUndefined();
    const board = { ...createBoard({ id: 'b', name: 'Food', rows: 1, columns: 1 }) };
    expect(translatedName(board, 'es')).toBeUndefined();
    expect(
      translatedName({ ...board, ext_openaac_name_translations: { es: 'Comida' } }, 'es'),
    ).toBe('Comida');
  });
});
