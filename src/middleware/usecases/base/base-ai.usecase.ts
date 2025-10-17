import { ollamaService } from '../../services/ollama/ollama.service';
import { getModelConfig, ModelConfigKey, ValidatedOllamaModelConfig } from '../../shared/config/models.config';
import { ResponseProcessorService } from '../../services/response-processor/response-processor.service';
import { BaseAIRequest, BaseAIResult } from '../../shared/types/base-request.types';
import { logger } from '../../shared/utils/logging.utils';
import { ModelParameterManagerService, ModelParameterOverrides } from '../../services/model-parameter-manager/model-parameter-manager.service';

/**
 * Base abstract class for all AI use cases
 * Provides common functionality and enforces configuration for each use case
 * TPrompt: The type of prompt data (string, object, etc.)
 * TRequest: The request type (must extend BaseAIRequest<TPrompt>)
 * TResult: The result type (must extend BaseAIResult)
 */
export abstract class BaseAIUseCase<
  TPrompt = string,
  TRequest extends BaseAIRequest<TPrompt> = BaseAIRequest<TPrompt>, 
  TResult extends BaseAIResult = BaseAIResult
> {
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
   * Returns validated config with guaranteed model name
   */
  protected get modelConfig(): ValidatedOllamaModelConfig {
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
   * Abstract method that each use case MUST implement
   * Returns the specific template function for the use case
   * This enforces the message pattern: each use case should have a corresponding message file
   */
  protected abstract getUserTemplate(): (formattedPrompt: string) => string;

  /**
   * Override model parameters for this specific use case
   * Override this method in child classes to customize parameters
   * @returns Parameter overrides to apply to the default model configuration
   */
  protected getParameterOverrides(): ModelParameterOverrides {
    return {}; // Default: no overrides
  }

  /**
   * Execute the AI use case
   * @param request The request parameters
   * @returns The result of the AI processing
   */
  public async execute(request: TRequest): Promise<TResult> {
    if (!request.prompt) {
      throw new Error('Valid prompt must be provided');
    }

    // Format the raw prompt using formatUserMessage
    const formattedPrompt = this.formatUserMessage(request.prompt);
    
    // Apply the user template to create the final message
    const userTemplate = this.getUserTemplate();
    const formattedUserMessage = userTemplate(formattedPrompt);
    const startTime = Date.now();

    logger.info('AI Use Case execution started', {
      context: this.constructor.name,
      metadata: {
        model: this.modelConfig.name,
        promptLength: formattedUserMessage.length
      }
    });

    try {
      // Get parameter overrides from the use case
      const overrides = this.getParameterOverrides();
      
      // Get effective parameters by combining config and overrides
      const effectiveParams = ModelParameterManagerService.getEffectiveParameters(
        {
          temperature: this.modelConfig.temperature
        },
        overrides
      );
      
      // Validate parameters
      const validatedParams = ModelParameterManagerService.validateParameters(effectiveParams);
      
      const result = await ollamaService.callOllamaApiWithSystemMessage(
        formattedUserMessage,
        this.systemMessage,
        {
          model: this.modelConfig.name,
          temperature: validatedParams.temperature,
          authToken: this.modelConfig.bearerToken,
          baseUrl: this.modelConfig.baseUrl,
          ...ModelParameterManagerService.toOllamaOptions(validatedParams),
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