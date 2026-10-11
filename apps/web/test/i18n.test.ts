import { describe, expect, it } from 'vitest';
import { isAppLanguage, MESSAGES, pickAppLanguage } from '../src/lib/i18n';

describe('app language', () => {
  it('follows the words when the app is translated into their language', () => {
    expect(pickAppLanguage('auto', 'es', ['en-US'])).toBe('es');
  });

  it('falls back to the browser, then English', () => {
    expect(pickAppLanguage('auto', 'fr', ['de-DE', 'es-MX'])).toBe('es');
    expect(pickAppLanguage('auto', 'fr', ['de-DE'])).toBe('en');
  });

  it('uses the language chosen in settings', () => {
    expect(pickAppLanguage('en', 'es', ['es-ES'])).toBe('en');
  });

  it("doesn't mistake object properties for languages", () => {
    expect(isAppLanguage('constructor')).toBe(false);
    expect(pickAppLanguage('auto', 'toString', [])).toBe('en');
  });

  it('formats numbers the way each language writes them', () => {
    expect(MESSAGES.en.seconds(1500)).toBe('1.5 s');
    expect(MESSAGES.es.seconds(1500)).toBe('1,5 s');
    expect(MESSAGES.es.boardCount(1)).toBe('1 tablero');
    expect(MESSAGES.es.boardCount(3)).toBe('3 tableros');
  });
});
