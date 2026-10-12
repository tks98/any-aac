/**
 * Updates to the app. The service worker downloads a new version in the
 * background, and it waits until it can't interrupt anyone: it's installed
 * when the app is put away (another app opened, or the screen locked) with
 * nothing in the message and nothing being edited, so the app reopens updated,
 * on its Home board. An adult can install it at once from edit mode or
 * Settings → About.
 *
 * An app on the Home Screen is rarely closed, and a browser only looks for a
 * new version when the app starts, so it also looks whenever the app comes
 * back on screen, and every hour while it's open.
 */
import { registerSW } from 'virtual:pwa-register';
import { writesFinished } from './storage';

const CHECK_EVERY_MS = 60 * 60 * 1000;

class Updates {
  /** A new version has downloaded and is waiting to be installed. */
  ready = $state(false);
  private install: (() => Promise<void>) | null = null;
  private installing = false;
  /** Another copy of the app (in another tab) installed it; reload at the next safe moment. */
  private reloadPending = false;
  private canInstall: () => boolean = () => false;

  /** `canInstall` says whether reloading now would interrupt anyone. */
  start(canInstall: () => boolean) {
    if (!('serviceWorker' in navigator)) return;
    this.canInstall = canInstall;
    this.install = registerSW({
      onNeedRefresh: () => {
        this.ready = true;
      },
      // The plugin only calls this when the page started under an older
      // version, so it misses an app first installed in this session. The
      // controllerchange listener below handles every case instead.
      onNeedReload: () => {},
      onRegisteredSW: (_url, registration) => {
        if (registration) this.watch(registration);
      },
    });
    // The new version has taken over: from this copy of the app, or another
    // (in another tab). A first install also takes over, but isn't an update.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (this.installing) location.reload();
      else if (this.ready) this.reloadPending = true;
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'hidden' || !this.canInstall()) return;
      if (this.reloadPending) void writesFinished().then(() => location.reload());
      else if (this.ready) void this.now();
    });
  }

  /** Installs the new version: the app restarts, once anything being saved is saved. */
  async now() {
    if (!this.install || this.installing) return;
    this.installing = true;
    await writesFinished();
    await this.install();
  }

  private watch(registration: ServiceWorkerRegistration) {
    const check = () => {
      if (navigator.onLine) registration.update().catch(() => {});
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
    setInterval(check, CHECK_EVERY_MS);
  }
}

export const updates = new Updates();
