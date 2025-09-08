// Processed entity types - simplified, flattened versions for LLM consumption
import { ProcessedEntity } from '../base-preset';

export interface ProcessedCharacter extends ProcessedEntity {
  Name: string;
  Description: string;
  Role: string;
  Age: string;
  Appearance: string;
  Personality: string;
  Background: string;
  Goals: string;
  Conflicts: string;
  Relationships: string;
  Development: string;
}

export interface ProcessedChapter extends ProcessedEntity {
  'Chapter Name': string;
  'Chapter Number': number;
  Description: string;
  Length: string;
  Goals: string;
  Conflicts: string;
  Setting: string;
  Mood: string;
  'Key Events': string;
  Characters: string;
}

export interface ProcessedChapterData extends ProcessedEntity {
  'Chapter Number': number;
  'Chapter Name': string;
  Description: string;
  Goals: string;
  Setting: string;
  Mood: string;
  Length: string;
  'Key Events': string;
  Conflicts: string;
  Characters: string;
  'Previous Events': string;
  'Writing Style': string;
  'Target Audience': string;
}

export interface ProcessedPageSummary extends ProcessedEntity {
  'Chapter Number': number;
  'Page Number': number;
  Title: string;
  Summary: string;
  'Key Events': string;
  Characters: string;
  Mood: string;
  Themes: string;
  Conflicts: string;
  Outcomes: string;
  'Next Steps': string;
}

export interface ProcessedPlot extends ProcessedEntity {
  Title: string;
  'Main Conflict': string;
  'Plot Structure': string;
  'Key Events': string;
  Climax: string;
  Resolution: string;
  'Sub Plots': string;
  'Plot Twists': string;
  Themes: string;
  Pacing: string;
  'Tension Curve': string;
}

export interface ProcessedSetting extends ProcessedEntity {
  Name: string;
  'Time Period': string;
  Location: string;
  Geography: string;
  Climate: string;
  Culture: string;
  Technology: string;
  Politics: string;
  Economy: string;
  Religion: string;
  'Social Structure': string;
  Atmosphere: string;
  'Important Places': string;
  Rules: string;
}

export interface ProcessedGenre extends ProcessedEntity {
  Name: string;
  Description: string;
  Conventions: string;
  Themes: string;
  Tone: string;
  Style: string;
  Audience: string;
  'Common Elements': string;
  Subgenres: string;
  Examples: string;
  'Writing Tips': string;
}

export interface ProcessedTargetAudience extends ProcessedEntity {
  Name: string;
  'Age Range': string;
  Description: string;
  Interests: string;
  'Reading Level': string;
  'Preferred Length': string;
  'Preferred Themes': string;
  'Language Style': string;
  'Content Guidelines': string;
  'Avoid Topics': string;
  'Engagement Tips': string;
}

export interface ProcessedNarrative extends ProcessedEntity {
  Name: string;
  Perspective: string;
  Narrator: string;
  Voice: string;
  Tense: string;
  Style: string;
  Tone: string;
  Pacing: string;
  Structure: string;
  'Language Level': string;
  'Dialogue Style': string;
  'Description Level': string;
  'Emotional Tone': string;
  'Writing Techniques': string;
}