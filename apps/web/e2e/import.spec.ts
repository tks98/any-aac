import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { expect, test, type Page } from '@playwright/test';
import { closeSettings, openSettings, recordSpeech, spoken, VOICE_FILES, word } from './helpers';

/** Files made by other apps' own exporters (packages/core/test/fixtures/real-exports). */
const fixture = (path: string) =>
  readFileSync(
    new URL(`../../../packages/core/test/fixtures/real-exports/${path}`, import.meta.url),
  );

test.beforeEach(async ({ page }) => {
  await recordSpeech(page);
  await page.goto('/');
  await expect(word(page, 'want')).toBeVisible();
});

async function importFile(page: Page, name: string, buffer: Buffer) {
  await openSettings(page, 'Boards & backup');
  page.on('dialog', (dialog) => dialog.accept());
  await page
    .getByLabel('Import boards or a backup')
    .setInputFiles({ name, mimeType: 'application/octet-stream', buffer });
}
const status = (page: Page) => page.getByRole('dialog').getByRole('status');

test('a board exported from Cboard imports with its pictures, and speaks', async ({ page }) => {
  await importFile(
    page,
    'Cboard Classic Home.obf',
    gunzipSync(fixture('cboard/classic-home.obf.gz')),
  );
  await expect(status(page)).toHaveText('Imported 1 board.');
  await closeSettings(page);

  await expect(word(page, 'quick chat').locator('img')).toHaveAttribute(
    'src',
    /^data:image\/svg\+xml/,
  );
  await word(page, 'yes').click();
  await expect.poll(() => spoken(page)).toEqual(['yes']);
});

test("Cboard's empty export says it has no boards", async ({ page }) => {
  await importFile(page, 'boards.obz', fixture('cboard/empty-all-boards.obz'));
  await expect(status(page)).toHaveText('There are no boards in this file.');
});

test('a CoughDrop set gets linked Mulberry pictures from the library, and nothing from other sites', async ({
  page,
  baseURL,
}) => {
  const elsewhere: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/^(data|blob):/.test(url) || VOICE_FILES.test(url)) return;
    if (new URL(url).origin !== new URL(baseURL!).origin) elsewhere.push(url);
  });

  await importFile(page, 'deep_simple.zip', fixture('coughdrop/deep_simple.zip'));
  await expect(status(page)).toContainText('Imported 98 boards.');
  await expect(status(page)).toContainText(/\d+ buttons’ pictures are on other websites/);
  await page.getByText(/fixed while importing/).click();
  await expect(
    page.getByText(/pictures linked to Mulberry symbols online now come from/),
  ).toBeVisible();
  await closeSettings(page);

  // "hello" links to a Mulberry symbol: now a file from the library.
  await expect(word(page, 'hello').locator('img')).toHaveAttribute('src', /^blob:/);
  // "want" links to ARASAAC, which isn't loaded: the button shows its word.
  await expect(word(page, 'want')).toBeVisible();
  await expect(word(page, 'want').locator('img')).toHaveCount(0);
  await page.getByRole('button', { name: 'Food, folder' }).click();
  await expect(page.getByRole('button', { name: /, folder$/ }).first()).toBeVisible();

  // The boards were saved with the pictures in them.
  await page.reload();
  await expect(word(page, 'hello').locator('img')).toHaveAttribute('src', /^blob:/);
  expect(elsewhere).toEqual([]);
});
