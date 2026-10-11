#!/usr/bin/env node
/**
 * Copies the starter vocabulary's symbols into src/assets/symbols/<set>/<key>.svg,
 * as listed in src/assets/symbols/sources.json.
 *
 * Mulberry comes from its release zip (download mulberry-symbols.zip for the
 * version in sources.json from github.com/mulberrysymbols/mulberry-symbols/releases);
 * OpenMoji is fetched from GitHub at the pinned tag.
 *
 *   node scripts/vendor-symbols.mjs path/to/mulberry-symbols.zip
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';

const out = join(dirname(fileURLToPath(import.meta.url)), '../src/assets/symbols');
const sources = JSON.parse(readFileSync(join(out, 'sources.json'), 'utf8'));

const zipPath = process.argv[2];
if (!zipPath) {
  console.error('Usage: node scripts/vendor-symbols.mjs path/to/mulberry-symbols.zip');
  process.exit(1);
}
const mulberry = unzipSync(readFileSync(zipPath), {
  filter: (file) => file.name.startsWith('EN-symbols/') && file.name.endsWith('.svg'),
});

// Symbols are shown with <img>, where scripts can't run, but keep the files plain anyway.
const UNSAFE = /<script|javascript:|\son[a-z]+\s*=|<foreignObject|href\s*=\s*["']https?:/i;

for (const set of ['mulberry', 'openmoji']) {
  rmSync(join(out, set), { recursive: true, force: true });
  mkdirSync(join(out, set), { recursive: true });
}

for (const [key, source] of Object.entries(sources.symbols)) {
  let svg;
  if (source.set === 'mulberry') {
    const bytes = mulberry[`EN-symbols/${source.name}.svg`];
    if (!bytes) throw new Error(`Mulberry has no symbol "${source.name}" (for "${key}").`);
    svg = new TextDecoder().decode(bytes);
  } else if (source.set === 'openmoji') {
    const url = `https://raw.githubusercontent.com/hfg-gmuend/openmoji/${sources.openmoji}/color/svg/${source.name}.svg`;
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`OpenMoji ${source.name} (for "${key}"): HTTP ${response.status}`);
    svg = await response.text();
  } else {
    throw new Error(`Unknown symbol set "${source.set}" for "${key}".`);
  }
  if (UNSAFE.test(svg))
    throw new Error(`${source.set} ${source.name} has active or external content.`);
  writeFileSync(join(out, source.set, `${key}.svg`), svg);
}

console.log(`Wrote ${Object.keys(sources.symbols).length} symbols to ${out}`);
