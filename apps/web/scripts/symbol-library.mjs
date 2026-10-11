#!/usr/bin/env node
/**
 * Builds the symbol library the board editor searches: every Mulberry symbol
 * as a static file, plus a small index of names, categories and tags.
 *
 *   public/symbol-library/index.json
 *   public/symbol-library/mulberry/<id>.svg
 *
 * The files are generated, not committed (about 3,400 symbols). The pinned
 * release zip is downloaded once into .cache/ and checked against its hash.
 * Runs before `vite` and `vite build`; it does nothing when the library is
 * already up to date.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { strFromU8, unzipSync } from 'fflate';

const VERSION = 'v3.6.1';
const RELEASE = `https://github.com/mulberrysymbols/mulberry-symbols/releases/download/${VERSION}`;
/** The digests GitHub publishes for the release's files. */
const SHA256 = {
  'mulberry-symbols.zip': '9da3f23a17bd71aec3c94eae9a3367e977e7b65d3d7feeaadb3f4690182aa05b',
  'symbol-info.csv': '7ab9c0a3a964334c4f8d38fb2d49bd3e08a3be652a1eca36ac9036ba7adc568c',
};

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache = join(root, '.cache');
const out = join(root, 'public/symbol-library');
const stamp = join(out, 'VERSION');

if (existsSync(stamp) && readFileSync(stamp, 'utf8').trim() === VERSION) process.exit(0);

async function download(name) {
  const path = join(cache, `mulberry-${VERSION}-${name}`);
  if (!existsSync(path)) {
    mkdirSync(cache, { recursive: true });
    console.log(`Downloading Mulberry ${VERSION} ${name}…`);
    const response = await fetch(`${RELEASE}/${name}`);
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
    writeFileSync(path, new Uint8Array(await response.arrayBuffer()));
  }
  const bytes = readFileSync(path);
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (hash !== SHA256[name]) {
    rmSync(path);
    throw new Error(`${name} has hash ${hash}, expected ${SHA256[name]}. Try again.`);
  }
  return bytes;
}

const zip = await download('mulberry-symbols.zip');
const info = strFromU8(await download('symbol-info.csv'));

/** Parses the CSV (quoted fields may hold commas). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length > 0) rows.push([...row, field]);
  const [header, ...body] = rows;
  return body.map((cells) => Object.fromEntries(header.map((key, i) => [key, cells[i] ?? ''])));
}

const files = unzipSync(zip, {
  filter: (file) => file.name.startsWith('EN-symbols/') && file.name.endsWith('.svg'),
});

// Symbols are shown with <img>, where scripts can't run, but keep the files plain anyway.
const UNSAFE = /<script|javascript:|\son[a-z]+\s*=|<foreignObject|href\s*=\s*["']https?:/i;

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'mulberry'), { recursive: true });

const index = [];
let skipped = 0;
for (const symbol of parseCsv(info)) {
  const file = symbol['symbol-en'];
  const bytes = files[`EN-symbols/${file}.svg`];
  if (!bytes || UNSAFE.test(strFromU8(bytes))) {
    skipped++;
    continue;
  }
  const id = symbol['symbol-id'];
  writeFileSync(join(out, 'mulberry', `${id}.svg`), bytes);
  index.push({
    id,
    // "want_,_to" → "want, to"
    name: file.replace(/_/g, ' ').replace(/\s+,/g, ',').replace(/\s+/g, ' ').trim(),
    file,
    category: symbol['category-en'],
    tags: symbol.tags,
  });
}

writeFileSync(join(out, 'index.json'), JSON.stringify({ mulberry: VERSION, symbols: index }));
writeFileSync(stamp, VERSION);
console.log(`Symbol library: ${index.length} Mulberry symbols (${skipped} skipped).`);
