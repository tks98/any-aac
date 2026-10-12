/** Types for scripts/trim-phonemizer.mjs, which the unit tests import. */
export function dictionariesFor(voices: { lang: string }[]): string[];
export function trim(
  js: string,
  data: Uint8Array,
  keepDictionaries: string[],
): { js: string; data: Buffer };
