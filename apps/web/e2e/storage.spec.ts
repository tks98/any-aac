import { expect, test, type Page } from '@playwright/test';
import { closeSettings, openEditor, openSettings, recordSpeech, spoken, word } from './helpers';

const panel = (page: Page) => page.getByRole('complementary', { name: 'Button settings' });
const done = (page: Page) => page.getByRole('button', { name: 'Done', exact: true }).click();

/** In edit mode: renames a word on the board on screen. */
async function rename(page: Page, from: string, to: string) {
  await word(page, from).click();
  await panel(page).getByLabel('Label in English').fill(to);
  await panel(page).getByLabel('Label in English').press('Enter');
  await expect(word(page, to)).toBeVisible();
}

/** How many times the settings have been saved. */
const settingsRevision = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const open = indexedDB.open('open-aac');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const get = open.result.transaction('settings').objectStore('settings').get('current');
          get.onsuccess = () => {
            resolve((get.result as { revision?: number } | undefined)?.revision ?? 0);
            open.result.close();
          };
        };
      }),
  );

/** Changes the saved boards' root board in place, as an older version of the app might have left it. */
const editStoredRoot = (page: Page, fields: Record<string, unknown>) =>
  page.evaluate(
    (fields) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('open-aac');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const store = open.result.transaction('sets', 'readwrite').objectStore('sets');
          const get = store.get('current');
          get.onsuccess = () => {
            const stored = get.result as {
              set: { rootId: string; boards: Record<string, unknown>[] };
            };
            const root = stored.set.boards.find((board) => board.id === stored.set.rootId)!;
            Object.assign(root, fields);
            const put = store.put(stored);
            put.onsuccess = () => {
              open.result.close();
              resolve();
            };
            put.onerror = () => reject(put.error);
          };
        };
      }),
    fields,
  );

/** Every button label in the saved boards. */
const savedLabels = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const open = indexedDB.open('open-aac');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const get = open.result.transaction('sets').objectStore('sets').get('current');
          get.onsuccess = () => {
            const stored = get.result as
              { set: { boards: { buttons: { label?: string }[] }[] } } | undefined;
            resolve(
              stored?.set.boards.flatMap((board) => board.buttons.map((b) => b.label ?? '')) ?? [],
            );
            open.result.close();
          };
        };
      }),
  );

async function start(page: Page) {
  await recordSpeech(page);
  await page.goto('/');
  await expect(word(page, 'want')).toBeVisible();
}

