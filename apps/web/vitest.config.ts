import { defineConfig } from 'vitest/config';

// Unit tests only; the Playwright browser tests live in e2e/.
export default defineConfig({
  test: { include: ['test/**/*.test.ts'] },
});
