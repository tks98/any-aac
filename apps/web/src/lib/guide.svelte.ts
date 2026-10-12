/**
 * The getting-started guide, for the adult setting Any AAC up: how the board
 * works, that editing is behind a hold on Edit, the voice, and keeping the
 * boards safe. It opens on the first launch on a device, and from
 * Settings → About after that.
 */

const SEEN = 'any-aac-guide-seen';

function seenBefore(): boolean {
  try {
    return localStorage.getItem(SEEN) === '1';
  } catch {
    return false;
  }
}

class Guide {
  open = $state(false);

  /** A first launch: no boards were saved here before. */
  firstLaunch() {
    if (!seenBefore()) this.open = true;
  }

  show() {
    this.open = true;
  }

  close() {
    this.open = false;
    try {
      localStorage.setItem(SEEN, '1');
    } catch {
      // Not remembered; the guide only opens by itself on a first launch anyway.
    }
  }
}

export const guide = new Guide();
