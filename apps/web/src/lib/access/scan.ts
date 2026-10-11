/**
 * Switch scanning: a highlight steps through groups (rows, columns) and items
 * (words, buttons), and a switch chooses. Pure logic with an injectable clock,
 * so the timing can be tested; scanning.svelte.ts connects it to the screen.
 *
 * - auto: the highlight moves by itself; any switch chooses.
 * - step: switch 1 moves the highlight, switch 2 chooses.
 * - inverse: holding switch 1 moves the highlight; letting go stops it, and
 *   the item is chosen if the switch isn't pressed again within one step.
 */

export interface ScanNode {
  id: string;
  /** What auditory scanning says for it. */
  label: string;
  /** A group (row, column, toolbar); choosing it scans its children. */
  children?: ScanNode[];
}

export type ScanMethod = 'auto' | 'step' | 'inverse';

export interface ScanTiming {
  method: ScanMethod;
  /** Time on each item. */
  speedMs: number;
  /** Extra time on the first item of a group, to get ready. */
  firstDelayMs: number;
  /** Times round a group before going back up (auto scanning). */
  loops: number;
  /** Start again from the top after choosing. Off: wait for a switch. */
  autoRestart: boolean;
  /** Presses closer together than this count once. */
  ignoreRepeatMs: number;
}

export interface ScanHooks {
  /** The highlight moved (null: nothing highlighted). */
  highlight: (node: ScanNode | null) => void;
  /** An item was chosen. */
  choose: (node: ScanNode) => void;
}

export interface Clock {
  now(): number;
  set(callback: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

const realClock: Clock = {
  now: () => performance.now(),
  set: (callback, ms) => setTimeout(callback, ms),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

interface Level {
  nodes: ScanNode[];
  index: number;
  loops: number;
}

export class Scanner {
  private root: ScanNode = { id: 'root', label: '', children: [] };
  private levels: Level[] = [];
  private timer: unknown = null;
  private held = false;
  private lastPress = -Infinity;

  constructor(
    private readonly timing: () => ScanTiming,
    private readonly hooks: ScanHooks,
    private readonly clock: Clock = realClock,
  ) {}

  /** The highlighted node, or null when scanning is waiting for a switch. */
  get current(): ScanNode | null {
    const level = this.levels.at(-1);
    return level ? (level.nodes[level.index] ?? null) : null;
  }

  /**
   * Replaces what is scanned (the screen changed). A scan in progress keeps its
   * place if the highlighted group or item is still there, and stops if not; a
   * restart already due after a choice goes ahead with the new screen.
   */
  setRoot(root: ScanNode) {
    this.root = root;
    if (this.levels.length === 0) return;
    const levels: Level[] = [];
    let nodes = root.children ?? [];
    for (const level of this.levels) {
      const id = level.nodes[level.index]?.id;
      const index = nodes.findIndex((node) => node.id === id);
      if (index < 0) return this.stop();
      levels.push({ nodes, index, loops: level.loops });
      nodes = nodes[index]!.children ?? [];
    }
    this.levels = levels;
    this.hooks.highlight(this.current);
  }

  stop() {
    this.clearTimer();
    this.held = false;
    if (this.levels.length > 0) {
      this.levels = [];
      this.hooks.highlight(null);
    }
  }

  /** Starts again from the top, as after a choice. */
  restart() {
    this.clearTimer();
    this.levels = [];
    this.start();
  }

  press(sw: 1 | 2) {
    const now = this.clock.now();
    if (now - this.lastPress < this.timing().ignoreRepeatMs) return;
    this.lastPress = now;
    const { method } = this.timing();
    if (this.levels.length === 0) {
      this.start();
      if (method === 'inverse' && sw === 1) this.hold();
      return;
    }
    if (method === 'auto') return this.choose();
    if (method === 'step') return sw === 1 ? this.next() : this.choose();
    if (sw === 1) this.hold();
    else this.choose();
  }

  release(sw: 1 | 2) {
    if (this.timing().method !== 'inverse' || sw !== 1 || !this.held) return;
    this.held = false;
    this.clearTimer();
    // Chosen unless the switch is pressed again within one step.
    this.timer = this.clock.set(() => this.choose(), this.timing().speedMs);
  }

  private start() {
    const nodes = this.root.children ?? [];
    if (nodes.length === 0) return;
    this.levels = [{ nodes, index: 0, loops: 0 }];
    this.show(true);
  }

  private hold() {
    this.held = true;
    this.clearTimer();
    const step = () => {
      this.next();
      if (this.held) this.timer = this.clock.set(step, this.timing().speedMs);
    };
    this.timer = this.clock.set(step, this.timing().speedMs);
  }

  /** Highlights the current node and, for auto scanning, schedules the next step. */
  private show(first = false) {
    this.hooks.highlight(this.current);
    if (this.timing().method !== 'auto') return;
    this.clearTimer();
    const { speedMs, firstDelayMs } = this.timing();
    this.timer = this.clock.set(() => this.next(), speedMs + (first ? firstDelayMs : 0));
  }

  private next() {
    const level = this.levels.at(-1);
    if (!level) return;
    level.index++;
    if (level.index >= level.nodes.length) {
      level.index = 0;
      level.loops++;
      const { method, loops } = this.timing();
      // Auto scanning gives up after some loops; step and hold go back up after one.
      const done = method === 'auto' ? level.loops >= loops : this.levels.length > 1;
      if (done) return this.up();
    }
    this.show(level.index === 0);
  }

  /** Back to the group above, or stop at the top. */
  private up() {
    if (this.levels.length <= 1) {
      this.stop();
      return;
    }
    this.levels.pop();
    this.levels.at(-1)!.loops = 0;
    this.show();
  }

  private choose() {
    this.clearTimer();
    let node = this.current;
    if (!node) return;
    // A group of one is the same as its item.
    while (node.children?.length === 1) node = node.children[0]!;
    if (node.children && node.children.length > 0) {
      this.levels.push({ nodes: node.children, index: 0, loops: 0 });
      this.show(true);
      return;
    }
    this.levels = [];
    this.hooks.highlight(null);
    this.hooks.choose(node);
    if (this.timing().autoRestart) {
      this.timer = this.clock.set(() => this.start(), this.timing().speedMs);
    }
  }

  private clearTimer() {
    if (this.timer !== null) this.clock.clear(this.timer);
    this.timer = null;
  }
}
