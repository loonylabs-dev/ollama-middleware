import { BasePreset } from './base-preset';
import { Narrative } from './types/entity-types';
import { ProcessedNarrative } from './types/processed-entity-types';

export class NarrativePreset extends BasePreset<Narrative, ProcessedNarrative> {
  constructor() {
    super('Narrative');
  }

  protected preprocessEntity(narrative: Narrative): ProcessedNarrative {
    return {
      'Name': narrative.Name || 'Unnamed Narrative Style',
      'Perspective': narrative.Perspective || 'Unspecified perspective',
      'Narrator': narrative.Narrator || 'Unspecified narrator',
      'Voice': narrative.Voice || 'Unspecified voice',
      'Tense': narrative.Tense || 'Unspecified tense',
      'Style': narrative.Style || 'Unspecified style',
      'Tone': narrative.Tone || 'Unspecified tone',
      'Pacing': narrative.Pacing || 'Unspecified pacing',
      'Structure': narrative.Structure || 'Unspecified structure',
      'Language Level': narrative.LanguageLevel || 'Unspecified language level',
      'Dialogue Style': narrative.DialogueStyle || 'Unspecified dialogue style',
      'Description Level': narrative.DescriptionLevel || 'Unspecified description level',
      'Emotional Tone': narrative.EmotionalTone || 'Unspecified emotional tone',
      'Writing Techniques': narrative.WritingTechniques || 'No writing techniques specified'
    };
  }
}

// Singleton instance for global use
export const narrativePreset = new NarrativePreset();