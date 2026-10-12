/// <reference types="vite-plugin-pwa/client" />

/** The app's version, from package.json (set in vite.config.ts). */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** "true" when the build serves voice files itself (see scripts/self-host-voices.mjs). */
  readonly VITE_SELF_HOST_VOICES?: string;
}
