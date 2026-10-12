import { expect, test } from '@playwright/test';
import { messageBar, openSettings, recordSpeech, spoken, word } from './helpers';

test.describe('on a device set to Spanish', () => {
  test.use({ locale: 'es-MX' });

  test('the Spanish-first boards come first, with the app in Spanish', async ({ page }) => {
    await recordSpeech(page);
    await page.goto('/');
    await expect(word(page, 'quiero')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hablar', exact: true })).toBeVisible();
    await expect(page.getByText('Palabras básicas')).toBeVisible();
    // Articles, and the verb forms young Spanish speakers use.
    for (const label of ['el', 'la', 'un', 'dame', 'mira', 'me gusta']) {
      await expect(word(page, label)).toBeVisible();
    }
    await word(page, 'quiero').click();
    await page.getByRole('button', { name: 'Comida, carpeta' }).click();
    await word(page, 'helado').click();
    await expect(messageBar(page)).toHaveAccessibleName(
      'Mensaje: quiero helado. Toca para decirlo.',
    );
    await expect.poll(() => spoken(page)).toEqual(['quiero', 'helado']);
  });
});

test('either starter vocabulary can be chosen when starting over', async ({ page }) => {
  await recordSpeech(page);
  await page.goto('/');
  await expect(word(page, 'want')).toBeVisible();
  await openSettings(page, 'Boards & backup');
  page.on('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Start over with the Spanish starter boards' }).click();
  // The app follows the boards' language: the dialog is now in Spanish.
  await page.getByRole('dialog').getByRole('button', { name: 'Listo', exact: true }).click();
  await page.getByRole('button', { name: 'Listo', exact: true }).click();
  await expect(word(page, 'quiero')).toBeVisible();
  await expect(word(page, 'el')).toBeVisible();
});
