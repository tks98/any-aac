# Findings: voices

## Browser speech

- Web Speech voices differ by device, some need the internet, Chrome on Android can fall back to English, and Firefox on Android has none ([foundations.md §4.1](../foundations.md#41-speech-output)). Open AAC warns when the device has no voice for the language in use, or none at all.
- Neural voices run well in the browser: Piper on an iPhone runs about seven times faster than real time, and prepared words play in 20–45 ms ([0001](../decisions/0001-offline-voice.md)).

## Licences

- A voice's licence comes from its recordings **and from any voice it was fine-tuned from**. Several Piper voices with open recordings were fine-tuned from lessac, whose recordings are research-only ([lessac licence](https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html)); some don't document their training ([0002](../decisions/0002-only-clearly-licensed-voices.md)).
- Clearly open Piper voices: Linda (LJ Speech), Kristin, Norman, Cori (LibriVox) in English; Carlfm in Spanish (small, low quality). Every Spanish Piper voice of good quality is lessac-derived or undocumented.
- Kokoro-82M's weights are Apache 2.0 and it has Spanish voices, but it was trained partly on synthetic audio from closed commercial TTS models, with no dataset manifest ([model card](https://huggingface.co/hexgrad/Kokoro-82M)), so it isn't clearly open ([0007](../decisions/0007-kokoro-for-spanish.md)).
- Openly licensed Spanish recordings exist, such as [OpenSLR 61](https://www.openslr.org/61/) (Argentinian, female and male, CC BY-SA 4.0). Training one with a clean starting point is a possible future route to a clean Spanish voice ([0008](../decisions/0008-train-a-spanish-voice.md)).

## Where the files come from

- The hosted app serves voice files from its own site, copied from the pinned Piper release and checked against their hashes, so no other site learns who downloads a voice ([0010](../decisions/0010-hosting.md)).

## Gaps

No openly licensed children's voices found yet; voice banking not started.
