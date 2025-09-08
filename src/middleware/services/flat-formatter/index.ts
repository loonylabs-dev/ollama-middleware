// Core FlatFormatter service
export { FlatFormatter, FormatConfigurator, ComputedFieldOptions } from './flat-formatter.service';

// LLM Context Builder
export { LLMContextBuilder } from './llm-context-builder';

// Presets system
export * from './presets';

// Re-export everything for convenience
export {
  // Base classes
  BasePreset,
  BaseEntity,
  ProcessedEntity,
  FormatConfig,
  
  // Entity types
  GenericEntity,
  Character,
  Chapter,
  ChapterData,
  PageSummary,
  Plot,
  Setting,
  Genre,
  TargetAudience,
  Narrative,
  
  // Processed entity types
  ProcessedCharacter,
  ProcessedChapter,
  ProcessedChapterData,
  ProcessedPageSummary,
  ProcessedPlot,
  ProcessedSetting,
  ProcessedGenre,
  ProcessedTargetAudience,
  ProcessedNarrative,
  
  // Preset instances (ready to use)
  characterPreset,
  chapterPreset,
  genrePreset,
  settingPreset,
  plotPreset,
  targetAudiencePreset,
  narrativePreset,
  chapterDataPreset,
  pageSummaryPreset
} from './presets';