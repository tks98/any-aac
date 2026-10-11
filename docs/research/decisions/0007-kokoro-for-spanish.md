# 0007: Kokoro for a clearly licensed Spanish voice

Status: not adopted. 2026-10-11.

## Context

After [0002](0002-only-clearly-licensed-voices.md), the only Open AAC voice in Spanish is Carlfm: male, small and low quality. Kokoro-82M has Apache 2.0 weights and Spanish voices, including a female one, so it was the first candidate.

## Evaluation

The licence check comes first, because it's what [0002](0002-only-clearly-licensed-voices.md) requires. Kokoro's model card says it "was trained exclusively on permissive/non-copyrighted audio data", which includes public-domain audio, Apache- and MIT-licensed audio, two CC BY datasets, and **synthetic audio from closed TTS models from large providers** ([model card](https://huggingface.co/hexgrad/Kokoro-82M)). There's no dataset manifest saying which voices came from what. Closed providers' terms commonly restrict using their output to train other models, and we can't check what applies to the Spanish voices.

Kokoro also costs more than Piper: the model is several times larger, so the download is bigger and synthesis slower on phones. We stopped at the licence check, so these weren't measured.

## Decision

Not adopted: by our standard, Kokoro's licence isn't clearly open, whatever its weights' licence says. See [0008](0008-train-a-spanish-voice.md) for the alternative.
