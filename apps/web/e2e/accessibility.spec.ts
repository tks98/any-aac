import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openEditor, openSettings, recordSpeech, word } from './helpers';

/** WCAG 2.2 A and AA, checked by axe-core. */
async function audit(page: Page, name: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const problems = results.violations.map(
    (v) => `${name}: ${v.id} (${v.impact}) ${v.nodes.length}× ${v.nodes[0]?.target.join(' ')}`,
  );
  expect(problems, problems.join('\n')).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await recordSpeech(page);
  await page.goto('/');
  await expect(word(page, 'want')).toBeVisible();
});

for (const theme of ['Light', 'Dark', 'High contrast']) {
  test(`the communication screen meets WCAG 2.2 AA (${theme})`, async ({ page }) => {
    if (theme !== 'Light') {
      await openSettings(page, 'Display');
      await page.getByRole('group', { name: 'Theme' }).getByRole('button', { name: theme }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Done', exact: true }).click();
      await page.getByRole('button', { name: 'Done', exact: true }).click();
    }
    await word(page, 'I').click();
    await audit(page, `communicate (${theme})`);
    await page.getByRole('button', { name: 'Word forms' }).click();
    await audit(page, `word forms (${theme})`);
  });
}

test('edit mode, settings, modeling and the symbol search meet WCAG 2.2 AA', async ({ page }) => {
  test.setTimeout(90_000);
  await openEditor(page);
  await audit(page, 'edit mode');
  await word(page, 'want').click();
  await audit(page, 'edit mode with a button selected');
  await page.getByRole('complementary').getByRole('button', { name: 'Find a symbol' }).click();
  await expect(page.getByRole('dialog', { name: 'Find a symbol' })).toBeVisible();
  await audit(page, 'symbol search');

  await page.goto('/');
  await openSettings(page);
  for (const section of [
    'Speech & voice',
    'Language',
    'Touch',
    'Switch scanning',
    'Display',
    'Boards & backup',
    'About',
  ]) {
    await page.getByRole('button', { name: section }).click();
    await audit(page, `settings: ${section}`);
  }

  await page.goto('/');
  await openEditor(page);
  await page.getByRole('toolbar').getByRole('button', { name: 'Model' }).click();
  await page.getByRole('searchbox', { name: 'Find a word' }).fill('apple');
  await audit(page, 'modeling');
});

/** Interactive elements smaller than this, in CSS pixels. */
async function smallTargets(page: Page, min: number) {
  return page.evaluate((min) => {
    const found: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(
      'button, a[href], input, select, [role="switch"]',
    )) {
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (
        box.width === 0 ||
        style.visibility === 'hidden' ||
        el.closest('[hidden], .visually-hidden')
      )
        continue;
      if (el.tagName === 'A' && style.display === 'inline') continue; // links in text
      if ((el as HTMLInputElement).type === 'file') continue;
      if (box.width < min || box.height < min) {
        found.push(
          `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(box.width)}×${Math.round(box.height)}`,
        );
      }
    }
    return found;
  }, min);
}

for (const [device, viewport] of [
  ['tablet', { width: 1180, height: 820 }],
  ['phone', { width: 375, height: 667 }],
] as const) {
  test(`every control on the communication screen is at least 44 px (${device})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await expect(word(page, 'want')).toBeVisible();
    expect(await smallTargets(page, 44)).toEqual([]);
  });
}

test('controls say what they do, and taps get feedback', async ({ page }) => {
  // Icons come with words.
  await expect(page.getByRole('button', { name: 'Delete last word' })).toContainText('Delete');
  await expect(page.getByRole('button', { name: 'Clear message' })).toContainText('Clear');
  // A tap on Edit explains that it needs a hold.
  await page.getByRole('button', { name: /^Edit boards/ }).click();
  await expect(page.getByText('Hold Edit for a second to edit')).toBeVisible();
  await expect(page.getByRole('toolbar')).toBeHidden();
  // The chosen word is outlined for a moment.
  await word(page, 'want').click();
  await expect(word(page, 'want')).toHaveClass(/chosen/);
  await expect(word(page, 'want')).not.toHaveClass(/chosen/);
});
