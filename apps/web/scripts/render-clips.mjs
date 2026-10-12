#!/usr/bin/env node
/**
 * Renders the bundled starter clips: every word and quick phrase on the
 * starter boards, in each language's default app voice, so they speak from the
 * first tap, before any voice has downloaded (and, on iPhone and iPad, in
 * silent mode). See src/lib/voice/starter-clips.ts for what's covered.
 *
 * It runs the app's own voice engine in a browser (the dev server and
 * Playwright's Chromium), trims silence, and encodes each clip as MP3 with
 * LAME (`brew install lame`). The output, src/lib/voice/clips/, is committed;
 * run this again after changing the starter vocabularies or default voices:
 *
 *   node scripts/render-clips.mjs
 *
 * Voice files come from .cache/voices when there (see self-host-voices.mjs),
 * otherwise from the Piper release.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'src/lib/voice/clips');

/** Below this (about -36 dBFS), a sample counts as silence. */
const SILENCE = 500;
/** Silence kept before and after each word, in seconds. */
const MARGIN = 0.015;
/** MP3 bitrate (kbit/s): clear for speech, about 4 KB a second. */
const BITRATE = 32;

/** The clip without the silence before and after it. */
export function trimSilence(pcm, sampleRate) {
  let start = 0;
  let end = pcm.length;
  while (start < end && Math.abs(pcm[start]) < SILENCE) start++;
  while (end > start && Math.abs(pcm[end - 1]) < SILENCE) end--;
  const margin = Math.round(MARGIN * sampleRate);
  return pcm.subarray(Math.max(0, start - margin), Math.min(pcm.length, end + margin));
}

function encodeMp3(pcm, sampleRate) {
  const result = spawnSync(
    'lame',
    [
      '--quiet',
      '-r',
      '-s',
      String(sampleRate / 1000),
      '--bitwidth',
      '16',
      '--signed',
      '--little-endian',
      '-m',
      'm',
      '-b',
      String(BITRATE),
      '-q',
      '2',
      '-',
      '-',
    ],
    { input: Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength), maxBuffer: 1 << 26 },
  );
  if (result.error)
    throw new Error(`Couldn't run lame (brew install lame): ${result.error.message}`);
  if (result.status !== 0) throw new Error(`lame failed: ${result.stderr}`);
  return result.stdout;
}

async function main() {
  const server = await createServer({ root, logLevel: 'error', server: { port: 5199 } });
  await server.listen();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    // Voice files from the local cache when they're there.
    await page.route(/\/resolve\/v1\.0\.0\/(.+\.onnx(\.json)?)$/, (route) => {
      const path = route.request().url().split('/resolve/v1.0.0/')[1];
      const local = join(root, '.cache/voices', path);
      return existsSync(local) ? route.fulfill({ path: local }) : route.continue();
    });
    await page.goto('http://localhost:5199/render-clips.html');
    await page.waitForFunction(() => 'renderVoice' in window);
    const languages = await page.evaluate(() => window.clipLanguages());

    rmSync(out, { recursive: true, force: true });
    mkdirSync(out, { recursive: true });
    const index = {};
    for (const lang of languages) {
      console.log(`Rendering ${lang}…`);
      const rendered = await page.evaluate((l) => window.renderVoice(l), lang);
      const parts = [];
      const clips = {};
      let offset = 0;
      for (const [text, b64] of Object.entries(rendered.clips).sort(([a], [b]) =>
        a.localeCompare(b),
      )) {
        const raw = Buffer.from(b64, 'base64');
        const pcm = new Int16Array(raw.buffer, raw.byteOffset, raw.byteLength / 2);
        const mp3 = encodeMp3(trimSilence(pcm, rendered.sampleRate), rendered.sampleRate);
        clips[text] = [offset, offset + mp3.length];
        parts.push(mp3);
        offset += mp3.length;
      }
      writeFileSync(join(out, `${rendered.voiceId}.bin`), Buffer.concat(parts));
      index[rendered.voiceId] = { lang, clips };
      console.log(
        `  ${Object.keys(clips).length} clips, ${(offset / 1024).toFixed(0)} KB (${rendered.voiceId})`,
      );
    }
    // One line per clip.
    const json = JSON.stringify(index, null, 1).replace(
      /\[\n\s*(\d+),\n\s*(\d+)\n\s*\]/g,
      '[$1, $2]',
    );
    writeFileSync(join(out, 'index.json'), `${json}\n`);
    console.log(`Wrote ${readdirSync(out).join(', ')}`);
  } finally {
    await browser.close();
    await server.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
