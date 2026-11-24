import { expect, test, type Page } from '@playwright/test';
import { closeSettings, messageBar, openSettings, recordSpeech, spoken, word } from './helpers';

/** The words (or buttons) under the scanning highlight. */
const highlighted = (page: Page) =>
  page
    .locator('[data-scan-focus]')
    .evaluateAll((elements) =>
      elements.map((e) => (e.getAttribute('aria-label') ?? e.textContent ?? '').trim()),
    );

async function turnOnScanning(page: Page, method: string, extra?: (page: Page) => Promise<void>) {
  await openSettings(page, 'Switch scanning');
  await page.getByRole('switch', { name: 'Switch scanning' }).click();
  await page
    .getByRole('group', { name: 'How the highlight moves' })
    .getByRole('button', { name: method })
    .click();
  // Tests press faster than people; don't drop quick presses.
  await page.getByRole('slider', { name: 'Ignore repeat taps for' }).fill('0');
  await extra?.(page);
  await closeSettings(page);
}

test.beforeEach(async ({ page }) => {
  await recordSpeech(page);
  await page.goto('/');
  await expect(word(page, 'want')).toBeVisible();
});

test('two switches: switch 1 moves through rows, switch 2 goes in and chooses', async ({
  page,
}) => {
  await turnOnScanning(page, 'Two switches');
  await expect.poll(() => highlighted(page)).toEqual([]);

  await page.keyboard.press(' ');
  await expect
    .poll(() => highlighted(page))
    .toEqual(['I', 'want', 'get', 'is', 'more', 'that', 'not', 'People, folder']);
  await page.keyboard.press(' ');
  await expect.poll(async () => (await highlighted(page))[0]).toBe('you');
  await page.keyboard.press('Enter');
  await expect.poll(() => highlighted(page)).toEqual(['you']);
  await page.keyboard.press(' ');
  await expect.poll(() => highlighted(page)).toEqual(['like']);
  await page.keyboard.press('Enter');
  await expect(messageBar(page)).toHaveAccessibleName('Message: like. Tap to speak it.');
  await expect.poll(() => spoken(page)).toEqual(['like']);
});

test('the message bar and buttons are scanned after the board', async ({ page }) => {
  await turnOnScanning(page, 'Two switches');
  await word(page, 'I').click();
  // Six rows, then the message bar.
  for (let i = 0; i < 7; i++) await page.keyboard.press(' ');
  await expect.poll(async () => (await highlighted(page)).at(-1)).toBe('Speak');
  await page.keyboard.press('Enter');
  await page.keyboard.press(' ');
  await page.keyboard.press(' ');
  await page.keyboard.press(' ');
  await expect.poll(() => highlighted(page)).toEqual(['Speak']);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await spoken(page)).at(-1)).toBe('i');

  // Then the navigation buttons, without Edit.
  for (let i = 0; i < 8; i++) await page.keyboard.press(' ');
  const nav = await highlighted(page);
  expect(nav).toContain('Help');
  expect(nav.some((label) => label.startsWith('Edit'))).toBe(false);
});

test('by itself: the highlight moves on its own, and any switch chooses', async ({ page }) => {
  await turnOnScanning(page, 'By itself', async (page) => {
    await page.getByRole('slider', { name: 'Time on each item' }).fill('1200');
    await page.getByRole('slider', { name: 'Extra time on the first item' }).fill('0');
  });
  await page.keyboard.press(' ');
  await expect
    .poll(async () => (await highlighted(page))[0], { timeout: 3000, intervals: [50] })
    .toBe('you');
  await page.keyboard.press(' ');
  await expect.poll(() => highlighted(page)).toEqual(['you']);
  await page.keyboard.press(' ');
  await expect(messageBar(page)).toHaveAccessibleName('Message: you. Tap to speak it.');
});

