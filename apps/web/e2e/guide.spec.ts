import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { openSettings, recordSpeech, word } from './helpers';

// A first launch on a new device: the guide hasn't been seen.
test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await recordSpeech(page);
  await page.goto('/');
});

const guide = (page: import('@playwright/test').Page) =>
  page.getByRole('dialog', { name: /Talking with the board|hold Edit|The voice|Keeping it ready/ });

test('opens on the first launch, walks through four steps, and stays closed after', async ({
  page,
}) => {
  await expect(guide(page)).toBeVisible();
  await expect(guide(page)).toContainText('Step 1 of 4');
  await expect(guide(page)).toContainText('Speak says the whole message');
  // With a keyboard or switch, the focus stays on Next, which becomes Start.
  await expect(guide(page).getByRole('button', { name: 'Next' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(guide(page)).toHaveAccessibleName('Changing words: hold Edit');
  await page.keyboard.press('Enter');
  await expect(guide(page)).toHaveAccessibleName('The voice');
  await expect(guide(page)).toContainText(/its voice, Linda \(about \d+ MB\)/);
  await guide(page).getByRole('button', { name: 'Back' }).click();
  await expect(guide(page)).toHaveAccessibleName('Changing words: hold Edit');
  await guide(page).getByRole('button', { name: 'Next' }).click();
  await guide(page).getByRole('button', { name: 'Next' }).focus();
  await page.keyboard.press('Enter');
  await expect(guide(page)).toHaveAccessibleName('Keeping it ready');
  await expect(guide(page).getByRole('button', { name: 'Start' })).toBeFocused();
  await expect(page.getByRole('link', { name: 'Read the setup guide' })).toHaveAttribute(
    'href',
    /docs\/setup\.md$/,
  );
  await guide(page).getByRole('button', { name: 'Start' }).click();
  await expect(guide(page)).toBeHidden();
  await expect(word(page, 'want')).toBeVisible();

  await page.reload();
  await expect(word(page, 'want')).toBeVisible();
  await expect(guide(page)).toBeHidden();
});

test('can be skipped, and opened again from Settings', async ({ page }) => {
  await guide(page).getByRole('button', { name: 'Skip' }).click();
  await expect(guide(page)).toBeHidden();

  await openSettings(page, 'About');
  await page.getByRole('button', { name: 'Show the getting started guide' }).click();
  await expect(guide(page)).toHaveAccessibleName('Talking with the board');
  // It opens over the board, not edit mode.
  await expect(page.getByRole('toolbar')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(guide(page)).toBeHidden();
});

test('meets WCAG 2.2 AA', async ({ page }) => {
  for (let step = 1; step <= 4; step++) {
    await expect(guide(page)).toContainText(`Step ${step} of 4`);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => `step ${step}: ${v.id}`)).toEqual([]);
    if (step < 4) await guide(page).getByRole('button', { name: 'Next' }).click();
  }
});
