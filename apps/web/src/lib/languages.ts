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

/** Languages that write language names with a capital letter even mid-sentence. */
const CAPITALIZED = new Set(['en', 'de']);

/** A language's name for use inside a sentence: "español", but "Spanish". */
export function nameInSentence(code: string, inLanguage: string): string {
  const name = nameIn(code, inLanguage);
  const base = inLanguage.toLowerCase().split('-')[0] ?? '';
  return CAPITALIZED.has(base)
    ? capitalize(name, inLanguage)
    : name.charAt(0).toLocaleLowerCase(inLanguage) + name.slice(1);
}
