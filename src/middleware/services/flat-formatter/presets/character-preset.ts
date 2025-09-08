import { BasePreset } from './base-preset';
import { Character } from './types/entity-types';
import { ProcessedCharacter } from './types/processed-entity-types';

export class CharacterPreset extends BasePreset<Character, ProcessedCharacter> {
  constructor() {
    super('Character');
  }

  protected preprocessEntity(character: Character): ProcessedCharacter {
    return {
      'Name': character.Name || 'Unknown Character',
      'Description': character.Description || 'No description available',
      'Role': character.Role || 'Undefined role',
      'Age': String(character.Age || 'Unknown'),
      'Appearance': character.Appearance || 'No appearance described',
      'Personality': character.Personality || 'No personality described',
      'Background': character.Background || 'No background provided',
      'Goals': character.Goals || 'No goals specified',
      'Conflicts': character.Conflicts || 'No conflicts specified',
      'Relationships': character.Relationships || 'No relationships described',
      'Development': character.Development || 'No character development arc specified'
    };
  }
}

// Singleton instance for global use
export const characterPreset = new CharacterPreset();