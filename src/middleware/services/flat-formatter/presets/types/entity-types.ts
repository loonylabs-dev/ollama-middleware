// Generic base interface for all entities
export interface GenericEntity {
  [key: string]: any;
}

// Character entity definition
export interface Character extends GenericEntity {
  Name?: string;
  Description?: string;
  Role?: string;
  Age?: string | number;
  Appearance?: string;
  Personality?: string;
  Background?: string;
  Goals?: string;
  Conflicts?: string;
  Relationships?: string;
  Development?: string;
  SpecialAbilities?: string;
  Weaknesses?: string;
}

// Chapter entity definition  
export interface Chapter extends GenericEntity {
  Chapter_Name?: string;
  Chapter_Nr?: number;
  Chapter_Description?: string;
  Chapter_Length?: string | number;
  Chapter_Goals?: string;
  Chapter_Conflicts?: string;
  Chapter_Setting?: string;
  Chapter_Mood?: string;
  Chapter_KeyEvents?: string;
  Chapter_Characters?: string;
}

// Chapter data entity definition
export interface ChapterData extends GenericEntity {
  Chapter_Nr?: number;
  Chapter_Name?: string;
  Chapter_Description?: string;
  Chapter_Goals?: string;
  Chapter_Setting?: string;
  Chapter_Mood?: string;
  Chapter_Length?: string | number;
  Chapter_KeyEvents?: string;
  Chapter_Conflicts?: string;
  Chapter_Characters?: string;
  Previous_Events?: string;
  Writing_Style?: string;
  Target_Audience?: string;
}

// Page summary entity definition
export interface PageSummary extends GenericEntity {
  chapterNr: number;
  pageNr?: number;
  title?: string;
  summary?: string;
  keyEvents?: string;
  characters?: string;
  mood?: string;
  themes?: string;
  conflicts?: string;
  outcomes?: string;
  nextSteps?: string;
}

// Plot entity definition
export interface Plot extends GenericEntity {
  Title?: string;
  MainConflict?: string;
  PlotStructure?: string;
  KeyEvents?: string;
  Climax?: string;
  Resolution?: string;
  SubPlots?: string;
  PlotTwists?: string;
  Themes?: string;
  Pacing?: string;
  TensionCurve?: string;
}

// Setting entity definition
export interface Setting extends GenericEntity {
  Name?: string;
  TimePeriod?: string;
  Location?: string;
  Geography?: string;
  Climate?: string;
  Culture?: string;
  Technology?: string;
  Politics?: string;
  Economy?: string;
  Religion?: string;
  SocialStructure?: string;
  Atmosphere?: string;
  ImportantPlaces?: string;
  Rules?: string;
}

// Genre entity definition
export interface Genre extends GenericEntity {
  Name?: string;
  Description?: string;
  Conventions?: string;
  Themes?: string;
  Tone?: string;
  Style?: string;
  Audience?: string;
  CommonElements?: string;
  Subgenres?: string;
  Examples?: string;
  WritingTips?: string;
}

// Target audience entity definition
export interface TargetAudience extends GenericEntity {
  Name?: string;
  AgeRange?: string;
  Description?: string;
  Interests?: string;
  ReadingLevel?: string;
  PreferredLength?: string;
  PreferredThemes?: string;
  LanguageStyle?: string;
  ContentGuidelines?: string;
  AvoidTopics?: string;
  EngagementTips?: string;
}

// Narrative entity definition
export interface Narrative extends GenericEntity {
  Name?: string;
  Perspective?: string;
  Narrator?: string;
  Voice?: string;
  Tense?: string;
  Style?: string;
  Tone?: string;
  Pacing?: string;
  Structure?: string;
  LanguageLevel?: string;
  DialogueStyle?: string;
  DescriptionLevel?: string;
  EmotionalTone?: string;
  WritingTechniques?: string;
}