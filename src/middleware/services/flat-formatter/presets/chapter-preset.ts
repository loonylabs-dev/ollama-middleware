import { BasePreset } from './base-preset';
import { Chapter } from './types/entity-types';
import { ProcessedChapter } from './types/processed-entity-types';

export class ChapterPreset extends BasePreset<Chapter, ProcessedChapter> {
  constructor() {
    super('Chapter');
  }

  protected preprocessEntity(chapter: Chapter): ProcessedChapter {
    return {
      'Chapter Name': chapter.Chapter_Name || 'Untitled Chapter',
      'Chapter Number': chapter.Chapter_Nr || 0,
      'Description': chapter.Chapter_Description || 'No description available',
      'Length': String(chapter.Chapter_Length || 'Not specified'),
      'Goals': chapter.Chapter_Goals || 'No goals specified',
      'Conflicts': chapter.Chapter_Conflicts || 'No conflicts specified',
      'Setting': chapter.Chapter_Setting || 'No setting specified',
      'Mood': chapter.Chapter_Mood || 'No mood specified',
      'Key Events': chapter.Chapter_KeyEvents || 'No key events specified',
      'Characters': chapter.Chapter_Characters || 'No characters specified'
    };
  }
}

// Singleton instance for global use
export const chapterPreset = new ChapterPreset();