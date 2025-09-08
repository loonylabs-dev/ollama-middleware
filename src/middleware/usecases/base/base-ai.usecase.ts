import { ollamaService } from '../../services/ollama/ollama.service';
import { getModelConfig, ModelConfigKey, OllamaModelConfig } from '../../shared/config/models.config';
import { ResponseProcessorService } from '../../services/response-processor/response-processor.service';
import { BaseAIRequest, BaseAIResult } from '../../shared/types/base-request.types';
import { logger } from '../../shared/utils/logging.utils';

/**
 * Base abstract class for all AI use cases
 * Provides common functionality and enforces configuration for each use case
 */
export abstract class BaseAIUseCase<TRequest extends BaseAIRequest, TResult extends BaseAIResult> {
  /**
   * The system message defines the behavior and instructions for the AI model
   * Must be defined by each specific use case
   */
  protected abstract readonly systemMessage: string;

  /**
   * Default model configuration key to use across all use cases
   * Can be overridden by specific use cases if needed
   */
  protected static readonly DEFAULT_MODEL_CONFIG_KEY: ModelConfigKey = 'MODEL1';

  /**
   * The model configuration key to use for this specific use case
   * If not overridden, uses the default model config key
   */
  protected get modelConfigKey(): ModelConfigKey {
    return (this.constructor as typeof BaseAIUseCase).DEFAULT_MODEL_CONFIG_KEY;
  }

  /**
   * Get the model configuration for this use case
   */
  protected get modelConfig(): OllamaModelConfig {
    return getModelConfig(this.modelConfigKey);
  }

  /**
   * Creates a user message from the prompt
   * Override in child classes for custom formatting
   */
  protected formatUserMessage(prompt: any): string {
    if (typeof prompt === 'string') {
      return prompt;
    }
    
    // Basic JSON formatting for complex prompts
    return JSON.stringify(prompt, null, 2);
  }

  /**
   * Abstract method that each use case can implement
   * Returns the specific template function for the use case
   */
  protected getUserTemplate?(): (formattedPrompt: string) => string;

  /**
   * Execute the AI use case
   * @param request The request parameters
   * @returns The result of the AI processing
   */
  public async execute(request: TRequest): Promise<TResult> {
    if (!request.prompt) {
      throw new Error('Valid prompt must be provided');
    }

    const formattedUserMessage = this.formatUserMessage(request.prompt);
    const startTime = Date.now();

    logger.info('AI Use Case execution started', {
      context: this.constructor.name,
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
          debugContext: this.constructor.name
        }
      );

      if (!result || !result.message) {
        throw new Error('No response received from the Ollama API');
      }

      // Process the response using the ResponseProcessorService
      const { cleanedJson: processedContent, thinking: extractedThinking } = 
        ResponseProcessorService.processResponse(result.message.content);
      
      const duration = Date.now() - startTime;

      logger.info('AI Use Case execution completed', {
        context: this.constructor.name,
        metadata: {
          duration,
          model: this.modelConfig.name,
          hasThinking: !!extractedThinking
        }
      });

      // Create and return the result
      return this.createResult(processedContent, formattedUserMessage, extractedThinking);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('AI Use Case execution failed', {
        context: this.constructor.name,
        error: errorMessage,
        metadata: {
          duration,
          model: this.modelConfig.name
        }
      });

      throw error;
    }
  }

  /**
   * Process the raw AI response
   * Can be overridden by specific use cases if special processing is needed
   */
  protected processResponse(response: string): { cleanedJson: string; thinking: string } { 
    return ResponseProcessorService.processResponse(response);
  }

  /**
   * Create the result object
   * This is a template method to be implemented by specific use cases
   * @param content The processed content to use for the result
   * @param usedPrompt The formatted prompt that was used
   * @param thinking Optional thinking content from the model
   */
  protected abstract createResult(content: string, usedPrompt: string, thinking?: string): TResult;
}