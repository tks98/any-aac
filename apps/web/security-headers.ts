/**
 * The app's security policy. It keeps the promise that Any AAC contacts no
 * other site: the browser refuses any script, style, font or request from
 * elsewhere, including scripts a host or network might inject.
 *
 * - Every build puts the Content-Security-Policy in its pages (vite.config.ts),
 *   so self-hosted copies have it too.
 * - any-aac.com also sends it, with the other headers here, from Cloudflare
 *   (docs/research/decisions/0010-hosting.md). Headers cover what a page's own
 *   policy can't: framing, and the workers that run the voice. To print them:
 *
 *     node apps/web/security-headers.ts
 *
 * - `pnpm preview`, which the browser tests run against, sends the headers
 *   too, so the tests catch anything they would block.
 */

/** Where development builds download voices: Hugging Face, which redirects to its CDN. */
const VOICE_HOSTS = ['https://huggingface.co', 'https://*.huggingface.co', 'https://*.hf.co'];

export function contentSecurityPolicy({ selfHostedVoices }: { selfHostedVoices: boolean }) {
  return [
    "default-src 'self'",
    // WebAssembly runs the voice and its phonemizer.
    "script-src 'self' 'wasm-unsafe-eval'",
    // Svelte sets some styles inline.
    "style-src 'self' 'unsafe-inline'",
    // Photos are shown from blob: URLs, and some pictures are SVG data: URLs.
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src ${["'self'", ...(selfHostedVoices ? [] : VOICE_HOSTS)].join(' ')}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ].join('; ');
}

/** The headers for a site that serves the voices itself, as any-aac.com does. */
export function securityHeaders({ selfHostedVoices }: { selfHostedVoices: boolean }) {
  return {
    // Only a header can stop other sites showing the app in a frame.
    'Content-Security-Policy': `${contentSecurityPolicy({ selfHostedVoices })}; frame-ancestors 'none'`,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    // Nothing the app doesn't use. Game controllers stay allowed: they can be switches.
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=()',
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [name, value] of Object.entries(securityHeaders({ selfHostedVoices: true }))) {
    console.log(`${name}: ${value}`);
  }
}
