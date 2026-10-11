import { describe, expect, it } from 'vitest';
import { TouchSelector, type Clock, type TouchSettings } from '../src/lib/access/touch';

function setup(settings: Partial<TouchSettings> = {}) {
  let now = 0;
  const pending: { at: number; run: () => void; id: number }[] = [];
  let nextId = 1;
  const clock: Clock = {
    now: () => now,
    setTimeout: (run, ms) => {
      const id = nextId++;
      pending.push({ at: now + ms, run, id });
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimeout: (timer) => {
      const i = pending.findIndex((p) => p.id === (timer as unknown as number));
      if (i >= 0) pending.splice(i, 1);
    },
  };
  const advance = (ms: number) => {
    now += ms;
    for (const p of pending.filter((p) => p.at <= now)) {
      pending.splice(pending.indexOf(p), 1);
      p.run();
    }
  };
  const selected: string[] = [];
  const events: string[] = [];
  const all: TouchSettings = { holdMs: 0, selectOnRelease: false, ignoreRepeatMs: 0, ...settings };
  const selector = new TouchSelector<string>(
    () => all,
    {
      select: (t) => selected.push(t),
      holdStart: (t, ms) => events.push(`start ${t} ${ms}`),
      holdEnd: () => events.push('end'),
    },
    clock,
  );
  return { selector, selected, events, advance };
}

describe('TouchSelector', () => {
  it('chooses on first touch by default', () => {
    const { selector, selected } = setup();
    selector.down('want');
    expect(selected).toEqual(['want']);
    selector.up('want');
    expect(selected).toEqual(['want']);
  });

  it('with select-on-release, chooses what is under the finger when it lifts', () => {
    const { selector, selected } = setup({ selectOnRelease: true });
    selector.down('want');
    expect(selected).toEqual([]);
    selector.move('go');
    selector.up('go');
    expect(selected).toEqual(['go']);
  });

  it('with select-on-release, lifting off the board chooses nothing', () => {
    const { selector, selected } = setup({ selectOnRelease: true });
    selector.down('want');
    selector.up(null);
    expect(selected).toEqual([]);
  });

  it('with a hold time, chooses only once the hold completes', () => {
    const { selector, selected, events, advance } = setup({ holdMs: 500 });
    selector.down('want');
    expect(events).toEqual(['start want 500']);
    advance(499);
    expect(selected).toEqual([]);
    advance(1);
    expect(selected).toEqual(['want']);
    expect(events).toEqual(['start want 500', 'end']);
    selector.up('want');
    expect(selected).toEqual(['want']);
  });

  it('with a hold time, a short tap chooses nothing', () => {
    const { selector, selected, events, advance } = setup({ holdMs: 500 });
    selector.down('want');
    advance(200);
    selector.up('want');
    advance(1000);
    expect(selected).toEqual([]);
    expect(events).toEqual(['start want 500', 'end']);
  });

  it('with a hold time, sliding off the button abandons the hold', () => {
    const { selector, selected, advance } = setup({ holdMs: 500 });
    selector.down('want');
    advance(300);
    selector.move('want');
    selector.move('go');
    advance(1000);
    expect(selected).toEqual([]);
  });

  it('hold takes priority over select-on-release', () => {
    const { selector, selected, advance } = setup({ holdMs: 300, selectOnRelease: true });
    selector.down('want');
    selector.up('want');
    expect(selected).toEqual([]);
    selector.down('go');
    advance(300);
    selector.up('go');
    expect(selected).toEqual(['go']);
  });

  it('ignores a second choice that comes too soon', () => {
    const { selector, selected, advance } = setup({ ignoreRepeatMs: 400 });
    selector.down('want');
    advance(100);
    selector.down('want');
    advance(299);
    selector.activate('go');
    advance(1);
    selector.down('go');
    expect(selected).toEqual(['want', 'go']);
  });

  it('a cancelled pointer chooses nothing', () => {
    const { selector, selected, advance } = setup({ holdMs: 500 });
    selector.down('want');
    selector.cancel();
    advance(1000);
    expect(selected).toEqual([]);
  });

  it('keyboard activation skips hold and release rules', () => {
    const { selector, selected } = setup({ holdMs: 2000, selectOnRelease: true });
    selector.activate('want');
    expect(selected).toEqual(['want']);
  });
});
