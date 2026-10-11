/**
 * Things the app itself says, in each board language. (Menu text lives in the
 * interface translations; these are spoken in the communicator's language.)
 */
const PHRASES = {
  help: { en: 'I need help', es: 'Necesito ayuda' },
  test: { en: 'Hello. This is how I sound.', es: 'Hola. Así suena mi voz.' },
} satisfies Record<string, Record<string, string> & { en: string }>;

export function phrase(key: keyof typeof PHRASES, lang: string): string {
  const translations: Record<string, string> = PHRASES[key];
  return translations[lang] ?? PHRASES[key].en;
}
