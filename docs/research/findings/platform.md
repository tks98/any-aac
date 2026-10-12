# Findings: the browser platform

How browsers update an installed web app and enforce a security policy, and what that means for an app someone relies on to speak. Background: [foundations.md §4.4](../foundations.md#44-running-offline-and-where-data-lives).

## Updates

- **A new version waits until no page uses the old one.** An updated service worker "will wait until the existing worker is controlling zero clients", and refreshing a page isn't enough to let it take over ([web.dev: the service worker lifecycle](https://web.dev/articles/service-worker-lifecycle)).
- **An open app rarely looks for a new version.** Browsers check when the site is navigated to, on some background events at most once a day, and when the page asks (`registration.update()`); registering the same worker again doesn't check ([web.dev](https://web.dev/articles/service-worker-lifecycle)).
- **An app on the Home Screen is rarely fully closed.** On an iPhone, a fix only arrived after the app had been closed and opened twice (2026-10-11).
- **vite-plugin-pwa's prompt mode only reloads a page that started under an older version.** Its reload waits for workbox-window's `controlling` event with `isUpdate`, which is false for a page that installed the app's first version in the same session (vite-plugin-pwa 2.0.0, `client/build/register.js`); our browser test found it.
- **Playwright can't serve Firefox a changed service worker.** Its service-worker support is for Chromium ([Playwright](https://playwright.dev/docs/service-workers)), and a route for the worker's script is never called in Firefox ([microsoft/playwright#38642](https://github.com/microsoft/playwright/issues/38642)).

**What we do:** the app looks for a new version whenever it comes back on screen and every hour, installs it when it's put away with nothing in the message and nothing being edited, and reloads on `controllerchange` itself; edit mode and Settings offer **Update now** ([0016](../decisions/0016-updates-when-put-away.md)). The update tests run in Chromium and WebKit.

## Security policy

- **A policy in the page can't stop framing.** `frame-ancestors` (like `report-uri` and `sandbox`) is ignored in a `<meta>` policy; it has to be a header ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)).
- **Workers follow their own headers, not the page's policy.** A dedicated worker takes its policy from the response that delivered its script; only `blob:` and `data:` workers inherit the page's ([Chromium](https://chromium.googlesource.com/chromium/src/+/f7c475b89dc0281b63133497efefa6b6cc007c64), [WebKit](https://bugs.webkit.org/show_bug.cgi?id=153157)). So a `<meta>` policy doesn't cover the worker that runs the voice.
- **WebAssembly needs `'wasm-unsafe-eval'`** under a `script-src` policy: Safari from 16, Chrome from 97, Firefox from 102 (MDN's compatibility data, [mirrored](https://docs.w3cub.com/http/headers/content-security-policy/script-src)). Before Safari 16, WebAssembly needed `'unsafe-eval'` ([WebKit](https://bugs.webkit.org/show_bug.cgi?id=197759)). Checked 2026-10-12: the voice loads and speaks under our policy, as a page policy and as headers, in Chromium and WebKit.
- **A host can add scripts to pages.** Cloudflare's Free plan adds its analytics beacon unless Real User Monitoring is turned off ([0010](../decisions/0010-hosting.md)).

**What we do:** every page carries a policy that allows scripts, styles, fonts and requests only from the app's own site; any-aac.com also sends it as a header, with `frame-ancestors 'none'` and others, from Cloudflare; and the browser tests run under the same headers and check that an injected script is refused ([0010](../decisions/0010-hosting.md), `apps/web/security-headers.ts`).
