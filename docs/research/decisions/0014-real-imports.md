# 0014: Imports tested with real exports; linked pictures come from our library or not at all

Status: accepted. 2026-10-11.

## Context

Importing boards from Cboard and CoughDrop is one of P1's exit criteria ([plan.md](../../plan.md)), but the importer had only been tested with files written to look like theirs. So we collected files their own exporters made ([fixtures](../../../packages/core/test/fixtures/real-exports/README.md)):

- **Cboard** (app.cboard.io, as a guest): a single board, with every picture inlined as SVG, and "Export All Boards", which for a guest is a package with no boards in it.
- **CoughDrop**: the samples in the tests of [open-aac/obf](https://github.com/open-aac/obf), the library CoughDrop exports with. Among them, a 98-board set whose 1,354 pictures are links to OpenSymbols, and an 81-board page set converted from another app.

All of them imported, but they showed four problems:

1. **Pictures that are only links**, to symbol libraries on other sites (Amazon S3, for OpenSymbols). The app showed them by loading them from there, which broke the promise that it contacts no other site; the new security policy ([0010](0010-hosting.md)) blocks them, which would leave broken images.
2. **Folder buttons whose board isn't in the file**: links the converter never wrote, some of them another app's commands (`print::ice cream;goto::flavors`). Tapping one did nothing.
3. **Hundreds of identical notices**: 98 "no format", 926 "missing picture".
4. **An unhelpful message for an empty file** ("manifest.json does not name a root board"), and macOS's `__MACOSX` files kept with the boards.

## Decision

- **Linked Mulberry symbols come from our own library.** 1,069 of the 1,354 linked pictures in the CoughDrop set are Mulberry symbols, which Any AAC has offline; all 1,069 match by name. On import they're copied in from the library, so they work offline and nothing is fetched from elsewhere (`apps/web/src/lib/linked-pictures.ts`). Boards imported before this are fixed the next time the app opens.
- **Other linked pictures aren't loaded.** Those buttons show their words, and the import says how many and suggests choosing pictures in edit mode. The links stay in the boards, so exporting gives them back. (ARASAAC and Sclera, most of the rest, are non-commercial licences, which we don't bundle.)
- **A folder whose board isn't in the file becomes a word** that says its label. The link it had is kept in `ext_anyaac_missing_board`.
- **Notices are said once**: the same notice on many boards is one line ("98 boards: …"), and missing pictures are one count.
- An empty package says "There are no boards in this file", and `__MACOSX` and `.DS_Store` files are left out.

## Consequences

- The real exports are in the tests: `packages/core/test/real-exports.test.ts` reads each one, and `apps/web/e2e/import.spec.ts` imports Cboard's board and the CoughDrop set through Settings and checks that no request leaves the site.
- Still untested: an export from CoughDrop's current app (the samples are from its exporter's tests, 2014–2017), a Cboard set with folders (a guest has none of their own; single-board exports drop folder links), and other apps that write OBF (AsTeRICS Grid, LibreAAC).
