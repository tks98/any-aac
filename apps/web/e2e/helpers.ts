import { expect, type Page } from '@playwright/test';

export const word = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
export const messageBar = (page: Page) =>
  page.getByRole('button', { name: /^(Message|Mensaje|El mensaje)/ });

export async function holdOn(page: Page, name: string | RegExp, ms: number) {
  await page.getByRole('button', { name, exact: typeof name === 'string' }).hover();
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

/** Edit mode sits behind a press and hold on Edit. */
export async function openEditor(page: Page) {
  await holdOn(page, /^Edit boards/, 1200);
  await expect(page.getByRole('toolbar')).toBeVisible();
}

export async function openSettings(page: Page, section?: string) {
  await openEditor(page);
  await page.getByRole('toolbar').getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  if (section) await page.getByRole('button', { name: section }).click();
}

/** Closes settings, then edit mode, back to the board. */
export async function closeSettings(page: Page, done = 'Done') {
  await page.getByRole('dialog').getByRole('button', { name: done, exact: true }).click();
  await page.getByRole('button', { name: done, exact: true }).click();
  await expect(page.getByRole('toolbar')).toBeHidden();
}

/** App voice model files. Tests don't download them (60 MB each); see VOICE_FILES' use. */
export const VOICE_FILES = /\.onnx(\.json)?$/;

/**
 * Replaces the browser voice with a recorder, so tests can see what would be
 * said. App voices download automatically, so their files are blocked: the
 * download fails and the device voice speaks, as it does until a voice is ready.
 */
export async function recordSpeech(page: Page) {
  await page.route(VOICE_FILES, (route) => route.abort());
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
      speaking: false,
      pending: false,
      // Like a browser that lets speech start: it starts at once. The silent
      // utterance that unlocks speech on iOS isn't a word, so isn't recorded.
      speak(utterance: { text: string; lang: string; dispatchEvent?: (event: Event) => void }) {
        utterance.dispatchEvent?.(new Event('start'));
        if (utterance.text.trim() === '') return;
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

export const spoken = (page: Page) =>
  page.evaluate(() => (window as unknown as { spoken: string[] }).spoken);
/** The language each spoken text was said in. */
export const spokenIn = (page: Page) =>
  page.evaluate(() => (window as unknown as { spokenIn: string[] }).spokenIn);
