<script lang="ts">
  import { editor } from '../editor.svelte';
  import { app } from '../state.svelte';
  import { scanning } from '../access/scanning.svelte';

  /** Holding the screen this long opens edit mode, so a caregiver can always get out. */
  const ESCAPE_MS = 3000;

  const box = $derived(scanning.box);
  const capture = $derived(scanning.active && (app.settings.scan.touch || app.settings.scan.mouse));
  let escape: ReturnType<typeof setTimeout> | undefined;

  function switchFor(event: PointerEvent): 1 | 2 | null {
    if (event.pointerType === 'mouse') {
      if (!app.settings.scan.mouse && !app.settings.scan.touch) return null;
      return event.button === 2 ? 2 : event.button === 0 ? 1 : null;
    }
    return app.settings.scan.touch ? 1 : null;
  }

  function onpointerdown(event: PointerEvent) {
    event.preventDefault();
    const sw = switchFor(event);
    if (sw) scanning.press(sw);
    clearTimeout(escape);
    escape = setTimeout(() => editor.open(), ESCAPE_MS);
  }

  function onpointerup(event: PointerEvent) {
    clearTimeout(escape);
    const sw = switchFor(event);
    if (sw) scanning.release(sw);
  }
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
    {onpointerdown}
    {onpointerup}
    onpointercancel={() => clearTimeout(escape)}
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
