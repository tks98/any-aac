import { expect, test, type Page } from '@playwright/test';

const word = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const messageBar = (page: Page) => page.getByRole('button', { name: /^Message/ });

async function holdOn(page: Page, name: string | RegExp, ms: number) {
  await page.getByRole('button', { name, exact: typeof name === 'string' }).hover();
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

async function openSettings(page: Page, section?: string) {
  await holdOn(page, /^Edit boards/, 1200);
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  if (section) await page.getByRole('button', { name: section }).click();
}

/** Replaces the browser voice with a recorder, so tests can see what would be said. */
async function recordSpeech(page: Page) {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    Object.assign(window, { spoken });
    if (!('SpeechSynthesisUtterance' in window)) {
      Object.assign(window, {
        SpeechSynthesisUtterance: class {
          constructor(public text: string) {}
        },
      });
    }
    const fake = {
      speak: (utterance: { text: string }) => spoken.push(utterance.text),
      cancel() {},
      getVoices: () => [],
      addEventListener() {},
      removeEventListener() {},
    };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  });
}

const spoken = (page: Page) =>
  page.evaluate(() => (window as unknown as { spoken: string[] }).spoken);

test.beforeEach(async ({ page }) => {
  await recordSpeech(page);
  await page.goto('/');
  await expect(word(page, 'want')).toBeVisible();
});

test('builds, edits and clears a message', async ({ page }) => {
  await word(page, 'I').click();
  await word(page, 'want').click();
  await word(page, 'more').click();
  await expect(messageBar(page)).toHaveAccessibleName('Message: I want more. Tap to speak it.');

  await page.getByRole('button', { name: 'Delete last word' }).click();
  await expect(messageBar(page)).toHaveAccessibleName('Message: I want. Tap to speak it.');

  await page.getByRole('button', { name: 'Clear message' }).click();
  await expect(messageBar(page)).toHaveAccessibleName('Message is empty');
});

