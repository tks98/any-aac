import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { contentSecurityPolicy, securityHeaders } from './security-headers';

// Lets phones on your tailnet reach the dev and preview servers through
// `tailscale serve` (https://<machine>.<tailnet>.ts.net).
const allowedHosts = ['.ts.net'];

const selfHostedVoices = process.env.VITE_SELF_HOST_VOICES === 'true';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

/**
 * Puts the security policy (security-headers.ts) first in every built page,
 * and asks the browser not to tell other sites where a link was opened from.
 */
function securityPolicy(): Plugin {
  return {
    name: 'any-aac-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: {
          'http-equiv': 'Content-Security-Policy',
          content: contentSecurityPolicy({ selfHostedVoices }),
        },
        injectTo: 'head-prepend',
      },
      { tag: 'meta', attrs: { name: 'referrer', content: 'no-referrer' }, injectTo: 'head' },
    ],
  };
}

/**
 * The link preview's image (public/social-card.jpg). Previews need its full
 * address, so a build for a known address (SITE_URL, as on GitHub Pages) gives
 * that and the page's own; otherwise it's relative, which some sites accept.
 */
function linkPreview(): Plugin {
  let base = '/';
  return {
    name: 'any-aac-link-preview',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml(_html, { path }) {
      if (path !== '/index.html') return;
      const site = process.env.SITE_URL;
      const meta = (property: string, content: string) => ({
        tag: 'meta',
        attrs: { property, content },
        injectTo: 'head' as const,
      });
      return [
        meta('og:image', site ? new URL('social-card.jpg', site).href : `${base}social-card.jpg`),
        meta('og:image:width', '1200'),
        meta('og:image:height', '630'),
        meta('og:image:alt', 'The Any AAC word board on an iPad'),
        ...(site ? [meta('og:url', site)] : []),
      ];
    },
  };
}

export default defineConfig({
  // GitHub Pages serves the app from /<repo>/; elsewhere it's the site root.
  base: process.env.BASE_PATH ?? '/',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  server: { allowedHosts },
  // The headers any-aac.com sends, so the browser tests run under them.
  preview: { allowedHosts, headers: securityHeaders({ selfHostedVoices }) },
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
    securityPolicy(),
    linkPreview(),
    VitePWA({
      // A new version waits until it can't interrupt anyone: it never reloads
      // the page while someone is in the middle of saying something.
      registerType: 'prompt',
      // src/lib/updates.svelte.ts registers it, and decides when to update.
      injectRegister: false,
      includeAssets: ['icon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Any AAC',
        short_name: 'Any AAC',
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
        // .bin: the bundled starter clips, so starter words speak offline from the start.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,bin}'],
        // The offline voice is an optional download: cache its code when first
        // used, rather than making every install fetch it.
        globIgnores: [
          '**/ort*.js',
          '**/piper*.js',
          '**/voice.worker*.js',
          // The symbol library is fetched as symbols are looked at, not up front.
          'symbol-library/**',
          // Voices are optional downloads the app caches itself.
          'voices/**',
        ],
        // Cache names keep the app's first name (Open AAC), so a device that's
        // offline still finds the voice engine it downloaded before the rename.
        runtimeCaching: [
          {
            urlPattern: /\/assets\/(ort|piper|voice\.worker)[^/]*\.(m?js|wasm|data)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'open-aac-voice-runtime' },
          },
          {
            urlPattern: /\/symbol-library\/index\.json$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'open-aac-symbol-index' },
          },
          {
            urlPattern: /\/symbol-library\/.+\.svg$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'open-aac-symbols',
              expiration: { maxEntries: 4000 },
            },
          },
        ],
        clientsClaim: true,
      },
    }),
  ],
});
