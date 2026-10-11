import { describe, expect, it } from 'vitest';
import { addWord, replaceLastWord, wordForms, type PartOfSpeech } from '../src';

const texts = (word: string, lang: string, type?: PartOfSpeech) =>
  wordForms(word, lang, type).map((f) => f.text);

describe('English word forms', () => {
  it('conjugates regular verbs', () => {
    expect(texts('want', 'en', 'verb')).toEqual(['want', 'wants', 'wanting', 'wanted']);
    expect(texts('stop', 'en', 'verb')).toEqual(['stop', 'stops', 'stopping', 'stopped']);
    expect(texts('like', 'en', 'verb')).toEqual(['like', 'likes', 'liking', 'liked']);
    expect(texts('play', 'en', 'verb')).toEqual(['play', 'plays', 'playing', 'played']);
    expect(texts('cry', 'en', 'verb')).toEqual(['cry', 'cries', 'crying', 'cried']);
    expect(texts('watch', 'en', 'verb')).toEqual(['watch', 'watches', 'watching', 'watched']);
    expect(texts('open', 'en', 'verb')).toEqual(['open', 'opens', 'opening', 'opened']);
  });

  it('knows irregular verbs, from any of their forms', () => {
    expect(texts('go', 'en', 'verb')).toEqual(['go', 'goes', 'going', 'went', 'gone']);
    expect(texts('went', 'en', 'verb')).toEqual(['go', 'goes', 'going', 'went', 'gone']);
    expect(texts('eat', 'en', 'verb')).toEqual(['eat', 'eats', 'eating', 'ate', 'eaten']);
    expect(texts('get', 'en', 'verb')).toEqual(['get', 'gets', 'getting', 'got', 'gotten']);
    expect(texts('make', 'en', 'verb')).toEqual(['make', 'makes', 'making', 'made']);
    expect(texts('is', 'en', 'verb')).toContain('was');
    expect(texts('can', 'en', 'verb')).toEqual(['can', 'could', "can't", "couldn't"]);
    expect(texts('do', 'en', 'verb')).toContain("don't");
  });

  it('makes plurals and possessives', () => {
    expect(texts('apple', 'en', 'noun')).toEqual(['apple', 'apples', "apple's"]);
    expect(texts('sandwich', 'en', 'noun')).toEqual(['sandwich', 'sandwiches', "sandwich's"]);
    expect(texts('tummy', 'en', 'noun')).toEqual(['tummy', 'tummies', "tummy's"]);
    expect(texts('baby', 'en', 'noun')).toEqual(['baby', 'babies', "baby's"]);
    expect(texts('foot', 'en', 'noun')).toEqual(['foot', 'feet', "foot's"]);
    expect(texts('water', 'en', 'noun')).toEqual([]);
  });

  it('compares describing words', () => {
    expect(texts('big', 'en', 'descriptor')).toEqual(['big', 'bigger', 'biggest']);
    expect(texts('good', 'en', 'descriptor')).toEqual(['good', 'better', 'best']);
    expect(texts('happy', 'en', 'descriptor')).toEqual(['happy', 'happier', 'happiest']);
    expect(texts('nice', 'en', 'descriptor')).toEqual(['nice', 'nicer', 'nicest']);
    expect(texts('excited', 'en', 'descriptor')).toEqual([
      'excited',
      'more excited',
      'most excited',
    ]);
    expect(texts('again', 'en', 'descriptor')).toEqual([]);
  });

  it('gives pronoun cases', () => {
    expect(texts('I', 'en', 'pronoun')).toEqual(['I', 'me', 'my', 'mine', 'myself']);
    expect(texts('she', 'en', 'pronoun')).toEqual(['she', 'her', 'hers', 'herself']);
    expect(texts('that', 'en', 'determiner')).toEqual(['that', 'those']);
  });

  it('guesses only when sure, without a word type', () => {
    expect(texts('he', 'en')).toEqual(['he', 'him', 'his', 'himself']);
    expect(texts('went', 'en')).toContain('go');
    expect(texts('apple', 'en')).toEqual([]);
    expect(texts('all done', 'en', 'social')).toEqual([]);
  });
});

