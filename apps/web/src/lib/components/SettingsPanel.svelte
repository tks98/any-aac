<script lang="ts">
  import { ObfError, type BoardSet } from '@open-aac/core';
  import { downloadBoards, readBoardFile } from '../files';
  import { ICONS } from '../icons';
  import { appLanguage, baseLanguage, speech, type VoiceInfo } from '../speech';
  import { starterSet } from '../starter';
  import { app } from '../state.svelte';
  import { saveBoards } from '../storage';
  import Icon from './Icon.svelte';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  const SECTIONS = [
    { id: 'speech', name: 'Speech & voice', icon: ICONS.speak },
    { id: 'touch', name: 'Touch', icon: ICONS.touch },
    { id: 'display', name: 'Display', icon: ICONS.display },
    { id: 'boards', name: 'Boards & backup', icon: ICONS.boards },
    { id: 'about', name: 'About', icon: ICONS.about },
  ] as const;
  type SectionId = (typeof SECTIONS)[number]['id'];

  let dialog: HTMLDialogElement;
  let section = $state<SectionId>('speech');
  let voices = $state<VoiceInfo[]>([]);
  let status = $state('');
  let fixes = $state<string[]>([]);

  const isMain = (v: VoiceInfo) => !v.novelty && baseLanguage(v.lang) === baseLanguage(appLanguage);
  const myVoices = $derived(voices.filter(isMain));
  const otherVoices = $derived(voices.filter((v) => !isMain(v)));
  const s = $derived(app.settings);

  $effect(() => {
    if (open && !dialog.open) {
      status = '';
      fixes = [];
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  $effect(() => {
    if (!open) return;
    voices = speech.voices();
    return speech.onVoicesChanged(() => (voices = speech.voices()));
  });

  const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

  async function replaceBoards(set: BoardSet, done: string) {
    app.load(set);
    try {
      await saveBoards(set);
      status = done;
    } catch {
      status = `${done} They could not be saved on this device, so they will be gone when the app closes.`;
    }
  }

  async function importFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    fixes = [];
    try {
      const { set, issues } = await readBoardFile(file);
      const count = set.boards.length === 1 ? '1 board' : `${set.boards.length} boards`;
      if (!confirm(`Replace all boards on this device with ${count} from “${file.name}”?`)) return;
      await replaceBoards(set, `Imported ${count}.`);
      fixes = issues.map((issue) => issue.message);
    } catch (error) {
      status = error instanceof ObfError ? error.message : 'That file could not be read.';
    }
  }

  function exportAll() {
    if (!app.set) return;
    downloadBoards(app.set);
    status = 'Exported a copy of all boards.';
  }

  async function reset() {
    if (!confirm('Replace all boards on this device with the starter boards?')) return;
    await replaceBoards(starterSet(), 'Starter boards restored.');
  }
</script>

{#snippet toggle(label: string, help: string, checked: boolean, change: (on: boolean) => void)}
  <div class="row">
    <div class="text">
      <span class="label">{label}</span>
      {#if help}<span class="help">{help}</span>{/if}
    </div>
    <button
      class="switch"
      class:on={checked}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onclick={() => change(!checked)}
    >
      <span class="knob" aria-hidden="true"></span>
    </button>
  </div>
{/snippet}

{#snippet slider(
  label: string,
  help: string,
  value: number,
  min: number,
  max: number,
  step: number,
  shown: string,
  change: (value: number) => void,
)}
  <div class="row">
    <div class="text">
      <span class="label">{label}</span>
      {#if help}<span class="help">{help}</span>{/if}
    </div>
    <div class="slider">
      <input
        type="range"
        aria-label={label}
        aria-valuetext={shown}
        {min}
        {max}
        {step}
        {value}
        oninput={(event) => change(Number(event.currentTarget.value))}
      />
      <span class="value">{shown}</span>
    </div>
  </div>
{/snippet}

{#snippet voiceOption(voice: VoiceInfo)}
  <label class="voice">
    <input
      type="radio"
      name="voice"
      checked={s.speech.voice === voice.key}
      onchange={() => (app.settings.speech.voice = voice.key)}
    />
    <span class="voice-name">{voice.name}</span>
    <span class="voice-meta">{voice.lang} · {voice.local ? 'works offline' : 'needs internet'}</span
    >
  </label>
{/snippet}

<dialog bind:this={dialog} aria-labelledby="settings-title" onclose={() => (open = false)}>
  <header>
    <h2 id="settings-title">Settings</h2>
    <button class="done" onclick={() => (open = false)}>Done</button>
  </header>

  <div class="layout">
    <nav aria-label="Settings sections">
      {#each SECTIONS as item (item.id)}
        <button
          class:current={section === item.id}
          aria-current={section === item.id ? 'page' : undefined}
          onclick={() => (section = item.id)}
        >
          <Icon path={item.icon} size={22} />
          {item.name}
        </button>
      {/each}
    </nav>

    <main>
      {#if section === 'speech'}
        <h3>Speech & voice</h3>
        <div class="card">
          {@render toggle(
            'Speak each word when tapped',
            'Off: words only build the message until Speak is pressed.',
            s.speech.speakEachWord,
            (on) => (app.settings.speech.speakEachWord = on),
          )}
          {@render slider(
            'Speaking rate',
            '',
            s.speech.rate,
            0.5,
            2,
            0.1,
            `${s.speech.rate.toFixed(1)}×`,
            (v) => (app.settings.speech.rate = v),
          )}
          {@render slider(
            'Pitch',
            '',
            s.speech.pitch,
            0.5,
            1.5,
            0.1,
            `${s.speech.pitch.toFixed(1)}×`,
            (v) => (app.settings.speech.pitch = v),
          )}
          <div class="row">
            <div class="text">
              <span class="label">Try it</span>
            </div>
            <button class="action" onclick={() => app.say('Hello. This is how I sound.')}>
              <Icon path={ICONS.speak} size={22} />
              Test voice
            </button>
          </div>
        </div>

        <fieldset class="card voices">
          <legend>Voice</legend>
          <p class="help">
            The voices this device offers. Voices that work offline keep speaking without internet.
          </p>
          <label class="voice">
            <input
              type="radio"
              name="voice"
              checked={s.speech.voice === null}
              onchange={() => (app.settings.speech.voice = null)}
            />
            <span class="voice-name">Device default</span>
            <span class="voice-meta">Picks an offline voice in your language when there is one</span
            >
          </label>
          {#each myVoices as voice (voice.key)}
            {@render voiceOption(voice)}
          {/each}
          {#if otherVoices.length > 0}
            <details>
              <summary>Other voices ({otherVoices.length})</summary>
              {#each otherVoices as voice (voice.key)}
                {@render voiceOption(voice)}
              {/each}
            </details>
          {/if}
          {#if voices.length === 0}
            <p class="help">This browser hasn't listed any voices yet.</p>
          {/if}
        </fieldset>
      {:else if section === 'touch'}
        <h3>Touch</h3>
        <p class="intro">When a touch on a word counts. These apply to the board.</p>
        <div class="card">
          {@render slider(
            'Hold to select',
            'How long a finger must stay on a word. 0 chooses it on first touch.',
            s.touch.holdMs,
            0,
            2000,
            100,
            seconds(s.touch.holdMs),
            (v) => (app.settings.touch.holdMs = v),
          )}
          {@render toggle(
            'Select when finger lifts',
            'Lets the finger slide to the right word before choosing it.',
            s.touch.selectOnRelease,
            (on) => (app.settings.touch.selectOnRelease = on),
          )}
          {@render slider(
            'Ignore repeat taps for',
            'Stops one tap from counting twice.',
            s.touch.ignoreRepeatMs,
            0,
            2000,
            100,
            seconds(s.touch.ignoreRepeatMs),
            (v) => (app.settings.touch.ignoreRepeatMs = v),
          )}
          {@render slider(
            'Space between buttons',
            'More space suits keyguards and tremor.',
            s.display.buttonGap,
            0,
            32,
            2,
            `${s.display.buttonGap} px`,
            (v) => (app.settings.display.buttonGap = v),
          )}
        </div>
      {:else if section === 'display'}
        <h3>Display</h3>
        <div class="card">
          <div class="row">
            <div class="text">
              <span class="label">Labels</span>
            </div>
            <div class="segmented" role="group" aria-label="Labels">
              <button
                aria-pressed={s.display.labelPosition === 'below'}
                class:on={s.display.labelPosition === 'below'}
                onclick={() => (app.settings.display.labelPosition = 'below')}
              >
                Below symbol
              </button>
              <button
                aria-pressed={s.display.labelPosition === 'above'}
                class:on={s.display.labelPosition === 'above'}
                onclick={() => (app.settings.display.labelPosition = 'above')}
              >
                Above symbol
              </button>
            </div>
          </div>
          {@render toggle(
            'Show symbols',
            'Off: words only, in larger text.',
            s.display.showSymbols,
            (on) => (app.settings.display.showSymbols = on),
          )}
        </div>
      {:else if section === 'boards'}
        <h3>Boards & backup</h3>
        <p class="intro">
          Boards are stored on this device only. Export a copy now and then so they can't be lost.
        </p>
        <div class="actions">
          <label class="action">
            <Icon path={ICONS.import} size={24} />
            Import boards
            <input
              class="visually-hidden"
              type="file"
              accept=".obz,.obf,application/zip,application/json"
              onchange={importFile}
            />
          </label>
          <button class="action" onclick={exportAll}>
            <Icon path={ICONS.export} size={24} />
            Export all boards
          </button>
          <button class="action" onclick={reset}>
            <Icon path={ICONS.reset} size={24} />
            Reset to starter boards
          </button>
        </div>
        {#if status}
          <p class="status" role="status">{status}</p>
        {/if}
        {#if fixes.length > 0}
          <details>
            <summary>{fixes.length} small problems were fixed while importing</summary>
            <ul>
              {#each fixes.slice(0, 50) as fix, i (i)}
                <li>{fix}</li>
              {/each}
            </ul>
          </details>
        {/if}
      {:else}
        <h3>About</h3>
        <div class="card prose">
          <p>
            Open AAC is free, open-source software, licensed under the
            <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noreferrer"
              >GNU AGPL v3 or later</a
            >. The source is at
            <a href="https://github.com/tks98/open-aac" target="_blank" rel="noreferrer"
              >github.com/tks98/open-aac</a
            >.
          </p>
          <p>
            The starter vocabulary and pictograms are placeholders by Open AAC contributors,
            licensed
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noreferrer">CC BY-SA 4.0</a
            >.
          </p>
          <p>Text is set in Atkinson Hyperlegible Next (SIL Open Font License).</p>
          <p>Open AAC collects nothing. Your boards and settings stay on this device.</p>
        </div>
      {/if}
    </main>
  </div>
</dialog>

<style>
  dialog {
    width: 100vw;
    max-width: none;
    height: 100dvh;
    max-height: none;
    margin: 0;
    padding: 0;
    border: none;
    background: #f3f5f7;
    color: var(--ink);
    user-select: text;
  }

  dialog[open] {
    display: flex;
    flex-direction: column;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: max(12px, env(safe-area-inset-top)) 20px 12px;
    background: var(--surface);
    border-bottom: 1px solid #d5dce3;
  }

  h2 {
    margin: 0;
    font-size: 1.6rem;
  }

  .done {
    min-height: 52px;
    padding: 0 28px;
    border: none;
    border-radius: 12px;
    background: var(--accent);
    color: var(--accent-ink);
    font-size: 1.1rem;
    font-weight: 800;
    cursor: pointer;
  }

  .layout {
    flex: 1;
    min-height: 0;
    display: flex;
  }

  nav {
    width: 250px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px 12px;
    background: var(--surface);
    border-right: 1px solid #d5dce3;
    overflow-y: auto;
  }

  nav button {
    min-height: 50px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    border: none;
    border-radius: 12px;
    background: transparent;
    font-size: 1.05rem;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }

  nav button.current {
    background: #e8effc;
    font-weight: 800;
  }

  main {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    padding: 24px max(28px, env(safe-area-inset-right)) max(28px, env(safe-area-inset-bottom)) 28px;
  }

  h3 {
    margin: 0 0 12px;
    font-size: 1.5rem;
  }

  .intro {
    margin: -4px 0 16px;
    color: var(--muted);
  }

  .card {
    margin: 0 0 20px;
    padding: 0;
    border: 1px solid #d5dce3;
    border-radius: 16px;
    background: var(--surface);
    overflow: hidden;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 20px;
    min-height: 72px;
    padding: 12px 20px;
  }

  .row + .row {
    border-top: 1px solid #e4e9ee;
  }

  .text {
    flex: 1 1 240px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .label {
    font-size: 1.1rem;
    font-weight: 700;
  }

  .help {
    margin: 0;
    color: var(--muted);
    line-height: 1.35;
  }

  .switch {
    width: 60px;
    height: 34px;
    flex-shrink: 0;
    display: flex;
    padding: 3px;
    border: none;
    border-radius: 17px;
    background: #8a97a3;
    cursor: pointer;
  }

  .switch.on {
    justify-content: flex-end;
    background: var(--accent);
  }

  .knob {
    width: 28px;
    height: 28px;
    border-radius: 14px;
    background: #ffffff;
  }

  .slider {
    flex: 0 1 340px;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .slider input {
    flex: 1;
    min-width: 0;
    height: 32px;
    accent-color: var(--accent);
  }

  .value {
    width: 64px;
    text-align: right;
    font-size: 1.1rem;
    font-weight: 800;
  }

  .segmented {
    display: flex;
    gap: 4px;
    padding: 4px;
    border-radius: 14px;
    background: #eef2f6;
  }

  .segmented button {
    min-height: 44px;
    padding: 0 16px;
    border: none;
    border-radius: 10px;
    background: transparent;
    font-weight: 600;
    cursor: pointer;
  }

  .segmented button.on {
    background: #ffffff;
    font-weight: 800;
    box-shadow: 0 1px 3px rgb(21 32 43 / 0.2);
  }

  .voices {
    padding: 16px 20px;
  }

  legend {
    float: left;
    width: 100%;
    margin-bottom: 4px;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .voices > .help {
    margin-bottom: 8px;
  }

  .voice {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 12px;
    align-items: center;
    padding: 10px 0;
    border-top: 1px solid #e4e9ee;
    cursor: pointer;
  }

  .voice input {
    grid-row: span 2;
    width: 22px;
    height: 22px;
    accent-color: var(--accent);
  }

  .voice-name {
    font-weight: 700;
  }

  .voice-meta {
    color: var(--muted);
    font-size: 0.95rem;
  }

  details {
    margin-top: 8px;
  }

  summary {
    padding: 10px 0;
    font-weight: 700;
    cursor: pointer;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 480px;
  }

  .action {
    min-height: 56px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 18px;
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    font-size: 1.05rem;
    font-weight: 700;
    cursor: pointer;
  }

  .status {
    margin: 18px 0 0;
    font-weight: 700;
  }

  .prose {
    padding: 4px 20px;
    line-height: 1.5;
  }

  button:focus-visible,
  .action:focus-within,
  input:focus-visible,
  summary:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }

  @media (max-width: 599px) {
    .layout {
      flex-direction: column;
    }

    nav {
      width: auto;
      flex-direction: row;
      padding: 8px;
      overflow-x: auto;
      border-right: none;
      border-bottom: 1px solid #d5dce3;
    }

    nav button {
      flex-shrink: 0;
      min-height: 44px;
      white-space: nowrap;
    }

    main {
      padding: 16px;
    }
  }
</style>
