/**
 * The app's own words (buttons, menus, settings) in each language it's
 * translated into. Board words are translated on the boards themselves.
 *
 * To add a language, copy `en`, translate it, and add it to `MESSAGES`; the
 * `Messages` type makes sure nothing is missed.
 */

/** Formats a number with one decimal place, the way the language writes it. */
const oneDecimal = (lang: string, value: number) =>
  value.toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const en = {
  // Main screen
  boardNavigation: 'Board navigation',
  home: 'Home',
  back: 'Back',
  switchLanguage: (name: string) => `${name} (switch language)`,
  help: 'Help',
  edit: 'Edit',
  editHold: 'Edit boards (press and hold)',
  message: (text: string) => `Message: ${text}. Tap to speak it.`,
  messageEmpty: 'Message is empty',
  messageHint: 'Tap words to build a message',
  deleteLast: 'Delete last word',
  clearMessage: 'Clear message',
  speak: 'Speak',
  folder: (label: string) => `${label}, folder`,
  notSaved: 'Not saved on this device',

  // Settings
  settings: 'Settings',
  done: 'Done',
  settingsSections: 'Settings sections',
  sectionSpeech: 'Speech & voice',
  sectionLanguage: 'Language',
  sectionTouch: 'Touch',
  sectionDisplay: 'Display',
  sectionBoards: 'Boards & backup',
  sectionAbout: 'About',

  voice: 'Voice',
  voiceHelp: 'Open AAC voices sound the same on every device and work offline once downloaded.',
  openaacVoice: 'Open AAC voice',
  deviceVoice: 'Device voice',
  speakEachWord: 'Speak each word when tapped',
  speakEachWordHelp: 'Off: words only build the message until Speak is pressed.',
  rate: 'Speaking rate',
  pitch: 'Pitch',
  tryIt: 'Try it',
  testVoice: 'Test voice',
  openaacVoices: 'Open AAC voices',
  openaacVoicesHelp:
    'These run on this device. The first download is about 80 MB (the voice plus the speech engine), from the Piper project at huggingface.co. After that they work offline.',
  noOpenaacVoice: (language: string) =>
    `There's no Open AAC voice in ${language} yet, so the device voice speaks.`,
  female: 'female',
  male: 'male',
  smallAndFast: 'small and fast',
  downloading: (loaded: number, total: number) => `Downloading ${loaded} of ${total} MB`,
  startingVoice: 'Starting the voice…',
  voiceError: (error: string) => `Couldn't load this voice: ${error}`,
  inUse: 'In use',
  use: 'Use',
  delete: 'Delete',
  deleteVoice: (name: string) => `Delete ${name}`,
  confirmDeleteVoice: (name: string) => `Delete the ${name} voice from this device?`,
  download: 'Download',
  gettingReady: (done: number, total: number) => `Getting words ready: ${done} of ${total}`,
  deviceSpeaksUntilReady: 'Until an Open AAC voice is ready, the device voice speaks.',
  deviceVoicesHelp:
    'The voices this device offers. Voices that work offline keep speaking without internet.',
  deviceDefault: 'Device default',
  deviceDefaultHelp: 'Picks an offline voice in your language when there is one',
  otherVoices: (count: number) => `Other voices (${count})`,
  noVoices: "This browser hasn't listed any voices yet.",
  worksOffline: 'works offline',
  needsInternet: 'needs internet',

  languageIntro: 'Every language uses the same boards, with each word in the same place.',
  words: 'Words',
  wordsHelp: 'The language words are shown and spoken in.',
  secondLanguage: 'Second language',
  secondLanguageHelp:
    'For bilingual communicators: adds a button next to Home and Back that switches between the two languages.',
  none: 'None',
  onlyLanguage: (language: string) =>
    `These boards only have words in ${language}. Boards with translations can be used in more languages.`,
  appLanguage: 'Buttons and menus',
  appLanguageHelp: 'Automatic follows the words when the app is translated into their language.',
  automatic: 'Automatic',
  draftWords:
    'The starter words in every language are a first draft until speech-language pathologists who work in that language review them.',

  touchIntro: 'When a touch on a word counts. These apply to the board.',
  holdToSelect: 'Hold to select',
  holdToSelectHelp: 'How long a finger must stay on a word. 0 chooses it on first touch.',
  selectOnRelease: 'Select when finger lifts',
  selectOnReleaseHelp: 'Lets the finger slide to the right word before choosing it.',
  ignoreRepeats: 'Ignore repeat taps for',
  ignoreRepeatsHelp: 'Stops one tap from counting twice.',
  buttonGap: 'Space between buttons',
  buttonGapHelp: 'More space suits keyguards and tremor.',
  seconds: (ms: number) => `${oneDecimal('en', ms / 1000)} s`,
  times: (value: number) => `${oneDecimal('en', value)}×`,

  labels: 'Labels',
  labelsBelow: 'Below symbol',
  labelsAbove: 'Above symbol',
  showSymbols: 'Show symbols',
  showSymbolsHelp: 'Off: words only, in larger text.',

  boardsIntro:
    "Boards are stored on this device only. Export a copy now and then so they can't be lost.",
  importBoards: 'Import boards',
  exportBoards: 'Export all boards',
  resetBoards: 'Reset to starter boards',
  boardCount: (count: number) => (count === 1 ? '1 board' : `${count} boards`),
  confirmImport: (count: string, file: string) =>
    `Replace all boards on this device with ${count} from “${file}”?`,
  imported: (count: string) => `Imported ${count}.`,
  exported: 'Exported a copy of all boards.',
  confirmReset: 'Replace all boards on this device with the starter boards?',
  restored: 'Starter boards restored.',
  couldNotSave: 'They could not be saved on this device, so they will be gone when the app closes.',
  unreadable: 'That file could not be read.',
  fixedWhileImporting: (count: number) =>
    count === 1
      ? '1 small problem was fixed while importing'
      : `${count} small problems were fixed while importing`,
};

