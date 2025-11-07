import { LLMModelConfig, ValidatedLLMModelConfig, ModelsConfigMap } from '../types';

// Re-export for compatibility
export { LLMModelConfig, ValidatedLLMModelConfig, ModelsConfigMap };

/**
 * Default model configurations
 * Override these by setting environment variables
 */
export const MODELS: ModelsConfigMap = {
  'MODEL1': {
    name: process.env.MODEL1_NAME,
    baseUrl: process.env.MODEL1_URL || 'http://localhost:11434',
    bearerToken: process.env.MODEL1_TOKEN,
    temperature: 0.8,
    description: 'Primary model for all text generation tasks'
  }
};

// Create a type for model keys to use in type checking
export type ModelConfigKey = keyof typeof MODELS;

/**
 * Helper function to get a model config by key
 * Returns a validated config with guaranteed model name
 * @throws Error if model name is not configured
 */
export function getModelConfig(key: ModelConfigKey): ValidatedLLMModelConfig {
  const config = MODELS[key];

  if (!config.name) {
    throw new Error(
      `Model name for ${key} is not configured. ` +
      `Please set MODEL1_NAME in your .env file or environment variables.`
    );
  }

  // Type assertion: we've validated that name exists
  return config as ValidatedLLMModelConfig;
}

/**
 * Helper function to get all available model keys
 */
export function getAvailableModelKeys(): ModelConfigKey[] {
  return Object.keys(MODELS) as ModelConfigKey[];
}