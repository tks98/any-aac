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
  names: { core: 'Core words', phone: ' (phone)', phrases: 'Phrases' },
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
    '(Center for Literacy and Disability Studies, UNC-Chapel Hill, CC BY 4.0), with a few additions, arranged by Open AAC contributors.</p>',
};