test.describe('when the saved boards cannot be read', () => {
  test.beforeEach(async ({ page }) => {
    // Reading the boards fails while the tab's "fail-reads" flag is set, as
    // when Safari loses its connection to IndexedDB.
    // "fail-meta" fails only reading when the boards were backed up.
    await page.addInitScript(() => {
      const get = IDBObjectStore.prototype.get;
      IDBObjectStore.prototype.get = function (this: IDBObjectStore, key: IDBValidKey) {
        if (
          (this.name === 'sets' && sessionStorage.getItem('fail-reads') === '1') ||
          (this.name === 'meta' && sessionStorage.getItem('fail-meta') === '1')
        ) {
          throw new DOMException('Connection to Indexed Database server lost', 'UnknownError');
        }
        return get.call(this, key);
      };
    });
  });

  test('the starter boards speak, nothing is saved over the real boards, and Try again reads them', async ({
    page,
  }) => {
    await start(page);
    await openEditor(page);
    await rename(page, 'want', 'need');
    await done(page);

    await page.evaluate(() => sessionStorage.setItem('fail-reads', '1'));
    await page.reload();
    // Speaking still works, with the starter boards.
    await word(page, 'want').click();
    await expect.poll(() => spoken(page)).toEqual(['want']);
    await expect(page.getByText("Saved boards couldn't be read")).toBeVisible();

    await openEditor(page);
    await expect(page.getByRole('alert')).toContainText("The boards saved on this device couldn't");
    await rename(page, 'go', 'went');
    await expect(page.getByText("Changes couldn't be saved on this device")).toBeVisible();

    // The read works again.
    await page.evaluate(() => sessionStorage.removeItem('fail-reads'));
    await page.getByRole('alert').getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('alert')).toBeHidden();
    await expect(word(page, 'need')).toBeVisible();
    await expect(word(page, 'go')).toBeVisible();
    await done(page);

    await page.reload();
    await expect(word(page, 'need')).toBeVisible();
  });

  test('an adult can replace boards that cannot be read, after a warning; edits still cannot', async ({
    page,
  }) => {
    await start(page);
    await openEditor(page);
    await rename(page, 'want', 'need');
    await done(page);

    await page.evaluate(() => sessionStorage.setItem('fail-reads', '1'));
    await page.reload();
    await expect(page.getByText("Saved boards couldn't be read")).toBeVisible();

    await openEditor(page);
    await rename(page, 'go', 'went');
    await expect(page.getByText("Changes couldn't be saved on this device")).toBeVisible();
    await page.getByRole('toolbar').getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Boards & backup' }).click();
    const dialog = page.getByRole('dialog');
    const asked: string[] = [];
    page.on('dialog', (prompt) => {
      asked.push(prompt.message());
      void prompt.accept();
    });
    await dialog
      .getByRole('button', { name: 'Start over with the English starter boards' })
      .click();
    await expect(dialog.getByRole('status')).toHaveText('Starter boards restored.');
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain("couldn't be read. They will be replaced");
    await expect(dialog.getByRole('alert')).toBeHidden();
    await closeSettings(page);
    await expect(page.getByText("Saved boards couldn't be read")).toBeHidden();
    await expect(page.getByText('Not saved on this device')).toBeHidden();

    // Saved: reading works again and shows the starter boards, not the old ones.
    await page.evaluate(() => sessionStorage.removeItem('fail-reads'));
    await page.reload();
    await expect(word(page, 'want')).toBeVisible();
    await expect(word(page, 'need')).toBeHidden();
  });

  test("not knowing when the boards were backed up doesn't stop them being saved", async ({
    page,
  }) => {
    await start(page);
    await page.evaluate(() => sessionStorage.setItem('fail-meta', '1'));
    await page.reload();
    await expect(word(page, 'want')).toBeVisible();
    await expect(page.getByText("Saved boards couldn't be read")).toBeHidden();

    await openEditor(page);
    await rename(page, 'want', 'need');
    await expect(page.getByText('Changes save on this device')).toBeVisible();
    await done(page);
    // Showing the app again doesn't read the boards over the change.
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect(word(page, 'need')).toBeVisible();
    await page.evaluate(() => sessionStorage.removeItem('fail-meta'));
    await page.reload();
    await expect(word(page, 'need')).toBeVisible();
  });
});

test('updating untouched starter boards keeps the boards an adult can put back', async ({
  page,
}) => {
  await start(page);
  await openEditor(page);
  await rename(page, 'want', 'need');
  await page.getByRole('toolbar').getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Boards & backup' }).click();
  const dialog = page.getByRole('dialog');
  page.on('dialog', (prompt) => void prompt.accept());
  await dialog.getByRole('button', { name: 'Start over with the English starter boards' }).click();
  await expect(dialog.getByRole('status')).toHaveText('Starter boards restored.');
  await closeSettings(page);

  // The untouched starter boards are from an older version, so the next launch updates them.
  await editStoredRoot(page, { ext_anyaac_starter_version: 1 });
  await page.reload();
  await expect(word(page, 'want')).toBeVisible();

  await openSettings(page, 'Boards & backup');
  await dialog.getByRole('button', { name: 'Put back the boards from before' }).click();
  await expect(dialog.getByRole('status')).toHaveText('The boards from before are back.');
  await closeSettings(page);
  await expect(word(page, 'need')).toBeVisible();
});

test('a board saved without its button list is read, not taken for unreadable', async ({
  page,
}) => {
  await start(page);
  await editStoredRoot(page, { buttons: undefined, images: undefined, sounds: undefined });
  await page.reload();
  // The other boards are there; the root board is just empty, and nothing says it couldn't be read.
  await expect(page.getByText("Saved boards couldn't be read")).toBeHidden();
  await expect(page.getByText('Not saved on this device')).toBeHidden();
});

