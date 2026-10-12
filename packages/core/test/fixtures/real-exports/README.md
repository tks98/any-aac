# Real exports from other AAC apps

Files made by other apps' own exporters, so the importer is tested against what people will really bring, not files written to look like them. `real-exports.test.ts` reads each one.

## Cboard

Exported from [app.cboard.io](https://app.cboard.io/) on 2026-10-11, as a guest (Settings → Export), in OpenBoard format:

| File                   | What it is                                                                                                                                                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `classic-home.obf.gz`  | "Export a single board" of **Cboard Classic Home**: one 6 × 5 board, 29 buttons, every picture inlined as an SVG `data:` URI. Its folder buttons (food, drinks…) lose their links in this export. Gzipped here; the bytes inside are the export as downloaded. |
| `empty-all-boards.obz` | "Export All Boards" as a guest, who has no boards of their own: a package whose manifest names no root board.                                                                                                                                                  |

The board is Cboard's (it marks itself CC BY). Its pictures are [Mulberry Symbols](https://mulberrysymbols.org/) (CC BY-SA 2.0 UK) and Cboard's own symbols, from [cboard-org/cboard](https://github.com/cboard-org/cboard) (GPL-3.0).

## CoughDrop

Samples from the tests of [open-aac/obf](https://github.com/open-aac/obf) (`spec/samples/`, commit `9a143b485904`), the library CoughDrop uses to read and write Open Board Format. MIT licence, © CoughDrop.

| File              | What it is                                                                                                                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `links.obz`       | Three boards linked by `load_board.path`.                                                                                                                                                                                           |
| `path_images.obz` | Pictures stored in the package and found by `path`.                                                                                                                                                                                 |
| `foreign.obf`     | Labels in Nepali, Arabic and Chinese; pictures linked from OpenSymbols (Mulberry and Sclera).                                                                                                                                       |
| `deep_simple.zip` | A 98-board set with no `format` fields and a `__MACOSX` folder. Its 1,354 pictures are links: 1,069 to Mulberry symbols on OpenSymbols, the rest to ARASAAC, Sclera, the Noun Project and others.                                   |
| `pageset.obz`     | An 81-board page set converted from another app, whose buttons name 926 pictures that aren't in the package, and 15 folders whose boards it never wrote (some are the other app's commands, like `print::ice cream;goto::flavors`). |
