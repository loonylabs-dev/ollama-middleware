import { BasePreset } from './base-preset';
import { ChapterData } from './types/entity-types';
import { ProcessedChapterData } from './types/processed-entity-types';

export class ChapterDataPreset extends BasePreset<ChapterData, ProcessedChapterData> {
  constructor() {
    super('ChapterData');
  }

  protected preprocessEntity(chapterData: ChapterData): ProcessedChapterData {
    return {
      'Chapter Number': chapterData.Chapter_Nr || 0,
      'Chapter Name': chapterData.Chapter_Name || 'Untitled Chapter',
      'Description': chapterData.Chapter_Description || 'No description available',
      'Goals': chapterData.Chapter_Goals || 'No goals specified',
      'Setting': chapterData.Chapter_Setting || 'No setting specified',
      'Mood': chapterData.Chapter_Mood || 'No mood specified',
      'Length': String(chapterData.Chapter_Length || 'Not specified'),
      'Key Events': chapterData.Chapter_KeyEvents || 'No key events specified',
      'Conflicts': chapterData.Chapter_Conflicts || 'No conflicts specified',
      'Characters': chapterData.Chapter_Characters || 'No characters specified',
      'Previous Events': chapterData.Previous_Events || 'No previous events specified',
      'Writing Style': chapterData.Writing_Style || 'No writing style specified',
      'Target Audience': chapterData.Target_Audience || 'No target audience specified'
    };
  }
}

// Singleton instance for global use
export const chapterDataPreset = new ChapterDataPreset();