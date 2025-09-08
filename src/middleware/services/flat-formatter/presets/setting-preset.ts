import { BasePreset } from './base-preset';
import { Setting } from './types/entity-types';
import { ProcessedSetting } from './types/processed-entity-types';

export class SettingPreset extends BasePreset<Setting, ProcessedSetting> {
  constructor() {
    super('Setting');
  }

  protected preprocessEntity(setting: Setting): ProcessedSetting {
    return {
      'Name': setting.Name || 'Unnamed Setting',
      'Time Period': setting.TimePeriod || 'Unspecified time period',
      'Location': setting.Location || 'Unspecified location',
      'Geography': setting.Geography || 'No geography described',
      'Climate': setting.Climate || 'No climate described',
      'Culture': setting.Culture || 'No culture described',
      'Technology': setting.Technology || 'No technology level specified',
      'Politics': setting.Politics || 'No political system described',
      'Economy': setting.Economy || 'No economic system described',
      'Religion': setting.Religion || 'No religious system described',
      'Social Structure': setting.SocialStructure || 'No social structure described',
      'Atmosphere': setting.Atmosphere || 'No atmosphere described',
      'Important Places': setting.ImportantPlaces || 'No important places specified',
      'Rules': setting.Rules || 'No special rules specified'
    };
  }
}

// Singleton instance for global use
export const settingPreset = new SettingPreset();