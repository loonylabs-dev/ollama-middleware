import { BaseAIUseCase } from '../../middleware/usecases/base/base-ai.usecase';
import { BaseAIRequest, BaseAIResult } from '../../middleware/shared/types/base-request.types';
import { 
  CHARACTER_GENERATOR_SYSTEM_MESSAGE, 
  CHARACTER_GENERATOR_USER_TEMPLATE 
} from './character-generator.messages';
import { 
  FlatFormatter, 
  LLMContextBuilder,
  settingPreset,
  genrePreset,
  targetAudiencePreset 
} from '../../middleware/services/flat-formatter';

/**
 * Character generation prompt data
 */
export interface CharacterPromptData {
  characterName?: string;
  role: string;
  setting?: {
    Name: string;
    TimePeriod: string;
    Location: string;
    Culture: string;
    Atmosphere: string;
  };
  genre?: {
    Name: string;
    Themes: string;
    Style: string;
    Conventions: string;
  };
  targetAudience?: {
    Name: string;
    AgeRange: string;
    ReadingLevel: string;
    PreferredThemes: string;
  };
  constraints: string[];
}

/**
 * Character generation request interface
 * Extends BaseAIRequest to support complex prompt objects
 */
export interface CharacterGeneratorRequest extends BaseAIRequest<CharacterPromptData | string> {}

/**
 * Generated character structure (expected JSON response)
 */
export interface GeneratedCharacter {
  Name: string;
  Age: string;
  Description: string;
  Appearance: string;
  Personality: string;
  Background: string;
  Goals: string;
  Conflicts: string;
  Relationships: string;
  SpecialAbilities?: string;
  Weaknesses: string;
  Motivation: string;
  CharacterArc: string;
  Dialogue_Style: string;
  Key_Relationships: string[];
  Character_Flaws: string[];
  Strengths: string[];
}

/**
 * Character generation result interface
 * Extends BaseAIResult with character-specific data
 */
export interface CharacterGeneratorResult extends BaseAIResult {
  character: GeneratedCharacter;
  rawResponse: string;
  wasRepaired: boolean;
}

/**
 * Advanced character generator use case that demonstrates:
 * - FlatFormatter for input context preparation
 * - Structured JSON output with schema
 * - JSON cleaning and repair
 * - Complex context building with presets
 * - Message pattern with separate message files
 */
export class CharacterGeneratorUseCase extends BaseAIUseCase<CharacterPromptData | string, CharacterGeneratorRequest, CharacterGeneratorResult> {
  
  /**
   * System message from message file
   */
  protected readonly systemMessage = CHARACTER_GENERATOR_SYSTEM_MESSAGE;

  /**
   * Get the user template from message file
   */
  protected getUserTemplate(): (formattedPrompt: string) => string {
    return CHARACTER_GENERATOR_USER_TEMPLATE;
  }

  /**
   * Format the user message using FlatFormatter and presets
   */
  protected formatUserMessage(prompt: CharacterPromptData | string): string {
    // If it's already a string, return as is
    if (typeof prompt === 'string') {
      return prompt;
    }
    const { characterName, role, setting, genre, targetAudience, constraints } = prompt;
    
    // Build context using FlatFormatter and presets
    const contextBuilder = new LLMContextBuilder();
    
    let contextSections: string[] = [];
    
    // Add role requirement
    contextSections.push(`## CHARACTER ROLE REQUIREMENT:\n${role}`);
    
    // Add optional character name
    if (characterName) {
      contextSections.push(`## SUGGESTED NAME:\n${characterName}`);
    }
    
    // Format setting if provided
    if (setting) {
      const formattedSetting = settingPreset.formatForLLM(setting, "## STORY SETTING:");
      contextSections.push(formattedSetting);
    }
    
    // Format genre if provided
    if (genre) {
      const formattedGenre = genrePreset.formatForLLM(genre, "## GENRE REQUIREMENTS:");
      contextSections.push(formattedGenre);
    }
    
    // Format target audience if provided
    if (targetAudience) {
      const formattedAudience = targetAudiencePreset.formatForLLM(
        targetAudience, 
        "## TARGET AUDIENCE:"
      );
      contextSections.push(formattedAudience);
    }
    
    // Format constraints using FlatFormatter
    if (constraints && constraints.length > 0) {
      const constraintsFormatted = FlatFormatter.flatten(
        constraints.map((constraint: string, index: number) => ({ 
          constraint: constraint,
          priority: "MUST FOLLOW"
        })),
        {
          format: 'numbered',
          entryTitleKey: 'constraint',
          ignoredKeys: ['constraint'],
          keyValueSeparator: ': '
        }
      );
      contextSections.push(`## CHARACTER CONSTRAINTS:\n${constraintsFormatted}`);
    }
    
    return contextSections.join('\n\n');
  }

  /**
   * Create the result with parsed character data
   */
  protected createResult(content: string, usedPrompt: string, thinking?: string): CharacterGeneratorResult {
    let character: GeneratedCharacter;
    let wasRepaired = false;
    let rawResponse = content;

    try {
      // First try to parse directly
      character = JSON.parse(content);
    } catch (error) {
      // If direct parsing fails, this indicates JSON was repaired by ResponseProcessorService
      wasRepaired = true;
      try {
        character = JSON.parse(content);
      } catch (secondError) {
        // If it still fails after cleaning, create a fallback character
        character = this.createFallbackCharacter(content, rawResponse);
      }
    }

    // Validate required fields
    this.validateCharacter(character);

    return {
      generatedContent: content,
      model: this.modelConfig.name,
      usedPrompt: usedPrompt,
      thinking: thinking,
      character: character,
      rawResponse: rawResponse,
      wasRepaired: wasRepaired
    };
  }

  /**
   * Validate that the character has all required fields
   */
  private validateCharacter(character: GeneratedCharacter): void {
    const requiredFields = [
      'Name', 'Age', 'Description', 'Appearance', 'Personality', 
      'Background', 'Goals', 'Conflicts', 'Relationships', 
      'Weaknesses', 'Motivation', 'CharacterArc', 'Dialogue_Style'
    ];

    const missingFields = requiredFields.filter(field => 
      !character[field as keyof GeneratedCharacter] || 
      String(character[field as keyof GeneratedCharacter]).trim() === ''
    );

    if (missingFields.length > 0) {
      throw new Error(`Generated character is missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate array fields
    if (!Array.isArray(character.Key_Relationships)) {
      character.Key_Relationships = [];
    }
    if (!Array.isArray(character.Character_Flaws)) {
      character.Character_Flaws = [];
    }
    if (!Array.isArray(character.Strengths)) {
      character.Strengths = [];
    }
  }

  /**
   * Create a fallback character when JSON parsing completely fails
   */
  private createFallbackCharacter(content: string, rawResponse: string): GeneratedCharacter {
    return {
      Name: "Character Generation Failed",
      Age: "Unknown",
      Description: "Character generation failed due to invalid response format.",
      Appearance: "Unable to generate appearance.",
      Personality: "Unable to generate personality.",
      Background: "Unable to generate background.",
      Goals: "Unable to generate goals.",
      Conflicts: "Unable to generate conflicts.",
      Relationships: "Unable to generate relationships.",
      Weaknesses: "Unable to generate weaknesses.",
      Motivation: "Unable to generate motivation.",
      CharacterArc: "Unable to generate character arc.",
      Dialogue_Style: "Unable to generate dialogue style.",
      Key_Relationships: [],
      Character_Flaws: ["Generation failure"],
      Strengths: []
    };
  }
}