import { expect, test, type Page } from '@playwright/test';

const word = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const messageBar = (page: Page) =>
  page.getByRole('button', { name: /^(Message|Mensaje|El mensaje)/ });

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
    const spokenIn: string[] = [];
    Object.assign(window, { spoken, spokenIn });
    if (!('SpeechSynthesisUtterance' in window)) {
      Object.assign(window, {
        SpeechSynthesisUtterance: class {
          constructor(public text: string) {}
        },
      });
    }
    const fake = {
      speak(utterance: { text: string; lang: string }) {
        spoken.push(utterance.text);
        spokenIn.push(utterance.lang);
      },
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
/** The language each spoken text was said in. */
const spokenIn = (page: Page) =>
  page.evaluate(() => (window as unknown as { spokenIn: string[] }).spokenIn);

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
  // The symbols came back inside the package.
  await expectSymbolsLoaded(page);
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
        labelClipped: label.scrollWidth > label.clientWidth + 1,
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
    expect(cell.labelClipped, `${cell.name} is cut off`).toBe(false);
  }
}

test('the board fits on screen', async ({ page }) => {
  await expectBoardFits(page);
});

/** Every symbol on the board has loaded (no broken images). */
async function expectSymbolsLoaded(page: Page) {
  const images = page.locator('button.cell img');
  await expect(images.first()).toBeVisible();
  const broken = await images.evaluateAll((els) =>
    (els as HTMLImageElement[])
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.closest('button')?.textContent?.trim()),
  );
  expect(broken).toEqual([]);
}

