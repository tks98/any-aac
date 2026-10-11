import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Lets phones on your tailnet reach the dev and preview servers through
// `tailscale serve` (https://<machine>.<tailnet>.ts.net).
const allowedHosts = ['.ts.net'];

export default defineConfig({
  server: { allowedHosts },
  preview: { allowedHosts },
  plugins: [
    svelte(),
    VitePWA({
      // A new version waits until the app is next opened. It never reloads the
      // page while someone is in the middle of saying something.
      registerType: 'prompt',
      injectRegister: 'script-defer',
      includeAssets: ['icon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Open AAC',
        short_name: 'Open AAC',
        description: 'Free, open-source AAC that works offline.',
        lang: 'en',
        theme_color: '#E6EAEE',
        background_color: '#E6EAEE',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        clientsClaim: true,
      },
    }),
  ],
});
