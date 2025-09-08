import { OllamaModelConfig, ModelsConfigMap } from '../types';

// Re-export for compatibility
export { OllamaModelConfig, ModelsConfigMap };

/**
 * Default model configurations
 * Override these by setting environment variables
 */
export const MODELS: ModelsConfigMap = {
  'MODEL1': {
    name: process.env.MODEL1_NAME || 'gemma3:27b',
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
 */
export function getModelConfig(key: ModelConfigKey): OllamaModelConfig {
  return MODELS[key];
}

/**
 * Helper function to get all available model keys
 */
export function getAvailableModelKeys(): ModelConfigKey[] {
  return Object.keys(MODELS) as ModelConfigKey[];
}