test('word forms are scanned in their dialog', async ({ page }) => {
  await turnOnScanning(page, 'Two switches');
  await word(page, 'want').click();
  await page.getByRole('button', { name: 'Word forms' }).click();
  await page.keyboard.press(' ');
  await expect.poll(() => highlighted(page)).toEqual(['Cancel']);
  await page.keyboard.press(' ');
  await page.keyboard.press(' ');
  await expect.poll(() => highlighted(page)).toEqual(['wants']);
  await page.keyboard.press('Enter');
  await expect(messageBar(page)).toHaveAccessibleName('Message: wants. Tap to speak it.');
});

test('tap anywhere: a tap is a switch press, and holding the screen opens edit mode', async ({
  page,
}) => {
  await turnOnScanning(page, 'Two switches', async (page) => {
    await page.getByRole('switch', { name: 'Tap anywhere' }).click();
  });
  await page.mouse.click(600, 400);
  await expect.poll(() => highlighted(page)).not.toEqual([]);
  // The tap didn't press the word underneath.
  await expect(messageBar(page)).toHaveAccessibleName('Message is empty');

  await page.mouse.move(600, 400);
  await page.mouse.down();
  await page.waitForTimeout(3300);
  await page.mouse.up();
  await expect(page.getByRole('toolbar')).toBeVisible();
});

test('mouse switch: a quick press that opens a dialog does not open edit mode, and the dialog takes switch presses', async ({
  page,
}) => {
  await word(page, 'want').click();
  await turnOnScanning(page, 'Two switches', async (page) => {
    await page.getByRole('switch', { name: 'Tap anywhere' }).click();
  });
  // Get the highlight to Word forms with the keyboard switches.
  await page.keyboard.press(' ');
  for (let i = 0; i < 20 && !(await highlighted(page)).includes('Word forms'); i++)
    await page.keyboard.press(' ');
  await page.keyboard.press('Enter');
  for (let i = 0; i < 20 && (await highlighted(page)).join() !== 'Word forms'; i++)
    await page.keyboard.press(' ');
  expect(await highlighted(page)).toEqual(['Word forms']);

  // A quick right click (switch 2) chooses it, and the dialog opens over the layer.
  await page.mouse.move(600, 400);
  await page.mouse.down({ button: 'right' });
  await page.mouse.up({ button: 'right' });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(3300);
  await expect(page.getByRole('toolbar')).toBeHidden();

  // Clicks on the dialog are switch presses too, not a direct choice of what's under them.
  // Choosing in the dialog starts the highlight on its first button.
  await expect.poll(() => highlighted(page)).toEqual(['Cancel']);
  const cancel = (await dialog.getByRole('button', { name: 'Cancel' }).boundingBox())!;
  // A left click right on Cancel moves the highlight on instead of closing the dialog.
  await page.mouse.click(cancel.x + cancel.width / 2, cancel.y + cancel.height / 2);
  await expect.poll(() => highlighted(page)).toEqual(['want']);
  await page.mouse.click(cancel.x + cancel.width / 2, cancel.y + cancel.height / 2);
  await expect.poll(() => highlighted(page)).toEqual(['wants']);
  await expect(dialog).toBeVisible();
  const chosen = 'wants';
  await page.mouse.click(600, 400, { button: 'right' });
  await expect(dialog).toBeHidden();
  await expect(messageBar(page)).toHaveAccessibleName(`Message: ${chosen}. Tap to speak it.`);
});

test('while held: leaving the app lets go of a held tap, so the highlight stops moving', async ({
  page,
}) => {
  await turnOnScanning(page, 'While held', async (page) => {
    await page.getByRole('switch', { name: 'Tap anywhere' }).click();
    await page.getByRole('slider', { name: 'Time on each item' }).fill('600');
  });
  await page.mouse.move(600, 400);
  await page.mouse.down();
  await expect.poll(() => highlighted(page)).not.toEqual([]);
  // The window loses focus (another app, a notification) before the finger lifts,
  // so no pointerup arrives: that's a let-go, which chooses the row highlighted.
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect.poll(async () => (await highlighted(page)).length).toBe(1);
  const chosen = await highlighted(page);
  await page.waitForTimeout(1500);
  // Not still held: the highlight stays where it was let go.
  expect(await highlighted(page)).toEqual(chosen);
  await page.mouse.up();
  await expect(page.getByRole('toolbar')).toBeHidden();
});
