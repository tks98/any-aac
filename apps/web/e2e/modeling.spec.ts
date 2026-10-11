import { expect, test, type Page } from '@playwright/test';
import { messageBar, openEditor, recordSpeech, spoken, word } from './helpers';

async function openModeling(page: Page) {
  await openEditor(page);
  await page.getByRole('toolbar').getByRole('button', { name: 'Model' }).click();
  await expect(page.getByText("Taps are said, but aren't added to the message.")).toBeVisible();
}

const path = (page: Page) => page.getByRole('complementary');
/** The cell badged as the next step. */
const nextCell = (page: Page) => page.locator('.slot.next button.cell');

test.beforeEach(async ({ page }) => {
  await recordSpeech(page);
  await page.goto('/');
  await expect(word(page, 'want')).toBeVisible();
});

test('find word shows the path one step at a time, and modeled words stay out of the message', async ({
  page,
}) => {
  await openModeling(page);
  await page.getByRole('searchbox', { name: 'Find a word' }).fill('apple');
  await expect(path(page)).toContainText('Open Food');
  await expect(path(page)).toContainText('Tap apple');
  await expect(nextCell(page)).toHaveAccessibleName('Food, folder');

  await nextCell(page).click();
  await expect(nextCell(page)).toHaveAccessibleName('apple');
  await nextCell(page).click();
  expect((await spoken(page)).at(-1)).toBe('apple');
  await expect(path(page)).toContainText('Done');

  await path(page).getByRole('button', { name: 'Start over' }).click();
  await expect(nextCell(page)).toHaveAccessibleName('Food, folder');
  await path(page).getByRole('button', { name: 'Say it' }).click();
  expect((await spoken(page)).at(-1)).toBe('apple');

  // Words the partner models are said, but never become the person's message.
  await page.getByRole('button', { name: 'Exit' }).click();
  await expect(messageBar(page)).toHaveAccessibleName('Message is empty');
});

test('offers other matches, and says when nothing matches', async ({ page }) => {
  await openModeling(page);
  await page.getByRole('searchbox', { name: 'Find a word' }).fill('zebra');
  await expect(path(page)).toContainText('No word on these boards matches “zebra”.');
  await page.getByRole('searchbox', { name: 'Find a word' }).fill('d');
  await path(page).getByRole('button', { name: 'Dad' }).click();
  await expect(path(page)).toContainText('Open People');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('paths follow the phone layout', async ({ page }) => {
    await openModeling(page);
    await page.getByRole('searchbox', { name: 'Find a word' }).fill('happy');
    await expect(nextCell(page)).toHaveAccessibleName('Feelings, folder');
    await nextCell(page).tap();
    await expect(nextCell(page)).toHaveAccessibleName('happy');
  });
});
