import { beforeEach, describe, expect, it } from 'vitest';
import { Scanner, type Clock, type ScanNode, type ScanTiming } from '../src/lib/access/scan';

/** A clock that only moves when the test says so. */
class FakeClock implements Clock {
  time = 0;
  private timers = new Map<number, { at: number; callback: () => void }>();
  private next = 1;
  now = () => this.time;
  set = (callback: () => void, ms: number) => {
    const id = this.next++;
    this.timers.set(id, { at: this.time + ms, callback });
    return id;
  };
  clear = (id: unknown) => void this.timers.delete(id as number);
  tick(ms: number) {
    const end = this.time + ms;
    for (;;) {
      const due = [...this.timers]
        .filter(([, t]) => t.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      this.timers.delete(due[0]);
      this.time = due[1].at;
      due[1].callback();
    }
    this.time = end;
  }
}

const item = (id: string): ScanNode => ({ id, label: id });
const group = (id: string, ...ids: string[]): ScanNode => ({
  id,
  label: id,
  children: ids.map(item),
});
const ROOT: ScanNode = {
  id: 'root',
  label: '',
  children: [group('row1', 'I', 'want'), group('row2', 'go', 'stop'), group('bar', 'speak')],
};

let clock: FakeClock;
let timing: ScanTiming;
let seen: (string | null)[];
let chosen: string[];
let scanner: Scanner;

beforeEach(() => {
  clock = new FakeClock();
  timing = {
    method: 'auto',
    speedMs: 1000,
    firstDelayMs: 500,
    loops: 2,
    autoRestart: false,
    ignoreRepeatMs: 0,
  };
  seen = [];
  chosen = [];
  scanner = new Scanner(
    () => timing,
    { highlight: (n) => seen.push(n?.id ?? null), choose: (n) => chosen.push(n.id) },
    clock,
  );
  scanner.setRoot(ROOT);
});

describe('auto scanning', () => {
  it('waits for a switch, then moves by itself, with extra time on the first item', () => {
    clock.tick(5000);
    expect(seen).toEqual([]);
    scanner.press(1);
    expect(seen).toEqual(['row1']);
    clock.tick(1000);
    expect(seen).toEqual(['row1']);
    clock.tick(500);
    expect(seen).toEqual(['row1', 'row2']);
    clock.tick(1000);
    expect(seen.at(-1)).toBe('bar');
  });

  it('goes into a group and chooses an item', () => {
    scanner.press(1);
    clock.tick(1500); // row2
    scanner.press(1);
    expect(scanner.current?.id).toBe('go');
    clock.tick(1500); // stop
    scanner.press(1);
    expect(chosen).toEqual(['stop']);
    expect(scanner.current).toBeNull();
  });

  it('chooses a group of one item straight away', () => {
    scanner.press(1);
    clock.tick(2500); // bar
    scanner.press(1);
    expect(chosen).toEqual(['speak']);
  });

  it('goes back up after the loops run out, and stops at the top', () => {
    scanner.press(1);
    scanner.press(1); // into row1
    clock.tick(1500 + 1000 + 1500 + 1000); // two loops of I, want
    expect(scanner.current?.id).toBe('row1');
    clock.tick(30_000);
    expect(scanner.current).toBeNull();
    expect(seen.at(-1)).toBeNull();
  });

  it('starts again after choosing, when asked to', () => {
    timing.autoRestart = true;
    scanner.press(1);
    scanner.press(1);
    scanner.press(1); // I
    expect(chosen).toEqual(['I']);
    // The screen changes after a choice; the restart still happens.
    scanner.setRoot(ROOT);
    clock.tick(1000);
    expect(scanner.current?.id).toBe('row1');
  });
});

describe('step scanning (two switches)', () => {
  beforeEach(() => (timing.method = 'step'));

  it('moves with switch 1 and chooses with switch 2, never by itself', () => {
    scanner.press(1);
    clock.tick(10_000);
    expect(scanner.current?.id).toBe('row1');
    scanner.press(1);
    expect(scanner.current?.id).toBe('row2');
    scanner.press(2);
    scanner.press(1);
    expect(scanner.current?.id).toBe('stop');
    scanner.press(2);
    expect(chosen).toEqual(['stop']);
  });

  it('leaves a group after one pass', () => {
    scanner.press(1);
    scanner.press(2); // into row1
    scanner.press(1); // want
    scanner.press(1); // past the end: back to row1
    expect(scanner.current?.id).toBe('row1');
  });
});

describe('inverse scanning (hold to move)', () => {
  beforeEach(() => (timing.method = 'inverse'));

  it('moves while held and chooses once let go', () => {
    scanner.press(1);
    expect(scanner.current?.id).toBe('row1');
    clock.tick(1000);
    expect(scanner.current?.id).toBe('row2');
    scanner.release(1);
    clock.tick(999);
    expect(chosen).toEqual([]);
    clock.tick(1);
    expect(scanner.current?.id).toBe('go'); // into row2
    scanner.press(1);
    clock.tick(1000);
    scanner.release(1);
    clock.tick(1000);
    expect(chosen).toEqual(['stop']);
  });

  it('keeps moving if the switch is pressed again in time', () => {
    scanner.press(1);
    scanner.release(1);
    clock.tick(500);
    scanner.press(1);
    clock.tick(1000);
    scanner.release(1);
    clock.tick(1000);
    expect(scanner.current?.id).toBe('go');
  });
});

describe('a changing screen', () => {
  it('keeps the place when the highlighted item is still there', () => {
    timing.method = 'step';
    scanner.press(1);
    scanner.press(1); // row2
    scanner.setRoot({ ...ROOT, children: [group('new', 'x'), ...ROOT.children!] });
    expect(scanner.current?.id).toBe('row2');
    scanner.press(1);
    expect(scanner.current?.id).toBe('bar');
  });

  it('stops when it is gone', () => {
    scanner.press(1);
    scanner.setRoot({ id: 'root', label: '', children: [group('other', 'x')] });
    expect(scanner.current).toBeNull();
  });
});

describe('repeat presses', () => {
  it('count once inside the repeat window', () => {
    timing.method = 'step';
    timing.ignoreRepeatMs = 300;
    scanner.press(1);
    clock.tick(100);
    scanner.press(1);
    expect(scanner.current?.id).toBe('row1');
    clock.tick(300);
    scanner.press(1);
    expect(scanner.current?.id).toBe('row2');
  });
});
