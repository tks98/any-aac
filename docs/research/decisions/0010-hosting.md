# 0010: Host on GitHub Pages at any-aac.com, behind Cloudflare

Status: accepted. 2026-10-11.

## Context

People need somewhere to open Any AAC before they can install it ([plan.md §5.5](../../plan.md#55-offline-and-self-hosting-modes), "Hosted"). The app is static files, so any static host works. [0001](0001-offline-voice.md) requires the voice files to come from our own site, not Hugging Face, before release: a third party shouldn't learn who downloads a voice, and the app shouldn't depend on another service staying up.

Options:

1. **GitHub Pages.** Free for public repositories, deploys from Actions, HTTPS included. Sites can be up to 1 GB, with a soft limit of 100 GB of traffic a month ([GitHub's limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)).
2. **Another static host** (Cloudflare Pages, Netlify). Similar, but Cloudflare Pages can't serve files over 25 MiB, and each voice is 64 MB.
3. **Our own server.** The most control, but someone has to run it.

## Decision

1. **GitHub Pages, at `https://any-aac.com/`.** [pages.yml](../../../.github/workflows/pages.yml) deploys `main` only after CI has passed on the same commit. The domain is registered at Squarespace and verified on the GitHub account, so no other repository can claim it. The old address, `tks98.github.io/any-aac`, redirects to it.
2. **Cloudflare (Free) in front**, as for opcode-dev.com. It isn't needed for the app to work: Any AAC needs no special headers, and GitHub provides HTTPS. It's there to cache the large files, so GitHub's traffic limit isn't the ceiling, and to count requests without a script in the page. Its settings:
   - SSL/TLS mode **Full** (encrypted to GitHub), and Always Use HTTPS.
   - Nothing that changes pages: Rocket Loader, Email Address Obfuscation, Speed Brain and Early Hints are off, and Real User Monitoring is set to **Disable completely**. Left unconfigured, Cloudflare injects its analytics beacon (static.cloudflareinsights.com) into pages on the Free plan.
   - A cache rule: files under `/voices/`, and `.wasm` and `.data` files (the speech engine), are cached at Cloudflare for 7 days, whatever GitHub's 10-minute cache header says. If a voice file ever changes in place, purge Cloudflare's cache.
   - DNS: GitHub Pages' four addresses for the domain, `www` to `tks98.github.io` (GitHub redirects it), GitHub's verification record, and records saying the domain sends no email (SPF `-all`, DMARC reject).
   - DNSSEC is on: Cloudflare signs the zone, and its DS record (key tag 2371, algorithm 13, digest type 2) is at Squarespace. If DNSSEC is ever turned off or re-keyed in Cloudflare, change the DS record at Squarespace first, or the domain stops resolving for validating resolvers.
3. **The voices are copied into the site at build time** by `apps/web/scripts/self-host-voices.mjs`, from the pinned Piper release, and each file is checked against the size and hash in `voices.json`. Built with `VITE_SELF_HOST_VOICES=true`, the app downloads voices from its own site. The hosted app makes no requests to any other site.
4. **Self-hosters use the same two commands** (README, "Self-hosting"), with `BASE_PATH` for a sub-path.

## Consequences

- The site is about 340 MB, nearly all voices. A first voice download is about 80 MB (the voice and the speech engine), mostly served from Cloudflare's cache.
- Cloudflare, like GitHub, sees requests for the site's files (addresses and which files). Nothing from inside the app reaches either: boards, messages and settings stay on the device.
- Browsers keep each site's data separately. **If the address changes again**, boards saved at the old address stay there, and people need to back up and restore. any-aac.com is meant to be the long-term address.
- GitHub Pages needs the repository to be public (or a paid plan).
