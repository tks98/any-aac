/**
 * The message being built in the message bar. Pure functions so every access
 * method (touch, scanning, dwell) shares the same behaviour.
 */
import { spokenText } from './board';
import type { ObfButton } from './obf';

export interface MessageItem {
  readonly label: string;
  readonly text: string;
  readonly imageId?: string;
  readonly boardId?: string;
}

export type Message = readonly MessageItem[];

export function addWord(message: Message, button: ObfButton, boardId?: string): Message {
  const text = spokenText(button);
  if (text === '') return message;
  const item: MessageItem = {
    label: button.label ?? text,
    text,
    ...(button.image_id !== undefined ? { imageId: button.image_id } : {}),
    ...(boardId !== undefined ? { boardId } : {}),
  };
  return [...message, item];
}

/** Adds text to the end of the last word, e.g. "+s" turns "dog" into "dogs". */
export function appendText(message: Message, text: string): Message {
  const last = message.at(-1);
  if (!last) return [{ label: text, text }];
  return [...message.slice(0, -1), { ...last, label: last.label + text, text: last.text + text }];
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
