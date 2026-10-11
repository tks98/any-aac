/**
 * Spanish word forms: present tense for each person, the gerund and the past
 * (preterite) for verbs; gender and number for describing words; plurals for
 * nouns. Rules cover regular words; tables cover the common irregular ones.
 */
import type { PartOfSpeech } from '../ext';
import type { WordForm } from './types';

const PERSONS = ['yo', 'tú', 'él, ella', 'nosotros', 'ellos, ellas'] as const;

interface Verb {
  infinitive: string;
  /** Present tense: yo, tú, él, nosotros, ellos. */
  present: [string, string, string, string, string];
  gerund: string;
  /** Preterite: yo, él. */
  past: [string, string];
}

/** Irregular and stem-changing verbs, in full. */
const IRREGULAR: Verb[] = [
  v('ser', 'soy eres es somos son', 'siendo', 'fui fue'),
  v('estar', 'estoy estás está estamos están', 'estando', 'estuve estuvo'),
  v('ir', 'voy vas va vamos van', 'yendo', 'fui fue'),
  v('tener', 'tengo tienes tiene tenemos tienen', 'teniendo', 'tuve tuvo'),
  v('querer', 'quiero quieres quiere queremos quieren', 'queriendo', 'quise quiso'),
  v('poder', 'puedo puedes puede podemos pueden', 'pudiendo', 'pude pudo'),
  v('hacer', 'hago haces hace hacemos hacen', 'haciendo', 'hice hizo'),
  v('poner', 'pongo pones pone ponemos ponen', 'poniendo', 'puse puso'),
  v('decir', 'digo dices dice decimos dicen', 'diciendo', 'dije dijo'),
  v('ver', 'veo ves ve vemos ven', 'viendo', 'vi vio'),
  v('dar', 'doy das da damos dan', 'dando', 'di dio'),
  v('venir', 'vengo vienes viene venimos vienen', 'viniendo', 'vine vino'),
  v('salir', 'salgo sales sale salimos salen', 'saliendo', 'salí salió'),
  v('saber', 'sé sabes sabe sabemos saben', 'sabiendo', 'supe supo'),
  v('oír', 'oigo oyes oye oímos oyen', 'oyendo', 'oí oyó'),
  v('traer', 'traigo traes trae traemos traen', 'trayendo', 'traje trajo'),
  v('leer', 'leo lees lee leemos leen', 'leyendo', 'leí leyó'),
  v('jugar', 'juego juegas juega jugamos juegan', 'jugando', 'jugué jugó'),
  v('dormir', 'duermo duermes duerme dormimos duermen', 'durmiendo', 'dormí durmió'),
  v('pedir', 'pido pides pide pedimos piden', 'pidiendo', 'pedí pidió'),
  v('sentir', 'siento sientes siente sentimos sienten', 'sintiendo', 'sentí sintió'),
  v('pensar', 'pienso piensas piensa pensamos piensan', 'pensando', 'pensé pensó'),
  v('empezar', 'empiezo empiezas empieza empezamos empiezan', 'empezando', 'empecé empezó'),
  v('cerrar', 'cierro cierras cierra cerramos cierran', 'cerrando', 'cerré cerró'),
  v('volver', 'vuelvo vuelves vuelve volvemos vuelven', 'volviendo', 'volví volvió'),
  v(
    'encontrar',
    'encuentro encuentras encuentra encontramos encuentran',
    'encontrando',
    'encontré encontró',
  ),
  v('contar', 'cuento cuentas cuenta contamos cuentan', 'contando', 'conté contó'),
  v('llegar', 'llego llegas llega llegamos llegan', 'llegando', 'llegué llegó'),
  v('buscar', 'busco buscas busca buscamos buscan', 'buscando', 'busqué buscó'),
  v('tocar', 'toco tocas toca tocamos tocan', 'tocando', 'toqué tocó'),
  v('pagar', 'pago pagas paga pagamos pagan', 'pagando', 'pagué pagó'),
  v('conocer', 'conozco conoces conoce conocemos conocen', 'conociendo', 'conocí conoció'),
  v('caer', 'caigo caes cae caemos caen', 'cayendo', 'caí cayó'),
];

function v(infinitive: string, present: string, gerund: string, past: string): Verb {
  return {
    infinitive,
    present: present.split(' ') as Verb['present'],
    gerund,
    past: past.split(' ') as Verb['past'],
  };
}

function regular(infinitive: string): Verb | undefined {
  const match = /^(.+)(ar|er|ir)$/.exec(infinitive);
  if (!match) return undefined;
  const [, stem, ending] = match as unknown as [string, string, 'ar' | 'er' | 'ir'];
  if (ending === 'ar') {
    return v(
      infinitive,
      `${stem}o ${stem}as ${stem}a ${stem}amos ${stem}an`,
      `${stem}ando`,
      `${stem}é ${stem}ó`,
    );
  }
  const we = ending === 'er' ? 'emos' : 'imos';
  return v(
    infinitive,
    `${stem}o ${stem}es ${stem}e ${stem}${we} ${stem}en`,
    `${stem}iendo`,
    `${stem}í ${stem}ió`,
  );
}

/** Starter words that are already a form of a verb (an imperative or a conjugation). */
const LEMMAS: Record<string, string> = {
  para: 'parar',
  mira: 'mirar',
  ayuda: 'ayudar',
  dame: 'dar',
  terminé: 'terminar',
  beber: 'beber',
  armar: 'armar',
};

function findVerb(word: string): Verb | undefined {
  const lemma = LEMMAS[word] ?? word;
  const known = IRREGULAR.find(
    (verb) =>
      verb.infinitive === lemma || verb.present.includes(lemma) || verb.past.includes(lemma),
  );
  if (known) return known;
  return regular(lemma);
}

