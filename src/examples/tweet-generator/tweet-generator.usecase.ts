import { BaseAIUseCase } from '../../middleware/usecases/base/base-ai.usecase';
import { BaseAIRequest, BaseAIResult } from '../../middleware/shared/types/base-request.types';
import { 
  TWEET_GENERATOR_SYSTEM_MESSAGE, 
  TWEET_GENERATOR_USER_TEMPLATE 
} from './tweet-generator.messages';
import { ModelParameterOverrides } from '../../middleware/services/model-parameter-manager/model-parameter-manager.service';

/**
 * Tweet generation request interface
 */
export interface TweetGeneratorRequest extends BaseAIRequest<string> {
  topic: string;
  includeHashtags?: boolean;
}

/**
 * Tweet generation result interface
 */
export interface TweetGeneratorResult extends BaseAIResult {
  tweet: string;
  characterCount: number;
  withinLimit: boolean;
}

/**
 * Tweet Generator Use Case
 * 
 * Demonstrates parameter configuration for token limiting and concise output.
 * 
 * Key Features:
 * - Token limiting via `num_predict` parameter (max ~70 tokens for 280 chars)
 * - Marketing preset for engaging, varied content
 * - Lower temperature for focused, on-brand output
 * - Character count validation
 * 
 * This use case is particularly useful for:
 * - Social media content generation
 * - Testing parameter effectiveness
 * - Demonstrating output length control
 * - Validating token limiting functionality
 */
export class TweetGeneratorUseCase extends BaseAIUseCase<string, TweetGeneratorRequest, TweetGeneratorResult> {
  
  /**
   * System message emphasizing brevity and Twitter best practices
   */
  protected readonly systemMessage = TWEET_GENERATOR_SYSTEM_MESSAGE;

  /**
   * Get the user template from message file
   */
  protected getUserTemplate(): (formattedPrompt: string) => string {
    return TWEET_GENERATOR_USER_TEMPLATE;
  }

  /**
   * Format the user message - pass through the topic
   */
  protected formatUserMessage(prompt: any): string {
    return typeof prompt === 'string' ? prompt : prompt.topic;
  }

  /**
   * Override model parameters for tweet generation
   * 
   * This configuration is optimized for generating short, engaging tweets
   * while staying within Twitter's 280 character limit.
   * 
   * @returns ModelParameterOverrides with Marketing-inspired preset + token limiting
   * 
   * **Parameter Selection Rationale:**
   * 
   * **Token Limiting:**
   * - `num_predict: 70` - Strictly limits output to ~70 tokens (roughly 280 characters)
   *   This is the key parameter for enforcing length constraints.
   * 
   * **Creative Control:**
   * - `temperature: 0.7` - Balanced creativity for engaging but focused content
   * - `repeatPenalty: 1.3` - Strong penalty to avoid repetitive phrasing in short text
   * - `frequencyPenalty: 0.3` - Encourages word variety in limited space
   * - `presencePenalty: 0.2` - Promotes diverse concepts even in brief content
   * 
   * **Quality Control:**
   * - `topP: 0.9` - Moderate nucleus sampling for reliable quality
   * - `topK: 50` - Balanced vocabulary selection for natural language
   * - `repeatLastN: 32` - Short window appropriate for tweet-length text
   * 
   * **Expected Impact:**
   * - Tweets will be under 280 characters (enforced by num_predict)
   * - Content will be varied and engaging without repetition
   * - Output will be focused and on-topic
   * - Language will be natural and conversational
   * 
   * **Testing Note:**
   * This configuration allows testing of token limiting functionality.
   * Increase num_predict to see longer outputs; decrease for shorter ones.
   * 
   * For more information about parameters, see docs/OLLAMA_PARAMETERS.md
   */
  protected getParameterOverrides(): ModelParameterOverrides {
    return {
      // TOKEN LIMITING - This is the key parameter we're testing
      // Approximately 70 tokens ≈ 280 characters for English text
      // Adjust this value to control output length
      num_predict: 70,
      
      // Marketing-inspired preset for engaging social media content
      temperatureOverride: 0.7,
      repeatPenalty: 1.3,
      frequencyPenalty: 0.3,
      presencePenalty: 0.2,
      topP: 0.9,
      topK: 50,
      repeatLastN: 32
    };
  }

  /**
   * Create the result with character count validation
   */
  protected createResult(content: string, usedPrompt: string, thinking?: string): TweetGeneratorResult {
    // Clean the content - remove any thinking tags or extra whitespace
    const cleanedTweet = content.trim();
    const characterCount = cleanedTweet.length;
    const withinLimit = characterCount <= 280;

    return {
      generatedContent: content,
      model: this.modelConfig.name,
      usedPrompt: usedPrompt,
      thinking: thinking,
      tweet: cleanedTweet,
      characterCount: characterCount,
      withinLimit: withinLimit
    };
  }
}
