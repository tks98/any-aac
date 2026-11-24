import type { ObfButton } from '@any-aac/core';
import { describe, expect, it } from 'vitest';
import { cellColors } from '../src/lib/theme';

describe('cellColors', () => {
  it('uses an imported board’s own colours on light themes', () => {
    const button: ObfButton = {
      id: 'a',
      background_color: '#ffff32',
      border_color: 'rgb(68,68,68)',
    };
    expect(cellColors(button)).toEqual({ fill: '#ffff32', edge: 'rgb(68,68,68)', width: 2 });
  });

  it('never puts anything but a plain colour in a style', () => {
    const button: ObfButton = {
      id: 'a',
      background_color: 'red; position: fixed; inset: 0; z-index: 99999',
      border_color: 'rgb(0,0,0); background: url(x)',
    };
    expect(cellColors(button)).toEqual({ fill: '#FFFFFF', edge: '#C3CDD6', width: 2 });
    expect(cellColors({ ...button, border_color: '#000' })).toEqual({
      fill: '#FFFFFF',
      edge: '#000',
      width: 2,
    });
  });
});
