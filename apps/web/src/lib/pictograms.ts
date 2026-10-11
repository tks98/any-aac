/**
 * Placeholder pictograms for the starter vocabulary: simple line drawings on a
 * 48×48 grid, drawn for this project. They hold the place of real symbol sets
 * (Mulberry, OpenMoji) until the symbol pipeline lands.
 */

const circle = (x: number, y: number, r: number) =>
  `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const HEAD = circle(24, 13, 6);
const BODY = 'M12 41c0-7 5-13 12-13s12 6 12 13';
const PERSON = HEAD + BODY;
const FACE = circle(24, 24, 17);
const EYES = 'M18 20v1M30 20v1';
const SHE = circle(24, 14, 6) + 'M17 18c-3-9 1-14 7-14s10 5 7 14M13 42l11-14 11 14z';
const HE = PERSON + 'M18 9c2-3 10-3 12 0';
const WE =
  circle(16, 14, 5) +
  circle(32, 14, 5) +
  'M5 40c0-6 5-11 11-11s11 5 11 11M21 40c0-6 5-11 11-11s11 5 11 11';
const APPLE =
  'M24 15c-4-3-13-3-15 5s3 21 9 21c3 0 4-1 6-1s3 1 6 1c6 0 11-13 9-21s-11-8-15-5zM24 15c0-4 2-8 6-9';
const HOUSE = 'M6 22L24 8l18 14M10 19v22h28V19M20 41V29h8v12';
const BALL = circle(24, 24, 17) + 'M9 18c9 5 21 5 30 0M9 30c9-5 21-5 30 0';
const BOOK =
  'M8 10h13a4 4 0 0 1 3 2 4 4 0 0 1 3-2h13v28H27a3 3 0 0 0-3 3 3 3 0 0 0-3-3H8zM24 12v29';
const EYE = 'M4 24s7-12 20-12 20 12 20 12-7 12-20 12S4 24 4 24z' + circle(24, 24, 5);

export const PICTOGRAMS: Record<string, string> = {
  I: PERSON + circle(24, 35, 2),
  you: circle(20, 13, 6) + 'M8 41c0-7 5-13 12-13s12 6 12 13M45 4l-9 9m0-7v7h7',
  it: 'M24 6l16 9v18l-16 9-16-9V15zM8 15l16 9 16-9M24 24v18',
  he: HE,
  she: SHE,
  we: WE,
  want: 'M42 24H14m8-8l-8 8 8 8M7 10v28',
  like: 'M24 41S7 31 7 18a8.5 8.5 0 0 1 17-2 8.5 8.5 0 0 1 17 2c0 13-17 23-17 23z',
  go: 'M7 24h32m-11-11l11 11-11 11',
  stop: 'M17 5h14l12 12v14L31 43H17L5 31V17zM15 24h18',
  help: circle(24, 24, 17) + circle(24, 24, 7) + 'M12 12l7 7M36 12l-7 7M12 36l7-7M36 36l-7-7',
  look: EYE,
  get: 'M24 30V7m-8 8l8-8 8 8M7 27v13h34V27',
  put: 'M24 7v23m-8-8l8 8 8-8M7 27v13h34V27',
  make: 'M27 7l14 14-6 6-14-14zM24 16L7 33l7 7 17-17',
  open: 'M7 20h34v21H7zM7 20l-2-9h12l2 9M41 20l2-9H31l-2 9',
  play: BALL,
  feel: FACE + EYES + 'M17 31h14',
  is: 'M10 18h28M10 30h28',
  can: circle(24, 24, 17) + 'M16 24l6 6 11-12',
  do: 'M24 5v9M24 34v9M5 24h9M34 24h9M11 11l6 6M31 31l6 6M11 37l6-6M31 17l6-6',
  have: 'M9 20h30v20H9zM17 20v-6a7 7 0 0 1 14 0v6',
  eat: 'M13 6v12a4 4 0 0 0 8 0V6M17 6v36M33 6c-4 0-6 5-6 9s2 7 6 7 6-3 6-7-2-9-6-9zM33 22v20',
  drink: 'M13 9h22l-3 32H16zM14 18h20',
  more: 'M24 8v32M8 24h32',
  again: 'M10 20a15 15 0 0 1 27-6M37 5v9h-9M38 28a15 15 0 0 1-27 6M11 43v-9h9',
  big: circle(24, 24, 18),
  little: circle(24, 24, 7),
  good: 'M14 22v18H7V22zM14 22l8-14c3 0 5 2 4 6l-2 6h12c3 0 4 3 3 5l-4 12c-1 2-2 3-4 3H14',
  bad: 'M14 26V8H7v18zM14 26l8 14c3 0 5-2 4-6l-2-6h12c3 0 4-3 3-5l-4-12c-1-2-2-3-4-3H14',
  that: 'M9 39L35 13M21 13h14v14',
  in: 'M8 10h32v30H8z' + circle(24, 28, 5),
  on: 'M5 38h38' + circle(24, 27, 8),
  up: 'M24 41V7M12 19L24 7l12 12',
  down: 'M24 7v34M12 29l12 12 12-12',
  allDone: 'M12 43V5M12 7h25l-6 8 6 8H12',
  my: PERSON + 'M45 31H31m5-5l-5 5 5 5',
  different: circle(14, 24, 8) + 'M30 16h14v16H30z',
  same: 'M6 17h14v14H6zM28 17h14v14H28z',
  all:
    'M4 6h40v36H4z' + circle(15, 17, 4) + circle(33, 17, 4) + circle(15, 31, 4) + circle(33, 31, 4),
  some: circle(15, 24, 5) + circle(29, 24, 5) + 'M40 24h.01',
  turn: 'M38 24a14 14 0 1 1-4-10M38 8v8h-8',
  here: 'M24 6v24m-8-8l8 8 8-8' + circle(24, 40, 3),
  when: circle(24, 24, 17) + 'M24 14v10l7 5',
  why: 'M15 16a7 7 0 1 1 10 6.3c-2 1-3 2.7-3 4.7v3M22 37v1M33 31l8 8M41 31l-8 8',
  not: circle(24, 24, 17) + 'M12 12l24 24',
  what: 'M17 16a7 7 0 1 1 10 6.3c-2 1-3 2.7-3 4.7v3M24 37v1',
  where: 'M24 43s14-12 14-23a14 14 0 0 0-28 0c0 11 14 23 14 23z' + circle(24, 20, 5),
  who:
    circle(17, 15, 6) +
    'M5 42c0-8 5-14 12-14s12 6 12 14M33 13a5 5 0 1 1 7 4.5c-1.5.8-2 2-2 3.5v2M38 29v1',
  yes: 'M8 26l10 10 22-24',
  no: 'M12 12l24 24M36 12L12 36',
  people:
    circle(24, 12, 6) +
    'M12 40c0-7 5-12 12-12s12 5 12 12' +
    circle(9, 18, 4) +
    'M2 37c0-5 3-9 7-9' +
    circle(39, 18, 4) +
    'M46 37c0-5-3-9-7-9',
  food: APPLE,
  places: HOUSE,
  feelings: FACE + EYES + 'M16 28c4 5 12 5 16 0',
  body: circle(24, 8, 4) + 'M24 12v16M13 18h22M24 28l-7 14M24 28l7 14',
  things: BOOK,
  apple: APPLE,
  banana: 'M9 30c8 9 26 6 31-12 1-4 0-8-1-11-3 11-12 19-24 20-3 0-5 1-6 3zM39 7l2-3',
  cookie:
    circle(24, 24, 17) +
    circle(18, 18, 1.5) +
    circle(29, 17, 1.5) +
    circle(30, 29, 1.5) +
    circle(18, 30, 1.5) +
    circle(24, 24, 1.5),
  pizza:
    'M7 12c11-6 23-6 34 0L24 43zM9 17c10-4 20-4 30 0' + circle(21, 24, 2.5) + circle(28, 31, 2.5),
  sandwich: 'M5 22L24 9l19 13zM5 22v5h38v-5M6 32h36M6 36c0 2 2 4 4 4h28c2 0 4-2 4-4',
  cereal: 'M5 24h38a19 19 0 0 1-38 0zM13 20c2-4 6-4 8 0M24 18c2-4 6-4 8 0',
  juice: 'M14 16h20v26H14zM14 16l4-6h12l4 6M27 10l4-6h4',
  milk: 'M16 18l4-10h8l4 10v24H16zM16 18h16M20 8h8',
  water: 'M24 5s14 16 14 25a14 14 0 0 1-28 0c0-9 14-25 14-25z',
  happy: FACE + EYES + 'M16 28c4 5 12 5 16 0',
  sad: FACE + EYES + 'M16 33c4-5 12-5 16 0',
  mad: FACE + 'M15 16l6 3M33 16l-6 3M18 22v1M30 22v1M17 33h14',
  scared: FACE + circle(18, 20, 2.5) + circle(30, 20, 2.5) + circle(24, 32, 3.5),
  tired: FACE + 'M15 21h6M27 21h6M20 32h8',
  sick: FACE + EYES + 'M16 31c3-3 5 3 8 0s5 3 8 0',
  excited: FACE + EYES + 'M15 27h18c0 6-4 9-9 9s-9-3-9-9z',
  hurt: 'M10 30L30 10a6 6 0 0 1 8 8L18 38a6 6 0 0 1-8-8zM20 20l8 8',
  mom: SHE,
  dad: HE,
  teacher: PERSON + 'M33 4h12v9H33z',
  friend: WE,
  baby: circle(24, 17, 8) + 'M13 41c0-6 5-10 11-10s11 4 11 10M21 17v1M27 17v1',
  home: HOUSE,
  school: 'M6 42V19l18-11 18 11v23M3 42h42M19 42V31h10v11M24 8V3h6',
  park: 'M24 43V27M24 5c-8 0-13 6-13 12s5 10 13 10 13-4 13-10-5-12-13-12z',
  store: 'M4 8h6l4 21h23l4-15H12' + circle(17, 37, 3) + circle(34, 37, 3),
  outside:
    circle(24, 24, 7) +
    'M24 5v5M24 38v5M5 24h5M38 24h5M10.5 10.5l3.5 3.5M34 34l3.5 3.5M10.5 37.5l3.5-3.5M34 14l3.5-3.5',
  bathroom: 'M13 6h12v14H13zM9 20h26c0 8-5 13-11 13v9M15 42h18',
  head: circle(24, 20, 13) + 'M19 18v1M29 18v1M20 25c2.5 2 5.5 2 8 0M19 33v9M29 33v9',
  hand: 'M16 24V10a3 3 0 0 1 6 0v12M22 20V7a3 3 0 0 1 6 0v13M28 20V9a3 3 0 0 1 6 0v17c0 9-6 16-14 16-6 0-9-3-12-8l-5-8a3 3 0 0 1 5-3l4 5',
  tummy: 'M14 6c-2 10-4 18-2 26 2 7 8 10 12 10s10-3 12-10c2-8 0-16-2-26' + circle(24, 28, 2),
  leg: 'M20 4v26l-6 12h12l2-12V4',
  mouth: 'M8 24c8-8 24-8 32 0-8 9-24 9-32 0zM8 24h32',
  eye: EYE,
  ball: BALL,
  book: BOOK,
  tablet: 'M10 6h28v36H10zM21 37h6',
  phone: 'M16 4h16v40H16zM22 39h4',
  blanket: 'M6 10h36v28H6zM6 19h36M6 29h36M18 10v28M30 10v28',
  teddy:
    circle(24, 27, 12) +
    circle(14, 12, 5) +
    circle(34, 12, 5) +
    circle(24, 17, 9) +
    'M21 16v1M27 16v1M22 21c1.5 1 2.5 1 4 0',
};

export const hasPictogram = (key: string) => key in PICTOGRAMS;

export function pictogramDataUri(key: string, stroke = '#15202B'): string {
  const path = PICTOGRAMS[key];
  if (path === undefined) throw new Error(`No pictogram named "${key}".`);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="${stroke}" ` +
    `stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
