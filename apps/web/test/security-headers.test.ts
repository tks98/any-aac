import { describe, expect, it } from 'vitest';
import { headersFile, securityHeaders } from '../security-headers';

describe('the _headers file for static hosts', () => {
  it('sends every security header on every path', () => {
    for (const selfHostedVoices of [true, false]) {
      const file = headersFile({ selfHostedVoices });
      const lines = file.split('\n').filter((line) => line && !line.startsWith('#'));
      expect(lines[0]).toBe('/*');
      expect(lines.slice(1)).toEqual(
        Object.entries(securityHeaders({ selfHostedVoices })).map(([n, v]) => `  ${n}: ${v}`),
      );
    }
    expect(headersFile({ selfHostedVoices: true })).toContain("frame-ancestors 'none'");
  });
});
