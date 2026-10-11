# Starter symbols

Symbols for the starter vocabulary, one SVG per word, named by the word's key in
`src/lib/starter.ts`. `sources.json` lists where each one comes from. To change a
symbol, edit `sources.json` and run:

```bash
node scripts/vendor-symbols.mjs path/to/mulberry-symbols.zip
```

Words without a symbol here use a placeholder line drawing from
`src/lib/pictograms.ts`.

## Licences

- `mulberry/`: [Mulberry Symbols](https://mulberrysymbols.org) © 2018–2026 Steve Lee,
  licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
  Version pinned in `sources.json`.
- `openmoji/`: [OpenMoji](https://openmoji.org), the open-source emoji and icon
  project, licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
  Version pinned in `sources.json`.

Each image in the starter boards also carries its licence and source in its OBF
`license` field, so the attribution travels with exported boards.