test('the boards from before an import or start over can be put back', async ({ page }) => {
  await start(page);
  await openEditor(page);
  await rename(page, 'want', 'need');
  await page.getByRole('toolbar').getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Boards & backup' }).click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('button', { name: 'Put back the boards from before' }),
  ).toBeHidden();

  page.on('dialog', (prompt) => void prompt.accept());
  await dialog.getByRole('button', { name: 'Start over with the English starter boards' }).click();
  await expect(dialog.getByRole('status')).toHaveText('Starter boards restored.');
  // Undo doesn't reach back across it.
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
  await expect(word(page, 'want')).toBeVisible();

  await page.getByRole('toolbar').getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Boards & backup' }).click();
  await dialog.getByRole('button', { name: 'Put back the boards from before' }).click();
  await expect(dialog.getByRole('status')).toHaveText('The boards from before are back.');
  await closeSettings(page);
  await expect(word(page, 'need')).toBeVisible();

  await page.reload();
  await expect(word(page, 'need')).toBeVisible();
});

test.describe('two tabs', () => {
  test('a change in one shows in the other, and neither saves over the other', async ({
    page,
    context,
  }) => {
    await start(page);
    const other = await context.newPage();
    await start(other);

    await openEditor(page);
    await rename(page, 'want', 'need');
    await expect(word(other, 'need')).toBeVisible();

    await openEditor(other);
    await rename(other, 'go', 'went');
    await expect(word(page, 'went')).toBeVisible();
    await expect(word(page, 'need')).toBeVisible();

    // Settings too, without the two tabs saving them back and forth.
    await done(page);
    await openSettings(page, 'Speech & voice');
    await page.getByRole('switch', { name: 'Speak each word when tapped' }).click();
    await closeSettings(page);
    await expect(other.getByRole('switch', { name: 'Speak each word when tapped' })).toHaveCount(0);
    const first = await settingsRevision(page);
    await page.waitForTimeout(1000);
    expect(await settingsRevision(page)).toBe(first);
    await done(other);
    await other.reload();
    await expect(word(other, 'need')).toBeVisible();
    await expect(word(other, 'went')).toBeVisible();
  });

  test("a settings change that another tab's newer settings replaced says so", async ({
    page,
    context,
  }) => {
    await start(page);
    const other = await context.newPage();
    await other.addInitScript(() => {
      Object.defineProperty(window, 'BroadcastChannel', { value: undefined });
    });
    await start(other);

    await openSettings(page, 'Speech & voice');
    await page.getByRole('switch', { name: 'Speak each word when tapped' }).click();
    await closeSettings(page);

    await openSettings(other, 'Speech & voice');
    await other.getByRole('switch', { name: 'Speak each word when tapped' }).click();
    await expect(
      other.getByRole('dialog').getByRole('alert').filter({ hasText: 'The settings were changed' }),
    ).toBeVisible();
  });

  test("a tab that missed the other's save reads it in instead of saving over it", async ({
    page,
    context,
  }) => {
    await start(page);
    const other = await context.newPage();
    // As if the message between tabs never arrived.
    await other.addInitScript(() => {
      Object.defineProperty(window, 'BroadcastChannel', { value: undefined });
    });
    await start(other);

    await openEditor(page);
    await rename(page, 'want', 'need');
    await openEditor(other);
    await expect(word(other, 'want')).toBeVisible();
    await word(other, 'go').click();
    await panel(other).getByLabel('Label in English').fill('went');
    await panel(other).getByLabel('Label in English').press('Enter');
    await expect(other.getByText('The boards were changed in another tab or window')).toBeVisible();
    await expect(word(other, 'need')).toBeVisible();
    await expect(word(other, 'go')).toBeVisible();
    // Undo can't bring back the version that was replaced.
    await expect(other.getByRole('button', { name: 'Undo' })).toBeDisabled();

    // Its next change saves, on top of the other tab's.
    await rename(other, 'go', 'went');
    await expect.poll(() => savedLabels(other), { timeout: 10000 }).toContain('went');
    await other.reload();
    await expect(word(other, 'need')).toBeVisible();
    await expect(word(other, 'went')).toBeVisible();
  });
});
