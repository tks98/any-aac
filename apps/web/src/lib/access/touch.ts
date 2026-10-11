/**
 * Touch accommodations: when a touch on a button counts as choosing it.
 * Pure logic with an injectable clock, so it can be tested without a browser.
 */

export interface TouchSettings {
  /** How long a touch must stay on a button before it counts. 0 = at once. */
  holdMs: number;
  /** Choose whatever button is under the finger when it lifts, so it can slide first. */
  selectOnRelease: boolean;
  /** Ignore a new choice made this soon after the last one, so one tap can't count twice. */
  ignoreRepeatMs: number;
}

type Timer = ReturnType<typeof setTimeout>;

export interface Clock {
  now(): number;
  setTimeout(run: () => void, ms: number): Timer;
  clearTimeout(timer: Timer): void;
}

const browserClock: Clock = {
  now: () => performance.now(),
  setTimeout: (run, ms) => setTimeout(run, ms),
  clearTimeout: (timer) => clearTimeout(timer),
};

export interface TouchHandlers<T> {
  select(target: T): void;
  /** A hold has started on target; show progress for `ms`. */
  holdStart?(target: T, ms: number): void;
  /** The hold finished or was abandoned; hide progress. */
  holdEnd?(): void;
}

/**
 * Turns pointer down, move and up into choices. A hold time takes priority over
 * select-on-release: with both set, the button is chosen once the hold completes.
 */
export class TouchSelector<T> {
  private pressed: T | null = null;
  private timer: Timer | undefined;
  private lastSelected = -Infinity;

  constructor(
    private readonly settings: () => TouchSettings,
    private readonly handlers: TouchHandlers<T>,
    private readonly clock: Clock = browserClock,
  ) {}

  /** A finger or pointer went down on target. */
  down(target: T) {
    this.cancel();
    const { holdMs, selectOnRelease } = this.settings();
    if (holdMs > 0) {
      this.pressed = target;
      this.handlers.holdStart?.(target, holdMs);
      this.timer = this.clock.setTimeout(() => {
        this.timer = undefined;
        this.pressed = null;
        this.handlers.holdEnd?.();
        this.select(target);
      }, holdMs);
    } else if (selectOnRelease) {
      this.pressed = target;
    } else {
      this.select(target);
    }
  }

  /** The pointer moved; target is what's under it now (null for nothing). */
  move(target: T | null) {
    if (this.timer !== undefined && target !== this.pressed) this.cancel();
  }

  /** The pointer lifted; target is what's under it (null for nothing). */
  up(target: T | null) {
    const { holdMs, selectOnRelease } = this.settings();
    const wasPressed = this.pressed !== null;
    this.cancel();
    if (holdMs === 0 && selectOnRelease && wasPressed && target !== null) this.select(target);
  }

  /** The browser took the pointer away (a gesture, a system dialog). */
  cancel() {
    if (this.timer !== undefined) {
      this.clock.clearTimeout(this.timer);
      this.timer = undefined;
      this.handlers.holdEnd?.();
    }
    this.pressed = null;
  }

  /** Keyboard and switch activation: hold and release rules don't apply. */
  activate(target: T) {
    this.select(target);
  }

  private select(target: T) {
    const now = this.clock.now();
    if (now - this.lastSelected < this.settings().ignoreRepeatMs) return;
    this.lastSelected = now;
    this.handlers.select(target);
  }
}
