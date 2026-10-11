# 0006: Tools for partner modeling

Status: accepted. 2026-10-11.

## Context

Aided language modeling, where partners tap words on the person's own AAC system as they talk, is the best-evidenced AAC teaching practice ([findings/teaching.md](../findings/teaching.md)). To model well, partners need to find words quickly, and what they tap shouldn't become the person's own words. No open-source AAC app had tools for this ([foundations.md §3](../foundations.md#3-what-already-exists)). The approved design included a find-word screen.

## Decision

**Modeling mode**, opened with **Model** in the edit toolbar (so it sits behind the same press-and-hold as editing, and a communicator can't enter it by accident). It follows the approved find-word design:

- **Taps are said but not added to the message.** Folders open as usual; Home and Back are in the header.
- **Find a word** searches every board, in the language in use, ignoring accents and case. The path ("1 Open Food, 2 Tap apple") is listed, the next cell is outlined and numbered, and tapping it moves on to the next step. **Start over** goes back to the first step; **Say it** says the word; other matches can be chosen.
- **Paths follow what's on screen**: on a phone, the phone layouts. Words that aren't on the phone layout aren't offered there.

Path-finding is in `packages/core/src/find.ts` (breadth-first from the home board, so the shortest path wins), and the screen in `apps/web/src/lib/components/ModelingMode.svelte`.

## Consequences

- Partners need to know that Model is in the edit toolbar; [setup.md](../../setup.md) says so.
- Not yet: highlighting each modeled word for a moment, modeling while scanning, and a quick way back into modeling without the press-and-hold.
