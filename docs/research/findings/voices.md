# Findings: voices

## Browser speech

- Web Speech voices differ by device, some need the internet, Chrome on Android can fall back to English, and Firefox on Android has none ([foundations.md §4.1](../foundations.md#41-speech-output)). Open AAC warns when the device has no voice for the language in use, or none at all.
- Neural voices run well in the browser: Piper on an iPhone runs about seven times faster than real time, and prepared words play in 20–45 ms ([0001](../decisions/0001-offline-voice.md)).

## Licences

- A voice's licence comes from its recordings **and from any voice it was fine-tuned from**. Several Piper voices with open recordings were fine-tuned from lessac, whose recordings are research-only ([lessac licence](https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html)); some don't document their training ([0002](../decisions/0002-only-clearly-licensed-voices.md)).
- Clearly open Piper voices: Linda (LJ Speech), Kristin, Norman, Cori (LibriVox) in English; Carlfm in Spanish (small, low quality). Every Spanish Piper voice of good quality is lessac-derived or undocumented.
- Kokoro-82M is Apache 2.0, built on the public-domain LJ Speech recordings, with a few voices per language including Spanish ([guide](https://soniqo.audio/guides/kokoro)); see [0007](../decisions/0007-kokoro-for-spanish.md).

## Gaps

No openly licensed children's voices found yet; voice banking not started.
