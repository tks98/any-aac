/**
 * Switch scanning on the screen: builds what to scan from the page, shows the
 * highlight, says cues, and turns keys, game controllers, taps and mouse
 * buttons into switch presses. The timing logic is in scan.ts.
 */
import { cells } from '@open-aac/core';
import { editor } from '../editor.svelte';
import { modeling } from '../modeling.svelte';
import { speech } from '../speech';
import { app } from '../state.svelte';
import { openaacVoice } from '../voice/voice.svelte';
import { Scanner, type ScanNode } from './scan';

export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const labelOf = (element: HTMLElement) =>
  (element.getAttribute('aria-label') ?? element.textContent ?? '').replace(/\s+/g, ' ').trim();

class Scanning {
  /** Where the highlight is drawn, or null when nothing is highlighted. */
  box = $state<Box | null>(null);
  /** Scanning is on and the communicator's screen is showing. */
  active = $derived(app.settings.scan.enabled && !editor.active && !modeling.active);

  private scanner = new Scanner(() => app.settings.scan, {
    highlight: (node) => this.show(node),
    choose: (node) => this.choose(node),
  });
  private elements = new Map<string, HTMLElement[]>();
  private actions = new Map<string, () => void>();
  private signature = '';
  private focused: HTMLElement[] = [];
  private current: ScanNode | null = null;

  /** Rebuilds what is scanned if the screen has changed. */
  refresh() {
    if (!this.active) {
      this.signature = '';
      this.scanner.setRoot({ id: 'root', label: '', children: [] });
      return;
    }
    const root = this.build();
    const signature = JSON.stringify(root);
    if (signature === this.signature) return;
    this.signature = signature;
    this.scanner.setRoot(root);
  }

  stop() {
    this.scanner.stop();
  }

  press(sw: 1 | 2) {
    if (!this.active) return;
    // Make sure a press acts on what's on screen now (a dialog may just have opened).
    this.refresh();
    this.scanner.press(sw);
  }

  release(sw: 1 | 2) {
    if (this.active) this.scanner.release(sw);
  }

  /** Moves the highlight box with the page (e.g. after a resize). */
  reposition() {
    this.box = boxAround(this.focused);
  }

  private build(): ScanNode {
    this.elements.clear();
    this.actions.clear();
    const leaf = (id: string, element: HTMLElement, action = () => element.click()): ScanNode => {
      this.elements.set(id, [element]);
      this.actions.set(id, action);
      return { id, label: labelOf(element) };
    };
    const group = (id: string, label: string, children: ScanNode[]): ScanNode => {
      this.elements.set(
        id,
        children.flatMap((child) => this.elements.get(child.id) ?? []),
      );
      return { id, label, children };
    };

    // A dialog the communicator uses (word forms) is scanned on its own.
    const dialog = document.querySelector<HTMLDialogElement>('dialog[open]');
    if (dialog) {
      if (!dialog.hasAttribute('data-scan')) return { id: 'root', label: '', children: [] };
      const buttons = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled)')];
      return {
        id: 'root',
        label: '',
        children: buttons.map((button, i) => leaf(`dialog-${i}`, button)),
      };
    }

    const children: ScanNode[] = [];
    const board = document.querySelector<HTMLElement>('[data-scan-board]');
    const view = app.view;
    if (board && view) {
      const buttons = cells(view);
      const columns = view.grid.columns;
      const items = [...board.querySelectorAll<HTMLElement>('button[data-cell]')].map((element) => {
        const index = Number(element.dataset.cell);
        const button = buttons[index]?.button;
        return {
          row: Math.floor(index / columns),
          column: index % columns,
          node: leaf(`cell-${index}`, element, () => button && app.press(button)),
        };
      });
      const { pattern } = app.settings.scan;
      if (pattern === 'linear') {
        children.push(...items.map((item) => item.node));
      } else {
        const key = pattern === 'rows' ? 'row' : 'column';
        const lines: ScanNode[][] = [];
        for (const item of items) (lines[item[key]] ??= []).push(item.node);
        lines.forEach((nodes, line) => {
          if (nodes) children.push(group(`${key}-${line}`, nodes[0]!.label, nodes));
        });
      }
    }
    if (app.settings.scan.includeBars) {
      for (const bar of document.querySelectorAll<HTMLElement>('[data-scan-group]')) {
        const buttons = [
          ...bar.querySelectorAll<HTMLElement>('button:not(:disabled):not([data-scan-skip])'),
        ];
        const name = bar.dataset.scanGroup!;
        const nodes = buttons.map((button, i) => leaf(`${name}-${i}`, button));
        if (nodes.length > 0)
          children.push(group(name, bar.getAttribute('aria-label') ?? name, nodes));
      }
    }
    return { id: 'root', label: '', children };
  }

  private show(node: ScanNode | null) {
    for (const element of this.focused) element.removeAttribute('data-scan-focus');
    this.current = node;
    this.focused = node ? (this.elements.get(node.id) ?? []) : [];
    for (const element of this.focused) element.setAttribute('data-scan-focus', '');
    this.box = boxAround(this.focused);
    const root = document.documentElement;
    if (node) root.dataset.scan = app.settings.scan.highlight;
    else delete root.dataset.scan;
    if (node && app.settings.scan.cues) this.cue(node.label);
  }

  /** Says the highlighted item, unless the message is being spoken. */
  private cue(label: string) {
    if (!label || speech.speaking || openaacVoice.engine.speaking) return;
    speech.speak(label, {
      lang: app.language,
      rate: app.settings.speech.rate,
      volume: app.settings.speech.volume * 0.8,
    });
  }

  private choose(node: ScanNode) {
    this.actions.get(node.id)?.();
    // The screen may change (a new board, a dialog): scan what's there now.
    requestAnimationFrame(() => this.refresh());
  }

  get highlighted() {
    return this.current;
  }
}

function boxAround(elements: HTMLElement[]): Box | null {
  if (elements.length === 0) return null;
  const rects = elements.map((element) => element.getBoundingClientRect());
  const top = Math.min(...rects.map((r) => r.top));
  const left = Math.min(...rects.map((r) => r.left));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  const right = Math.max(...rects.map((r) => r.right));
  return { top, left, width: right - left, height: bottom - top };
}

export const scanning = new Scanning();
