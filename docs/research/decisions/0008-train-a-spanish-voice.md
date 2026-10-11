# 0008: Train a clearly licensed Spanish voice

Status: proposed. 2026-10-11.

## Context

Spanish needs a good Open AAC voice, and a female one ([0002](0002-only-clearly-licensed-voices.md), [0007](0007-kokoro-for-spanish.md)). Every good-quality Spanish Piper voice was fine-tuned from the research-only lessac voice or doesn't document its training. The licence problem is the lineage, not the Spanish recordings: Daniela (Argentinian, female), for example, was trained on [OpenSLR 61](https://www.openslr.org/61/), which is CC BY-SA 4.0, but fine-tuned from lessac.

## Proposed decision

Train our own Piper voices (the engine stays the same, [0001](0001-offline-voice.md)) with a clean lineage:

1. **Recordings:** openly licensed Spanish speech with transcripts. Candidates: OpenSLR 61 (Argentinian Spanish, separate female and male recordings, CC BY-SA 4.0); public-domain LibriVox Spanish audiobooks; Common Voice Spanish (CC0, but many speakers and mixed quality). A Mexican or US Spanish source would match the starter vocabulary best.
2. **Starting point:** train from scratch, or fine-tune from a voice trained from scratch on public-domain recordings (Linda, from LJ Speech), never from lessac or an undocumented voice.
3. **Publish** the voice with a model card naming its recordings, starting voice and licence (CC BY-SA 4.0 if trained on OpenSLR 61), and host it with the app ([foundations.md §4.1](../foundations.md#41-speech-output)).

This needs GPU time (hours for fine-tuning, days from scratch) and listening tests with Spanish speakers, ideally AAC users and SLPs.

## Consequences

Until then, Spanish speaks with the device's voice or Carlfm. The same route would give children's voices, which no openly licensed voice offers yet.
