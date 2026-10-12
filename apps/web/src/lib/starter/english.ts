/**
 * The English-first starter vocabulary, with Spanish translations for
 * bilingual communicators (same boards, every word in the same place).
 *
 * The core words are Project Core's Universal Core vocabulary (Center for
 * Literacy and Disability Studies, UNC-Chapel Hill, CC BY 4.0): 36 words
 * prioritised from published core lists, device vocabularies and frequency
 * data, with "finished" as "all done". Added from Banajee et al.'s (2003)
 * toddler core: my, is, yes, no; and eat and drink, which young children use
 * constantly. See docs/research/decisions/0003-core-vocabulary.md.
 */
import { STARTER_TRANSLATIONS } from './english-translations';
import { folder, word, type Vocabulary } from './types';

export const ENGLISH: Vocabulary = {
  id: 'en',
  locale: 'en',
  names: { core: 'Core words', phone: ' (phone)', phrases: 'Phrases', more: 'More words' },
  // Word types run left to right in sentence order (Modified Fitzgerald).
  columns: [
    [
      word('I', 'pronoun'),
      word('you', 'pronoun'),
      word('it', 'pronoun'),
      word('he', 'pronoun'),
      word('she', 'pronoun'),
      word('my', 'pronoun'),
    ],
    [
      word('want', 'verb'),
      word('like', 'verb'),
      word('go', 'verb'),
      word('stop', 'verb'),
      word('help', 'verb'),
      word('look', 'verb'),
    ],
    [
      word('get', 'verb'),
      word('put', 'verb'),
      word('make', 'verb'),
      word('open', 'verb'),
      word('turn', 'verb'),
      word('do', 'verb'),
    ],
    [
      word('is', 'verb'),
      word('can', 'verb'),
      word('eat', 'verb'),
      word('drink', 'verb'),
      word('yes', 'social'),
      word('no', 'social'),
    ],
    [
      word('more', 'descriptor'),
      word('all', 'descriptor'),
      word('some', 'descriptor'),
      word('good', 'descriptor'),
      word('same', 'descriptor'),
      word('different', 'descriptor'),
    ],
    [
      word('that', 'determiner'),
      word('here', 'preposition'),
      word('in', 'preposition'),
      word('on', 'preposition'),
      word('up', 'preposition'),
      word('all done', 'social', 'allDone'),
    ],
    [
      word('not', 'negation'),
      word('what', 'question'),
      word('where', 'question'),
      word('who', 'question'),
      word('when', 'question'),
      word('why', 'question'),
    ],
    [
      folder('People', 'people'),
      folder('Food', 'food'),
      folder('Places', 'places'),
      folder('Feelings', 'feelings'),
      folder('Body', 'body'),
      folder('Things', 'things'),
    ],
  ],
  // The large board's 35 extra words: more pronouns, verbs, describing words
  // and little words from published core lists, each beside its word type,
  // and its partner where it has one (in/out, on/off, up/down, hot/cold).
  extraWords: [
    word('we', 'pronoun'),
    word('me', 'pronoun', null),
    word('your', 'pronoun', null),
    word('they', 'pronoun'),
    word('this', 'determiner', null),
    word('him', 'pronoun', 'he'),
    word('her', 'pronoun', 'she'),
    word('mine', 'pronoun', null),
    word('need', 'verb', null),
    word('give', 'verb'),
    word('have', 'verb'),
    word('play', 'verb'),
    word('know', 'verb', null),
    word('come', 'verb'),
    word('say', 'verb'),
    word('wait', 'verb'),
    word('think', 'verb'),
    word('see', 'verb'),
    word('again', 'descriptor'),
    word('big', 'descriptor'),
    word('little', 'descriptor'),
    word('hot', 'descriptor'),
    word('cold', 'descriptor'),
    word('bad', 'descriptor'),
    word('fast', 'descriptor'),
    word('slow', 'descriptor'),
    word('out', 'preposition'),
    word('how', 'question'),
    word('and', 'preposition', null),
    word('there', 'preposition'),
    word('with', 'preposition', null),
    word('to', 'preposition', null),
    word('off', 'preposition'),
    word('down', 'preposition'),
    word('now', 'preposition'),
    folder('Animals', 'animals'),
    folder('More words', 'more-words'),
  ],
  // Medium columns move to columns 1, 3, 4, 6, 7, 9, 10 and 12, and medium
  // rows 4–6 to rows 5–7: the cells that cover the same part of the screen.
  large: {
    rows: [
      ['I', 'me', 'want', 'get', 'play', 'is', 'more', 'big', 'that', 'not', 'and', 'People'],
      [
        'you',
        'your',
        'like',
        'put',
        'know',
        'can',
        'all',
        'little',
        'here',
        'what',
        'there',
        'Food',
      ],
      ['it', 'they', 'go', 'make', 'come', 'eat', 'some', 'hot', 'in', 'where', 'with', 'Places'],
      ['we', 'this', 'need', 'give', 'say', 'have', 'again', 'cold', 'out', 'how', 'to', 'Animals'],
      ['he', 'him', 'stop', 'open', 'wait', 'drink', 'good', 'bad', 'on', 'who', 'off', 'Feelings'],
      ['she', 'her', 'help', 'turn', 'think', 'yes', 'same', 'fast', 'up', 'when', 'down', 'Body'],
      [
        'my',
        'mine',
        'look',
        'do',
        'see',
        'no',
        'different',
        'slow',
        'all done',
        'why',
        'now',
        'Things',
      ],
    ],
    topics: [
      {
        id: 'animals',
        name: 'Animals',
        words: ['dog', 'cat', 'bird', 'fish', 'horse', 'cow'].map((w) => word(w, 'noun')),
      },
    ],
  },
  // Twenty of the medium words, each in the cell covering its medium place;
  // the other 21 are on More words, and "who" is on People.
  small: {
    rows: [
      ['I', 'want', 'is', 'more', 'not', 'People'],
      ['you', 'go', 'eat', 'all', 'what', 'Food'],
      ['he', 'stop', 'yes', 'good', 'up', 'Feelings'],
      ['my', 'help', 'no', 'different', 'all done', 'More words'],
    ],
    more: [
      ['like', 'get', 'put', 'here', 'that', 'Places'],
      ['it', 'make', 'can', 'some', 'where', 'Body'],
      ['she', 'open', 'drink', 'same', 'on', 'Things'],
      ['look', 'do', 'turn', 'in', 'why', 'when'],
    ],
  },
  keepOnTopics: ['I', 'want', 'more', 'not', 'eat', 'drink', 'help', 'all done'],
  topics: [
    {
      id: 'people',
      name: 'People',
      words: [
        word('Mom', 'pronoun', 'mom'),
        word('Dad', 'pronoun', 'dad'),
        word('teacher', 'pronoun'),
        word('friend', 'pronoun'),
        word('baby', 'pronoun'),
        word('who', 'question'),
      ],
    },
    {
      id: 'food',
      name: 'Food',
      words: [
        'apple',
        'banana',
        'cookie',
        'pizza',
        'sandwich',
        'cereal',
        'juice',
        'milk',
        'water',
      ].map((w) => word(w, 'noun')),
    },
    {
      id: 'places',
      name: 'Places',
      words: ['home', 'school', 'park', 'store', 'outside', 'bathroom'].map((w) => word(w, 'noun')),
    },
    {
      id: 'feelings',
      name: 'Feelings',
      words: [
        word('feel', 'verb'),
        ...['happy', 'sad', 'mad', 'scared', 'tired', 'sick', 'excited', 'hurt'].map((w) =>
          word(w, 'descriptor'),
        ),
      ],
    },
    {
      id: 'body',
      name: 'Body',
      words: ['head', 'hand', 'tummy', 'leg', 'mouth', 'eye'].map((w) => word(w, 'noun')),
    },
    {
      id: 'things',
      name: 'Things',
      words: [
        word('play', 'verb'),
        ...['ball', 'book', 'tablet', 'phone', 'blanket', 'teddy'].map((w) => word(w, 'noun')),
      ],
    },
  ],
  // 22 of the core words in the same left-to-right order and, where possible,
  // the same rows. See docs/research/decisions/0005-phone-layouts.md.
  phone: [
    ['I', 'want', 'more', 'not'],
    ['you', 'like', 'here', 'what'],
    ['it', 'go', 'eat', 'where'],
    ['stop', 'drink', 'good', 'that'],
    ['help', 'get', 'yes', 'up'],
    ['no', 'all done', 'Food', 'Feelings'],
    ['People', 'Places', 'Body', 'Things'],
  ],
  phrases: [
    'Hello',
    'Goodbye',
    'Thank you',
    "Please wait, I'm thinking",
    'I need a break',
    "I don't understand",
    'Can you help me?',
    'I need the bathroom',
    'Something is wrong',
    'Leave me alone, please',
    "I'm finished",
  ],
  translations: STARTER_TRANSLATIONS,
  credit:
    '<p>Core words from the <a href="https://www.med.unc.edu/ahs/clds/universal-core-vocabulary/">Universal Core vocabulary</a> ' +
    '(Center for Literacy and Disability Studies, UNC-Chapel Hill, CC BY 4.0), with a few additions, arranged by Any AAC contributors.</p>',
};
