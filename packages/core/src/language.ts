/**
 * Languages on boards. A button's own label is in its board's language
 * (`board.locale`); other languages come from the button's OBF `translations`,
 * so one board, with every button in the same place, can be used in several
 * languages. That keeps motor plans the same for bilingual communicators.
 */
import { isRecord, type ObfBoard, type ObfButton } from './obf';
import type { BoardSet } from './obz';

/** Board names in other languages. OBF translates buttons but not board names. */
export const EXT_NAME_TRANSLATIONS = 'ext_openaac_name_translations';

/** "es-MX" → "es". */
export function baseLanguage(locale: string): string {
  return locale.toLowerCase().replace('_', '-').split('-')[0] ?? '';
}

const normalize = (locale: string) => locale.toLowerCase().replace('_', '-');

/** Picks the value for a language from a locale-keyed record: exact match first, then base language. */
function pick<T>(record: unknown, lang: string): T | undefined {
  if (!isRecord(record)) return undefined;
  const want = normalize(lang);
  const entries = Object.entries(record);
  const exact = entries.find(([key]) => normalize(key) === want);
  const sameBase = entries.find(([key]) => baseLanguage(key) === baseLanguage(want));
  return (exact ?? sameBase)?.[1] as T | undefined;
}

export interface ButtonWords {
  /** What the button shows. */
  label: string;
  /** What it says. */
  text: string;
}

/** What a button shows and says, in a language if it has a translation for it. */
export function buttonWords(button: ObfButton, lang?: string): ButtonWords {
  const own = {
    label: button.label ?? button.vocalization ?? '',
    text: (button.vocalization ?? button.label ?? '').trim(),
  };
  if (lang === undefined) return own;
  const translation = pick<{ label?: unknown; vocalization?: unknown }>(button.translations, lang);
  if (!isRecord(translation)) return own;
  const label = typeof translation.label === 'string' ? translation.label : undefined;
  const vocalization =
    typeof translation.vocalization === 'string' ? translation.vocalization : undefined;
  if (label === undefined && vocalization === undefined) return own;
  return { label: label ?? vocalization ?? own.label, text: (vocalization ?? label ?? '').trim() };
}

export function boardName(board: ObfBoard, lang?: string): string {
  if (lang !== undefined) {
    const name = pick<unknown>(board[EXT_NAME_TRANSLATIONS], lang);
    if (typeof name === 'string') return name;
  }
  return board.name ?? '';
}

/** Every language a set of boards can be shown in, as base codes, sorted. */
export function setLanguages(set: BoardSet): string[] {
  const found = new Set<string>();
  for (const board of set.boards) {
    if (board.locale) found.add(baseLanguage(board.locale));
    for (const button of board.buttons) {
      if (isRecord(button.translations)) {
        for (const key of Object.keys(button.translations)) found.add(baseLanguage(key));
      }
    }
  }
  return [...found].filter((lang) => lang !== '').sort();
}
