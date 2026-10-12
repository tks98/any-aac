import { describe, expect, it } from 'vitest';
import { appVoiceIdFor, defaultVoiceFor } from '../src/lib/voice/catalog';

describe('app voices for each language', () => {
  it('starts each language with its recommended voice, or its only one', () => {
    expect(defaultVoiceFor('en')?.name).toBe('Linda');
    expect(defaultVoiceFor('en-GB')?.name).toBe('Linda');
    expect(defaultVoiceFor('es-MX')?.name).toBe('Carlfm');
    expect(defaultVoiceFor('fr')).toBeUndefined();
  });

  it('uses the chosen voice, else the default, and none after a deletion', () => {
    expect(appVoiceIdFor({}, 'en')).toBe('en_US-ljspeech-medium');
    expect(appVoiceIdFor({ en: 'en_GB-cori-medium' }, 'en-US')).toBe('en_GB-cori-medium');
    expect(appVoiceIdFor({ en: '' }, 'en')).toBeNull();
    expect(appVoiceIdFor({}, 'fr')).toBeNull();
  });
});
