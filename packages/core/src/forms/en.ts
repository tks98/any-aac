/**
 * English word forms: verb tenses, plurals, comparatives and pronoun cases.
 * Rules cover regular words; tables cover the irregular ones children use most.
 */
import type { PartOfSpeech } from '../ext';
import type { WordForm } from './types';

/** Roughly how many syllables: vowel groups, not counting a silent final e. */
function syllables(word: string): number {
  const groups = word
    .toLowerCase()
    .replace(/e$/, '')
    .match(/[aeiouy]+/g);
  return Math.max(1, groups?.length ?? 1);
}

/** Ends consonant-vowel-consonant in one syllable (stop, big, run), so the last letter doubles. */
function doublesLast(word: string): boolean {
  return (
    syllables(word) === 1 &&
    /[^aeiou][aeiou][^aeiouwxy]$/.test(word) &&
    !/^[^aeiou]*[aeiou]{2}/.test(word)
  );
}

// ---------------------------------------------------------------- verbs

/** Irregular verbs: base, past, past participle. */
const IRREGULAR_VERBS: Record<string, [string, string]> = {
  be: ['was', 'been'],
  have: ['had', 'had'],
  do: ['did', 'done'],
  go: ['went', 'gone'],
  get: ['got', 'gotten'],
  make: ['made', 'made'],
  put: ['put', 'put'],
  eat: ['ate', 'eaten'],
  drink: ['drank', 'drunk'],
  feel: ['felt', 'felt'],
  see: ['saw', 'seen'],
  say: ['said', 'said'],
  tell: ['told', 'told'],
  take: ['took', 'taken'],
  give: ['gave', 'given'],
  come: ['came', 'come'],
  run: ['ran', 'run'],
  sit: ['sat', 'sat'],
  stand: ['stood', 'stood'],
  think: ['thought', 'thought'],
  know: ['knew', 'known'],
  buy: ['bought', 'bought'],
  bring: ['brought', 'brought'],
  catch: ['caught', 'caught'],
  teach: ['taught', 'taught'],
  fight: ['fought', 'fought'],
  find: ['found', 'found'],
  fall: ['fell', 'fallen'],
  fly: ['flew', 'flown'],
  forget: ['forgot', 'forgotten'],
  hear: ['heard', 'heard'],
  hold: ['held', 'held'],
  hurt: ['hurt', 'hurt'],
  hit: ['hit', 'hit'],
  cut: ['cut', 'cut'],
  keep: ['kept', 'kept'],
  sleep: ['slept', 'slept'],
  leave: ['left', 'left'],
  lose: ['lost', 'lost'],
  meet: ['met', 'met'],
  pay: ['paid', 'paid'],
  read: ['read', 'read'],
  ride: ['rode', 'ridden'],
  write: ['wrote', 'written'],
  drive: ['drove', 'driven'],
  sing: ['sang', 'sung'],
  swim: ['swam', 'swum'],
  begin: ['began', 'begun'],
  sell: ['sold', 'sold'],
  send: ['sent', 'sent'],
  spend: ['spent', 'spent'],
  build: ['built', 'built'],
  break: ['broke', 'broken'],
  choose: ['chose', 'chosen'],
  speak: ['spoke', 'spoken'],
  wake: ['woke', 'woken'],
  wear: ['wore', 'worn'],
  tear: ['tore', 'torn'],
  throw: ['threw', 'thrown'],
  grow: ['grew', 'grown'],
  draw: ['drew', 'drawn'],
  blow: ['blew', 'blown'],
  show: ['showed', 'shown'],
  win: ['won', 'won'],
  shut: ['shut', 'shut'],
  let: ['let', 'let'],
  hide: ['hid', 'hidden'],
  bite: ['bit', 'bitten'],
  feed: ['fed', 'fed'],
  lead: ['led', 'led'],
  dig: ['dug', 'dug'],
  stick: ['stuck', 'stuck'],
  swing: ['swung', 'swung'],
  understand: ['understood', 'understood'],
  lie: ['lay', 'lain'],
  mean: ['meant', 'meant'],
  shake: ['shook', 'shaken'],
  steal: ['stole', 'stolen'],
};

