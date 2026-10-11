import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Regenerate the PNG icons in public/ with `pnpm generate-icons` after changing icon.svg.
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/icon.svg'],
});
