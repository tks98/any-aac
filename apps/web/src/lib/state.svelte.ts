import {
  addWord,
  appendText,
  backspace,
  behaviorOf,
  compactBoardId,
  messageText,
  spokenText,
  type BoardSet,
  type Message,
  type ObfButton,
} from '@open-aac/core';
import { DEFAULT_SETTINGS, type Settings } from './settings';
import { speech } from './speech';

class AppState {
  set = $state.raw<BoardSet | null>(null);
  /** The board we're on. Navigation and Back always use full-size board ids. */
  boardId = $state('');
  /** Boards we came through to reach this one, for Back. */
  history = $state.raw<string[]>([]);
  message = $state.raw<Message>([]);
  settings = $state<Settings>(structuredClone(DEFAULT_SETTINGS));
  /** Phone-sized screen: show boards' compact layouts where they have one. */
  compact = $state(false);

  board = $derived(this.set?.boards.find((b) => b.id === this.boardId) ?? null);
  /** The layout actually on screen. */
  view = $derived.by(() => {
    if (!this.board || !this.compact) return this.board;
    return this.boardById(compactBoardId(this.board)) ?? this.board;
  });
  atHome = $derived(this.set !== null && this.boardId === this.set.rootId);
  trail = $derived(
    [...this.history, this.boardId]
      .map((id) => this.set?.boards.find((b) => b.id === id)?.name ?? '')
      .filter((name) => name !== ''),
  );

  load(set: BoardSet) {
    this.set = set;
    this.boardId = set.rootId;
    this.history = [];
    this.message = [];
  }

  boardById(id: string | undefined) {
    return id === undefined ? undefined : this.set?.boards.find((b) => b.id === id);
  }

  press(button: ObfButton) {
    const behavior = behaviorOf(button);
    switch (behavior.kind) {
      case 'navigate': {
        const target = this.boardById(behavior.target.id);
        if (target) {
          this.history = [...this.history, this.boardId];
          this.boardId = target.id;
        }
        return;
      }
      case 'special':
        if (behavior.action === 'clear') this.clear();
        else if (behavior.action === 'backspace') this.deleteLast();
        else if (behavior.action === 'speak') this.speakMessage();
        else if (behavior.action === 'home') this.home();
        else if (behavior.action === 'hush') speech.stop();
        return;
      case 'append':
        this.message = appendText(this.message, behavior.text);
        return;
      case 'word':
        this.message = addWord(this.message, button, this.view?.id);
        if (this.settings.speech.speakEachWord) this.say(spokenText(button));
        return;
    }
  }

  home() {
    if (!this.set) return;
    this.boardId = this.set.rootId;
    this.history = [];
  }

  back() {
    const previous = this.history.at(-1);
    if (previous === undefined) return;
    this.history = this.history.slice(0, -1);
    this.boardId = previous;
  }

  deleteLast() {
    this.message = backspace(this.message);
  }

  clear() {
    this.message = [];
  }

  speakMessage() {
    this.say(messageText(this.message));
  }

  askForHelp() {
    this.say('I need help');
  }

  say(text: string) {
    speech.speak(text, this.settings.speech);
  }
}

export const app = new AppState();