export type Messages = typeof en;

const es: Messages = {
  boardNavigation: 'Navegación de tableros',
  home: 'Inicio',
  back: 'Atrás',
  switchLanguage: (name) => `${name} (cambiar idioma)`,
  help: 'Ayuda',
  edit: 'Editar',
  editHold: 'Editar tableros (mantener pulsado)',
  message: (text) => `Mensaje: ${text}. Toca para decirlo.`,
  messageEmpty: 'El mensaje está vacío',
  messageHint: 'Toca palabras para formar un mensaje',
  deleteLast: 'Borrar la última palabra',
  clearMessage: 'Borrar el mensaje',
  speak: 'Hablar',
  folder: (label) => `${label}, carpeta`,
  notSaved: 'No se guardó en este dispositivo',

  settings: 'Ajustes',
  done: 'Listo',
  settingsSections: 'Secciones de ajustes',
  sectionSpeech: 'Habla y voz',
  sectionLanguage: 'Idioma',
  sectionTouch: 'Toque',
  sectionDisplay: 'Pantalla',
  sectionBoards: 'Tableros y copias',
  sectionAbout: 'Acerca de',

  voice: 'Voz',
  voiceHelp:
    'Las voces de Open AAC suenan igual en todos los dispositivos y, una vez descargadas, funcionan sin internet.',
  openaacVoice: 'Voz de Open AAC',
  deviceVoice: 'Voz del dispositivo',
  speakEachWord: 'Decir cada palabra al tocarla',
  speakEachWordHelp: 'Desactivado: las palabras solo forman el mensaje hasta pulsar Hablar.',
  rate: 'Velocidad',
  pitch: 'Tono',
  tryIt: 'Probar',
  testVoice: 'Probar la voz',
  openaacVoices: 'Voces de Open AAC',
  openaacVoicesHelp:
    'Funcionan en este dispositivo. La primera descarga ocupa unos 80 MB (la voz y el motor de habla) y viene del proyecto Piper en huggingface.co. Después funcionan sin internet.',
  noOpenaacVoice: (language) =>
    `Todavía no hay una voz de Open AAC en ${language}, así que habla la voz del dispositivo.`,
  female: 'femenina',
  male: 'masculina',
  smallAndFast: 'ligera y rápida',
  downloading: (loaded, total) => `Descargando ${loaded} de ${total} MB`,
  startingVoice: 'Iniciando la voz…',
  voiceError: (error) => `No se pudo cargar esta voz: ${error}`,
  inUse: 'En uso',
  use: 'Usar',
  delete: 'Borrar',
  deleteVoice: (name) => `Borrar ${name}`,
  confirmDeleteVoice: (name) => `¿Borrar la voz ${name} de este dispositivo?`,
  download: 'Descargar',
  gettingReady: (done, total) => `Preparando palabras: ${done} de ${total}`,
  deviceSpeaksUntilReady: 'Hasta que una voz de Open AAC esté lista, habla la voz del dispositivo.',
  deviceVoicesHelp:
    'Las voces que ofrece este dispositivo. Las que funcionan sin internet siguen hablando sin conexión.',
  deviceDefault: 'Predeterminada del dispositivo',
  deviceDefaultHelp: 'Elige una voz sin conexión en tu idioma si hay alguna',
  otherVoices: (count) => `Otras voces (${count})`,
  noVoices: 'Este navegador todavía no ha mostrado ninguna voz.',
  worksOffline: 'funciona sin internet',
  needsInternet: 'necesita internet',

  languageIntro: 'Todos los idiomas usan los mismos tableros, con cada palabra en el mismo lugar.',
  words: 'Palabras',
  wordsHelp: 'El idioma en que se muestran y se dicen las palabras.',
  secondLanguage: 'Segundo idioma',
  secondLanguageHelp:
    'Para comunicadores bilingües: añade un botón junto a Inicio y Atrás que cambia entre los dos idiomas.',
  none: 'Ninguno',
  onlyLanguage: (language) =>
    `Estos tableros solo tienen palabras en ${language}. Los tableros con traducciones se pueden usar en más idiomas.`,
  appLanguage: 'Botones y menús',
  appLanguageHelp:
    'Automático sigue a las palabras cuando la aplicación está traducida a su idioma.',
  automatic: 'Automático',
  draftWords:
    'Las palabras iniciales de cada idioma son un primer borrador hasta que las revisen terapeutas del lenguaje que trabajen en ese idioma.',

  touchIntro: 'Cuándo cuenta un toque sobre una palabra. Se aplica al tablero.',
  holdToSelect: 'Mantener para elegir',
  holdToSelectHelp:
    'Cuánto tiempo debe quedarse el dedo sobre una palabra. 0 la elige al primer toque.',
  selectOnRelease: 'Elegir al levantar el dedo',
  selectOnReleaseHelp: 'Permite deslizar el dedo hasta la palabra correcta antes de elegirla.',
  ignoreRepeats: 'Ignorar toques repetidos durante',
  ignoreRepeatsHelp: 'Evita que un toque cuente dos veces.',
  buttonGap: 'Espacio entre botones',
  buttonGapHelp: 'Más espacio va mejor con rejillas protectoras y temblores.',
  seconds: (ms) => `${oneDecimal('es', ms / 1000)} s`,
  times: (value) => `${oneDecimal('es', value)}×`,

  labels: 'Etiquetas',
  labelsBelow: 'Debajo del símbolo',
  labelsAbove: 'Encima del símbolo',
  showSymbols: 'Mostrar símbolos',
  showSymbolsHelp: 'Desactivado: solo palabras, en letra más grande.',

  boardsIntro:
    'Los tableros se guardan solo en este dispositivo. Exporta una copia de vez en cuando para no perderlos.',
  importBoards: 'Importar tableros',
  exportBoards: 'Exportar todos los tableros',
  resetBoards: 'Volver a los tableros iniciales',
  boardCount: (count) => (count === 1 ? '1 tablero' : `${count} tableros`),
  confirmImport: (count, file) =>
    `¿Reemplazar todos los tableros de este dispositivo por ${count} de «${file}»?`,
  imported: (count) => `Importado: ${count}.`,
  exported: 'Se exportó una copia de todos los tableros.',
  confirmReset: '¿Reemplazar todos los tableros de este dispositivo por los tableros iniciales?',
  restored: 'Se restauraron los tableros iniciales.',
  couldNotSave:
    'No se pudieron guardar en este dispositivo, así que desaparecerán al cerrar la aplicación.',
  unreadable: 'No se pudo leer ese archivo.',
  fixedWhileImporting: (count) =>
    count === 1
      ? 'Se corrigió 1 pequeño problema al importar'
      : `Se corrigieron ${count} pequeños problemas al importar`,
};

export const MESSAGES = { en, es } satisfies Record<string, Messages>;

export type AppLanguage = keyof typeof MESSAGES;

export const APP_LANGUAGES = Object.keys(MESSAGES) as AppLanguage[];

export const isAppLanguage = (lang: string): lang is AppLanguage => Object.hasOwn(MESSAGES, lang);

/**
 * The language of buttons and menus. "auto" follows the words in use when the
 * app is translated into their language, then the browser's languages, then English.
 */
export function pickAppLanguage(
  setting: 'auto' | AppLanguage,
  wordsLanguage: string,
  browserLanguages: readonly string[],
): AppLanguage {
  if (setting !== 'auto') return setting;
  const candidates = [wordsLanguage, ...browserLanguages].map(
    (lang) => lang.toLowerCase().split('-')[0] ?? '',
  );
  return candidates.find(isAppLanguage) ?? 'en';
}
