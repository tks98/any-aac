# 0016: Updates install when the app is put away

Status: accepted. 2026-10-12.

## Context

The plan says updates are never applied mid-use ([plan.md §7](../../plan.md#7-quality-bars)), so the service worker waited: a new version installed only when every copy of the app had closed. But browsers keep a new version waiting until no page uses the old one, an open app only looks for a new version when told to, and an app on the Home Screen is rarely closed ([findings/platform.md](../findings/platform.md#updates)). On an iPhone, the fix for silent first words needed two restarts to arrive. Fixes could take a long time to reach the people who need them.

## Options

1. **Install as soon as a version arrives.** Fast, but it reloads the page in front of someone, possibly mid-sentence. Rejected by the plan's principle.
2. **Only an adult installs it**, from a button. Safe, but most people would never press it.
3. **Install it when the app is put away (chosen)**, with a button for adults too.

## Decision

- **The app looks for a new version** whenever it comes back on screen, and every hour while it's open.
- **It installs a waiting version when the app is put away** (another app opened, or the screen locked), only with nothing in the message and nothing being edited, set up, printed or read in the getting-started guide. It waits for saves in progress, then reloads, so the app reopens updated, on its Home board.
- **Edit mode and Settings → About say when an update is ready**, with **Update now**.
- Another copy of the app (another tab) that the new version takes over reloads at its own next safe moment.
- The app registers the service worker itself (`src/lib/updates.svelte.ts`) and reloads on `controllerchange`: vite-plugin-pwa's own reload misses an app installed in the same session ([findings/platform.md](../findings/platform.md#updates)).

## Consequences

- An update reaches someone the next time the app is put away and opened with an empty message, usually the same day.
- The app reopens on Home after an update, not on the board it was on. A message isn't lost: the app only updates with an empty one.
- Copies of the app from before this change still update the old way, once every copy is closed; after that, this way.
- The browser tests check both paths (waiting while there's a message, installing when put away; and Update now) in Chromium and WebKit. Playwright can't serve Firefox a new service worker, so they skip Firefox.
