import {
  addWord,
  appendText,
  backspace,
  baseLanguage,
  behaviorOf,
  boardName,
  compactBoardId,
  messageText,
  setLanguages,
  spokenText,
  type BoardSet,
  type Message,
  type ObfButton,
} from '@open-aac/core';
import { MESSAGES, pickAppLanguage } from './i18n';
import { DEFAULT_SETTINGS, type Settings } from './settings';
import { phrase } from './phrases';
import { preferPlaybackAudio, speech } from './speech';
import { openaacVoice } from './voice/voice.svelte';

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
  /** The language the boards are written in (base code, e.g. "en"). */
  boardsLanguage = $derived(
    baseLanguage(this.set?.boards.find((b) => b.id === this.set?.rootId)?.locale ?? 'en'),
  );
  /** Every language the boards can be shown in. */
  languages = $derived(this.set ? setLanguages(this.set) : ['en']);
  /** The language buttons are shown and spoken in right now. */
  language = $derived.by(() => {
    const { primary, second, usingSecond } = this.settings.language;
    if (usingSecond && second) return second;
    return primary ?? this.boardsLanguage;
  });
  /** The language of buttons and menus. */
  appLanguage = $derived(
    pickAppLanguage(
      this.settings.language.app,
      this.language,
      typeof navigator === 'undefined' ? [] : navigator.languages,
    ),
  );
  /** The app's own words, in its language. */
  t = $derived(MESSAGES[this.appLanguage]);
  trail = $derived(
    [...this.history, this.boardId]
      .map((id) => {
        const board = this.boardById(id);
        return board ? boardName(board, this.language) : '';
      })
      .filter((name) => name !== ''),
  );

  load(set: BoardSet) {
    this.set = set;
    this.boardId = set.rootId;
    this.history = [];
    this.message = [];
  }

  /** Swaps in an edited version of the boards, staying on the same board where it still exists. */
  replaceSet(set: BoardSet) {
    const exists = (id: string) => set.boards.some((b) => b.id === id);
    this.set = set;
    this.history = this.history.filter(exists);
    if (!exists(this.boardId)) this.boardId = set.rootId;
  }

  /** Opens a board, remembering where we came from for Back. */
  open(id: string) {
    if (!this.boardById(id) || id === this.boardId) return;
    this.history = [...this.history, this.boardId];
    this.boardId = id;
  }

  boardById(id: string | undefined) {
    return id === undefined ? undefined : this.set?.boards.find((b) => b.id === id);
  }

  press(button: ObfButton) {
    const behavior = behaviorOf(button);
    switch (behavior.kind) {
      case 'navigate':
        if (behavior.target.id !== undefined) this.open(behavior.target.id);
        return;
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
        this.message = addWord(this.message, button, this.view?.id, this.language);
        if (this.settings.speech.speakEachWord) this.say(spokenText(button, this.language));
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
    this.say(phrase('help', this.language));
  }

  /** Switches between the two languages of a bilingual communicator. */
  switchLanguage() {
    const settings = this.settings.language;
    if (settings.second) settings.usingSecond = !settings.usingSecond;
  }

  /** The Open AAC voice chosen for the language in use. */
  openaacVoiceId = $derived(this.settings.speech.openaacVoices[this.language] ?? null);

  /**
   * Speaks with the Open AAC voice when it's chosen and ready, and with the
   * device voice otherwise, or if the Open AAC voice fails.
   */
  say(text: string) {
    preferPlaybackAudio();
    const options = this.settings.speech;
    const lang = this.language;
    const device = {
      voice: options.deviceVoices[lang] ?? null,
      rate: options.rate,
      pitch: options.pitch,
      lang,
    };
    if (options.engine === 'openaac' && openaacVoice.isReady(this.openaacVoiceId)) {
      speech.stop();
      openaacVoice.engine.speak(text, options.rate).then(
        () => announce('openaac', text),
        () => {
          speech.speak(text, device);
          announce('device', text);
        },
      );
      return;
    }
    openaacVoice.engine.stop();
    speech.speak(text, device);
    announce('device', text);
  }
}

/** Tells listeners (tests, for now) which voice said what. */
function announce(engine: 'device' | 'openaac', text: string) {
  if (text.trim() === '') return;
  dispatchEvent(new CustomEvent('openaac:speak', { detail: { engine, text } }));
}

export const app = new AppState();
