#!/usr/bin/env node
/**
 * Copies the offered voices into a built site, so the app downloads them from
 * its own origin rather than Hugging Face (build with VITE_SELF_HOST_VOICES=true).
 * Files come from the pinned Piper release, are checked against the sizes and
 * hashes in src/lib/voice/voices.json, and are kept in .cache/voices/.
 *
 *   node scripts/self-host-voices.mjs dist
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

let total = 0;
for (const voice of voices) {
  const base = `${voice.dir}/${voice.dir.split('/').slice(1).join('-')}`;
  for (const [suffix, expected] of [
    ['.onnx', voice.model],
    ['.onnx.json', voice.config],
  ]) {
    const path = base + suffix;
    const source = await fetchChecked(path, expected);
    const target = join(out, 'voices', path);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
    total += expected.size;
  }
}
console.log(
  `Copied ${voices.length} voices (${Math.round(total / 1e6)} MB) into ${join(out, 'voices')}.`,
);
