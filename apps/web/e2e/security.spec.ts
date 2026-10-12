import { expect, test, type Page } from '@playwright/test';
import { closeSettings, openEditor, recordSpeech, VOICE_FILES, word } from './helpers';

/**
 * Any AAC contacts no other site, and its security policy makes the browser
 * enforce that (security-headers.ts). The preview server sends the headers
 * any-aac.com sends, and every built page carries the policy too.
 */

/** Collects what the security policy refuses, from the first script on. */
async function recordViolations(page: Page) {
  await page.addInitScript(() => {
    const violations: string[] = [];
    Object.assign(window, { violations });
    document.addEventListener('securitypolicyviolation', (event) =>
      violations.push(`${event.effectiveDirective}: ${event.blockedURI}`),
    );
  });
}
const violations = (page: Page) =>
  page.evaluate(() => (window as unknown as { violations: string[] }).violations);

test('speaking and editing contact no other site and break no rule of the policy', async ({
  page,
  baseURL,
}) => {
  await recordSpeech(page);
  await recordViolations(page);
  const elsewhere: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    // Development builds get voices from Hugging Face; recordSpeech blocks them.
    if (/^(blob|data):/.test(url) || VOICE_FILES.test(url)) return;
    if (new URL(url).origin !== new URL(baseURL!).origin) elsewhere.push(url);
  });

  await page.goto('/');
  await word(page, 'want').click();
  await page.getByRole('button', { name: 'Speak', exact: true }).click();
  await page.getByRole('button', { name: 'People, folder' }).click();

  // A symbol from the library, and a photo, which is shown from a blob: URL.
  await openEditor(page);
  const panel = page.getByRole('complementary', { name: 'Button settings' });
  await page
    .getByRole('button', { name: /^Empty cell/ })
    .first()
    .click();
  await panel.getByLabel('Label in English').fill('Grandma');
  await panel.getByRole('button', { name: 'Add a button' }).click();
  await panel.getByRole('button', { name: 'Find a symbol' }).click();
  await page.getByRole('searchbox', { name: 'Search symbols' }).fill('grandmother');
  await page.getByRole('button', { name: 'Use the symbol “grandmother”' }).click();
  await expect(word(page, 'Grandma').locator('img')).toBeVisible();
  await word(page, 'I').click();
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEklEQVR4nGP4z8DAwMDAwMDAAAAYAAH/AZz8xgAAAABJRU5ErkJggg==',
    'base64',
  );
  await panel
    .getByLabel('Photo')
    .setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: png });
  await expect.poll(() => word(page, 'I').locator('img').getAttribute('src')).toMatch(/^blob:/);

  await page.getByRole('toolbar').getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  await closeSettings(page);

  expect(await violations(page)).toEqual([]);
  expect(elsewhere).toEqual([]);
});

test('a script from another site is refused', async ({ page }) => {
  await recordViolations(page);
  let fetched = false;
  // The analytics script Cloudflare can add to pages it serves.
  await page.route('https://static.cloudflareinsights.com/**', (route) => {
    fetched = true;
    return route.fulfill({ contentType: 'text/javascript', body: 'window.injected = true;' });
  });
  await page.goto('/');
  await expect(word(page, 'want')).toBeVisible();
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    document.head.append(script);
  });
  // Refused by the page's policy and the server's alike.
  await expect
    .poll(() => violations(page))
    .toContain('script-src-elem: https://static.cloudflareinsights.com/beacon.min.js');
  expect(fetched).toBe(false);
  expect(await page.evaluate(() => 'injected' in window)).toBe(false);
});

test('the page carries the policy before any script, and the server sends the headers', async ({
  request,
}) => {
  const response = await request.get('/');
  const html = await response.text();
  const policy = html.indexOf('http-equiv="Content-Security-Policy"');
  expect(policy).toBeGreaterThan(-1);
  expect(policy).toBeLessThan(html.indexOf('<script'));

  const headers = response.headers();
  expect(headers['content-security-policy']).toContain("default-src 'self'");
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('no-referrer');
});
