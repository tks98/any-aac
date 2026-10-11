import { expect, test, type Page } from '@playwright/test';
import { messageBar, openEditor, recordSpeech, spoken, word } from './helpers';

async function openSettingsFromEditor(page: Page, section: string) {
  await page.getByRole('toolbar').getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: section }).click();
}

const panel = (page: Page) => page.getByRole('complementary', { name: 'Button settings' });
const done = (page: Page) => page.getByRole('button', { name: 'Done', exact: true }).click();

test.beforeEach(async ({ page }) => {
  await recordSpeech(page);
  await page.goto('/');
  await expect(word(page, 'want')).toBeVisible();
});

test('changes a word, and the change is spoken, saved and can be undone', async ({ page }) => {
  await openEditor(page);
  // In edit mode a tap selects; it doesn't speak.
  await word(page, 'want').click();
  expect(await spoken(page)).toEqual([]);
  await panel(page).getByLabel('Label in English').fill('need');
  await panel(page).getByLabel('Label in English').press('Enter');
  await expect(word(page, 'need')).toBeVisible();

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(word(page, 'want')).toBeVisible();
  await page.getByRole('button', { name: 'Redo' }).click();
  await done(page);

  await word(page, 'need').click();
  await expect(messageBar(page)).toHaveAccessibleName('Message: need. Tap to speak it.');
  expect(await spoken(page)).toEqual(['need']);

  await page.reload();
  await expect(word(page, 'need')).toBeVisible();
});

test('adds a word with a symbol from the library, on the tablet and phone layouts', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'People, folder' }).click();
  await openEditor(page);
  await page
    .getByRole('button', { name: /^Empty cell/ })
    .first()
    .click();
  await panel(page).getByLabel('Label in English').fill('Grandma');
  await panel(page).getByRole('button', { name: 'Add a button' }).click();
  await expect(word(page, 'Grandma')).toBeVisible();

  await panel(page).getByRole('button', { name: 'Find a symbol' }).click();
  const search = page.getByRole('searchbox', { name: 'Search symbols' });
  await expect(search).toHaveValue('Grandma');
  await search.fill('grandmother');
  await page.getByRole('button', { name: 'Use the symbol “grandmother”' }).click();
  await expect(word(page, 'Grandma').locator('img')).toBeVisible();

  await panel(page).getByRole('button', { name: 'Noun', exact: true }).click();
  await done(page);
  await word(page, 'Grandma').click();
  await expect(messageBar(page)).toHaveAccessibleName('Message: Grandma. Tap to speak it.');

  // The phone layout of the board gets the word too.
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(word(page, 'Grandma')).toBeVisible();
  await expect(word(page, 'Grandma').locator('img')).toBeVisible();
});

test('a photo from the device can be a symbol', async ({ page }) => {
  await openEditor(page);
  await word(page, 'I').click();
  // A tiny red PNG stands in for a photo.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEklEQVR4nGP4z8DAwMDAwMDAAAAYAAH/AZz8xgAAAABJRU5ErkJggg==',
    'base64',
  );
  await panel(page)
    .getByLabel('Photo')
    .setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: png });
  await expect.poll(() => word(page, 'I').locator('img').getAttribute('src')).toMatch(/^blob:/);
});

test('words locked in place cannot be swapped; others can', async ({ page }) => {
  await openEditor(page);
  await page.getByRole('button', { name: 'Swap' }).click();
  await word(page, 'want').click();
  await expect(page.getByRole('status')).toHaveText(
    '“want” is locked in place. Unlock its position first.',
  );

  await page.getByRole('button', { name: 'Swap' }).click();
  await word(page, 'want').click();
  await panel(page).getByRole('switch', { name: 'Lock position' }).click();
  await word(page, 'more').click();
  await panel(page).getByRole('switch', { name: 'Lock position' }).click();
  const wantAt = await word(page, 'want').boundingBox();
  const moreAt = await word(page, 'more').boundingBox();

  await page.getByRole('button', { name: 'Swap' }).click();
  await word(page, 'want').click();
  await expect(page.getByRole('status')).toHaveText('Now tap where “want” should go.');
  await word(page, 'more').click();
  expect(await word(page, 'want').boundingBox()).toEqual(moreAt);
  expect(await word(page, 'more').boundingBox()).toEqual(wantAt);
});

test('hidden words keep their place and come back', async ({ page }) => {
  const wantAt = await word(page, 'want').boundingBox();
  await openEditor(page);
  await word(page, 'want').click();
  await panel(page).getByRole('switch', { name: 'Visible to communicator' }).click();
  await expect(page.getByRole('button', { name: 'want, hidden' })).toBeVisible();
  await done(page);
  await expect(word(page, 'want')).toHaveCount(0);

  await openEditor(page);
  await page.getByRole('button', { name: 'want, hidden' }).click();
  await panel(page).getByRole('switch', { name: 'Visible to communicator' }).click();
  await done(page);
  expect(await word(page, 'want').boundingBox()).toEqual(wantAt);
});

