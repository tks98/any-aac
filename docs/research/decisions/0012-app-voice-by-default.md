# 0012: An app voice by default, with the starter words bundled

Status: accepted. 2026-10-11.

## Context

Any AAC used the device's own voice until someone downloaded an app voice in Settings. Testing on an iPhone showed why that default fails: with the ring/silent switch on silent, iOS mutes the browser's speech (Web Speech), and nothing a page does changes that. Setting the audio session to `playback` and keeping a silent audio element playing didn't help. Web Audio, which plays app voices, was heard ([findings/voices.md](../findings/voices.md)). Many people keep their phones on silent, so the app would seem not to work at all.

An app voice was a 77 MB download (measured on the live site): the model (63.5 MB), eSpeak NG's data for about 100 languages (9.0 MB compressed), and ONNX Runtime (3.7 MB compressed).

## Options

1. **Keep the device voice as the default.** No download, but silent on iPhones in silent mode.
2. **Make an app voice the default and download it on first launch.** Works in silent mode, but nothing speaks well until about 70 MB have arrived.
3. **Option 2, plus bundle the starter words as audio (chosen).** The starter vocabulary is known in advance, so its words can be rendered ahead of time and shipped as audio clips, far smaller than a voice model.

## Decision

- **The app voice is the default.** Each language starts with its recommended voice (Linda for English, Carlfm for Spanish), which downloads in the background the first time the app opens. **Download app voices automatically** in Settings turns this off. The device voice can still be chosen; on iPhone and iPad, Settings and edit mode then explain the silent-mode problem.
- **Every word and quick phrase on the starter boards is bundled as audio**, in both languages: 261 clips (350 since the three sizes, [0015](0015-three-sizes.md)) rendered with the default voices, trimmed and encoded as 32 kbit/s MP3, 0.6 MB in all (`scripts/render-clips.mjs`, `apps/web/src/lib/voice/bundled.ts`). They're cached with the app, so starter words speak from the first tap, offline and in silent mode, before any voice has downloaded. Speak says a message of starter words clip by clip.
- **eSpeak's data is trimmed** to the dictionaries of the offered voices: 1 MB instead of 18 MB (0.5 MB compressed instead of 9 MB). Phonemes are identical (`scripts/trim-phonemizer.mjs`).

Until the voice is ready: bundled clips for starter words, then the device voice for anything else (words added or edited, word forms, typed text, and speaking rates other than normal). Once it's ready, the voice says everything.

## Consequences

- A first launch downloads about 70 MB on its own (about 37 MB since [0013](0013-half-precision-voices.md)). The setup guide suggests opening the app on Wi-Fi, and the setting turns it off.
- Before the voice arrives, a whole message is said word by word, so it sounds a little choppy.
- The clips must match the starter vocabularies. A unit test fails when a starter word has no clip; then run `node scripts/render-clips.mjs`.
- Building this found a bug in piper-phonemize: it stops working after about 80 calls (its original build too), which made sentences fall back to the device voice once the app had prepared enough words. A fresh instance now takes over every 50 calls, and again if a call fails.
- Next: a smaller voice model, after a listening comparison. Done in [0013](0013-half-precision-voices.md): voices are stored in half precision, half the size.
