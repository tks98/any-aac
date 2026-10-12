import { expect, test, type Page } from '@playwright/test';
import { closeSettings, openSettings, recordSpeech, spoken, word } from './helpers';

/** The starter boards come in three sizes (docs/research/decisions/0015-three-sizes.md). */

test.beforeEach(async ({ page }) => {
  await recordSpeech(page);
  await page.goto('/');
  await expect(word(page, 'want')).toBeVisible();
});

async function startOver(page: Page, size: string) {
  await openSettings(page, 'Boards & backup');
  await page
    .getByRole('group', { name: 'Size of the starter boards' })
    .getByRole('button', { name: size })
    .click();
  page.on('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Start over with the English starter boards' }).click();
  await expect(page.getByRole('dialog').getByRole('status')).toBeVisible();
  await closeSettings(page);
}

test('the large boards add words and an Animals topic, and the size is kept', async ({ page }) => {
  await startOver(page, 'Large (84)');
  await expect(word(page, 'think')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Animals, folder' })).toBeVisible();
  await page.getByRole('button', { name: 'Animals, folder' }).click();
  await word(page, 'dog').click();
  await expect.poll(() => spoken(page)).toEqual(['dog']);

  // The size is kept.
  await page.reload();
  await expect(word(page, 'think')).toBeVisible();
});

test('the small boards have the biggest buttons, and the other words one folder away', async ({
  page,
}) => {
  const before = await word(page, 'want').boundingBox();
  await startOver(page, 'Small (24)');
  const after = await word(page, 'want').boundingBox();
  expect(after!.width * after!.height).toBeGreaterThan(before!.width * before!.height * 1.5);
  await expect(word(page, 'like')).toBeHidden();

  await page.getByRole('button', { name: 'More words, folder' }).click();
  await word(page, 'like').click();
  await expect.poll(() => spoken(page)).toEqual(['like']);
  await page.getByRole('button', { name: 'Places, folder' }).click();
  await expect(word(page, 'bathroom')).toBeVisible();
});
