/**
 * Real symbols for the starter vocabulary (Mulberry and OpenMoji), shipped as
 * asset files so they stay out of the JavaScript bundle and the service worker
 * caches them for offline use.
 */
import type { ObfLicense } from '@open-aac/core';
import sources from '../assets/symbols/sources.json';

const urls = import.meta.glob<string>('../assets/symbols/*/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
});

export type SetName = 'mulberry' | 'openmoji';

export interface StarterSymbol {
  /** Where the app can load it from. */
  url: string;
  set: SetName;
  /** Its name in its set (a Mulberry file name or an OpenMoji code). */
  name: string;
  license: ObfLicense;
}

const CC_BY_SA = 'https://creativecommons.org/licenses/by-sa/4.0/';

/** Licence metadata for a symbol, recorded on every image that uses it. */
export function symbolLicense(set: SetName, name: string): ObfLicense {
  return set === 'mulberry'
    ? {
        type: 'CC BY-SA 4.0',
        copyright_notice_url: CC_BY_SA,
        author_name: 'Steve Lee (Mulberry Symbols)',
        author_url: 'https://mulberrysymbols.org',
        source_url: `https://github.com/mulberrysymbols/mulberry-symbols/blob/${sources.mulberry}/EN/${encodeURIComponent(name)}.svg`,
      }
    : {
        type: 'CC BY-SA 4.0',
        copyright_notice_url: CC_BY_SA,
        author_name: 'OpenMoji',
        author_url: 'https://openmoji.org',
        source_url: `https://openmoji.org/library/emoji-${name}/`,
      };
}

/** Every starter word key that has a real symbol. */
export const STARTER_SYMBOL_KEYS = Object.keys(sources.symbols);

/** The real symbol for a starter word key, if there is one. */
export function starterSymbol(key: string): StarterSymbol | undefined {
  const source = (sources.symbols as Record<string, { set: string; name: string }>)[key];
  if (!source) return undefined;
  const set = source.set as SetName;
  const url = urls[`../assets/symbols/${set}/${key}.svg`];
  return url
    ? { url, set, name: source.name, license: symbolLicense(set, source.name) }
    : undefined;
}
