<script lang="ts">
  import { messageText } from '@open-aac/core';
  import { ICONS } from '../icons';
  import { imageSrc } from '../images';
  import { app } from '../state.svelte';
  import Icon from './Icon.svelte';

  let strip: HTMLButtonElement;

  const chips = $derived(
    app.message.map((item, index) => {
      const board = app.boardById(item.boardId);
      return {
        key: index,
        label: item.label,
        src: app.set && board ? imageSrc(app.set, board, item.imageId) : undefined,
      };
    }),
  );
  const text = $derived(messageText(app.message));
  let copied = $state(false);

  /** Shares the message as text where the device can, and copies it otherwise. */
  async function share() {
    if (!text) return;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch (error) {
      // Closing the share sheet isn't a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      // No clipboard either; nothing more to do.
    }
  }

  // Keep the newest word in view.
  $effect(() => {
    void chips.length;
    strip.scrollLeft = strip.scrollWidth;
  });
</script>

<div class="bar">
  <button
    bind:this={strip}
    class="message"
    aria-label={text ? app.t.message(text) : app.t.messageEmpty}
    onclick={() => app.speakMessage()}
  >
    {#if chips.length === 0}
      <span class="hint">{app.t.messageHint}</span>
    {/if}
    {#each chips as chip (chip.key)}
      <span class="chip">
        {#if chip.src}
          <img src={chip.src} alt="" draggable="false" />
        {/if}
        <span>{chip.label}</span>
      </span>
    {/each}
  </button>
  <button class="tool" aria-label={app.t.deleteLast} onclick={() => app.deleteLast()}>
    <Icon path={ICONS.backspace} size={40} />
  </button>
  <button class="tool" aria-label={app.t.clearMessage} onclick={() => app.clear()}>
    <Icon path={ICONS.clear} size={40} />
  </button>
  {#if app.settings.display.showShare}
    <button class="tool share" aria-label={app.t.shareMessage} onclick={share}>
      <Icon path={ICONS.share} size={36} />
      <span class="small" role="status">{copied ? app.t.copiedMessage : app.t.share}</span>
    </button>
  {/if}
  <button class="speak" onclick={() => app.speakMessage()}>
    <Icon path={ICONS.speak} size={40} />
    {app.t.speak}
  </button>
</div>

<style>
  .bar {
    display: flex;
    gap: var(--gap);
    height: clamp(76px, 13vh, 112px);
    flex-shrink: 0;
  }

  button {
    border-radius: 16px;
    border: 2px solid var(--line);
    background: var(--surface);
    cursor: pointer;
    touch-action: manipulation;
  }

  button:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }

  .message {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    overflow-x: auto;
    scrollbar-width: none;
    text-align: left;
  }

  .hint {
    padding-left: 6px;
    font-size: 1.3rem;
    color: var(--muted);
  }

  .chip {
    flex-shrink: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 4px 10px;
    border-radius: 10px;
    background: var(--chip);
    font-size: 1.15rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .share {
    flex-direction: column;
    gap: 2px;
  }

  .small {
    display: block;
    font-size: 0.85rem;
    font-weight: 700;
  }

  .chip img {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 4px;
    background: var(--symbol-card);
    pointer-events: none;
  }

  .tool {
    width: clamp(64px, 8vw, 96px);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .speak {
    width: clamp(88px, 12vw, 148px);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: none;
    background: var(--accent);
    color: var(--accent-ink);
    font-size: 1.35rem;
    font-weight: 800;
  }

  @media (max-width: 599px) {
    .tool {
      width: 52px;
    }

    .speak {
      width: 76px;
      font-size: 1rem;
    }

    .chip {
      font-size: 0.9rem;
    }

    .chip img {
      width: 1.8rem;
      height: 1.8rem;
    }

    .hint {
      font-size: 1rem;
    }
  }
</style>
