#!/usr/bin/env node
/**
 * Copies the offered voices into a built site, so the app downloads them from
 * its own origin rather than Hugging Face (build with VITE_SELF_HOST_VOICES=true).
 * Files come from the pinned Piper release, are checked against the sizes and
 * hashes in src/lib/voice/voices.json, and are kept in .cache/voices/.
 * Each model is stored in half precision, half the size and sounding the same
 * (scripts/half-precision.mjs), and checked against its pinned hash too. They
 * go in the site's voices/fp16/ folder.
 *
 *   node scripts/self-host-voices.mjs dist
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { check, voiceCatalog, voiceFile } from './fetch-checked.mjs';
import { toHalfPrecision } from './half-precision.mjs';

const out = process.argv[2];
if (!out) {
  console.error('Usage: node scripts/self-host-voices.mjs <built site folder>');
  process.exit(1);
}
const { voices } = voiceCatalog;

const folder = join(out, 'voices/fp16');
let total = 0;
for (const voice of voices) {
  const path = `${voice.dir}/${voice.dir.split('/').slice(1).join('-')}.onnx`;
  const target = join(folder, path);
  mkdirSync(dirname(target), { recursive: true });

  const { model } = toHalfPrecision(readFileSync(await voiceFile(path, voice.model)));
  check(model, voice.fp16, `${path} in half precision`);
  writeFileSync(target, model);
  copyFileSync(await voiceFile(`${path}.json`, voice.config), `${target}.json`);
  total += voice.fp16.size + voice.config.size;
}
console.log(`Copied ${voices.length} voices (${Math.round(total / 1e6)} MB) into ${folder}.`);
