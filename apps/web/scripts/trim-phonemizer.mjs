#!/usr/bin/env node
/**
 * Makes a copy of piper-phonemize (eSpeak NG in WebAssembly) with only the
 * dictionaries for the languages Any AAC has voices in. The full package
 * carries dictionaries for about 100 languages (18 MB, 9 MB compressed), and
 * Russian alone is 8.5 MB; English and Spanish need about 1 MB.
 *
 * The output (src/lib/voice/phonemizer/) is committed, so builds and tests
 * don't run this. Run it again after updating @diffusionstudio/piper-wasm or
 * adding a voice in a new language:
 *
 *   node scripts/trim-phonemizer.mjs
 *
 * A unit test checks the committed copy matches what this script makes.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'node_modules/@diffusionstudio/piper-wasm/build');
const out = join(root, 'src/lib/voice/phonemizer');

/** eSpeak dictionaries for the languages of the offered voices ("en-US" → en_dict). */
export function dictionariesFor(voices) {
  return [...new Set(voices.map((v) => `${v.lang.split('-')[0].toLowerCase()}_dict`))].sort();
}

/**
 * The trimmed package: the Emscripten glue as an ES module with a new file
 * index, and the data with only the kept files.
 */
export function trim(js, data, keepDictionaries) {
  const match = js.match(/loadPackage\((\{"files":.*?\})\)/s);
  if (!match) throw new Error('No file index in piper_phonemize.js.');
  const index = JSON.parse(match[1]);
  const keep = (name) =>
    !name.endsWith('_dict') || keepDictionaries.includes(name.split('/').pop());
  const parts = [];
  let offset = 0;
  const files = [];
  for (const file of index.files) {
    if (!keep(file.filename)) continue;
    const bytes = data.subarray(file.start, file.end);
    files.push({ ...file, start: offset, end: offset + bytes.length });
    parts.push(bytes);
    offset += bytes.length;
  }
  const missing = keepDictionaries.filter(
    (name) => !files.some((f) => f.filename.endsWith(`/${name}`)),
  );
  if (missing.length) throw new Error(`Not in the package: ${missing.join(', ')}`);
  const newIndex = { ...index, files, remote_package_size: offset };
  let glue = js.replace(match[0], `loadPackage(${JSON.stringify(newIndex)})`);
  // The package is UMD (CommonJS); the app imports it as an ES module.
  const umd = glue.indexOf("if (typeof exports === 'object' && typeof module === 'object')");
  if (umd === -1) throw new Error('Unexpected end of piper_phonemize.js.');
  glue = `${glue.slice(0, umd)}export default createPiperPhonemize;\n`;
  if (glue.includes('remote_package_size":18077249'))
    throw new Error('The package size was not updated.');
  return { js: glue, data: Buffer.concat(parts) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { voices } = JSON.parse(readFileSync(join(root, 'src/lib/voice/voices.json'), 'utf8'));
  const keepDictionaries = dictionariesFor(voices);
  const result = trim(
    readFileSync(join(source, 'piper_phonemize.js'), 'utf8'),
    readFileSync(join(source, 'piper_phonemize.data')),
    keepDictionaries,
  );
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'piper_phonemize.js'), result.js);
  writeFileSync(join(out, 'piper_phonemize.data'), result.data);
  copyFileSync(join(source, 'piper_phonemize.wasm'), join(out, 'piper_phonemize.wasm'));
  console.log(
    `Kept ${keepDictionaries.join(', ')}: ${(result.data.length / 1e6).toFixed(2)} MB of data.`,
  );
}
