/**
 * Word forms ("want" → "wants", "wanting", "wanted"), so a communicator can
 * say the grammatical form without every form needing its own button. Each
 * language plugs in its own rules.
 */
import type { PartOfSpeech } from '../ext';
import { baseLanguage } from '../language';
import { englishForms } from './en';
import { spanishForms } from './es';
import type { WordForm } from './types';

export type { WordForm } from './types';

const ENGINES: Record<string, (word: string, type: PartOfSpeech | undefined) => WordForm[]> = {
  en: englishForms,
  es: spanishForms,
};

/** Languages with word forms. */
export const FORM_LANGUAGES = Object.keys(ENGINES);

/** A word's forms, the word itself included; empty when it has none we know. */
export function wordForms(word: string, lang: string, type?: PartOfSpeech): WordForm[] {
  const forms = ENGINES[baseLanguage(lang)]?.(word, type) ?? [];
  return forms.length > 1 ? forms : [];
}
