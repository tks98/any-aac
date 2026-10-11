/**
 * The symbols the board editor can search: the whole Mulberry set (built by
 * scripts/symbol-library.mjs and fetched as needed) plus the starter
 * vocabulary's own symbols, some of which come from OpenMoji.
 */
import type { ObfImage } from '@open-aac/core';
import { STARTER_TRANSLATIONS } from './starter-translations';
import { STARTER_SYMBOL_KEYS, starterSymbol, symbolLicense, type SetName } from './symbols';

export interface LibrarySymbol {
  /** Unique across sets, e.g. "mulberry-123" or "starter-want". */
  key: string;
  name: string;
  /** Category and tags, searched after the name. */
  about: string;
  set: SetName;
  /** The symbol's name in its set, for its licence record. */
  file: string;
  url: string;
}

interface IndexFile {
  symbols: { id: string; name: string; file: string; category: string; tags: string }[];
}

const base = import.meta.env.BASE_URL;
let library: Promise<LibrarySymbol[]> | undefined;

/** "allDone" → "all done" */
const spaced = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

function starterSymbols(): LibrarySymbol[] {
  return STARTER_SYMBOL_KEYS.flatMap((key) => {
    const symbol = starterSymbol(key);
    if (!symbol) return [];
    const translations = Object.values(STARTER_TRANSLATIONS)
      .map((words) => words[spaced(key)] ?? words[key] ?? '')
      .join(' ');
    return [
      {
        key: `starter-${key}`,
        name: spaced(key),
        about: translations,
        set: symbol.set,
        file: symbol.name,
        url: symbol.url,
      },
    ];
  });
}

/** Loads the symbol list once. Works offline once it has been loaded online. */
export function loadSymbols(): Promise<LibrarySymbol[]> {
  library ??= fetch(`${base}symbol-library/index.json`)
    .then((response) => (response.ok ? (response.json() as Promise<IndexFile>) : { symbols: [] }))
    .catch(() => ({ symbols: [] }) as IndexFile)
    .then((index) => [
      ...starterSymbols(),
      ...index.symbols.map((s) => ({
        key: `mulberry-${s.id}`,
        name: s.name,
        about: `${s.category} ${s.tags}`,
        set: 'mulberry' as const,
        file: s.file,
        url: `${base}symbol-library/mulberry/${s.id}.svg`,
      })),
    ])
    .then((symbols) => {
      // Try again next time if the index couldn't be fetched.
      if (symbols.length <= STARTER_SYMBOL_KEYS.length) library = undefined;
      return symbols;
    });
  return library;
}

const fold = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

/** Words in other languages that the starter vocabulary translates from English. */
function englishFor(word: string): string[] {
  const found: string[] = [];
  for (const words of Object.values(STARTER_TRANSLATIONS)) {
    for (const [english, translated] of Object.entries(words)) {
      if (fold(translated) === word) found.push(fold(english));
    }
  }
  return found;
}

/**
 * Best matches first: the whole name, then names starting with the search,
 * then any word of the name, then categories and tags.
 */
export function searchSymbols(symbols: LibrarySymbol[], query: string, limit = 60) {
  const q = fold(query.trim());
  if (q === '') return [];
  const terms = [q, ...englishFor(q)];
  const scored: { symbol: LibrarySymbol; score: number }[] = [];
  for (const symbol of symbols) {
    const name = fold(symbol.name);
    const about = fold(symbol.about);
    let score = 0;
    for (const term of terms) {
      if (name === term) score = Math.max(score, 100);
      else if (name.startsWith(term)) score = Math.max(score, 60);
      else if (name.split(/[\s,-]+/).includes(term)) score = Math.max(score, 50);
      else if (name.includes(term)) score = Math.max(score, 30);
      else if (about.split(/\s+/).includes(term)) score = Math.max(score, 20);
    }
    if (score > 0) scored.push({ symbol, score: score - name.length / 100 });
  }
  scored.sort((a, b) => b.score - a.score);
  // The starter's own copy of a symbol and Mulberry's are often the same picture.
  const seen = new Set<string>();
  return scored
    .map((s) => s.symbol)
    .filter((s) => {
      const id = `${s.set}/${s.file}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .slice(0, limit);
}

/** Fetches a symbol and returns it as an image for a board, with its file. */
export async function symbolImage(
  symbol: LibrarySymbol,
): Promise<{ image: ObfImage; path: string; bytes: Uint8Array }> {
  const response = await fetch(symbol.url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  // Starter symbols keep the ids and paths the starter boards give them.
  const starter = symbol.key.startsWith('starter-') ? symbol.key.slice('starter-'.length) : null;
  const id = starter ? `sym-${starter}` : symbol.key;
  const path = `images/${symbol.set}/${starter ?? id}.svg`;
  return {
    image: {
      id,
      path,
      content_type: 'image/svg+xml',
      license: symbolLicense(symbol.set, symbol.file),
    },
    path,
    bytes,
  };
}
