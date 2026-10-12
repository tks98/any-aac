import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dictionariesFor, trim } from '../scripts/trim-phonemizer.mjs';
import catalog from '../src/lib/voice/voices.json';

const read = (path: string) => readFileSync(new URL(path, import.meta.url));

describe('the trimmed phonemizer', () => {
  it('keeps the dictionaries of every offered voice, and no others', () => {
    expect(dictionariesFor(catalog.voices)).toEqual(['en_dict', 'es_dict']);
  });

  it('is what scripts/trim-phonemizer.mjs makes from the installed piper-wasm', () => {
    const source = '../node_modules/@diffusionstudio/piper-wasm/build/';
    const fresh = trim(
      read(`${source}piper_phonemize.js`).toString(),
      read(`${source}piper_phonemize.data`),
      dictionariesFor(catalog.voices),
    );
    const committed = '../src/lib/voice/phonemizer/';
    expect(read(`${committed}piper_phonemize.js`).toString()).toBe(fresh.js);
    expect(read(`${committed}piper_phonemize.data`).equals(fresh.data)).toBe(true);
    expect(
      read(`${committed}piper_phonemize.wasm`).equals(read(`${source}piper_phonemize.wasm`)),
    ).toBe(true);
    // About 1 MB instead of 18 MB.
    expect(fresh.data.length).toBeLessThan(1.5e6);
  });
});
