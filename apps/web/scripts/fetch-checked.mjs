/**
 * Downloads checked against pinned hashes, for the maintainer scripts that
 * fetch files from elsewhere (self-host-voices.mjs, render-clips.mjs,
 * vendor-symbols.mjs). A file that doesn't match is never written or used.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Git's blob hash, which Hugging Face gives for files not stored with LFS. */
export const gitOid = (bytes) =>
  createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');

/**
 * Throws unless the bytes match the pin: its size when it has one, and its
 * sha256 or, failing that, its git blob hash. A pin with no hash never matches.
 */
export function check(bytes, expected, label) {
  if (expected.size !== undefined && bytes.length !== expected.size)
    throw new Error(`${label}: ${bytes.length} bytes, expected ${expected.size}.`);
  const ok = expected.sha256
    ? sha256(bytes) === expected.sha256
    : expected.gitOid
      ? gitOid(bytes) === expected.gitOid
      : false;
  if (!ok) throw new Error(`${label}: hash doesn't match the pinned one.`);
}

/**
 * The file at `url`, checked against `expected`. With `cached`, a copy that
 * matches is kept there and reused; one that doesn't is deleted and fetched again.
 */
export async function fetchChecked(url, expected, { cached, label = url } = {}) {
  if (cached && existsSync(cached)) {
    const bytes = readFileSync(cached);
    try {
      check(bytes, expected, label);
      return bytes;
    } catch {
      rmSync(cached);
    }
  }
  console.log(`Downloading ${label}…`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  check(bytes, expected, label);
  if (cached) {
    mkdirSync(dirname(cached), { recursive: true });
    writeFileSync(cached, bytes);
  }
  return bytes;
}

/** The offered voices, with their pinned sizes and hashes. */
export const voiceCatalog = JSON.parse(
  readFileSync(join(root, 'src/lib/voice/voices.json'), 'utf8'),
);

/**
 * A file of the pinned Piper release (`path` relative to it, as in
 * voices.json), checked and kept in .cache/voices/. Returns the cached path.
 */
export async function voiceFile(path, expected) {
  const cached = join(root, '.cache/voices', path);
  await fetchChecked(`${voiceCatalog.piper}/${path}`, expected, { cached, label: path });
  return cached;
}

/** The pin in voices.json for a file of the Piper release, or undefined. */
export function voicePin(path) {
  for (const voice of voiceCatalog.voices) {
    const model = `${voice.dir}/${voice.dir.split('/').slice(1).join('-')}.onnx`;
    if (path === model) return voice.model;
    if (path === `${model}.json`) return voice.config;
  }
  return undefined;
}
