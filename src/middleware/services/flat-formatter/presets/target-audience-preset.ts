import { BasePreset } from './base-preset';
import { TargetAudience } from './types/entity-types';
import { ProcessedTargetAudience } from './types/processed-entity-types';

export class TargetAudiencePreset extends BasePreset<TargetAudience, ProcessedTargetAudience> {
  constructor() {
    super('TargetAudience');
  }

  protected preprocessEntity(targetAudience: TargetAudience): ProcessedTargetAudience {
    return {
      'Name': targetAudience.Name || 'Unspecified Audience',
      'Age Range': targetAudience.AgeRange || 'Unspecified age range',
      'Description': targetAudience.Description || 'No description available',
      'Interests': targetAudience.Interests || 'No interests specified',
      'Reading Level': targetAudience.ReadingLevel || 'Unspecified reading level',
      'Preferred Length': targetAudience.PreferredLength || 'No length preference specified',
      'Preferred Themes': targetAudience.PreferredThemes || 'No theme preferences specified',
      'Language Style': targetAudience.LanguageStyle || 'No language style specified',
      'Content Guidelines': targetAudience.ContentGuidelines || 'No content guidelines specified',
      'Avoid Topics': targetAudience.AvoidTopics || 'No topics to avoid specified',
      'Engagement Tips': targetAudience.EngagementTips || 'No engagement tips provided'
    };
  }
}

// Singleton instance for global use
export const targetAudiencePreset = new TargetAudiencePreset();