/** Forms that aren't made by any rule. */
const SPECIAL_VERBS: Record<string, string[]> = {
  be: ['be', 'am', 'is', 'are', 'was', 'were', 'being', 'been', "isn't", "aren't", "wasn't"],
  can: ['can', 'could', "can't", "couldn't"],
  will: ['will', 'would', "won't", "wouldn't"],
  do: ['do', 'does', 'did', 'doing', 'done', "don't", "doesn't", "didn't"],
  have: ['have', 'has', 'had', 'having', "haven't", "hasn't"],
};

/** Inflected words that lead back to their verb: "is" → "be", "went" → "go". */
const VERB_LEMMA: Record<string, string> = {
  am: 'be',
  is: 'be',
  are: 'be',
  was: 'be',
  were: 'be',
  been: 'be',
  being: 'be',
  could: 'can',
  would: 'will',
  has: 'have',
  does: 'do',
  ...Object.fromEntries(
    Object.entries(IRREGULAR_VERBS).flatMap(([base, [past, participle]]) => [
      [past, base],
      [participle, base],
    ]),
  ),
};

function thirdPerson(verb: string): string {
  if (/(ch|sh|s|x|z|o)$/.test(verb)) return `${verb}es`;
  if (/[^aeiou]y$/.test(verb)) return `${verb.slice(0, -1)}ies`;
  return `${verb}s`;
}

function presentParticiple(verb: string): string {
  if (verb.endsWith('ie')) return `${verb.slice(0, -2)}ying`;
  if (/[^aeioy]e$/.test(verb) && verb !== 'be') return `${verb.slice(0, -1)}ing`;
  if (doublesLast(verb)) return `${verb}${verb.at(-1)}ing`;
  return `${verb}ing`;
}

function regularPast(verb: string): string {
  if (verb.endsWith('e')) return `${verb}d`;
  if (/[^aeiou]y$/.test(verb)) return `${verb.slice(0, -1)}ied`;
  if (doublesLast(verb)) return `${verb}${verb.at(-1)}ed`;
  return `${verb}ed`;
}

function verbForms(word: string): string[] {
  const base = VERB_LEMMA[word] ?? word;
  const special = SPECIAL_VERBS[base];
  if (special) return special;
  const [past, participle] = IRREGULAR_VERBS[base] ?? [regularPast(base), regularPast(base)];
  return [base, thirdPerson(base), presentParticiple(base), past, participle];
}

// ---------------------------------------------------------------- nouns

const IRREGULAR_PLURALS: Record<string, string> = {
  child: 'children',
  man: 'men',
  woman: 'women',
  person: 'people',
  foot: 'feet',
  tooth: 'teeth',
  goose: 'geese',
  mouse: 'mice',
  leaf: 'leaves',
  knife: 'knives',
  wife: 'wives',
  life: 'lives',
  wolf: 'wolves',
  half: 'halves',
  shelf: 'shelves',
  loaf: 'loaves',
  potato: 'potatoes',
  tomato: 'tomatoes',
  hero: 'heroes',
  sheep: 'sheep',
  fish: 'fish',
  deer: 'deer',
  baby: 'babies',
};

/** Nouns that are rarely counted, so they get no plural. */
const UNCOUNTED = new Set([
  'water',
  'milk',
  'juice',
  'cereal',
  'rice',
  'bread',
  'money',
  'music',
  'homework',
  'food',
  'hair',
  'outside',
  'home',
]);

function plural(noun: string): string {
  const lower = noun.toLowerCase();
  const irregular = IRREGULAR_PLURALS[lower];
  if (irregular) return noun[0] === noun[0]?.toUpperCase() ? capitalized(irregular) : irregular;
  if (/(ch|sh|s|x|z)$/.test(lower)) return `${noun}es`;
  if (/[^aeiou]y$/.test(lower)) return `${noun.slice(0, -1)}ies`;
  return `${noun}s`;
}

