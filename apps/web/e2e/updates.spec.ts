import { expect, test, type Page } from '@playwright/test';
import { messageBar, openEditor, recordSpeech, word } from './helpers';

/**
 * A new version installs only when it can't interrupt (src/lib/updates.svelte.ts):
 * when the app is put away with nothing in the message. Here the "new version"
 * is the same service worker with a comment added, which browsers treat as an
 * update.
 */
test.use({ serviceWorkers: 'allow' });

async function startWithAnUpdateWaiting(page: Page) {
  await recordSpeech(page);
  let version = 1;
  await page.context().route('**/sw.js', async (route) => {
    const response = await route.fetch();
    const body = `${await response.text()}\n// version ${version}`;
    await route.fulfill({
      response,
      body,
      headers: { ...response.headers(), 'cache-control': 'no-store' },
    });
  });
  await page.goto('/');
  await expect(word(page, 'want')).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  version = 2;
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
  await page.waitForFunction(
    async () => (await navigator.serviceWorker.getRegistration())?.waiting,
  );
  // Marks this page, so a reload shows.
  await page.evaluate(() => Object.assign(window, { notReloaded: true }));
}

async function putAway(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

/** Whether the page has reloaded; while it's reloading, not yet. */
const reloaded = (page: Page) => page.evaluate(() => !('notReloaded' in window)).catch(() => false);

test('a new version waits while there is a message, and installs when the app is put away', async ({
  page,
}) => {
  await startWithAnUpdateWaiting(page);

  await word(page, 'want').click();
  await expect(messageBar(page)).toHaveAccessibleName('Message: want. Tap to speak it.');
  await putAway(page);
  await page.waitForTimeout(1000);
  expect(await reloaded(page)).toBe(false);

  await page.getByRole('button', { name: 'Clear' }).click();
  await putAway(page);
  await expect.poll(() => reloaded(page), { timeout: 10_000 }).toBe(true);
  await expect(word(page, 'want')).toBeVisible();
  expect(
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.waiting),
  ).toBeFalsy();
});

test('edit mode says an update is ready, and installs it at once', async ({ page }) => {
  await startWithAnUpdateWaiting(page);
  await openEditor(page);
  await expect(page.getByText('An update is ready.')).toBeVisible();
  await page.getByRole('button', { name: 'Update now' }).click();
  await expect.poll(() => reloaded(page), { timeout: 10_000 }).toBe(true);
  await expect(word(page, 'want')).toBeVisible();
});
