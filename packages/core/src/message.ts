/**
 * The message being built in the message bar. Pure functions so every access
 * method (touch, scanning, dwell) shares the same behaviour.
 */
import { partOfSpeech, type PartOfSpeech } from './ext';
import { buttonWords } from './language';
import type { ObfButton } from './obf';

export interface MessageItem {
  readonly label: string;
  readonly text: string;
  readonly imageId?: string;
  readonly boardId?: string;
  /** The word's type and language, for word forms. */
  readonly type?: PartOfSpeech;
  readonly lang?: string;
}

export type Message = readonly MessageItem[];

/** Adds a button's word, in `lang` if the button has a translation for it. */
export function addWord(
  message: Message,
  button: ObfButton,
  boardId?: string,
  lang?: string,
): Message {
  const { label, text } = buttonWords(button, lang);
  if (text === '') return message;
  const type = partOfSpeech(button);
  const item: MessageItem = {
    label: label || text,
    text,
    ...(button.image_id !== undefined ? { imageId: button.image_id } : {}),
    ...(boardId !== undefined ? { boardId } : {}),
    ...(type !== undefined ? { type } : {}),
    ...(lang !== undefined ? { lang } : {}),
  };
  return [...message, item];
}

/** Adds text to the end of the last word, e.g. "+s" turns "dog" into "dogs". */
export function appendText(message: Message, text: string): Message {
  const last = message.at(-1);
  if (!last) return [{ label: text, text }];
  return [...message.slice(0, -1), { ...last, label: last.label + text, text: last.text + text }];
}

/** Swaps the last word for another form of it ("want" → "wanted"). */
export function replaceLastWord(message: Message, form: string): Message {
  const last = message.at(-1);
  if (!last) return message;
  return [...message.slice(0, -1), { ...last, label: form, text: form }];
}

export function backspace(message: Message): Message {
  return message.slice(0, -1);
}

export function messageText(message: Message): string {
  return message
    .map((item) => item.text)
    .filter((text) => text !== '')
    .join(' ');
}
