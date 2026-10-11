import {
  addWord,
  applyPronunciations,
  appendText,
  backspace,
  baseLanguage,
  behaviorOf,
  boardName,
  compactBoardId,
  isPhrasesBoard,
  messageText,
  replaceLastWord,
  setLanguages,
  spokenText,
  type BoardSet,
  type Message,
  type ObfButton,
} from '@any-aac/core';
import { MESSAGES, pickAppLanguage } from './i18n';
import { DEFAULT_SETTINGS, type Settings } from './settings';
import { phrase } from './phrases';
import { saveBoards } from './storage';
import { starterOf, starterPhrases } from './starter';
import { preferPlaybackAudio, speech } from './speech';
import { appVoice } from './voice/voice.svelte';

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
  /** The board of quick phrases, if the set has one. */
  phrases = $derived(this.set?.boards.find(isPhrasesBoard));
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
        // Quick phrases are said at once; they don't join the message.
        if (this.view && isPhrasesBoard(this.view)) {
          this.say(spokenText(button, this.language));
          return;
        }
        this.message = addWord(this.message, button, this.view?.id, this.language);
        if (this.settings.speech.speakEachWord) this.say(spokenText(button, this.language));
        return;
    }
  }

  /** Opens the quick phrases, adding the starter ones to boards that have none. */
  openPhrases() {
    if (!this.set) return;
    if (!this.phrases) {
      this.set = { ...this.set, boards: [...this.set.boards, starterPhrases(starterOf(this.set))] };
      void saveBoards(this.set).catch(() => undefined);
    }
    if (this.phrases) this.open(this.phrases.id);
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

  /** Swaps the last word for another of its forms ("want" → "wanted"). */
  useForm(form: string) {
    const last = this.message.at(-1);
    if (!last) return;
    this.message = replaceLastWord(this.message, form);
    if (this.settings.speech.speakEachWord) this.say(form, last.lang);
  }

  askForHelp() {
    this.say(phrase('help', this.language));
  }

  /** Switches between the two languages of a bilingual communicator. */
  switchLanguage() {
    const settings = this.settings.language;
    if (settings.second) settings.usingSecond = !settings.usingSecond;
  }

  /** The app voice chosen for the language in use. */
  appVoiceId = $derived(this.settings.speech.appVoices[this.language] ?? null);

  /**
   * Speaks with the app voice when it's chosen and ready, and with the
   * device voice otherwise, or if the app voice fails.
   */
  /** What the voice should say for some text, after the pronunciation dictionary. */
  spoken(text: string) {
    return applyPronunciations(text, this.settings.speech.pronunciations);
  }

  say(written: string, lang = this.language) {
    preferPlaybackAudio();
    const options = this.settings.speech;
    const text = this.spoken(written);
    const device = {
      voice: options.deviceVoices[lang] ?? null,
      rate: options.rate,
      pitch: options.pitch,
      volume: options.volume,
      lang,
    };
    // The loaded app voice is the one for the language in use.
    const voiceId = options.appVoices[lang] ?? null;
    if (options.engine === 'app' && appVoice.isReady(voiceId)) {
      speech.stop();
      appVoice.engine.speak(text, options.rate, options.volume).then(
        () => announce('app', text),
        () => {
          speech.speak(text, device);
          announce('device', text);
        },
      );
      return;
    }
    appVoice.engine.stop();
    speech.speak(text, device);
    announce('device', text);
  }
}

/** Tells listeners (tests, for now) which voice said what. */
function announce(engine: 'device' | 'app', text: string) {
  if (text.trim() === '') return;
  dispatchEvent(new CustomEvent('anyaac:speak', { detail: { engine, text } }));
}

export const app = new AppState();
