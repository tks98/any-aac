import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// Unit tests only; the Playwright browser tests live in e2e/. The Svelte plugin
// compiles .svelte.ts modules, which use runes.
export default defineConfig({
  plugins: [svelte()],
  test: { include: ['test/**/*.test.ts'] },
});
