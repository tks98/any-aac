import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Lets phones on your tailnet reach the dev and preview servers through
// `tailscale serve` (https://<machine>.<tailnet>.ts.net).
const allowedHosts = ['.ts.net'];

export default defineConfig({
  server: { allowedHosts },
  preview: { allowedHosts },
  // ONNX Runtime finds its .wasm next to itself; pre-bundling would break that.
  optimizeDeps: { exclude: ['onnxruntime-web'] },
  // The voice worker loads ONNX Runtime and the phonemizer on demand.
  worker: { format: 'es' },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        voiceLab: fileURLToPath(new URL('./voice-lab.html', import.meta.url)),
      },
    },
    // Keep symbols as separate files (cached by the service worker) rather than
    // inlining the small ones into the JavaScript bundle.
    assetsInlineLimit: (file) => (file.includes('/assets/symbols/') ? false : undefined),
  },
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
        // The offline voice is an optional download: cache its code when first
        // used, rather than making every install fetch it.
        globIgnores: ['**/ort*.js', '**/phonemizer*.js', '**/piper*.js'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/(ort|phonemizer|piper)[^/]*\.(m?js|wasm)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'open-aac-voice-runtime' },
          },
        ],
        clientsClaim: true,
      },
    }),
  ],
});
