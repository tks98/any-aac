import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/dev-dist/',
      '**/coverage/',
      '**/playwright-report/',
      '**/test-results/',
      // Generated from piper-wasm by scripts/trim-phonemizer.mjs.
      'apps/web/src/lib/voice/phonemizer/',
    ],
  },
  js.configs.recommended,
  ts.configs.recommended,
  svelte.configs.recommended,
  {
    // __APP_VERSION__ is defined at build time (apps/web/vite.config.ts).
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, __APP_VERSION__: 'readonly' },
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
);
