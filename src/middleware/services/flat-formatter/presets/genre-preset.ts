import { BasePreset } from './base-preset';
import { Genre } from './types/entity-types';
import { ProcessedGenre } from './types/processed-entity-types';

export class GenrePreset extends BasePreset<Genre, ProcessedGenre> {
  constructor() {
    super('Genre');
  }

  protected preprocessEntity(genre: Genre): ProcessedGenre {
    return {
      'Name': genre.Name || 'Unknown Genre',
      'Description': genre.Description || 'No description available',
      'Conventions': genre.Conventions || 'No conventions specified',
      'Themes': genre.Themes || 'No themes specified',
      'Tone': genre.Tone || 'No tone specified',
      'Style': genre.Style || 'No style specified',
      'Audience': genre.Audience || 'No target audience specified',
      'Common Elements': genre.CommonElements || 'No common elements specified',
      'Subgenres': genre.Subgenres || 'No subgenres specified',
      'Examples': genre.Examples || 'No examples provided',
      'Writing Tips': genre.WritingTips || 'No writing tips provided'
    };
  }
}

// Singleton instance for global use
export const genrePreset = new GenrePreset();