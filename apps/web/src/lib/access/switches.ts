/**
 * Switch input while scanning: keys (what most switch interfaces send) and game
 * controllers. Taps and mouse buttons come from ScanLayer.svelte.
 */
import { app } from '../state.svelte';
import { scanning } from './scanning.svelte';

/** Space and 1 are switch 1; Enter and 2 are switch 2. */
const SWITCH_KEYS: Record<string, 1 | 2> = { ' ': 1, '1': 1, Enter: 2, '2': 2 };

/**
 * Listens for switches while scanning is on. Returns a function that stops
 * listening. Taps and mouse buttons come from the overlay (ScanOverlay.svelte).
 */
export function listenForSwitches(): () => void {
  const isTyping = (target: EventTarget | null) =>
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

  const keydown = (event: KeyboardEvent) => {
    const sw = SWITCH_KEYS[event.key];
    if (!sw || !scanning.active || !app.settings.scan.keyboard || isTyping(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) scanning.press(sw);
  };
  const keyup = (event: KeyboardEvent) => {
    const sw = SWITCH_KEYS[event.key];
    if (!sw || !scanning.active || !app.settings.scan.keyboard || isTyping(event.target)) return;
    event.preventDefault();
    scanning.release(sw);
  };
  addEventListener('keydown', keydown, { capture: true });
  addEventListener('keyup', keyup, { capture: true });

  // Game controllers: button 0 (A / cross) is switch 1, button 1 (B / circle) switch 2.
  let frame = 0;
  const pressed: Record<string, boolean> = {};
  const poll = () => {
    frame = requestAnimationFrame(poll);
    if (!scanning.active || !app.settings.scan.gamepad) return;
    for (const pad of navigator.getGamepads?.() ?? []) {
      if (!pad) continue;
      ([1, 2] as const).forEach((sw) => {
        const key = `${pad.index}-${sw}`;
        const down = pad.buttons[sw - 1]?.pressed === true;
        if (down && !pressed[key]) scanning.press(sw);
        if (!down && pressed[key]) scanning.release(sw);
        pressed[key] = down;
      });
    }
  };
  const startPolling = () => {
    if (!frame) poll();
  };
  addEventListener('gamepadconnected', startPolling);
  if ([...(navigator.getGamepads?.() ?? [])].some(Boolean)) startPolling();

  const resize = () => scanning.reposition();
  addEventListener('resize', resize);

  return () => {
    removeEventListener('keydown', keydown, { capture: true });
    removeEventListener('keyup', keyup, { capture: true });
    removeEventListener('gamepadconnected', startPolling);
    removeEventListener('resize', resize);
    cancelAnimationFrame(frame);
  };
}
