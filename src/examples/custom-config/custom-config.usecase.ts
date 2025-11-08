import { BaseAIUseCase } from '../../middleware/usecases/base/base-ai.usecase';
import { BaseAIRequest, BaseAIResult } from '../../middleware/shared/types/base-request.types';
import { ModelConfigKey, ValidatedLLMModelConfig } from '../../middleware/shared/config/models.config';
import {
  CUSTOM_CONFIG_SYSTEM_MESSAGE,
  CUSTOM_CONFIG_USER_TEMPLATE
} from './custom-config.messages';

/**
 * Custom model configurations (not from the library's MODELS config)
 * This demonstrates how to use your own model configuration source
 */
const MY_CUSTOM_MODELS: Record<string, ValidatedLLMModelConfig> = {
  'PRODUCTION_MODEL': {
    name: 'llama3.2:latest',
    baseUrl: 'http://production-server.com:11434',
    temperature: 0.7
  },
  'DEVELOPMENT_MODEL': {
    name: 'llama3.2:latest',
    baseUrl: 'http://localhost:11434',
    temperature: 0.9
  },
  'STAGING_MODEL': {
    name: 'llama3.2:latest',
    baseUrl: 'http://staging-server.com:11434',
    temperature: 0.8
  }
};

/**
 * Simple request interface for the custom config example
 */
export interface CustomConfigRequest extends BaseAIRequest<string> {}

/**
 * Simple response structure
 */
export interface CustomConfigResponse {
  response: string;
}

/**
 * Result interface for the custom config example
 */
export interface CustomConfigResult extends BaseAIResult {
  parsedResponse: CustomConfigResponse;
}

/**
 * Custom Config Use Case Example
 *
 * This example demonstrates how to override the model configuration provider
 * to use your own custom model configurations instead of the library's default MODELS config.
 *
 * Key Pattern: Override `getModelConfigProvider()` method
 *
 * Use Cases:
 * - Multi-environment deployments (dev, staging, production)
 * - Dynamic model selection based on runtime conditions
 * - Using model configs from external sources (database, API, etc.)
 * - Testing with different model configurations
 *
 * @example
 * ```typescript
 * const useCase = new CustomConfigUseCase();
 * const result = await useCase.execute({
 *   prompt: 'What is the capital of France?'
 * });
 * console.log(result.parsedResponse.response);
 * ```
 */
export class CustomConfigUseCase extends BaseAIUseCase<string, CustomConfigRequest, CustomConfigResult> {
  protected readonly systemMessage = CUSTOM_CONFIG_SYSTEM_MESSAGE;

  /**
   * Default model to use - references our custom config
   */
  protected static readonly DEFAULT_MODEL_CONFIG_KEY = 'DEVELOPMENT_MODEL';

  /**
   * Override to use custom model configuration source
   *
   * This is the key method that allows you to provide your own model configurations.
   * Instead of calling the library's getModelConfig(), we use our own MY_CUSTOM_MODELS.
   *
   * @param key - The model configuration key
   * @returns Validated model configuration from our custom source
   */
  protected getModelConfigProvider(key: ModelConfigKey): ValidatedLLMModelConfig {
    const config = MY_CUSTOM_MODELS[key];

    if (!config?.name) {
      throw new Error(
        `Custom model ${key} not found. Available models: ${Object.keys(MY_CUSTOM_MODELS).join(', ')}`
      );
    }

    return config;
  }

  /**
   * Get user template for formatting the prompt
   */
  protected getUserTemplate(): (formattedPrompt: string) => string {
    return CUSTOM_CONFIG_USER_TEMPLATE;
  }

  /**
   * Create the result object from the AI response
   */
  protected createResult(content: string, usedPrompt: string, thinking?: string): CustomConfigResult {
    let parsedResponse: CustomConfigResponse;

    try {
      parsedResponse = JSON.parse(content);
    } catch (error) {
      // Fallback if JSON parsing fails
      parsedResponse = {
        response: content
      };
    }

    return {
      generatedContent: content,
      model: this.modelConfig.name,
      usedPrompt,
      thinking,
      parsedResponse
    };
  }
}

/**
 * Environment-Aware Use Case Example
 *
 * This example shows how to dynamically select model configurations
 * based on the runtime environment (NODE_ENV).
 */
export class EnvironmentAwareUseCase extends CustomConfigUseCase {
  /**
   * Override to select model based on environment
   */
  protected getModelConfigProvider(key: ModelConfigKey): ValidatedLLMModelConfig {
    const env = process.env.NODE_ENV || 'development';

    let selectedKey: string;

    switch (env) {
      case 'production':
        selectedKey = 'PRODUCTION_MODEL';
        break;
      case 'staging':
        selectedKey = 'STAGING_MODEL';
        break;
      default:
        selectedKey = 'DEVELOPMENT_MODEL';
    }

    const config = MY_CUSTOM_MODELS[selectedKey];

    if (!config?.name) {
      throw new Error(`Model for environment ${env} (${selectedKey}) not found`);
    }

    console.log(`Using ${selectedKey} for environment: ${env}`);
    return config;
  }
}
