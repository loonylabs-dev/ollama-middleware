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
    description: 'Large model for complex and creative text generation tasks'
  },
  'MODEL2': {
    name: process.env.MODEL2_NAME || 'mistral-small3.1:24b',
    baseUrl: process.env.MODEL2_URL || 'http://localhost:11434',
    bearerToken: process.env.MODEL2_TOKEN,
    temperature: 0.8,
    description: 'Large model for complex and creative text generation tasks'
  },
  'MODEL3': {
    name: process.env.MODEL3_NAME || 'mistral:latest',
    baseUrl: process.env.MODEL3_URL || 'http://localhost:11434',
    bearerToken: process.env.MODEL3_TOKEN,
    temperature: 0.8,
    description: 'Default model for general purpose text generation'
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