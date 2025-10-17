import { BaseAIUseCase } from '../../middleware/usecases/base/base-ai.usecase';
import { BaseAIRequest, BaseAIResult } from '../../middleware/shared/types/base-request.types';
import { RequestFormatterService } from '../../middleware/services/request-formatter';
import { 
  STORY_GENERATOR_SYSTEM_MESSAGE, 
  STORY_GENERATOR_USER_TEMPLATE 
} from './story-generator.messages';
import { ModelParameterOverrides } from '../../middleware/services/model-parameter-manager/model-parameter-manager.service';

/**
 * Story generation context interface
 */
export interface StoryContext {
  setting?: string;
  protagonist?: string;
  antagonist?: string;
  theme?: string;
  tone?: string;
  wordCount?: string;
  genre?: string;
  constraints?: string[];
  [key: string]: any; // Allow flexible additional context
}

/**
 * Story generation prompt - supports both simple strings and complex objects
 */
export type StoryPrompt = 
  | string 
  | { 
      context?: StoryContext; 
      instruction: string; 
    }
  | {
      prompt: {
        context?: StoryContext;
        instruction: string;
      };
    };

/**
 * Story generation request interface
 */
export interface StoryGeneratorRequest extends BaseAIRequest<StoryPrompt> {
  // prompt can be string or complex object with context
}

/**
 * Story generation result interface
 */
export interface StoryGeneratorResult extends BaseAIResult {
  story: string;
  wordCount: number;
  extractedContext: StoryContext | null;
  extractedInstruction: string;
}

/**
 * Story Generator Use Case
 * 
 * Demonstrates RequestFormatterService with complex nested context objects.
 * 
 * **Key Features:**
 * - Supports simple string prompts: "Write a story about dragons"
 * - Supports complex objects with context and instruction
 * - Uses RequestFormatterService for flexible prompt handling
 * - Formats context using FlatFormatter (via RequestFormatterService)
 * - Creative Writing preset for varied, engaging prose
 * 
 * **Example Requests:**
 * 
 * Simple string:
 * ```
 * { prompt: "Write a story about a lost key" }
 * ```
 * 
 * Complex with context:
 * ```
 * {
 *   prompt: {
 *     context: {
 *       setting: "abandoned lighthouse, stormy night",
 *       protagonist: "elderly lighthouse keeper",
 *       theme: "redemption and forgiveness",
 *       tone: "melancholic yet hopeful",
 *       wordCount: "500-700 words",
 *       genre: "literary fiction"
 *     },
 *     instruction: "Write the opening scene where the keeper discovers an unexpected visitor."
 *   }
 * }
 * ```
 * 
 * This use case shows how RequestFormatterService:
 * - Extracts context and instruction from various formats
 * - Formats nested objects into structured CONTEXT/INSTRUCTION sections
 * - Uses FlatFormatter for clean context presentation
 * - Validates prompts before processing
 */
export class StoryGeneratorUseCase extends BaseAIUseCase<StoryPrompt, StoryGeneratorRequest, StoryGeneratorResult> {
  
  protected readonly systemMessage = STORY_GENERATOR_SYSTEM_MESSAGE;

  /**
   * Get the user template from message file
   */
  protected getUserTemplate(): (formattedPrompt: string) => string {
    return STORY_GENERATOR_USER_TEMPLATE;
  }

  /**
   * Format the user message using RequestFormatterService
   * 
   * This demonstrates the primary use case for RequestFormatterService:
   * handling complex, nested prompt structures with context and instructions.
   */
  protected formatUserMessage(prompt: StoryPrompt): string {
    // RequestFormatterService handles:
    // - String prompts directly
    // - Objects with context + instruction
    // - Nested prompt structures
    // - FlatFormatter integration for context formatting
    return RequestFormatterService.formatUserMessage(
      prompt,
      this.getUserTemplate(),
      'StoryGeneratorUseCase'
    );
  }

  /**
   * Override model parameters for creative story generation
   * 
   * Uses Creative Writing preset for engaging, varied prose.
   */
  protected getParameterOverrides(): ModelParameterOverrides {
    return {
      // Creative Writing preset
      temperatureOverride: 0.85,  // High creativity for unique stories
      repeatPenalty: 1.3,          // Reduce repetitive phrasing
      frequencyPenalty: 0.2,       // Encourage diverse vocabulary
      presencePenalty: 0.2,        // Introduce varied concepts
      topP: 0.92,                  // Nucleus sampling for creative token selection
      topK: 60,                    // Moderate vocabulary diversity
      repeatLastN: 128             // Extended context for consistency
    };
  }

  /**
   * Create the result with extracted metadata
   */
  protected createResult(content: string, usedPrompt: string, thinking?: string): StoryGeneratorResult {
    const story = content.trim();
    const wordCount = story.split(/\s+/).length;

    // Extract context and instruction from the original prompt
    // This demonstrates RequestFormatterService's extraction capabilities
    const extractedContext = RequestFormatterService.extractContext(this.currentRequest?.prompt) as StoryContext | null;
    const extractedInstruction = RequestFormatterService.extractInstruction(this.currentRequest?.prompt);

    return {
      generatedContent: content,
      model: this.modelConfig.name,
      usedPrompt: usedPrompt,
      thinking: thinking,
      story: story,
      wordCount: wordCount,
      extractedContext: extractedContext,
      extractedInstruction: extractedInstruction
    };
  }

  // Store current request for result creation
  private currentRequest?: StoryGeneratorRequest;

  /**
   * Override execute to store request for result creation
   */
  public async execute(request: StoryGeneratorRequest): Promise<StoryGeneratorResult> {
    this.currentRequest = request;
    return super.execute(request);
  }
}
