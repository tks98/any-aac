# 0010: Host on GitHub Pages, with the voices on the same site

Status: accepted. 2026-10-11.

## Context

People need somewhere to open Any AAC before they can install it ([plan.md §5.5](../../plan.md#55-offline-and-self-hosting-modes), "Hosted"). The app is static files, so any static host works. [0001](0001-offline-voice.md) requires the voice files to come from our own site, not Hugging Face, before release: a third party shouldn't learn who downloads a voice, and the app shouldn't depend on another service staying up.

Options:

1. **GitHub Pages.** Free for public repositories, deploys from Actions, HTTPS included. Sites can be up to 1 GB, with a soft limit of 100 GB of traffic a month ([GitHub's limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)).
2. **Another static host** (Cloudflare Pages, Netlify). Similar, but another account and another service with access to the site.
3. **Our own server.** The most control, but someone has to run it.

## Decision

1. **GitHub Pages for now**, at `https://tks98.github.io/any-aac/`. [pages.yml](../../../.github/workflows/pages.yml) deploys `main` only after CI has passed on the same commit.
2. **The voices are copied into the site at build time** by `apps/web/scripts/self-host-voices.mjs`, from the pinned Piper release, and each file is checked against the size and hash in `voices.json`. Built with `VITE_SELF_HOST_VOICES=true`, the app downloads voices from its own site. The hosted app makes no requests to any other site.
3. **Self-hosters use the same two commands** (README, "Self-hosting"), with `BASE_PATH` for a sub-path.

## Consequences

- The site is about 340 MB, nearly all voices. A first voice download is about 80 MB (the voice and the speech engine), so the traffic limit allows roughly 1,000 voice downloads a month. If use grows past that, the voices can move to another host by changing `VOICE_BASE` in `catalog.ts`; cached voices move with it.
- Browsers keep each site's data separately. **If the app's address changes** (a custom domain, say), boards saved at the old address stay there, and people need to back up and restore. The long-term address should be settled before encouraging families to rely on it.
- Every project site of one GitHub account shares the `tks98.github.io` origin, and so its storage. No other Pages site should be published from this account while Any AAC is hosted there; a custom domain would give Any AAC an origin of its own.
- GitHub Pages needs the repository to be public (or a paid plan).