test('every symbol loads, on the core board and a topic board', async ({ page }) => {
  await expectSymbolsLoaded(page);
  await page.getByRole('button', { name: 'Food, folder' }).click();
  await expect(word(page, 'apple')).toBeVisible();
  await expectSymbolsLoaded(page);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('shows the phone board: 24 words and a row of topics, and it fits', async ({ page }) => {
    await expect(page.locator('button.cell')).toHaveCount(28);
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

  test('every topic has a phone layout', async ({ page }) => {
    for (const [topic, first] of [
      ['People', 'Mom'],
      ['Food', 'apple'],
      ['Places', 'home'],
      ['Feelings', 'happy'],
      ['Body', 'head'],
      ['Things', 'ball'],
    ]) {
      await page.getByRole('button', { name: `${topic}, folder` }).tap();
      await expect(word(page, first!)).toBeVisible();
      await expect(page.getByText(`Core words (phone)  ›  ${topic} (phone)`)).toHaveCount(0);
      await expectBoardFits(page);
      await page.getByRole('button', { name: 'Home', exact: true }).tap();
    }
  });

  test('Spanish words fit too', async ({ page }) => {
    await openSettings(page, 'Language');
    await page
      .getByRole('group', { name: 'Words' })
      .getByRole('button', { name: 'Español' })
      .click();
    await page.getByRole('button', { name: 'Listo', exact: true }).click();
    await expectBoardFits(page);
    await page.getByRole('button', { name: 'Emociones, carpeta' }).tap();
    await expect(word(page, 'feliz')).toBeVisible();
    await expectBoardFits(page);
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

test.describe('languages', () => {
  test('shows and speaks the boards in Spanish, with Spanish buttons and menus', async ({
    page,
  }) => {
    await openSettings(page, 'Language');
    await page
      .getByRole('group', { name: 'Words' })
      .getByRole('button', { name: 'Español' })
      .click();
    // Buttons and menus follow the words.
    await expect(page.getByRole('dialog', { name: 'Ajustes' })).toBeVisible();
    await page.getByRole('button', { name: 'Listo', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');

    await word(page, 'quiero').click();
    await word(page, 'más').click();
    await expect(messageBar(page)).toHaveAccessibleName('Mensaje: quiero más. Toca para decirlo.');
    expect(await spoken(page)).toEqual(['quiero', 'más']);
    expect(await spokenIn(page)).toEqual(['es', 'es']);

    await page.getByRole('button', { name: 'Comida, carpeta' }).click();
    await expect(word(page, 'manzana')).toBeVisible();
    await expect(page.getByText('Palabras básicas  ›  Comida')).toBeVisible();
    await page.getByRole('button', { name: 'Ayuda', exact: true }).click();
    expect((await spoken(page)).at(-1)).toBe('Necesito ayuda');

    await page.reload();
    await expect(word(page, 'quiero')).toBeVisible();
  });

  test('a bilingual communicator switches language with one tap, and words stay put', async ({
    page,
  }) => {
    const wantAt = await word(page, 'want').boundingBox();
    await openSettings(page, 'Language');
    await page
      .getByRole('group', { name: 'Second language' })
      .getByRole('button', { name: 'Español' })
      .click();
    await page.getByRole('button', { name: 'Done', exact: true }).click();

    await word(page, 'I').click();
    await page.getByRole('button', { name: 'Español (switch language)' }).click();
    expect(await word(page, 'quiero').boundingBox()).toEqual(wantAt);
    await word(page, 'quiero').click();
    await expect(messageBar(page)).toHaveAccessibleName('Mensaje: I quiero. Toca para decirlo.');
    expect(await spokenIn(page)).toEqual(['en', 'es']);

    await page.getByRole('button', { name: 'English (cambiar idioma)' }).click();
    await expect(word(page, 'want')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Speak', exact: true })).toBeVisible();
  });

  test('buttons and menus can stay in one language while the words change', async ({ page }) => {
    await openSettings(page, 'Language');
    await page
      .getByRole('group', { name: 'Buttons and menus' })
      .getByRole('button', { name: 'English' })
      .click();
    await page
      .getByRole('group', { name: 'Words' })
      .getByRole('button', { name: 'Español' })
      .click();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(word(page, 'quiero')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Speak', exact: true })).toBeVisible();
  });
});

test.describe('Open AAC voice', () => {
  const spokenBy = (page: Page) =>
    page.evaluate(
      () => (window as unknown as { voiceLog: { engine: string; text: string }[] }).voiceLog,
    );

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const voiceLog: { engine: string; text: string }[] = [];
      Object.assign(window, { voiceLog });
      addEventListener('openaac:speak', (event) =>
        voiceLog.push((event as CustomEvent<{ engine: string; text: string }>).detail),
      );
    });
    await page.reload();
    await expect(word(page, 'want')).toBeVisible();
  });

  test('offers only openly licensed voices, and the device voice speaks until one is ready', async ({
    page,
  }) => {
    await openSettings(page, 'Speech & voice');
    await page.getByRole('button', { name: 'Open AAC voice' }).click();
    const voices = page.locator('.voice.offline');
    await expect(voices).toHaveCount(6);
    await expect(voices.filter({ hasText: /CC BY-NC|lessac|hfc/ })).toHaveCount(0);
    await expect(voices.first().getByRole('button', { name: 'Download' })).toBeVisible();
    await expect(
      page.getByText('Until an Open AAC voice is ready, the device voice speaks.'),
    ).toBeVisible();
    // Pitch only applies to device voices.
    await expect(page.getByRole('slider', { name: 'Pitch' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Done', exact: true }).click();

    await word(page, 'want').click();
    expect(await spokenBy(page)).toEqual([{ engine: 'device', text: 'want' }]);
  });

  // Downloads a real 63 MB voice from Hugging Face, so it only runs when asked:
  // OPENAAC_E2E_VOICE=1 pnpm test:e2e --project=chromium
  test('downloads a voice, speaks with it, and starts it again offline', async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(!process.env.OPENAAC_E2E_VOICE, 'Set OPENAAC_E2E_VOICE=1 to run.');
    test.skip(browserName !== 'chromium', 'Offline check needs Chromium.');
    test.setTimeout(300_000);
    await openSettings(page, 'Speech & voice');
    await page.getByRole('button', { name: 'Open AAC voice' }).click();
    const linda = page.locator('.voice.offline').filter({ hasText: 'Linda' });
    await linda.getByRole('button', { name: 'Download' }).click();
    await expect(linda.getByRole('button', { name: 'In use' })).toBeVisible({ timeout: 240_000 });
    await expect(page.getByText(/Getting words ready|Until an Open AAC voice/)).toHaveCount(1);
    await page.getByRole('button', { name: 'Done', exact: true }).click();

    await word(page, 'want').click();
    await expect.poll(() => spokenBy(page)).toEqual([{ engine: 'openaac', text: 'want' }]);

    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await context.setOffline(true);
    await page.reload();
    await expect(word(page, 'go')).toBeVisible();
    await expect
      .poll(
        async () => {
          await word(page, 'go').click();
          return (await spokenBy(page)).at(-1)?.engine;
        },
        { timeout: 30_000 },
      )
      .toBe('openaac');
  });
});
