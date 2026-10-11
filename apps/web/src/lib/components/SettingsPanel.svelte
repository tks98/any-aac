<script lang="ts">
  import { ObfError, type BoardSet } from '@any-aac/core';
  import { backups, exportBoards, readBackup } from '../backup.svelte';
  import { APP_LANGUAGES, type AppLanguage } from '../i18n';
  import { ICONS } from '../icons';
  import { pictureCredits } from '../credits';
  import { capitalize, nameIn, nameInSentence, nativeName } from '../languages';
  import { phrase } from '../phrases';
  import { baseLanguage, speech, type VoiceInfo } from '../speech';
  import { starterSet, type StarterId } from '../starter';
  import { VOICES, type VoiceEntry } from '../voice/catalog';
  import { appVoice } from '../voice/voice.svelte';
  import { app } from '../state.svelte';
  import { saveBoards } from '../storage';
  import Icon from './Icon.svelte';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  const t = $derived(app.t);
  const SECTIONS = $derived([
    { id: 'speech', name: t.sectionSpeech, icon: ICONS.speak },
    { id: 'language', name: t.sectionLanguage, icon: ICONS.language },
    { id: 'touch', name: t.sectionTouch, icon: ICONS.touch },
    { id: 'scanning', name: t.sectionScanning, icon: ICONS.switch },
    { id: 'display', name: t.sectionDisplay, icon: ICONS.display },
    { id: 'boards', name: t.sectionBoards, icon: ICONS.boards },
    { id: 'about', name: t.sectionAbout, icon: ICONS.about },
  ] as const);
  type SectionId = (typeof SECTIONS)[number]['id'];

  let dialog: HTMLDialogElement;
  let section = $state<SectionId>('speech');
  let voices = $state<VoiceInfo[]>([]);
  let status = $state('');
  let fixes = $state<string[]>([]);

  const isMain = (v: VoiceInfo) =>
    !v.novelty && baseLanguage(v.lang) === baseLanguage(app.language);
  const myVoices = $derived(voices.filter(isMain));
  /** App voices in the language in use, the recommended one first. */
  const appVoices = $derived(
    VOICES.filter((v) => baseLanguage(v.lang) === baseLanguage(app.language)).sort(
      (a, b) => Number(b.recommended === true) - Number(a.recommended === true),
    ),
  );
  const otherVoices = $derived(voices.filter((v) => !isMain(v)));
  const s = $derived(app.settings);

  /** The main language: the one shown when the second isn't. */
  const primary = $derived(s.language.primary ?? app.boardsLanguage);
  /** A bilingual communicator's two languages, for choosing each one's voice. */
  const bilingual = $derived(s.language.second ? [primary, s.language.second] : []);

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
    void appVoice.refreshDownloaded();
    const lang = app.language;
    voices = speech.voices(lang);
    return speech.onVoicesChanged(() => (voices = speech.voices(lang)));
  });

  async function replaceBoards(set: BoardSet, done: string) {
    app.load(set);
    try {
      await saveBoards(set);
      backups.savedAt = Date.now();
      status = done;
    } catch {
      status = `${done} ${t.couldNotSave}`;
    }
  }

  async function importFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    fixes = [];
    try {
      const { set, issues, settings } = await readBackup(file);
      const count = t.boardCount(set.boards.length);
      if (!confirm(t.confirmImport(count, file.name))) return;
      await replaceBoards(set, t.imported(count));
      if (settings && confirm(t.restoreSettings)) {
        app.settings = settings;
        status = `${status} ${t.settingsRestored}`;
      }
      fixes = issues.map((issue) => issue.message);
    } catch (error) {
      status = error instanceof ObfError ? error.message : t.unreadable;
    }
  }

  async function backUp() {
    if (!app.set) return;
    await backups.backUp(app.set, $state.snapshot(app.settings));
    status = t.backedUp;
  }

  function exportAll() {
    if (!app.set) return;
    exportBoards(app.set);
    status = t.exported;
  }

  function progressText() {
    const { loaded, total } = appVoice.progress;
    if (appVoice.status === 'downloading' && total > 0 && loaded < total) {
      return t.downloading(Math.round(loaded / 1e6), Math.round(total / 1e6));
    }
    return t.startingVoice;
  }

  /** "Mexican Spanish, male · small and fast", in the app's language. */
  function describe(voice: VoiceEntry) {
    const lang = app.appLanguage;
    const parts = [capitalize(nameIn(voice.lang, lang), lang), t[voice.gender]];
    if (voice.small) parts.push(t.smallAndFast);
    return parts.join(', ');
  }

  async function downloadVoice(voice: VoiceEntry) {
    if (await appVoice.use(voice, { download: true })) {
      app.settings.speech.appVoices[baseLanguage(voice.lang)] = voice.id;
      app.settings.speech.engine = 'app';
    }
  }

  // The app starts the chosen voice from the files on this device.
  function chooseVoice(voice: VoiceEntry) {
    app.settings.speech.appVoices[baseLanguage(voice.lang)] = voice.id;
    app.settings.speech.engine = 'app';
  }

  async function removeVoice(voice: VoiceEntry) {
    if (!confirm(t.confirmDeleteVoice(voice.name))) return;
    await appVoice.remove(voice);
    const voices = app.settings.speech.appVoices;
    const lang = baseLanguage(voice.lang);
    if (voices[lang] === voice.id) delete voices[lang];
  }

  function choosePrimary(lang: string) {
    const settings = app.settings.language;
    settings.primary = lang;
    if (settings.second === lang) settings.second = null;
    settings.usingSecond = false;
  }

  function chooseSecond(lang: string | null) {
    const settings = app.settings.language;
    settings.second = lang;
    if (lang === null) settings.usingSecond = false;
  }

  /** Shows a bilingual communicator's other language, as the switch beside Home does. */
  function useLanguage(lang: string) {
    app.settings.language.usingSecond = lang !== primary;
  }

  function addPronunciation(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const word = String(data.get('word') ?? '').trim();
    const sayAs = String(data.get('sayAs') ?? '').trim();
    if (word === '' || sayAs === '') return;
    app.settings.speech.pronunciations.push({ word, sayAs });
    form.reset();
  }

  async function reset(starter: StarterId) {
    if (!confirm(t.confirmReset)) return;
    await replaceBoards(await starterSet(starter), t.restored);
    // Show the new boards in their own language.
    app.settings.language.primary = null;
    app.settings.language.usingSecond = false;
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

{#snippet choice(
  label: string,
  help: string,
  options: { value: string; name: string; lang?: string }[],
  selected: string,
  change: (value: string) => void,
)}
  <div class="row">
    <div class="text">
      <span class="label">{label}</span>
      {#if help}<span class="help">{help}</span>{/if}
    </div>
    <div class="segmented" role="group" aria-label={label}>
      {#each options as option (option.value)}
        <button
          lang={option.lang}
          aria-pressed={selected === option.value}
          class:on={selected === option.value}
          onclick={() => change(option.value)}
        >
          {option.name}
        </button>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet voiceOption(voice: VoiceInfo)}
  <label class="voice">
    <input
      type="radio"
      name="voice"
      checked={s.speech.deviceVoices[app.language] === voice.key}
      onchange={() => (app.settings.speech.deviceVoices[app.language] = voice.key)}
    />
    <span class="voice-name">{voice.name}</span>
    <span class="voice-meta">{voice.lang} · {voice.local ? t.worksOffline : t.needsInternet}</span>
  </label>
{/snippet}

<dialog
  bind:this={dialog}
  lang={app.appLanguage}
  aria-labelledby="settings-title"
  onclose={() => (open = false)}
>
  <header>
    <h2 id="settings-title">{t.settings}</h2>
    <button class="done" onclick={() => (open = false)}>{t.done}</button>
  </header>

  <div class="layout">
    <nav aria-label={t.settingsSections}>
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
        <h3>{t.sectionSpeech}</h3>
        <div class="card">
          {#if bilingual.length > 0}
            {@render choice(
              t.sectionLanguage,
              '',
              bilingual.map((lang) => ({ value: lang, name: nativeName(lang), lang })),
              app.language,
              useLanguage,
            )}
          {/if}
          {@render choice(
            t.voice,
            t.voiceHelp,
            [
              { value: 'app', name: t.appVoice },
              { value: 'device', name: t.deviceVoice },
            ],
            s.speech.engine,
            (engine) => (app.settings.speech.engine = engine === 'app' ? 'app' : 'device'),
          )}
          {@render toggle(
            t.speakEachWord,
            t.speakEachWordHelp,
            s.speech.speakEachWord,
            (on) => (app.settings.speech.speakEachWord = on),
          )}
          {@render slider(
            t.rate,
            '',
            s.speech.rate,
            0.5,
            2,
            0.1,
            t.times(s.speech.rate),
            (v) => (app.settings.speech.rate = v),
          )}
          {@render slider(
            t.volume,
            '',
            s.speech.volume,
            0.1,
            1,
            0.1,
            t.percent(s.speech.volume),
            (v) => (app.settings.speech.volume = v),
          )}
          {#if s.speech.engine === 'device'}
            {@render slider(
              t.pitch,
              '',
              s.speech.pitch,
              0.5,
              1.5,
              0.1,
              t.times(s.speech.pitch),
              (v) => (app.settings.speech.pitch = v),
            )}
          {/if}
          <div class="row">
            <div class="text">
              <span class="label">{t.tryIt}</span>
            </div>
            <button class="action" onclick={() => app.say(phrase('test', app.language))}>
              <Icon path={ICONS.speak} size={22} />
              {t.testVoice}
            </button>
          </div>
        </div>

        <section class="card voices" aria-labelledby="pronunciations-heading">
          <h4 id="pronunciations-heading" class="legend">{t.pronunciations}</h4>
          <p class="help">{t.pronunciationsHelp}</p>
          {#each s.speech.pronunciations as entry, i (i)}
            <div class="pronunciation">
              <input
                aria-label={t.writtenWord}
                value={entry.word}
                onchange={(event) =>
                  (app.settings.speech.pronunciations[i]!.word = event.currentTarget.value)}
              />
              <span aria-hidden="true">→</span>
              <input
                aria-label={t.sayAs}
                value={entry.sayAs}
                onchange={(event) =>
                  (app.settings.speech.pronunciations[i]!.sayAs = event.currentTarget.value)}
              />
              <button
                aria-label={t.tryPronunciation(entry.word)}
                onclick={() => app.say(entry.word)}
              >
                <Icon path={ICONS.speak} size={20} />
              </button>
              <button
                aria-label={t.deletePronunciation(entry.word)}
                onclick={() => app.settings.speech.pronunciations.splice(i, 1)}
              >
                <Icon path={ICONS.trash} size={20} />
              </button>
            </div>
          {/each}
          <form class="pronunciation" onsubmit={addPronunciation}>
            <input name="word" aria-label={t.writtenWord} placeholder={t.writtenWord} />
            <span aria-hidden="true">→</span>
            <input name="sayAs" aria-label={t.sayAs} placeholder={t.sayAs} />
            <button type="submit">{t.add}</button>
          </form>
        </section>

        {#if s.speech.engine === 'app'}
          <section class="card voices" aria-labelledby="app-voices">
            <h4 id="app-voices" class="legend">{t.appVoices}</h4>
            {#if appVoices.length === 0}
              <p class="help">{t.noAppVoice(nameInSentence(app.language, app.appLanguage))}</p>
            {:else}
              <p class="help">{t.appVoicesHelp}</p>
            {/if}
            {#each appVoices as voice (voice.id)}
              {@const anyBusy = appVoice.status === 'downloading' || appVoice.status === 'loading'}
              {@const busy =
                appVoice.voiceId === voice.id &&
                (appVoice.status === 'downloading' || appVoice.status === 'loading')}
              {@const inUse = s.speech.appVoices[baseLanguage(voice.lang)] === voice.id}
              <div class="voice offline">
                <div class="voice-text">
                  <span class="voice-name"
                    >{voice.name}
                    {#if voice.recommended}<span class="badge">{t.recommended}</span>{/if}</span
                  >
                  <span class="voice-meta"
                    >{describe(voice)} · {voice.license} · {Math.round(voice.sizeMB)} MB</span
                  >
                  {#if busy}
                    <span class="voice-meta" role="status">{progressText()}</span>
                    <progress max={appVoice.progress.total || 1} value={appVoice.progress.loaded}
                    ></progress>
                  {/if}
                  {#if appVoice.voiceId === voice.id && appVoice.status === 'error'}
                    <span class="error" role="alert">{t.voiceError(appVoice.error)}</span>
                  {/if}
                </div>
                <div class="voice-actions">
                  {#if appVoice.downloaded[voice.id]}
                    <button
                      aria-pressed={inUse}
                      class:selected={inUse}
                      disabled={anyBusy && !inUse}
                      onclick={() => chooseVoice(voice)}
                    >
                      {inUse ? t.inUse : t.use}
                    </button>
                    <button
                      aria-label={t.deleteVoice(voice.name)}
                      disabled={busy}
                      onclick={() => removeVoice(voice)}
                    >
                      {t.delete}
                    </button>
                  {:else}
                    <button disabled={anyBusy} onclick={() => downloadVoice(voice)}
                      >{t.download}</button
                    >
                  {/if}
                </div>
              </div>
            {/each}
            {#if appVoice.isReady(app.appVoiceId) && appVoice.preparing.done < appVoice.preparing.total}
              <p class="help" role="status">
                {t.gettingReady(appVoice.preparing.done, appVoice.preparing.total)}
              </p>
            {/if}
            {#if appVoices.length > 0 && !appVoice.isReady(app.appVoiceId)}
              <p class="help">{t.deviceSpeaksUntilReady}</p>
            {/if}
          </section>
        {:else}
          <fieldset class="card voices">
            <legend>{t.voice}</legend>
            <p class="help">{t.deviceVoicesHelp}</p>
            {#if !speech.available}
              <p class="warning" role="alert">{t.noDeviceSpeech}</p>
            {:else if voices.length > 0 && myVoices.length === 0}
              <p class="warning" role="alert">
                {t.noDeviceVoiceFor(nameInSentence(app.language, app.appLanguage))}
              </p>
            {/if}
            <label class="voice">
              <input
                type="radio"
                name="voice"
                checked={!s.speech.deviceVoices[app.language]}
                onchange={() => delete app.settings.speech.deviceVoices[app.language]}
              />
              <span class="voice-name">{t.deviceDefault}</span>
              <span class="voice-meta">{t.deviceDefaultHelp}</span>
            </label>
            {#each myVoices as voice (voice.key)}
              {@render voiceOption(voice)}
            {/each}
            {#if otherVoices.length > 0}
              <details>
                <summary>{t.otherVoices(otherVoices.length)}</summary>
                {#each otherVoices as voice (voice.key)}
                  {@render voiceOption(voice)}
                {/each}
              </details>
            {/if}
            {#if voices.length === 0}
              <p class="help">{t.noVoices}</p>
            {/if}
          </fieldset>
        {/if}
      {:else if section === 'language'}
        <h3>{t.sectionLanguage}</h3>
        <p class="intro">{t.languageIntro}</p>
        <div class="card">
          {#if app.languages.length > 1}
            {@render choice(
              t.words,
              t.wordsHelp,
              app.languages.map((lang) => ({ value: lang, name: nativeName(lang), lang })),
              primary,
              choosePrimary,
            )}
            {@render choice(
              t.secondLanguage,
              t.secondLanguageHelp,
              [
                { value: '', name: t.none },
                ...app.languages
                  .filter((lang) => lang !== primary)
                  .map((lang) => ({ value: lang, name: nativeName(lang), lang })),
              ],
              s.language.second ?? '',
              (lang) => chooseSecond(lang || null),
            )}
          {:else}
            <div class="row">
              <p class="help">
                {t.onlyLanguage(nameInSentence(app.boardsLanguage, app.appLanguage))}
              </p>
            </div>
          {/if}
          {@render choice(
            t.appLanguage,
            t.appLanguageHelp,
            [
              { value: 'auto', name: t.automatic },
              ...APP_LANGUAGES.map((lang) => ({ value: lang, name: nativeName(lang), lang })),
            ],
            s.language.app,
            (lang) => (app.settings.language.app = lang as 'auto' | AppLanguage),
          )}
        </div>
        <p class="intro">{t.draftWords}</p>
      {:else if section === 'scanning'}
        <h3>{t.sectionScanning}</h3>
        <p class="intro">{t.scanIntro}</p>
        <div class="card">
          {@render toggle(
            t.scanOn,
            t.scanOnHelp,
            s.scan.enabled,
            (on) => (app.settings.scan.enabled = on),
          )}
          {@render choice(
            t.scanMethod,
            t.scanMethodHelp,
            [
              { value: 'auto', name: t.methodAuto },
              { value: 'step', name: t.methodStep },
              { value: 'inverse', name: t.methodInverse },
            ],
            s.scan.method,
            (method) =>
              (app.settings.scan.method =
                method === 'step' || method === 'inverse' ? method : 'auto'),
          )}
          {@render choice(
            t.scanPattern,
            '',
            [
              { value: 'rows', name: t.patternRows },
              { value: 'columns', name: t.patternColumns },
              { value: 'linear', name: t.patternLinear },
            ],
            s.scan.pattern,
            (pattern) =>
              (app.settings.scan.pattern =
                pattern === 'columns' || pattern === 'linear' ? pattern : 'rows'),
          )}
          {@render slider(
            t.scanSpeed,
            '',
            s.scan.speedMs,
            300,
            6000,
            100,
            t.seconds(s.scan.speedMs),
            (v) => (app.settings.scan.speedMs = v),
          )}
          {@render slider(
            t.scanFirstDelay,
            '',
            s.scan.firstDelayMs,
            0,
            5000,
            100,
            t.seconds(s.scan.firstDelayMs),
            (v) => (app.settings.scan.firstDelayMs = v),
          )}
          {@render slider(
            t.scanLoops,
            '',
            s.scan.loops,
            1,
            10,
            1,
            t.loopsValue(s.scan.loops),
            (v) => (app.settings.scan.loops = v),
          )}
          {@render toggle(
            t.scanAutoRestart,
            t.scanAutoRestartHelp,
            s.scan.autoRestart,
            (on) => (app.settings.scan.autoRestart = on),
          )}
          {@render toggle(
            t.scanBars,
            '',
            s.scan.includeBars,
            (on) => (app.settings.scan.includeBars = on),
          )}
          {@render toggle(
            t.scanCues,
            t.scanCuesHelp,
            s.scan.cues,
            (on) => (app.settings.scan.cues = on),
          )}
          {@render choice(
            t.scanHighlight,
            '',
            [
              { value: 'dim', name: t.highlightDim },
              { value: 'outline', name: t.highlightOutline },
              { value: 'fill', name: t.highlightFill },
            ],
            s.scan.highlight,
            (style) =>
              (app.settings.scan.highlight =
                style === 'outline' || style === 'fill' ? style : 'dim'),
          )}
        </div>
        <h4 class="subhead">{t.scanInputs}</h4>
        <div class="card">
          {@render toggle(
            t.inputKeys,
            t.inputKeysHelp,
            s.scan.keyboard,
            (on) => (app.settings.scan.keyboard = on),
          )}
          {@render toggle(
            t.inputGamepad,
            t.inputGamepadHelp,
            s.scan.gamepad,
            (on) => (app.settings.scan.gamepad = on),
          )}
          {@render toggle(
            t.inputTouch,
            t.inputTouchHelp,
            s.scan.touch,
            (on) => (app.settings.scan.touch = on),
          )}
          {@render toggle(
            t.inputMouse,
            t.inputMouseHelp,
            s.scan.mouse,
            (on) => (app.settings.scan.mouse = on),
          )}
          {@render slider(
            t.ignoreRepeats,
            t.ignoreRepeatsHelp,
            s.scan.ignoreRepeatMs,
            0,
            2000,
            100,
            t.seconds(s.scan.ignoreRepeatMs),
            (v) => (app.settings.scan.ignoreRepeatMs = v),
          )}
        </div>
      {:else if section === 'touch'}
        <h3>{t.sectionTouch}</h3>
        <p class="intro">{t.touchIntro}</p>
        <div class="card">
          {@render slider(
            t.holdToSelect,
            t.holdToSelectHelp,
            s.touch.holdMs,
            0,
            2000,
            100,
            t.seconds(s.touch.holdMs),
            (v) => (app.settings.touch.holdMs = v),
          )}
          {@render toggle(
            t.selectOnRelease,
            t.selectOnReleaseHelp,
            s.touch.selectOnRelease,
            (on) => (app.settings.touch.selectOnRelease = on),
          )}
          {@render slider(
            t.ignoreRepeats,
            t.ignoreRepeatsHelp,
            s.touch.ignoreRepeatMs,
            0,
            2000,
            100,
            t.seconds(s.touch.ignoreRepeatMs),
            (v) => (app.settings.touch.ignoreRepeatMs = v),
          )}
          {@render toggle(
            t.selectionFlash,
            t.selectionFlashHelp,
            s.display.selectionFlash,
            (on) => (app.settings.display.selectionFlash = on),
          )}
          {@render slider(
            t.buttonGap,
            t.buttonGapHelp,
            s.display.buttonGap,
            0,
            32,
            2,
            `${s.display.buttonGap} px`,
            (v) => (app.settings.display.buttonGap = v),
          )}
        </div>
      {:else if section === 'display'}
        <h3>{t.sectionDisplay}</h3>
        <div class="card">
          {@render choice(
            t.theme,
            '',
            [
              { value: 'light', name: t.themeLight },
              { value: 'dark', name: t.themeDark },
              { value: 'contrast', name: t.themeContrast },
            ],
            s.display.theme,
            (theme) =>
              (app.settings.display.theme =
                theme === 'dark' || theme === 'contrast' ? theme : 'light'),
          )}
          {@render choice(
            t.wordColors,
            t.wordColorsHelp,
            [
              { value: 'fill', name: t.colorFill },
              { value: 'border', name: t.colorBorder },
              { value: 'none', name: t.colorNone },
            ],
            s.display.colorStyle,
            (style) =>
              (app.settings.display.colorStyle =
                style === 'border' || style === 'none' ? style : 'fill'),
          )}
          {@render slider(
            t.labelSize,
            t.labelSizeHelp,
            s.display.labelScale,
            1,
            1.5,
            0.1,
            t.percent(s.display.labelScale),
            (v) => (app.settings.display.labelScale = v),
          )}
          {@render choice(
            t.labels,
            '',
            [
              { value: 'below', name: t.labelsBelow },
              { value: 'above', name: t.labelsAbove },
            ],
            s.display.labelPosition,
            (position) =>
              (app.settings.display.labelPosition = position === 'above' ? 'above' : 'below'),
          )}
          {@render toggle(
            t.showSymbols,
            t.showSymbolsHelp,
            s.display.showSymbols,
            (on) => (app.settings.display.showSymbols = on),
          )}
          {@render toggle(
            t.showWordForms,
            t.showWordFormsHelp,
            s.display.showWordForms,
            (on) => (app.settings.display.showWordForms = on),
          )}
          {@render toggle(
            t.phoneLayouts,
            t.phoneLayoutsHelp,
            s.display.phoneLayouts,
            (on) => (app.settings.display.phoneLayouts = on),
          )}
          {@render toggle(
            t.showPhrases,
            t.showPhrasesHelp,
            s.display.showPhrases,
            (on) => (app.settings.display.showPhrases = on),
          )}
          {@render toggle(
            t.showShare,
            t.showShareHelp,
            s.display.showShare,
            (on) => (app.settings.display.showShare = on),
          )}
        </div>
      {:else if section === 'boards'}
        <h3>{t.sectionBoards}</h3>
        <p class="intro">{t.boardsIntro}</p>
        <div class="actions">
          <button class="action primary" onclick={backUp}>
            <Icon path={ICONS.export} size={24} />
            {t.backUp}
          </button>
          <p class="help">
            {t.backUpHelp}
            {backups.backedUpAt
              ? t.lastBackup(new Date(backups.backedUpAt).toLocaleDateString(app.appLanguage))
              : t.neverBackedUp}
          </p>
          <label class="action">
            <Icon path={ICONS.import} size={24} />
            {t.importBoards}
            <input
              class="visually-hidden"
              type="file"
              accept=".obz,.obf,application/zip,application/json"
              onchange={importFile}
            />
          </label>
          <button class="action" onclick={exportAll}>
            <Icon path={ICONS.boards} size={24} />
            {t.exportBoards}
          </button>
          <button class="action" onclick={() => reset('en')}>
            <Icon path={ICONS.reset} size={24} />
            {t.resetEnglish}
          </button>
          <button class="action" lang="es" onclick={() => reset('es')}>
            <Icon path={ICONS.reset} size={24} />
            {t.resetSpanish}
          </button>
          <p class="help">{t.resetHelp}</p>
        </div>
        {#if status}
          <p class="status" role="status">{status}</p>
        {/if}
        {#if fixes.length > 0}
          <details>
            <summary>{t.fixedWhileImporting(fixes.length)}</summary>
            <ul>
              {#each fixes.slice(0, 50) as fix, i (i)}
                <li>{fix}</li>
              {/each}
            </ul>
          </details>
        {/if}
      {:else}
        <h3>{t.sectionAbout}</h3>
        <p class="intro">{t.version(__APP_VERSION__)}</p>
        {#if app.set}
          {@const { credits, ownPictures } = pictureCredits(app.set)}
          <section class="card prose" aria-labelledby="pictures-heading">
            <h4 id="pictures-heading">{t.picturesHeading}</h4>
            <ul class="credits">
              {#each credits as credit (credit.author + credit.license)}
                <li>
                  {#if credit.url}
                    <a href={credit.url} target="_blank" rel="noreferrer">{credit.author}</a>
                  {:else}
                    {credit.author}
                  {/if}
                  {#if credit.license}
                    ·
                    {#if credit.licenseUrl}
                      <a href={credit.licenseUrl} target="_blank" rel="noreferrer"
                        >{credit.license}</a
                      >
                    {:else}
                      {credit.license}
                    {/if}
                  {/if}
                  · {t.pictureCount(credit.count)}
                </li>
              {/each}
              {#if ownPictures > 0}
                <li>{t.ownPictures(ownPictures)}</li>
              {/if}
            </ul>
          </section>
        {/if}
        {#if app.appLanguage === 'es'}
          <div class="card prose">
            <p>
              Any AAC es software libre y de código abierto, con licencia
              <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noreferrer"
                >GNU AGPL v3 o posterior</a
              >. El código está en
              <a href="https://github.com/tks98/any-aac" target="_blank" rel="noreferrer"
                >github.com/tks98/any-aac</a
              >.
            </p>
            <p>
              Símbolos de
              <a href="https://mulberrysymbols.org" target="_blank" rel="noreferrer"
                >Mulberry Symbols</a
              >
              © Steve Lee, y de
              <a href="https://openmoji.org" target="_blank" rel="noreferrer">OpenMoji</a>, el
              proyecto de emojis e iconos de código abierto. Ambos tienen licencia
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/deed.es"
                target="_blank"
                rel="noreferrer">CC BY-SA 4.0</a
              >. Cada símbolo guarda su origen, que viaja con los tableros exportados.
            </p>
            <p>
              Las palabras básicas son el vocabulario
              <a
                href="https://www.med.unc.edu/ahs/clds/universal-core-vocabulary/"
                target="_blank"
                rel="noreferrer">Universal Core</a
              >
              del Center for Literacy and Disability Studies (UNC-Chapel Hill, CC BY 4.0), con algunas
              palabras añadidas. El vocabulario inicial es provisional hasta que lo revisen terapeutas
              del lenguaje. Su organización, sus traducciones y los pocos pictogramas de línea que quedan
              son de colaboradores de Any AAC, con licencia CC BY-SA 4.0.
            </p>
            <p>El texto usa Atkinson Hyperlegible Next (SIL Open Font License).</p>
            <p>
              Las voces de la aplicación son modelos de Piper entrenados con grabaciones de dominio
              público, y funcionan con ONNX Runtime (MIT) y eSpeak NG (GPL-3.0). Las licencias de
              todo lo que usa Any AAC están en
              <a
                href="https://github.com/tks98/any-aac/blob/main/THIRD_PARTY.md"
                target="_blank"
                rel="noreferrer">THIRD_PARTY.md</a
              >.
            </p>
            <p>
              Any AAC no recoge ningún dato. Tus tableros y ajustes se quedan en este dispositivo.
            </p>
          </div>
        {:else}
          <div class="card prose">
            <p>
              Any AAC is free, open-source software, licensed under the
              <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noreferrer"
                >GNU AGPL v3 or later</a
              >. The source is at
              <a href="https://github.com/tks98/any-aac" target="_blank" rel="noreferrer"
                >github.com/tks98/any-aac</a
              >.
            </p>
            <p>
              Symbols from
              <a href="https://mulberrysymbols.org" target="_blank" rel="noreferrer"
                >Mulberry Symbols</a
              >
              © Steve Lee, and from
              <a href="https://openmoji.org" target="_blank" rel="noreferrer">OpenMoji</a>, the
              open-source emoji and icon project. Both are licensed
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noreferrer">CC BY-SA 4.0</a
              >. Each symbol's source is recorded with it, and travels with exported boards.
            </p>
            <p>
              The core words are the
              <a
                href="https://www.med.unc.edu/ahs/clds/universal-core-vocabulary/"
                target="_blank"
                rel="noreferrer">Universal Core</a
              >
              vocabulary from the Center for Literacy and Disability Studies (UNC-Chapel Hill, CC BY 4.0),
              with a few words added. The starter vocabulary is a draft until speech-language pathologists
              have reviewed it. Its arrangement, translations and the few remaining line-drawing pictograms
              are by Any AAC contributors, licensed CC BY-SA 4.0.
            </p>
            <p>Text is set in Atkinson Hyperlegible Next (SIL Open Font License).</p>
            <p>
              App voices are Piper models trained on public-domain recordings, run with ONNX Runtime
              (MIT) and eSpeak NG (GPL-3.0). The licences of everything Any AAC uses are in
              <a
                href="https://github.com/tks98/any-aac/blob/main/THIRD_PARTY.md"
                target="_blank"
                rel="noreferrer">THIRD_PARTY.md</a
              >.
            </p>
            <p>Any AAC collects nothing. Your boards and settings stay on this device.</p>
          </div>
        {/if}
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
    background: var(--panel-ground);
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
    border-bottom: 1px solid var(--divider);
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
    border-right: 1px solid var(--divider);
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
    background: var(--selected);
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

  .subhead {
    margin: 0 0 8px;
    font-size: 1.15rem;
  }

  .card {
    margin: 0 0 20px;
    padding: 0;
    border: 1px solid var(--divider);
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
    border-top: 1px solid var(--divider-soft);
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
    background: var(--track);
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
    background: var(--knob);
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
    flex-wrap: wrap;
    gap: 4px;
    padding: 4px;
    border-radius: 14px;
    background: var(--chip);
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
    background: var(--surface);
    font-weight: 800;
    box-shadow:
      0 1px 3px var(--shadow),
      inset 0 0 0 2px var(--on-ring);
  }

  .voices {
    padding: 16px 20px;
  }

  .pronunciation {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    border-top: 1px solid var(--divider-soft);
  }

  .pronunciation input {
    flex: 1 1 120px;
    min-width: 0;
    min-height: 44px;
    padding: 0 10px;
    border: 2px solid var(--line);
    border-radius: 10px;
    font: inherit;
  }

  .pronunciation button {
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    border: 2px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    font-weight: 700;
    cursor: pointer;
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
    border-top: 1px solid var(--divider-soft);
    cursor: pointer;
  }

  .voice input {
    grid-row: span 2;
    width: 22px;
    height: 22px;
    accent-color: var(--accent);
  }

  .legend {
    margin: 0 0 4px;
    font-size: 1.1rem;
  }

  .voice.offline {
    grid-template-columns: 1fr auto;
    gap: 6px 12px;
    cursor: default;
  }

  .voice-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .voice-actions {
    display: flex;
    gap: 6px;
  }

  .voice-actions button {
    min-height: 44px;
    padding: 0 14px;
    border: 2px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    font-weight: 700;
    cursor: pointer;
  }

  .voice-actions button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .voice-actions button.selected {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-ink);
  }

  progress {
    width: 100%;
    max-width: 320px;
    accent-color: var(--accent);
  }

  .error {
    color: var(--help);
    font-weight: 700;
  }

  .voice-name {
    font-weight: 700;
  }

  .badge {
    margin-left: 6px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--selected);
    color: var(--accent);
    font-size: 0.85rem;
    font-weight: 800;
  }

  .voice-meta {
    color: var(--muted);
    font-size: 0.95rem;
  }

  .warning {
    margin: 4px 0 8px;
    padding: 10px 12px;
    border-left: 4px solid var(--help);
    background: var(--chip);
    font-weight: 700;
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

  .action.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-ink);
  }

  .actions .help {
    margin: -2px 0 8px;
  }

  .status {
    margin: 18px 0 0;
    font-weight: 700;
  }

  .prose {
    padding: 4px 20px;
    line-height: 1.5;
  }

  .prose h4 {
    margin: 14px 0 4px;
  }

  .credits {
    margin: 0 0 14px;
    padding-left: 20px;
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
      border-bottom: 1px solid var(--divider);
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