describe('Spanish word forms', () => {
  it('conjugates regular verbs in the present, gerund and past', () => {
    expect(wordForms('comer', 'es', 'verb')).toEqual([
      { text: 'comer' },
      { text: 'como', hint: 'yo' },
      { text: 'comes', hint: 'tú' },
      { text: 'come', hint: 'él, ella' },
      { text: 'comemos', hint: 'nosotros' },
      { text: 'comen', hint: 'ellos, ellas' },
      { text: 'comiendo' },
      { text: 'comí', hint: 'yo, pasado' },
      { text: 'comió', hint: 'él, ella, pasado' },
      { text: 'voy a comer', hint: 'futuro' },
      { text: 'comido' },
    ]);
    expect(texts('voy', 'es', 'verb')).toContain('ido');
    expect(texts('abrir', 'es', 'verb')).toContain('abierto');
    expect(texts('tomar', 'es', 'verb')).toContain('tomado');
    expect(texts('abrir', 'es', 'verb')).toContain('abrimos');
    expect(texts('para', 'es', 'verb')).toContain('paramos');
  });

  it('knows irregular verbs, from a conjugated form', () => {
    expect(texts('quiero', 'es', 'verb')).toEqual([
      'querer',
      'quiero',
      'quieres',
      'quiere',
      'queremos',
      'quieren',
      'queriendo',
      'quise',
      'quiso',
      'voy a querer',
      'querido',
    ]);
    expect(texts('ir', 'es', 'verb')).toContain('vamos');
    expect(texts('tengo', 'es', 'verb')).toContain('tienes');
    expect(texts('está', 'es', 'verb')).toContain('estoy');
    expect(texts('jugar', 'es', 'verb')).toContain('juego');
  });

  it('changes the pronoun of gustar-like and reflexive verbs', () => {
    expect(texts('me gusta', 'es', 'verb')).toEqual([
      'me gusta',
      'te gusta',
      'le gusta',
      'nos gusta',
      'les gusta',
    ]);
    expect(texts('me siento', 'es', 'verb')).toContain('nos sentimos');
    expect(texts('me duele', 'es', 'descriptor')).toContain('le duele');
  });

  it('gives describing words their gender and number', () => {
    expect(texts('cansado', 'es', 'descriptor')).toEqual([
      'cansado',
      'cansada',
      'cansados',
      'cansadas',
    ]);
    expect(texts('feliz', 'es', 'descriptor')).toEqual(['feliz', 'felices']);
    expect(texts('grande', 'es', 'descriptor')).toEqual(['grande', 'grandes']);
    expect(texts('más', 'es', 'descriptor')).toEqual([]);
  });

  it('makes plurals, and gender for people', () => {
    expect(texts('manzana', 'es', 'noun')).toEqual(['manzana', 'manzanas']);
    expect(texts('sándwich', 'es', 'noun')).toEqual(['sándwich', 'sándwiches']);
    expect(texts('camión', 'es', 'noun')).toEqual(['camión', 'camiones']);
    expect(texts('lápiz', 'es', 'noun')).toEqual(['lápiz', 'lápices']);
    expect(texts('papá', 'es', 'noun')).toEqual(['papá', 'papás']);
    expect(texts('amigo', 'es', 'noun')).toEqual(['amigo', 'amiga', 'amigos', 'amigas']);
    expect(texts('agua', 'es', 'noun')).toEqual([]);
  });

  it('gives pronoun and determiner forms', () => {
    expect(texts('yo', 'es', 'pronoun')).toContain('conmigo');
    expect(texts('eso', 'es', 'determiner')).toEqual(['eso', 'ese', 'esa', 'esos', 'esas']);
  });
});

describe('languages without forms', () => {
  it('has none', () => {
    expect(wordForms('vouloir', 'fr', 'verb')).toEqual([]);
  });
});

describe('replaceLastWord', () => {
  it('swaps the last word for another form, keeping its symbol', () => {
    let message = addWord([], { id: 'i', label: 'I' });
    message = addWord(
      message,
      { id: 'w', label: 'want', image_id: 'img', ext_openaac_part_of_speech: 'verb' },
      'core',
      'en',
    );
    expect(message[1]).toEqual({
      label: 'want',
      text: 'want',
      imageId: 'img',
      boardId: 'core',
      type: 'verb',
      lang: 'en',
    });
    expect(replaceLastWord(message, 'wanted')[1]).toMatchObject({
      label: 'wanted',
      text: 'wanted',
      imageId: 'img',
    });
    expect(replaceLastWord([], 'x')).toEqual([]);
  });
});
