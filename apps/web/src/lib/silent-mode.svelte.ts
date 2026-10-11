/**
 * iPhone and iPad mute the device voice in silent mode (the ring/silent switch
 * or Silent Mode), whatever the page asks for, while app voices still play
 * (docs/research/findings/voices.md). Edit mode says so until an app voice is
 * ready, or someone dismisses it.
 */
import { isAppleMobile } from './platform';

const DISMISSED = 'any-aac-silent-mode-dismissed';

function storedDismissal(): boolean {
  try {
    return localStorage.getItem(DISMISSED) === '1';
  } catch {
    return false;
  }
}

class SilentMode {
  /** This device mutes the device voice in silent mode. */
  readonly mutesDeviceVoice = isAppleMobile;
  dismissed = $state(storedDismissal());

  dismiss() {
    this.dismissed = true;
    try {
      localStorage.setItem(DISMISSED, '1');
    } catch {
      // It'll say so again next time; that's fine.
    }
  }
}

export const silentMode = new SilentMode();
