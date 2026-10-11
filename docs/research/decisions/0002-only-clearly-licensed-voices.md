# 0002: Only voices with clearly open licences

Status: accepted. 2026-10-11.

## Context

Any AAC promises that someone could sell devices preloaded with it, so nothing in the default offering may be non-commercial ([foundations.md §5](../foundations.md#5-licensing-findings)). [0001](0001-offline-voice.md) chose Piper voices and checked each voice's recordings. The [research check](../check-2026-10-11.md) found that a voice's licence also depends on the voice it was fine-tuned from:

- Joe and Alba (English) and Davefx and Ald (Spanish) were fine-tuned from Piper's **lessac** voice. Its recordings are licensed "for Research Purposes only", which excludes "developing … voice synthesis or speech recognition products" ([licence](https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html)). The licence doesn't say whether a model fine-tuned from them is a derived work.
- Claude (Mexican Spanish) states Apache 2.0 but doesn't document its recordings or base model.

## Options

1. Keep them, labelled as unclear.
2. Remove them until the licences are settled (chosen).
3. Ask the voice authors and the lessac licensors first.

## Decision

Any AAC offers only voices that are clearly open: recordings under an open licence or in the public domain, **and** trained from scratch or fine-tuned from a voice that is itself clearly open. The five voices are removed. If a device has one downloaded, its files and prepared audio are deleted when the app starts, and that language goes back to the device voice until another voice is chosen.

Offered now: Linda (LJ Speech), Kristin, Norman and Cori (LibriVox) in English, all public domain and trained from scratch; Carlfm in Spanish, public domain, trained from scratch, small and low quality.

## Consequences

- Spanish has only one app voice, it's male, and it's low quality. Kokoro was evaluated as a replacement and doesn't meet this standard either ([0007](0007-kokoro-for-spanish.md)); training our own Spanish voice is noted as a possible future plan in [0008](0008-train-a-spanish-voice.md).
- Every voice added later needs its MODEL_CARD checked for the base model as well as the recordings. `apps/web/src/lib/voice/catalog.ts` says so.
- Option 3 is still worth doing: if lessac's licensors allow fine-tuned models, Joe, Alba, Davefx and Ald could come back.
