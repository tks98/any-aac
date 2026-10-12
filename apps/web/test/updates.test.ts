import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** What registerSW was given, so the test can play the service worker's part. */
let worker: { onNeedRefresh?: () => void };
const install = vi.fn(async () => {});

vi.mock('virtual:pwa-register', () => ({
  registerSW: (options: typeof worker) => {
    worker = options;
    return install;
  },
}));

// Fresh for each test, so no earlier test's listeners hear its events.
let page: EventTarget & { visibilityState: string };
let serviceWorker: EventTarget;
const reload = vi.fn();

/** The new version (or the first one) takes over the page. */
const takeOver = () => serviceWorker.dispatchEvent(new Event('controllerchange'));

function putAway() {
  page.visibilityState = 'hidden';
  page.dispatchEvent(new Event('visibilitychange'));
}

async function load(canInstall: () => boolean) {
  vi.resetModules();
  const { updates } = await import('../src/lib/updates.svelte');
  updates.start(canInstall);
  return updates;
}

describe('updates', () => {
  beforeEach(() => {
    page = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    serviceWorker = new EventTarget();
    vi.stubGlobal('document', page);
    vi.stubGlobal('navigator', { serviceWorker, onLine: true });
    vi.stubGlobal('location', { reload });
    install.mockClear();
    reload.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('installs a waiting version when the app is put away with nothing going on', async () => {
    const updates = await load(() => true);
    // A first install takes over too, but isn't an update.
    takeOver();
    putAway();
    expect(install).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();

    worker.onNeedRefresh!();
    expect(updates.ready).toBe(true);
    putAway();
    await vi.waitFor(() => expect(install).toHaveBeenCalledOnce());

    // The new version takes over, and the app reloads into it.
    takeOver();
    expect(reload).toHaveBeenCalledOnce();
  });

  it("waits while there's a message or an edit", async () => {
    let busy = true;
    await load(() => !busy);
    worker.onNeedRefresh!();
    putAway();
    await Promise.resolve();
    expect(install).not.toHaveBeenCalled();

    busy = false;
    putAway();
    await vi.waitFor(() => expect(install).toHaveBeenCalledOnce());
  });

  it('can be installed at once', async () => {
    const updates = await load(() => false);
    worker.onNeedRefresh!();
    await updates.now();
    expect(install).toHaveBeenCalledOnce();
  });

  it('reloads a copy that another copy updated only when it is safe to', async () => {
    let busy = true;
    await load(() => !busy);
    worker.onNeedRefresh!();
    takeOver();
    expect(reload).not.toHaveBeenCalled();
    putAway();
    await Promise.resolve();
    expect(reload).not.toHaveBeenCalled();

    busy = false;
    putAway();
    await vi.waitFor(() => expect(reload).toHaveBeenCalledOnce());
  });
});