test('opens a folder, keeps core words in place, and comes back', async ({ page }) => {
  const wantBefore = await word(page, 'want').boundingBox();
  await page.getByRole('button', { name: 'Food, folder' }).click();
  await expect(word(page, 'apple')).toBeVisible();
  await expect(page.getByText('Core words  ›  Food')).toBeVisible();

  // Core words keep their exact position on topic boards.
  expect(await word(page, 'want').boundingBox()).toEqual(wantBefore);

  await word(page, 'apple').click();
  await expect(messageBar(page)).toHaveAccessibleName('Message: apple. Tap to speak it.');

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('button', { name: 'Food, folder' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back' })).toBeDisabled();
});

test('editing needs a press and hold, not a tap', async ({ page }) => {
  await page.getByRole('button', { name: /^Edit boards/ }).click();
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeHidden();
  await openSettings(page);
});

test('exports boards and imports them back', async ({ page }) => {
  await openSettings(page, 'Boards & backup');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export all boards' }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^open-aac-boards-\d{4}-\d{2}-\d{2}\.obz$/);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByLabel('Import boards').setInputFiles(await download.path());
  await expect(page.getByRole('status')).toHaveText('Imported 10 boards.');

  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await word(page, 'go').click();
  await expect(messageBar(page)).toHaveAccessibleName('Message: go. Tap to speak it.');
});

/**
 * Every word button sits fully on screen between the message bar and the bottom,
 * and its symbol and at least one full line of its label show inside it.
 */
async function expectBoardFits(page: Page) {
  const bar = await messageBar(page).boundingBox();
  const viewport = page.viewportSize();
  const cells = await page.locator('button.cell').evaluateAll((els) =>
    els.map((el) => {
      const box = el.getBoundingClientRect();
      const label = el.querySelector('.label') as HTMLElement;
      const labelBox = label.getBoundingClientRect();
      const img = el.querySelector('img')?.getBoundingClientRect();
      return {
        name: label.textContent,
        top: box.top,
        bottom: box.bottom,
        imageTop: img?.top ?? box.top,
        labelBottom: labelBox.bottom,
        labelHeight: labelBox.height,
        fontSize: parseFloat(getComputedStyle(label).fontSize),
      };
    }),
  );
  expect(cells.length).toBeGreaterThan(0);
  for (const cell of cells) {
    expect(cell.top, cell.name ?? '').toBeGreaterThanOrEqual(bar!.y + bar!.height);
    expect(cell.bottom, cell.name ?? '').toBeLessThanOrEqual(viewport!.height);
    expect(cell.imageTop, cell.name ?? '').toBeGreaterThanOrEqual(cell.top);
    expect(cell.labelBottom, cell.name ?? '').toBeLessThanOrEqual(cell.bottom);
    expect(cell.labelHeight, cell.name ?? '').toBeGreaterThanOrEqual(cell.fontSize);
  }
}

test('the board fits on screen', async ({ page }) => {
  await expectBoardFits(page);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('shows the 24-word phone board, and it fits', async ({ page }) => {
    await expect(page.locator('button.cell')).toHaveCount(24);
    await expect(word(page, 'is')).toHaveCount(0);
    await expectBoardFits(page);
  });

  test('topic boards use the phone layout and keep core words in place', async ({ page }) => {
    const wantBefore = await word(page, 'want').boundingBox();
    await page.getByRole('button', { name: 'Food, folder' }).tap();
    await expect(word(page, 'apple')).toBeVisible();
    expect(await word(page, 'want').boundingBox()).toEqual(wantBefore);
    await expectBoardFits(page);

    await word(page, 'apple').tap();
    await expect(messageBar(page)).toHaveAccessibleName('Message: apple. Tap to speak it.');
  });
});

test('keeps working offline after the first visit', async ({ page, context, browserName }) => {
  test.skip(
    browserName !== 'chromium',
    'Offline emulation with service workers is Chromium-only in Playwright.',
  );
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await word(page, 'I').click();
  await expect(messageBar(page)).toHaveAccessibleName('Message: I. Tap to speak it.');
});

test('speaks each word, unless that is turned off', async ({ page }) => {
  await word(page, 'I').click();
  expect(await spoken(page)).toEqual(['I']);

  await openSettings(page, 'Speech & voice');
  await page.getByRole('switch', { name: 'Speak each word when tapped' }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();

  await word(page, 'want').click();
  expect(await spoken(page)).toEqual(['I']);
  await page.getByRole('button', { name: 'Speak', exact: true }).click();
  expect(await spoken(page)).toEqual(['I', 'I want']);
});

test('hold to select: a quick tap does nothing, a long press chooses', async ({ page }) => {
  await openSettings(page, 'Touch');
  await page.getByRole('slider', { name: 'Hold to select' }).fill('600');
  await page.getByRole('button', { name: 'Done', exact: true }).click();

  await word(page, 'want').click();
  await expect(messageBar(page)).toHaveAccessibleName('Message is empty');
  await holdOn(page, 'want', 900);
  await expect(messageBar(page)).toHaveAccessibleName('Message: want. Tap to speak it.');

  // Settings survive a reload.
  await page.reload();
  await openSettings(page, 'Touch');
  await expect(page.getByRole('slider', { name: 'Hold to select' })).toHaveValue('600');
});

test('select when finger lifts chooses the button it lifts from', async ({ page }) => {
  await openSettings(page, 'Touch');
  await page.getByRole('switch', { name: 'Select when finger lifts' }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();

  const from = await word(page, 'want').boundingBox();
  const to = await word(page, 'like').boundingBox();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await expect(messageBar(page)).toHaveAccessibleName('Message is empty');
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(messageBar(page)).toHaveAccessibleName('Message: like. Tap to speak it.');
});

test('the keyboard can choose words', async ({ page }) => {
  await word(page, 'I').focus();
  await page.keyboard.press('Enter');
  await expect(messageBar(page)).toHaveAccessibleName('Message: I. Tap to speak it.');
});

test('labels can go above symbols, or symbols can be hidden', async ({ page }) => {
  const label = word(page, 'want').locator('.label');
  const image = word(page, 'want').locator('img');
  expect((await label.boundingBox())!.y).toBeGreaterThan((await image.boundingBox())!.y);

  await openSettings(page, 'Display');
  await page.getByRole('button', { name: 'Above symbol' }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  expect((await label.boundingBox())!.y).toBeLessThan((await image.boundingBox())!.y);

  await openSettings(page, 'Display');
  await page.getByRole('switch', { name: 'Show symbols' }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(image).toHaveCount(0);
  await expectBoardFits(page);
});
