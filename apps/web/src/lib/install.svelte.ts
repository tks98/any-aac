/**
 * Installing the app to the Home Screen. Installed, it opens full screen and
 * the browser keeps its storage (iOS can clear a website's data after a week
 * unused). Chrome and Edge offer an install prompt; iOS needs Share → Add to
 * Home Screen.
 */

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED = 'open-aac-install-dismissed';

function storedDismissal(): boolean {
  try {
    return localStorage.getItem(DISMISSED) === '1';
  } catch {
    return false;
  }
}

class Install {
  private prompt = $state.raw<InstallPromptEvent | null>(null);
  private dismissed = $state(storedDismissal());
  private installed = $state(
    typeof matchMedia !== 'undefined' &&
      (matchMedia('(display-mode: standalone)').matches ||
        (navigator as { standalone?: boolean }).standalone === true),
  );
  /** iPhone and iPad (iPadOS says it's a Mac, but has touch). */
  readonly ios =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1));

  /** Whether to suggest installing, and how. */
  offer = $derived.by(() => {
    if (this.installed || this.dismissed) return null;
    if (this.prompt) return 'prompt' as const;
    return this.ios ? ('ios' as const) : null;
  });

  listen() {
    addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.prompt = event as InstallPromptEvent;
    });
    addEventListener('appinstalled', () => (this.installed = true));
  }

  async install() {
    const prompt = this.prompt;
    if (!prompt) return;
    await prompt.prompt();
    if ((await prompt.userChoice).outcome === 'accepted') this.installed = true;
    this.prompt = null;
  }

  dismiss() {
    this.dismissed = true;
    try {
      localStorage.setItem(DISMISSED, '1');
    } catch {
      // It'll ask again next time; that's fine.
    }
  }
}

export const install = new Install();
