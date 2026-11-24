<script lang="ts">
  import { editor } from '../editor.svelte';
  import { app } from '../state.svelte';
  import { scanning } from '../access/scanning.svelte';

  /** Holding the screen this long opens edit mode, so a caregiver can always get out. */
  const ESCAPE_MS = 3000;

  const box = $derived(scanning.box);
  const capture = $derived(scanning.active && (app.settings.scan.touch || app.settings.scan.mouse));
  let escape: ReturnType<typeof setTimeout> | undefined;
  let layer = $state<HTMLDivElement>();
  /** Pointers pressed on the layer (or on a scanned dialog) and not yet let go, with their switch. */
  let down: { id: number; sw: 1 | 2 | null }[] = [];
  const isDown = (id: number) => down.some((pointer) => pointer.id === id);

  function switchFor(event: PointerEvent): 1 | 2 | null {
    if (event.pointerType === 'mouse') {
      if (!app.settings.scan.mouse && !app.settings.scan.touch) return null;
      return event.button === 2 ? 2 : event.button === 0 ? 1 : null;
    }
    return app.settings.scan.touch ? 1 : null;
  }

  const openDialog = () => document.querySelector<HTMLDialogElement>('dialog[open]');

  /**
   * A modal dialog (word forms) sits in the top layer, above this one, so taps and
   * clicks land on it. While scanning shows it, they are still switch presses.
   */
  function inScannedDialog(event: Event) {
    return (
      event.target instanceof Element && event.target.closest('dialog[open][data-scan]') !== null
    );
  }

  function cancelEscape() {
    clearTimeout(escape);
    escape = undefined;
  }

  function press(event: PointerEvent) {
    event.preventDefault();
    if (layer?.isConnected) {
      try {
        // Keep this pointer's events here even if the press opens a dialog over the layer.
        layer.setPointerCapture(event.pointerId);
      } catch {
        // The pointer is already gone.
      }
    }
    const before = openDialog();
    const sw = switchFor(event);
    if (!isDown(event.pointerId)) down.push({ id: event.pointerId, sw });
    if (sw) scanning.press(sw);
    cancelEscape();
    escape = setTimeout(() => {
      escape = undefined;
      // Only a hold that is still going opens edit mode, and not when the press
      // itself chose something that opened (or closed) a dialog.
      if (down.length === 0 || openDialog() !== before) return;
      editor.open();
    }, ESCAPE_MS);
  }

  function onpointerdown(event: PointerEvent) {
    press(event);
  }

  function release(event: PointerEvent) {
    // The switch it pressed, as remembered when it was pressed.
    const pointer = down.find(({ id }) => id === event.pointerId);
    down = down.filter(({ id }) => id !== event.pointerId);
    cancelEscape();
    if (pointer?.sw) scanning.release(pointer.sw);
  }

  /**
   * The window lost focus or was hidden, so the pointers' pointerups may never
   * come: let go of their switches, or a "while held" scan stays held.
   */
  function letGoOfAll() {
    const held = down;
    down = [];
    cancelEscape();
    for (const { sw } of held) if (sw) scanning.release(sw);
  }

  $effect(() => {
    if (!capture) return;
    const windowDown = (event: PointerEvent) => {
      if (!inScannedDialog(event)) return;
      event.stopPropagation();
      press(event);
    };
    // A real click on a scanned dialog's button would choose it directly; scanning chooses.
    // (Scanning's own choice is a script click, which isn't trusted, so it gets through.)
    const swallow = (event: MouseEvent) => {
      if (event.isTrusted && event.detail > 0 && inScannedDialog(event)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const menu = (event: MouseEvent) => {
      if (inScannedDialog(event)) event.preventDefault();
    };
    const hidden = () => {
      if (document.visibilityState !== 'visible') letGoOfAll();
    };
    const options = { capture: true };
    addEventListener('pointerdown', windowDown, options);
    addEventListener('pointerup', release, options);
    addEventListener('pointercancel', release, options);
    addEventListener('click', swallow, options);
    addEventListener('contextmenu', menu, options);
    addEventListener('blur', letGoOfAll);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      removeEventListener('pointerdown', windowDown, options);
      removeEventListener('pointerup', release, options);
      removeEventListener('pointercancel', release, options);
      removeEventListener('click', swallow, options);
      removeEventListener('contextmenu', menu, options);
      removeEventListener('blur', letGoOfAll);
      document.removeEventListener('visibilitychange', hidden);
      letGoOfAll();
    };
  });
</script>

{#if box}
  <div
    class="highlight"
    class:fill={app.settings.scan.highlight === 'fill'}
    style:top="{box.top - 9}px"
    style:left="{box.left - 9}px"
    style:width="{box.width + 18}px"
    style:height="{box.height + 18}px"
    aria-hidden="true"
  ></div>
{/if}

{#if capture}
  <!-- Taps and clicks anywhere are switch presses while this is on. -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="capture"
    bind:this={layer}
    {onpointerdown}
    onlostpointercapture={(event) => {
      // Capture is lost without a pointerup when the layer goes away or the browser takes the
      // pointer: that is not a hold. (A normal lift also ends capture, after the pointerup.)
      if (isDown(event.pointerId)) release(event);
    }}
    oncontextmenu={(event) => event.preventDefault()}
  ></div>
{/if}

<style>
  .highlight {
    position: fixed;
    z-index: 50;
    border: 7px solid var(--scan);
    border-radius: 20px;
    pointer-events: none;
  }

  .highlight.fill {
    background: var(--scan-fill);
  }

  .capture {
    position: fixed;
    inset: 0;
    z-index: 60;
    touch-action: none;
  }
</style>
