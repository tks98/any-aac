# Open AAC

A free, open-source AAC (augmentative and alternative communication) app that runs in any modern browser, keeps working with no internet connection, and can be self-hosted by serving a folder of static files.

**Status: early.** You can tap words to build a message and hear it spoken. Folders work, phones get their own smaller board, the app works offline, boards and settings are saved on the device, and you can import and export Open Board Format files. Settings cover the voice, speaking rate and pitch, touch timing (hold to select, select on release, ignore repeat taps), button spacing, label position and text-only mode. Most of what's in the [plan](docs/plan.md) is still ahead, and the starter vocabulary and pictograms are placeholders (see [design.md](docs/design.md)).

## Run it

You need Node 24 and pnpm 10.

```bash
pnpm install
pnpm dev
```

Open the URL Vite prints. To try the offline build, run `pnpm build && pnpm preview`.

### On a phone or tablet

Offline mode and "Add to Home Screen" need HTTPS. On plain `http://` over the LAN (`pnpm dev:lan`) the app works, but without the service worker. The easiest way to get real HTTPS is [Tailscale](https://tailscale.com/), with the phone on the same tailnet:

```bash
pnpm build
pnpm --filter @open-aac/web preview --host 127.0.0.1
tailscale serve 4173
```

Then open `https://<machine>.<tailnet>.ts.net` on the phone. Only devices on your tailnet can reach it, and `tailscale serve` stops serving when you press Ctrl+C.

## Checks

```bash
pnpm lint        # ESLint and Prettier
pnpm typecheck   # tsc and svelte-check
pnpm test        # unit tests (Vitest)
pnpm test:e2e    # browser tests (Playwright; run `pnpm --filter @open-aac/web exec playwright install` once)
```

## Layout

```
packages/core   board model, OBF/OBZ import and export, message logic (no UI)
apps/web        the installable web app (Svelte 5, Vite, IndexedDB, service worker)
docs/           research, plan, and design decisions
```

Boards are stored in [Open Board Format](https://www.openboardformat.org/), so they move to and from other AAC apps without loss. Open AAC's own extra fields use the `ext_openaac_` prefix.

## Docs

- [research.md](docs/research.md): what AAC systems need, what exists, and what browsers can do
- [plan.md](docs/plan.md): principles, features, architecture, and roadmap
- [design.md](docs/design.md): the approved UI direction and design tokens

## License

The code is licensed under the [GNU AGPL v3 or later](LICENSE). Vocabulary content and the placeholder pictograms are licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). See [CONTRIBUTING.md](CONTRIBUTING.md) to get involved.
