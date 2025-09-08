import { ollamaService } from '../../middleware/services/ollama/ollama.service';
import { getModelConfig, ModelConfigKey, OllamaModelConfig } from '../../middleware/shared/config/models.config';
import { ResponseProcessorService } from '../../middleware/services/response-processor/response-processor.service';
import { logger } from '../../middleware/shared/utils/logging.utils';
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
 * Overrides the base prompt type to support complex objects
 */
export interface CharacterGeneratorRequest {
  prompt: CharacterPromptData;
  authToken?: string;
}

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
 */
export interface CharacterGeneratorResult {
  generatedContent: string;
  model: string;
  usedPrompt: string;
  thinking?: string;
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
 */
export class CharacterGeneratorUseCase {
  
  /**
   * Model configuration key to use for this use case
   */
  protected readonly modelConfigKey: ModelConfigKey = 'MODEL1';

  /**
   * Get the model configuration for this use case
   */
  protected get modelConfig(): OllamaModelConfig {
    return getModelConfig(this.modelConfigKey);
  }

  /**
   * System message with detailed JSON schema for character generation
   */
  protected readonly systemMessage = `You are an expert character creation assistant for creative writing. Your task is to generate detailed, compelling characters based on the provided context.

IMPORTANT: You MUST respond with ONLY a valid JSON object following this exact schema:

{
  "Name": "Full character name",
  "Age": "Age or age range (e.g. '25' or 'Early 20s')",
  "Description": "Brief 2-3 sentence character overview",
  "Appearance": "Detailed physical description including distinguishing features",
  "Personality": "Core personality traits, temperament, and behavioral patterns",
  "Background": "Character's history, upbringing, and formative experiences",
  "Goals": "What the character wants to achieve (short and long-term)",
  "Conflicts": "Internal and external conflicts the character faces",
  "Relationships": "Key relationships and how they relate to others",
  "SpecialAbilities": "Special skills, talents, or supernatural abilities (if any)",
  "Weaknesses": "Character flaws, vulnerabilities, and limitations",
  "Motivation": "Core driving force behind the character's actions",
  "CharacterArc": "How the character is likely to grow or change",
  "Dialogue_Style": "How the character speaks and communicates",
  "Key_Relationships": ["Array of important relationship types"],
  "Character_Flaws": ["Array of specific character flaws"],
  "Strengths": ["Array of character strengths and positive traits"]
}

Rules:
- Respond with ONLY the JSON object, no additional text
- All fields are required except SpecialAbilities
- Make the character believable and three-dimensional
- Ensure the character fits the provided setting, genre, and audience
- Create internal consistency between all character elements
- Include realistic flaws and strengths that create story potential

<think>
I need to analyze the provided context carefully:
1. Review the setting, genre, and target audience constraints
2. Consider the specific role and constraints provided
3. Create a character that fits organically within these parameters
4. Ensure all JSON fields are populated with detailed, relevant content
5. Make sure the character has clear motivation and potential for growth
</think>`;

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
   * Execute the character generation use case
   */
  public async execute(request: CharacterGeneratorRequest): Promise<CharacterGeneratorResult> {
    if (!request.prompt) {
      throw new Error('Valid prompt must be provided');
    }

    const formattedUserMessage = this.formatUserMessage(request.prompt);
    const startTime = Date.now();

    logger.info('Character Generator Use Case execution started', {
      context: 'CharacterGeneratorUseCase',
      metadata: {
        model: this.modelConfig.name,
        promptLength: formattedUserMessage.length
      }
    });

    try {
      const result = await ollamaService.callOllamaApiWithSystemMessage(
        formattedUserMessage,
        this.systemMessage,
        {
          model: this.modelConfig.name,
          temperature: this.modelConfig.temperature,
          authToken: this.modelConfig.bearerToken,
          baseUrl: this.modelConfig.baseUrl,
          debugContext: 'CharacterGeneratorUseCase'
        }
      );

      if (!result || !result.message) {
        throw new Error('No response received from the Ollama API');
      }

      // Process the response using the ResponseProcessorService
      const { cleanedJson: processedContent, thinking: extractedThinking } = 
        ResponseProcessorService.processResponse(result.message.content);
      
      const duration = Date.now() - startTime;

      logger.info('Character Generator Use Case execution completed', {
        context: 'CharacterGeneratorUseCase',
        metadata: {
          model: this.modelConfig.name,
          duration,
          responseLength: processedContent.length,
          hasThinking: !!extractedThinking
        }
      });

      return this.createResult(processedContent, formattedUserMessage, extractedThinking);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Character Generator Use Case execution failed', {
        context: 'CharacterGeneratorUseCase',
        metadata: {
          model: this.modelConfig.name,
          duration,
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
      throw error;
    }
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