/** iPhone and iPad (iPadOS says it's a Mac, but has touch). */
export const isAppleMobile =
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1));
