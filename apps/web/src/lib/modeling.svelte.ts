/**
 * Modeling mode, for communication partners: they tap words on the person's
 * own boards as they speak (aided language modeling). Words are said but
 * don't build the person's message. Find word shows the path to any word,
 * one step at a time. See docs/research/decisions/0006-partner-modeling.md.
 */
import { behaviorOf, findWord, spokenText, type ObfButton } from '@any-aac/core';
import { app } from './state.svelte';

class Modeling {
  active = $state(false);
  query = $state('');
  /** Which of the matches is shown. */
  choice = $state(0);
  /** How many of its steps are done. */
  step = $state(0);

  matches = $derived(
    app.set && this.query.trim() !== ''
      ? findWord(app.set, this.query, { lang: app.language, compact: app.compact })
      : [],
  );
  target = $derived(this.matches[this.choice] ?? null);
  /** The step to do next, if any. */
  next = $derived(this.target?.steps[this.step] ?? null);
  done = $derived(this.target !== null && this.step >= this.target.steps.length);

  open() {
    this.active = true;
    this.query = '';
    this.step = 0;
    app.home();
  }

  close() {
    this.active = false;
    app.home();
  }

  search(query: string) {
    this.query = query;
    this.choice = 0;
    this.restart();
  }

  choose(index: number) {
    this.choice = index;
    this.restart();
  }

  /** Back to the first step, on the home board. */
  restart() {
    this.step = 0;
    app.home();
  }

  /** A tap on the board: folders open; words are said, not added to the message. */
  tap(button: ObfButton) {
    const next = this.next;
    const isNext = next !== null && next.boardId === app.view?.id && next.button.id === button.id;
    const behavior = behaviorOf(button);
    if (behavior.kind === 'navigate') {
      if (behavior.target.id !== undefined) app.open(behavior.target.id);
    } else if (behavior.kind === 'word') {
      app.say(spokenText(button, app.language));
    }
    if (isNext) this.step++;
  }

  sayTarget() {
    if (this.target) app.say(this.target.label);
  }
}

export const modeling = new Modeling();