const capitalized = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

function nounForms(word: string): string[] {
  const singular =
    Object.entries(IRREGULAR_PLURALS).find(([, p]) => p === word.toLowerCase())?.[0] ?? word;
  if (UNCOUNTED.has(singular.toLowerCase())) return [];
  return [singular, plural(singular), `${singular}'s`];
}

// ---------------------------------------------------------------- describing words

const IRREGULAR_COMPARISON: Record<string, [string, string]> = {
  good: ['better', 'best'],
  well: ['better', 'best'],
  bad: ['worse', 'worst'],
  little: ['less', 'least'],
  much: ['more', 'most'],
  many: ['more', 'most'],
  far: ['farther', 'farthest'],
};

function comparisons(adjective: string): [string, string] {
  const irregular = IRREGULAR_COMPARISON[adjective];
  if (irregular) return irregular;
  const count = syllables(adjective);
  if (count === 1 || (count === 2 && /y$/.test(adjective))) {
    if (adjective.endsWith('e')) return [`${adjective}r`, `${adjective}st`];
    if (/[^aeiou]y$/.test(adjective)) {
      const stem = adjective.slice(0, -1);
      return [`${stem}ier`, `${stem}iest`];
    }
    if (doublesLast(adjective)) {
      const last = adjective.at(-1);
      return [`${adjective}${last}er`, `${adjective}${last}est`];
    }
    return [`${adjective}er`, `${adjective}est`];
  }
  return [`more ${adjective}`, `most ${adjective}`];
}

/** Describing words that don't compare. */
const UNCOMPARED = new Set(['more', 'again', 'all done', 'same', 'different', 'done']);

function describingForms(word: string): string[] {
  if (word === 'more') return ['more', 'most'];
  if (UNCOMPARED.has(word)) return [];
  const base =
    Object.entries(IRREGULAR_COMPARISON).find(([, [c, s]]) => c === word || s === word)?.[0] ??
    word;
  return [base, ...comparisons(base)];
}

// ---------------------------------------------------------------- pronouns and determiners

const PRONOUN_SETS = [
  ['I', 'me', 'my', 'mine', 'myself'],
  ['you', 'your', 'yours', 'yourself'],
  ['he', 'him', 'his', 'himself'],
  ['she', 'her', 'hers', 'herself'],
  ['it', 'its', 'itself'],
  ['we', 'us', 'our', 'ours', 'ourselves'],
  ['they', 'them', 'their', 'theirs', 'themselves'],
  ['this', 'these'],
  ['that', 'those'],
];

function setForms(word: string): string[] {
  const lower = word === 'I' ? 'I' : word.toLowerCase();
  return PRONOUN_SETS.find((set) => set.includes(lower)) ?? [];
}

// ---------------------------------------------------------------- all together

const isVerb = (word: string) =>
  word in SPECIAL_VERBS || word in IRREGULAR_VERBS || word in VERB_LEMMA;

export function englishForms(word: string, type: PartOfSpeech | undefined): WordForm[] {
  const w = word.trim();
  if (w === '' || (/\s/.test(w) && type !== 'descriptor')) return [];
  let forms: string[];
  switch (type) {
    case 'verb':
      forms = verbForms(w.toLowerCase());
      break;
    case 'noun':
      forms = nounForms(w);
      break;
    case 'descriptor':
      forms = describingForms(w.toLowerCase());
      break;
    case 'pronoun':
    case 'determiner':
      forms = setForms(w);
      break;
    case undefined:
      // No word type: only words we're sure about.
      forms = setForms(w);
      if (forms.length === 0 && isVerb(w.toLowerCase())) forms = verbForms(w.toLowerCase());
      break;
    default:
      forms = [];
  }
  return [...new Set(forms)].map((text) => ({ text }));
}