function verbForms(word: string): WordForm[] {
  const verb = findVerb(word);
  if (!verb) return [];
  return [
    { text: verb.infinitive },
    ...verb.present.map((text, i) => ({ text, hint: PERSONS[i] })),
    { text: verb.gerund },
    { text: verb.past[0], hint: `${PERSONS[0]}, pasado` },
    { text: verb.past[1], hint: `${PERSONS[2]}, pasado` },
  ];
}

/** "me gusta", "me duele": the thing does the verb, and the pronoun says to whom. */
const PRONOUN_VERBS = ['me', 'te', 'le', 'nos', 'les'];

function pronounVerbForms(word: string): WordForm[] {
  const match = /^(me|te|le|nos|les|se) (.+)$/.exec(word);
  if (!match) return [];
  const [, , verb] = match as unknown as [string, string, string];
  // Reflexive verbs ("me siento") change person with the pronoun.
  if (verb === 'siento' || verb === 'sientes' || verb === 'siente') {
    return [
      { text: 'me siento', hint: PERSONS[0] },
      { text: 'te sientes', hint: PERSONS[1] },
      { text: 'se siente', hint: PERSONS[2] },
      { text: 'nos sentimos', hint: PERSONS[3] },
      { text: 'se sienten', hint: PERSONS[4] },
    ];
  }
  return PRONOUN_VERBS.map((pronoun, i) => ({ text: `${pronoun} ${verb}`, hint: PERSONS[i] }));
}

// ---------------------------------------------------------------- nouns and describing words

/** Removes the accent a plural no longer needs: "camión" → "camion" (+es → "camiones"). */
const unaccentLast = (word: string) =>
  word.replace(
    /([áéíóú])([nsl])$/,
    (_, vowel: string, last: string) => `${vowel.normalize('NFD')[0]}${last}`,
  );

function plural(word: string): string {
  if (/[aeiouáéó]$/.test(word)) return `${word}s`;
  if (word.endsWith('z')) return `${word.slice(0, -1)}ces`;
  // Consonants (and stressed í, ú) take -es: "cereal" → "cereales", "sándwich" → "sándwiches".
  return `${unaccentLast(word)}es`;
}

/** People nouns that change for gender. */
const GENDERED_NOUNS = new Set([
  'amigo',
  'niño',
  'hermano',
  'abuelo',
  'tío',
  'primo',
  'maestro',
  'hijo',
  'compañero',
  'vecino',
  'chico',
]);

/** Nouns that are rarely counted. */
const UNCOUNTED = new Set(['agua', 'leche', 'jugo', 'cereal', 'arroz', 'pan', 'afuera', 'casa']);

function nounForms(word: string): WordForm[] {
  if (UNCOUNTED.has(word)) return [];
  if (word.endsWith('o') && GENDERED_NOUNS.has(word)) return genderForms(word);
  if (word.endsWith('a') && GENDERED_NOUNS.has(`${word.slice(0, -1)}o`)) {
    return genderForms(`${word.slice(0, -1)}o`);
  }
  return [{ text: word }, { text: plural(word) }];
}

function genderForms(masculine: string): WordForm[] {
  const stem = masculine.slice(0, -1);
  return ['o', 'a', 'os', 'as'].map((ending) => ({ text: `${stem}${ending}` }));
}

/** Describing words that don't change. */
const INVARIABLE = new Set(['más', 'otra vez', 'menos', 'también']);

function describingForms(word: string): WordForm[] {
  if (word.startsWith('me ')) return pronounVerbForms(word);
  if (INVARIABLE.has(word) || /\s/.test(word)) return [];
  // Masculine or feminine in -o/-a: four forms.
  const gendered = /^(.+)([oa])(s?)$/.exec(word);
  if (gendered) return genderForms(`${gendered[1]}o`);
  // -or: trabajador, trabajadora…
  if (word.endsWith('or')) {
    return [word, `${word}a`, `${word}es`, `${word}as`].map((text) => ({ text }));
  }
  // The same for both genders: grande, feliz…
  return [{ text: word }, { text: plural(word) }];
}

// ---------------------------------------------------------------- pronouns and determiners

const PRONOUN_SETS = [
  ['yo', 'me', 'mí', 'mi', 'mío', 'mía', 'conmigo'],
  ['tú', 'te', 'ti', 'tu', 'tuyo', 'tuya', 'contigo'],
  ['él', 'lo', 'le', 'su', 'suyo'],
  ['ella', 'la', 'le', 'su', 'suya'],
  ['nosotros', 'nosotras', 'nos', 'nuestro', 'nuestra'],
  ['ellos', 'ellas', 'los', 'las', 'les'],
  ['esto', 'este', 'esta', 'estos', 'estas'],
  ['eso', 'ese', 'esa', 'esos', 'esas'],
];

function setForms(word: string): WordForm[] {
  return (PRONOUN_SETS.find((set) => set.includes(word)) ?? []).map((text) => ({ text }));
}

// ---------------------------------------------------------------- all together

export function spanishForms(word: string, type: PartOfSpeech | undefined): WordForm[] {
  const w = word.trim().toLowerCase();
  if (w === '') return [];
  switch (type) {
    case 'verb':
      return /\s/.test(w) ? pronounVerbForms(w) : verbForms(w);
    case 'noun':
      return /\s/.test(w) ? [] : nounForms(w);
    case 'descriptor':
      return describingForms(w);
    case 'pronoun':
    case 'determiner':
      return setForms(w);
    case undefined: {
      const set = setForms(w);
      if (set.length > 0) return set;
      return IRREGULAR.some((verb) => verb.infinitive === w || verb.present.includes(w))
        ? verbForms(w)
        : [];
    }
    default:
      return [];
  }
}
