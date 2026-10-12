# Findings: board files from other apps

What other AAC apps' board files really contain, so that people can bring their boards to Any AAC and take them away again ([plan.md](../../plan.md), "Open formats"). Background: [foundations.md §4.5](../foundations.md#45-board-interchange-open-board-format-obfobz).

## Open Board Format

- **OBF is an open JSON format for AAC boards**, with `.obz` packages: a zip of boards, a `manifest.json`, and the pictures and sounds they use. CoughDrop's founder designed it to be free for any AAC vendor to implement ([openboardformat.org](https://www.openboardformat.org/); [CoughDrop's blog](https://blog.mycoughdrop.com/unlocking-board-files), a vendor source).
- **Cboard added OBF export in 2018**, as an "OpenBoard" option in its export settings ([Cboard's blog](https://www.cboard.io/cboard/openboard/open-source/2018/06/30/cboard-openboard-support/), a vendor source).

## What real exports contain

Tested 2026-10-11 with files the apps' own exporters made ([the fixtures](../../../packages/core/test/fixtures/real-exports/README.md)):

- **Cboard** ([app.cboard.io](https://app.cboard.io/), exported as a guest):
  - A single board is a clean grid with every picture inlined as an SVG `data:` URI, and a licence for the board but none for each picture.
  - **Folder buttons lose their links** in a single-board export: "food" and "drinks" come through as plain words.
  - "Export All Boards" as a guest, who has no boards of their own, gives a package whose manifest names no root board.
  - Cboard's home board uses Mulberry symbols and Cboard's own ([cboard-org/cboard](https://github.com/cboard-org/cboard), `src/api/boards.json`; GPL-3.0).
- **CoughDrop**: the samples in the tests of [open-aac/obf](https://github.com/open-aac/obf), the library CoughDrop reads and writes OBF with (MIT; from 2014–2017, not from CoughDrop's current app):
  - **Pictures are often links, not files.** In a 98-board set, all 1,354 pictures are links to [OpenSymbols](https://www.opensymbols.org/) on Amazon S3: 1,069 Mulberry, 151 ARASAAC, 91 Sclera, 31 from the Noun Project, and 12 others.
  - Boards without a `format` field, and a macOS `__MACOSX` folder in the zip.
  - A page set converted from another app names 926 pictures that aren't in the package, and links to 15 boards it never wrote; some of those links are the other app's commands (`print::ice cream;goto::flavors`).
- **Linked pictures from other sets carry non-commercial licences.** ARASAAC's pictograms are CC BY-NC-SA ([Global Symbols](https://globalsymbols.com/about/terms-and-conditions?locale=en) lists the set under it). Sclera's are CC BY-NC, and commercial use needs Sclera's consent ([Sclera](https://www.sclera.be/en/picto/copyright); Sclera's page says version 2.0 and Global Symbols says 4.0, _(unverified)_ which applies). We don't bundle non-commercial content ([CONTRIBUTING.md](../../../CONTRIBUTING.md#content-and-licensing)).

**What we do:** the importer is tested with these files. Linked Mulberry pictures are copied in from Any AAC's own library, other linked pictures aren't loaded (the buttons show their words), folders whose board isn't in the file become words, repeated notices are said once, and an empty file says it has no boards ([0014](../decisions/0014-real-imports.md)). Still untested: an export from CoughDrop's current app, a Cboard set with folders, and other apps that write OBF (AsTeRICS Grid, LibreAAC).
