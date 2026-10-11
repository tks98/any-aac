<script lang="ts">
  import {
    baseLanguage,
    boardName,
    buttonWords,
    EXT_LOCKED,
    EXT_PART_OF_SPEECH,
    isLocked,
    isPhrasesBoard,
    linkableBoards,
    messageText,
    PARTS_OF_SPEECH,
    partOfSpeech,
    replaceBoard,
    resizeGrid,
    setTranslatedLabel,
    setTranslatedName,
    translatedLabel,
    translatedName,
    without,
    type ObfButton,
    type PartOfSpeech,
  } from '@any-aac/core';
  import { editor } from '../editor.svelte';
  import { ICONS } from '../icons';
  import { imageSrc } from '../images';
  import { nameInSentence } from '../languages';
  import { shrinkPicture } from '../photos';
  import { app } from '../state.svelte';
  import { cellColors, WORD_TYPE_COLORS } from '../theme';
  import Icon from './Icon.svelte';
  import SymbolPicker from './SymbolPicker.svelte';

  const t = $derived(app.t);
  const board = $derived(editor.board);
  const button = $derived(editor.selectedButton);
  const cell = $derived(editor.selected);
  /** The boards' own language, and the others they're translated into; the one in use first. */
  const own = $derived(baseLanguage(board?.locale ?? app.boardsLanguage));
  const languages = $derived(
    [own, ...app.languages.filter((lang) => lang !== own)].sort(
      (a, b) => Number(b === app.language) - Number(a === app.language),
    ),
  );
  const multilingual = $derived(languages.length > 1);
  const src = $derived(
    app.set && board && button ? imageSrc(app.set, board, button.image_id) : undefined,
  );
  const boards = $derived(app.set ? linkableBoards(app.set) : []);

  let panel: HTMLElement;
  let pickingSymbol = $state(false);

  // On a phone the panel is a sheet over the board: take focus there when it opens.
  $effect(() => {
    if (!editor.selected || !matchMedia('(max-width: 599px)').matches) return;
    panel.querySelector<HTMLElement>('h3')?.focus();
  });
  let naming = $state(false);
  let photoError = $state('');

  const languageName = (lang: string) => nameInSentence(lang, app.appLanguage);

  const labelFor = (b: ObfButton, lang: string) =>
    lang === own ? (b.label ?? '') : (translatedLabel(b, lang) ?? '');

  function setLabel(lang: string, value: string) {
    editor.editButton((b) =>
      lang === own ? { ...b, label: value } : setTranslatedLabel(b, lang, value),
    );
  }

  function setSays(value: string) {
    editor.editButton((b) =>
      value.trim() === '' ? without(b, 'vocalization') : { ...b, vocalization: value },
    );
  }

  function setType(type: PartOfSpeech | null) {
    editor.editButton((b) =>
      type === null ? without(b, EXT_PART_OF_SPEECH) : { ...b, [EXT_PART_OF_SPEECH]: type },
    );
  }

  function setOpens(id: string) {
    if (id === '') {
      editor.editButton((b) => without(b, 'load_board'));
      naming = false;
    } else if (id === 'new') {
      naming = true;
    } else {
      const target = boards.find((b) => b.id === id);
      if (target) editor.editButton((b) => ({ ...b, load_board: { id, name: target.name ?? '' } }));
      naming = false;
    }
  }

  function createBoard(event: SubmitEvent) {
    event.preventDefault();
    const name = new FormData(event.currentTarget as HTMLFormElement).get('name');
    if (typeof name !== 'string' || name.trim() === '') return;
    naming = false;
    editor.linkToNewBoard(name.trim());
  }

  function addButton(event: SubmitEvent) {
    event.preventDefault();
    const label = new FormData(event.currentTarget as HTMLFormElement).get('label');
    const text = typeof label === 'string' ? label.trim() : '';
    editor.addButton(
      app.language === own || text === ''
        ? { label: text }
        : setTranslatedLabel({ id: '', label: text }, app.language, text),
    );
  }

  async function usePhoto(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    photoError = '';
    try {
      const picture = await shrinkPicture(file);
      const id = `photo-${crypto.getRandomValues(new Uint32Array(2)).join('')}`;
      const extension = picture.contentType === 'image/png' ? 'png' : 'jpg';
      const path = `images/photos/${id}.${extension}`;
      editor.setPicture(
        {
          id,
          path,
          content_type: picture.contentType,
          width: picture.width,
          height: picture.height,
        },
        path,
        picture.bytes,
      );
    } catch {
      photoError = t.photoError;
    }
  }

  function resize(rows: number, columns: number) {
    const current = editor.board;
    if (!current) return;
    const resized = resizeGrid(current, rows, columns);
    if (!resized) {
      editor.notice = t.resizeBlocked;
      return;
    }
    editor.change((set) => replaceBoard(set, resized));
  }

  function renameBoard(lang: string, value: string) {
    const full = app.board;
    if (!full || value.trim() === '') return;
    const renamed = lang === own ? { ...full, name: value } : setTranslatedName(full, lang, value);
    editor.change((set) => replaceBoard(set, renamed));
  }
