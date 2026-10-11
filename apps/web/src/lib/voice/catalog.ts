import type { VoiceSource } from './piper';

/**
 * Piper voices we can offer: only ones trained on openly licensed recordings.
 * (Several popular Piper voices, such as hfc_female, lessac and ryan, are
 * non-commercial, so they're left out.)
 *
 * The files currently come from the Piper project on Hugging Face. Before this
 * ships, they must be served from the app's own origin like everything else.
 */
export interface VoiceEntry {
  id: string;
  name: string;
  lang: string;
  description: string;
  license: string;
  sizeMB: number;
  source: VoiceSource;
}

const HF = 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0';

const piper = (locale: string, name: string, quality = 'medium'): VoiceSource => {
  const base = `${HF}/${locale.split('_')[0]}/${locale}/${name}/${quality}/${locale}-${name}-${quality}`;
  return { model: `${base}.onnx`, config: `${base}.onnx.json` };
};

export const VOICES: VoiceEntry[] = [
  {
    id: 'en_US-ljspeech-medium',
    name: 'Linda',
    lang: 'en-US',
    description: 'US English, female',
    license: 'Public domain (LJ Speech)',
    sizeMB: 63.5,
    source: piper('en_US', 'ljspeech'),
  },
  {
    id: 'en_US-kristin-medium',
    name: 'Kristin',
    lang: 'en-US',
    description: 'US English, female',
    license: 'Public domain (LibriVox)',
    sizeMB: 63.5,
    source: piper('en_US', 'kristin'),
  },
  {
    id: 'en_US-norman-medium',
    name: 'Norman',
    lang: 'en-US',
    description: 'US English, male',
    license: 'Public domain (LibriVox)',
    sizeMB: 63.5,
    source: piper('en_US', 'norman'),
  },
  {
    id: 'en_US-joe-medium',
    name: 'Joe',
    lang: 'en-US',
    description: 'US English, male',
    license: 'CC0 (Nabu Casa)',
    sizeMB: 63.2,
    source: piper('en_US', 'joe'),
  },
  {
    id: 'en_GB-cori-medium',
    name: 'Cori',
    lang: 'en-GB',
    description: 'UK English, female',
    license: 'Public domain (LibriVox)',
    sizeMB: 63.5,
    source: piper('en_GB', 'cori'),
  },
  {
    id: 'en_GB-alba-medium',
    name: 'Alba',
    lang: 'en-GB',
    description: 'UK English, female',
    license: 'CC BY 4.0 (University of Edinburgh)',
    sizeMB: 63.2,
    source: piper('en_GB', 'alba'),
  },
];
