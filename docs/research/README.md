# Research

What we've learned about AAC, and the decisions it led to. Every product decision that rests on evidence should be traceable to a finding here.

## Findings

By topic, with sources and what Any AAC does about each:

- [Vocabulary and layout](findings/vocabulary.md): core and fringe words, motor planning, grid size, colour coding
- [Languages](findings/languages.md): bilingual layouts, Spanish vocabulary and morphology
- [Voices](findings/voices.md): browser speech, neural voices, voice licences
- [Access](findings/access.md): touch, switch scanning, auditory scanning, high contrast and CVI
- [Teaching](findings/teaching.md): aided language modeling, just-in-time vocabulary, abandonment
- [Interface](findings/interface.md): AAC display research, cognitive accessibility, legibility, contrast and target size

Longer documents:

- [foundations.md](foundations.md): the original research (2026-10-10): who uses AAC, what systems need, what exists, what browsers can do, licensing, funding
- [check-2026-10-11.md](check-2026-10-11.md): a check of everything built against the research, and what it changed

## Decisions

| #                                                      | Decision                                                               | Status      |
| ------------------------------------------------------ | ---------------------------------------------------------------------- | ----------- |
| [0001](decisions/0001-offline-voice.md)                | Offline voice: Piper in the browser, our own engine                    | Accepted    |
| [0002](decisions/0002-only-clearly-licensed-voices.md) | Only voices with clearly open licences                                 | Accepted    |
| [0003](decisions/0003-core-vocabulary.md)              | Core vocabulary from Universal Core                                    | Accepted    |
| [0004](decisions/0004-spanish-first-vocabulary.md)     | A Spanish-first vocabulary                                             | Accepted    |
| [0005](decisions/0005-phone-layouts.md)                | Phone layouts follow the tablet's order; can be off                    | Accepted    |
| [0006](decisions/0006-partner-modeling.md)             | Tools for partner modeling                                             | Accepted    |
| [0007](decisions/0007-kokoro-for-spanish.md)           | Kokoro for a clearly licensed Spanish voice                            | Not adopted |
| [0008](decisions/0008-train-a-spanish-voice.md)        | Train a clearly licensed Spanish voice                                 | Deferred    |
| [0009](decisions/0009-plain-interface.md)              | A plain, consistent interface, checked against accessibility standards | Accepted    |
| [0010](decisions/0010-hosting.md)                      | Host on GitHub Pages, with the voices on the same site                 | Accepted    |
| [0011](decisions/0011-name.md)                         | Rename Open AAC to Any AAC                                             | Accepted    |

Earlier project decisions (licence, framework, building fresh, the approved design) are in [plan.md §10](../plan.md#10-decisions).

## Adding to this folder

- **A finding** goes in the topic file it belongs to (or a new one): what the evidence says, with links, then **What we do**. Say when a source is a vendor or practitioner rather than a study, and mark anything not checked against its source as _(unverified)_.
- **A decision** gets the next number in `decisions/`: context, the options, the decision, and its consequences. Its status is _proposed_, _accepted_, _not adopted_, or _superseded by_ a later number. Link it from the findings it rests on and from this table.
