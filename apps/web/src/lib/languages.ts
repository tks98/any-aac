/** "es" → "Español": a language's name in that language, for switching between languages. */
export function nativeName(code: string): string {
  return capitalize(nameIn(code, code), code);
}

/** A language's name in another language: "es" in "en" → "Spanish", "en-GB" in "es" → "inglés británico". */
export function nameIn(code: string, inLanguage: string): string {
  try {
    return new Intl.DisplayNames([inLanguage], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function capitalize(text: string, lang: string): string {
  return text.charAt(0).toLocaleUpperCase(lang) + text.slice(1);
}
