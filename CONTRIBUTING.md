# Contributing

Thanks for helping. An AAC app is someone's voice, so the bar for reliability, privacy and accessibility is higher than for most software. The principles in [docs/plan.md](docs/plan.md#2-principles-non-negotiable) apply to every change. In short:

- **Speaking always works.** No change may leave someone unable to speak: not offline, not mid-update, not when storage fails.
- **Vocabulary never moves on its own.** Nothing reorders, reflows or "smartly" rearranges buttons. Only an editor moves a button, on purpose.
- **Private by default.** No telemetry, no third-party scripts, and nothing leaves the device unless the user sets it up.
- **Every access method counts.** New features must work by touch, by keyboard and by switch scanning (and by dwell, once it exists).

## Getting set up

See the [README](README.md). Before opening a pull request, run:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e
```

## Releases

Every commit on `main` that passes CI is deployed to [tks98.github.io/any-aac](https://tks98.github.io/any-aac/) ([decision 0010](docs/research/decisions/0010-hosting.md)), so `main` must always be safe to use. People get an update the next time they open the app. Note user-facing changes in [CHANGELOG.md](CHANGELOG.md), and bump the version in the three `package.json` files for a release.

## Content and licensing

- Code contributions are accepted under the [AGPL-3.0-or-later](LICENSE).
- Vocabulary and symbol contributions are accepted under CC BY-SA 4.0 unless noted otherwise. Every image must carry its licence and author in its OBF `license` field.
- Don't copy the layouts or word lists of commercial AAC systems (LAMP, Unity, WordPower, TD Snap Core First, Proloquo2Go and others). Our vocabulary has to be our own.
- Don't add NC-licensed content (ARASAAC, for example) to the default bundle. It can be offered as an optional download.

## Working with AAC users and SLPs

Design changes that affect communicators should be checked with AAC users and speech-language pathologists before they ship. If you use AAC or work in the field and want to advise, please open an issue.