</script>

{#snippet toggle(label: string, help: string, checked: boolean, change: (on: boolean) => void)}
  <div class="row">
    <div class="text">
      <span class="label">{label}</span>
      <span class="help">{help}</span>
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

<aside bind:this={panel} class:idle={!cell} aria-label={t.buttonSettings}>
  {#if cell}
    <button class="close-sheet" onclick={() => (editor.selected = null)}>
      <Icon path={ICONS.back} size={22} />{t.backToBoard}
    </button>
  {/if}
  {#if !board}
    <!-- nothing to edit -->
  {:else if !cell}
    <h3>{t.board}</h3>
    {#each languages as lang (lang)}
      {@const full = app.board ?? board}
      <label class="field">
        <span>{multilingual ? t.boardNameIn(languageName(lang)) : t.boardNameLabel}</span>
        <input
          {lang}
          value={lang === own ? (full.name ?? '') : (translatedName(full, lang) ?? '')}
          onchange={(event) => renameBoard(lang, event.currentTarget.value)}
        />
      </label>
    {/each}
    {#each [{ name: t.rows, value: board.grid.rows, less: t.removeRow, more: t.addRow, change: (n: number) => resize(n, board.grid.columns) }, { name: t.columns, value: board.grid.columns, less: t.removeColumn, more: t.addColumn, change: (n: number) => resize(board.grid.rows, n) }] as size (size.name)}
      <div class="stepper">
        <span class="label">{size.name}</span>
        <button aria-label={size.less} onclick={() => size.change(size.value - 1)}>−</button>
        <span class="count" aria-live="polite">{size.value}</span>
        <button aria-label={size.more} onclick={() => size.change(size.value + 1)}>+</button>
      </div>
    {/each}
    <p class="help">{t.boardHelp}</p>
    {#if editor.linked}<p class="help">{t.linkedNote}</p>{/if}
  {:else if !button}
    <div class="heading">
      <span class="preview empty" aria-hidden="true"><Icon path={ICONS.plus} size={28} /></span>
      <div>
        <h3 tabindex="-1">{t.emptyCell}</h3>
        <span class="help">{t.where(cell.row + 1, cell.column + 1)}</span>
      </div>
    </div>
    <form class="add" onsubmit={addButton}>
      <label class="field">
        <span>{multilingual ? t.labelIn(languageName(app.language)) : t.label}</span>
        <!-- On the phrases board, the message so far is the likely new phrase. -->
        <input
          name="label"
          lang={app.language}
          autocomplete="off"
          value={isPhrasesBoard(board) ? messageText(app.message) : ''}
        />
      </label>
      <button class="primary" type="submit"
        ><Icon path={ICONS.plus} size={22} />{t.addButton}</button
      >
    </form>
    {#if editor.copied}
      <button class="action" onclick={() => editor.paste()}>
        <Icon path={ICONS.copy} size={22} />{t.paste(editor.copied.button.label ?? '')}
      </button>
    {/if}
  {:else}
    {@const colors = cellColors(
      button,
      app.settings.display.theme,
      app.settings.display.colorStyle,
    )}
    {@const type = partOfSpeech(button) ?? null}
    {@const locked = isLocked(button)}
    <div class="heading">
      <span class="preview" style:--fill={colors.fill} style:--edge={colors.edge}>
        {#if src}<img {src} alt="" />{/if}
        <span>{buttonWords(button, app.language).label}</span>
      </span>
      <div>
        <h3 tabindex="-1">{buttonWords(button, app.language).label || t.label}</h3>
        <span class="help">{t.where(cell.row + 1, cell.column + 1)}</span>
      </div>
    </div>

    {#each languages as lang (lang)}
      <label class="field">
        <span>{multilingual ? t.labelIn(languageName(lang)) : t.label}</span>
        <input
          {lang}
          value={labelFor(button, lang)}
          placeholder={lang === own ? '' : button.label}
          onchange={(event) => setLabel(lang, event.currentTarget.value)}
        />
      </label>
    {/each}
    {#if !button.load_board}
      <label class="field">
        <span>{t.says}</span>
        <input
          lang={own}
          value={button.vocalization ?? ''}
          placeholder={t.sameAsLabel}
          onchange={(event) => setSays(event.currentTarget.value)}
        />
      </label>
    {/if}

    <section aria-labelledby="symbol-heading">
      <h4 id="symbol-heading">{t.symbol}</h4>
      <div class="actions">
        <button class="action" onclick={() => (pickingSymbol = true)}>
          <Icon path={ICONS.search} size={22} />{t.findSymbol}
        </button>
        <label class="action">
          <Icon path={ICONS.photo} size={22} />{t.photo}
          <input class="visually-hidden" type="file" accept="image/*" onchange={usePhoto} />
        </label>
        {#if button.image_id}
          <button class="action" onclick={() => editor.editButton((b) => without(b, 'image_id'))}>
            {t.noSymbol}
          </button>
        {/if}
      </div>
      {#if photoError}<p class="error" role="alert">{photoError}</p>{/if}
    </section>

    {#if !button.load_board}
      <section aria-labelledby="type-heading">
        <h4 id="type-heading">{t.wordType}</h4>
        <div class="chips" role="group" aria-labelledby="type-heading">
          <button aria-pressed={type === null} onclick={() => setType(null)}>
            {t.partOfSpeech.none}
          </button>
          {#each PARTS_OF_SPEECH as pos (pos)}
            <button aria-pressed={type === pos} onclick={() => setType(pos)}>
              <span
                class="swatch"
                style:--fill={WORD_TYPE_COLORS[pos].fill}
                style:--edge={WORD_TYPE_COLORS[pos].edge}
                aria-hidden="true"
              ></span>
              {t.partOfSpeech[pos]}
            </button>
          {/each}
        </div>
      </section>
    {/if}

    <section aria-labelledby="tap-heading">
      <h4 id="tap-heading">{t.whenTapped}</h4>
      <label class="field">
        <span class="visually-hidden">{t.boardToOpen}</span>
        <select
          value={naming ? 'new' : (button.load_board?.id ?? '')}
          onchange={(event) => setOpens(event.currentTarget.value)}
        >
          <option value="">{t.addsWord}</option>
          <optgroup label={t.opensBoard}>
            {#each boards as b (b.id)}
              <option value={b.id}>{boardName(b, app.language)}</option>
            {/each}
            <option value="new">{t.newBoard}</option>
          </optgroup>
        </select>
      </label>
      {#if naming}
        <form class="add" onsubmit={createBoard}>
          <label class="field">
            <span>{t.newBoardName}</span>
            <input name="name" value={buttonWords(button, app.language).label} autocomplete="off" />
          </label>
          <button class="primary" type="submit">{t.newBoard.replace('…', '')}</button>
        </form>
      {:else if button.load_board?.id}
        {@const target = button.load_board.id}
        <button class="action" onclick={() => editor.openBoard(target)}>
          <Icon path={ICONS.folder} size={22} />{t.openBoard}
        </button>
      {/if}
    </section>

    <div class="card">
      {@render toggle(t.visible, t.visibleHelp, button.hidden !== true, (on) =>
        editor.editButton((b) => (on ? without(b, 'hidden') : { ...b, hidden: true })),
      )}
      {@render toggle(t.lockPosition, t.lockPositionHelp, locked, (on) =>
        editor.editButton((b) => (on ? { ...b, [EXT_LOCKED]: true } : without(b, EXT_LOCKED))),
      )}
    </div>

    <div class="actions">
      <button class="action" onclick={() => editor.copy()}>
        <Icon path={ICONS.copy} size={22} />{t.copy}
      </button>
      <button
        class="action danger"
        onclick={() =>
          locked ? (editor.notice = t.lockedNotice(button.label ?? '')) : editor.removeSelected()}
      >
        <Icon path={ICONS.trash} size={22} />{t.deleteButton}
      </button>
    </div>
    {#if editor.linked}<p class="help">{t.linkedNote}</p>{/if}
  {/if}
</aside>

{#if pickingSymbol && button}
  <SymbolPicker
    query={buttonWords(button, app.language).label}
    onpick={(image, path, bytes) => {
      pickingSymbol = false;
      editor.setPicture(image, path, bytes);
    }}
    onclose={() => (pickingSymbol = false)}
  />
{/if}

<style>
  aside {
    width: 360px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    border: 1px solid var(--divider);
    border-radius: 16px;
    background: var(--surface);
    overflow-y: auto;
    user-select: text;
  }

  h3 {
    margin: 0;
    font-size: 1.3rem;
  }

  h3:focus {
    outline: none;
  }

  h4 {
    margin: 0 0 8px;
    font-size: 1rem;
  }

  .heading {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .preview {
    width: 76px;
    height: 76px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 4px;
    border: 2px solid var(--edge, var(--line));
    border-radius: var(--radius);
    background: var(--fill, var(--surface));
    font-size: 0.8rem;
    font-weight: 700;
    overflow: hidden;
    text-align: center;
  }

  .preview.empty {
    border-style: dashed;
    color: var(--accent);
  }

  .preview img {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }

  .help {
    margin: 0;
    color: var(--muted);
    line-height: 1.35;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-weight: 700;
  }

  input:not([type]),
  select {
    min-height: 48px;
    padding: 0 12px;
    border: 2px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    font: inherit;
    font-weight: 600;
  }

  .add {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .action,
  .primary {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0 14px;
    border: 2px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    font-weight: 700;
    cursor: pointer;
  }

  .primary {
    justify-content: center;
    border: none;
    background: var(--accent);
    color: var(--accent-ink);
  }

  .danger {
    color: var(--help);
  }

  .stepper {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .stepper .label {
    flex: 1;
  }

  .stepper button {
    width: 48px;
    height: 48px;
    border: 2px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    font-size: 1.5rem;
    font-weight: 800;
    cursor: pointer;
  }

  .count {
    min-width: 2ch;
    font-size: 1.2rem;
    font-weight: 800;
    text-align: center;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chips button {
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 10px;
    border: 2px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    font-weight: 600;
    cursor: pointer;
  }

  .chips button[aria-pressed='true'] {
    border-color: var(--accent);
    font-weight: 800;
    box-shadow: inset 0 0 0 1px var(--accent);
  }

  .swatch {
    width: 16px;
    height: 16px;
    border: 2px solid var(--edge);
    border-radius: 4px;
    background: var(--fill);
  }

  .card {
    border: 1px solid var(--divider-soft);
    border-radius: 12px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
  }

  .row + .row {
    border-top: 1px solid var(--divider-soft);
  }

  .text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .label {
    font-weight: 700;
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

  .error {
    margin: 8px 0 0;
    color: var(--help);
    font-weight: 700;
  }

  button:focus-visible,
  .action:focus-within,
  input:focus-visible,
  select:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }

  .close-sheet {
    display: none;
  }

  @media (max-width: 599px) {
    aside {
      position: fixed;
      inset: 0;
      z-index: 10;
      width: auto;
      padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
      border: none;
      border-radius: 0;
    }

    aside.idle {
      display: none;
    }

    .close-sheet {
      align-self: flex-start;
      min-height: 48px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 16px;
      border: 2px solid var(--line);
      border-radius: 10px;
      background: var(--surface);
      font-weight: 700;
      cursor: pointer;
    }
  }
</style>
