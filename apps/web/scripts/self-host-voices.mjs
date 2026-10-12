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
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toHalfPrecision } from './half-precision.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2];
if (!out) {
  console.error('Usage: node scripts/self-host-voices.mjs <built site folder>');
  process.exit(1);
}
const { piper, voices } = JSON.parse(readFileSync(join(root, 'src/lib/voice/voices.json'), 'utf8'));

/** Git's blob hash, which Hugging Face gives for files not stored with LFS. */
const gitOid = (bytes) =>
  createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');

function check(bytes, expected, file) {
  if (bytes.length !== expected.size)
    throw new Error(`${file}: ${bytes.length} bytes, expected ${expected.size}.`);
  const ok = expected.sha256
    ? createHash('sha256').update(bytes).digest('hex') === expected.sha256
    : gitOid(bytes) === expected.gitOid;
  if (!ok) throw new Error(`${file}: hash doesn't match voices.json.`);
}

async function fetchChecked(path, expected) {
  const cached = join(root, '.cache/voices', path);
  if (existsSync(cached)) {
    const bytes = readFileSync(cached);
    try {
      check(bytes, expected, path);
      return cached;
    } catch {
      rmSync(cached);
    }
  }
  console.log(`Downloading ${path}…`);
  const response = await fetch(`${piper}/${path}`);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  check(bytes, expected, path);
  mkdirSync(dirname(cached), { recursive: true });
  writeFileSync(cached, bytes);
  return cached;
}

const folder = join(out, 'voices/fp16');
let total = 0;
for (const voice of voices) {
  const path = `${voice.dir}/${voice.dir.split('/').slice(1).join('-')}.onnx`;
  const target = join(folder, path);
  mkdirSync(dirname(target), { recursive: true });

  const { model } = toHalfPrecision(readFileSync(await fetchChecked(path, voice.model)));
  check(model, voice.fp16, `${path} in half precision`);
  writeFileSync(target, model);
  copyFileSync(await fetchChecked(`${path}.json`, voice.config), `${target}.json`);
  total += voice.fp16.size + voice.config.size;
}
console.log(`Copied ${voices.length} voices (${Math.round(total / 1e6)} MB) into ${folder}.`);
