# 0009: A plain, consistent interface, checked against accessibility standards

Status: accepted. 2026-10-11.

## Context

The question was whether Open AAC needs a distinctive, stylised look, or one that's simply easy to use. The evidence ([findings/interface.md](../findings/interface.md)) favours ease of use: consistent placement, clear labels, feedback, legible text, large targets and low visual clutter. Appeal matters for children, but it comes from personal content and choice (photos, themes, the voice), not decoration.

## Decision

- **Keep the approved design's plain look**: one consistent layout, words that never move, icons with words, Atkinson Hyperlegible text, colour only where it carries meaning (word types, Help, the highlight).
- **Hold the interface to WCAG 2.2 AA and the W3C cognitive accessibility (COGA) patterns**, with automated checks in the browser tests: axe-core on every screen and theme, and a 44 px minimum for every control on the communication screen.
- **Fixed in this check**: Delete and Clear show words as well as icons; a tap on Edit (which needs a hold) explains itself; the chosen word is outlined for a moment, which can be turned off (Settings → Touch).
- **Personalisation over styling**: photos, themes, label size and hiding optional buttons are how families make it theirs.

## Consequences

- New screens must pass the same checks.
- Still to do: help inside the app for families and partners (COGA's "provide human help"), and testing with AAC users themselves; automated checks can't tell us whether it's easy for them.
