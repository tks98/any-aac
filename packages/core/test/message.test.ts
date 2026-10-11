import { describe, expect, it } from 'vitest';
import { addWord, appendText, backspace, messageText, type Message } from '../src';

describe('message', () => {
  it('builds, edits and reads out a message', () => {
    let message: Message = [];
    message = addWord(message, { id: 'a', label: 'I', image_id: 'img-i' }, 'home');
    message = addWord(message, { id: 'b', label: 'want' });
    message = addWord(message, { id: 'c', label: 'dog' });
    message = appendText(message, 's');
    expect(message[0]).toEqual({ label: 'I', text: 'I', imageId: 'img-i', boardId: 'home' });
    expect(messageText(message)).toBe('I want dogs');
    expect(messageText(backspace(message))).toBe('I want');
  });

  it('speaks the vocalization but shows the label', () => {
    const message = addWord([], { id: 'a', label: 'hi', vocalization: 'hello there' });
    expect(message).toEqual([{ label: 'hi', text: 'hello there' }]);
  });

  it('ignores buttons with nothing to say', () => {
    expect(addWord([], { id: 'a' })).toEqual([]);
  });

  it('starts a new word when appending to an empty message', () => {
    expect(appendText([], 'a')).toEqual([{ label: 'a', text: 'a' }]);
    expect(backspace([])).toEqual([]);
  });
});