test('a button can open a new board, which is then filled in', async ({ page }) => {
  await page.getByRole('button', { name: 'Things, folder' }).click();
  await openEditor(page);
  await page
    .getByRole('button', { name: /^Empty cell/ })
    .first()
    .click();
  await panel(page).getByLabel('Label in English').fill('Animals');
  await panel(page).getByRole('button', { name: 'Add a button' }).click();
  await panel(page).getByRole('combobox').selectOption({ label: 'New board…' });
  await panel(page).getByLabel('Name of the new board').fill('Animals');
  await panel(page).getByRole('button', { name: 'New board' }).click();

  await expect(page.getByRole('heading', { name: 'Editing Animals' })).toBeVisible();
  await page
    .getByRole('button', { name: /^Empty cell/ })
    .first()
    .click();
  await panel(page).getByLabel('Label in English').fill('dog');
  await panel(page).getByRole('button', { name: 'Add a button' }).click();
  await done(page);

  await expect(word(page, 'dog')).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Animals, folder' }).click();
  await word(page, 'dog').click();
  await expect(messageBar(page)).toHaveAccessibleName('Message: dog. Tap to speak it.');
});

test('copies a word and pastes it into an empty cell, then deletes it', async ({ page }) => {
  await page.getByRole('button', { name: 'Food, folder' }).click();
  await openEditor(page);
  await word(page, 'apple').click();
  await panel(page).getByRole('button', { name: 'Copy' }).click();
  await page
    .getByRole('button', { name: /^Empty cell/ })
    .first()
    .click();
  await panel(page).getByRole('button', { name: 'Paste “apple”' }).click();
  await expect(word(page, 'apple')).toHaveCount(2);

  await panel(page).getByRole('switch', { name: 'Lock position' }).click();
  await panel(page).getByRole('button', { name: 'Delete button' }).click();
  await expect(word(page, 'apple')).toHaveCount(1);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('button settings open over the board, and close back to it', async ({ page }) => {
    await openEditor(page);
    await expect(panel(page)).toBeHidden();
    await word(page, 'want').tap();
    await expect(panel(page)).toBeVisible();
    await panel(page).getByLabel('Label in English').fill('need');
    await panel(page).getByLabel('Label in English').press('Enter');
    await panel(page).getByRole('button', { name: 'Back to the board' }).tap();
    await expect(panel(page)).toBeHidden();
    await expect(word(page, 'need')).toBeVisible();
  });
});

test('prints this board or all boards, one per page', async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => Object.assign(window, { printed: true });
  });
  await page.reload();
  await openEditor(page);
  await page.getByRole('button', { name: 'Print' }).click();
  await page.getByRole('button', { name: 'All boards (7)' }).click();
  await page.waitForFunction(() => (window as unknown as { printed?: boolean }).printed);
  await page.emulateMedia({ media: 'print' });
  const pages = page.locator('.print .page');
  await expect(pages).toHaveCount(7);
  await expect(pages.first().getByRole('heading')).toHaveText('Core words');
  await expect(page.locator('.screen > *').first()).toBeHidden();
  // Printing ends when the print window closes.
  await page.evaluate(() => dispatchEvent(new Event('afterprint')));
  await page.emulateMedia({ media: 'screen' });
  await expect(pages).toHaveCount(0);
});

test('backs up boards and settings, reminds when due, and restores both', async ({ page }) => {
  // Edit a word: edit mode now reminds that the boards aren't backed up.
  await openEditor(page);
  await word(page, 'want').click();
  await panel(page).getByLabel('Label in English').fill('need');
  await panel(page).getByLabel('Label in English').press('Enter');
  await expect(page.getByText('The boards have changed since the last backup.')).toBeVisible();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Back up now' }).click();
  const backup = await downloading;
  expect(backup.suggestedFilename()).toMatch(/^open-aac-backup-\d{4}-\d{2}-\d{2}\.obz$/);
  await expect(page.getByText('The boards have changed since the last backup.')).toBeHidden();

  // Change a word and a setting after the backup…
  await word(page, 'need').click();
  await panel(page).getByLabel('Label in English').fill('wish');
  await panel(page).getByLabel('Label in English').press('Enter');
  await openSettingsFromEditor(page, 'Speech & voice');
  await page.getByRole('switch', { name: 'Speak each word when tapped' }).click();

  // …then restore the backup: both come back.
  await page.getByRole('button', { name: 'Boards & backup' }).click();
  await expect(page.getByText(/one file\.\s+Last backup: /)).toBeVisible();
  page.on('dialog', (dialog) => dialog.accept());
  await page.getByLabel('Import boards or a backup').setInputFiles(await backup.path());
  await expect(page.getByRole('dialog').getByRole('status')).toHaveText(
    'Imported 14 boards. Settings restored.',
  );
  await page.getByRole('button', { name: 'Speech & voice' }).click();
  await expect(page.getByRole('switch', { name: 'Speak each word when tapped' })).toBeChecked();
  await page.getByRole('dialog').getByRole('button', { name: 'Done', exact: true }).click();
  await done(page);
  await expect(word(page, 'need')).toBeVisible();
});
