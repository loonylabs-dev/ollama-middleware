/**
 * Interface for model parameters used in AI requests
 */
export interface ModelParameters {
  temperature: number;
  repeatPenalty?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  repeatLastN?: number;
}

/**
 * Interface for parameter overrides that can be applied to default model parameters
 */
export interface ModelParameterOverrides {
  temperatureOverride?: number;
  repeatPenalty?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  repeatLastN?: number;
}

/**
 * Interface for model configuration from models.config
 */
export interface ModelConfig {
  temperature?: number;
  maxTokens?: number;
  contextLength?: number;
}

/**
 * Service for managing and validating model parameters for AI requests
 * Handles parameter combination, validation, and conversion to API formats
 */
export class ModelParameterManagerService {
  private static readonly DEFAULT_TEMPERATURE = 0.7;

  /**
   * Get the effective model parameters, combining config defaults and use case overrides
   * @param modelConfig The model configuration from models.config
   * @param overrides Optional overrides from the use case
   * @returns Final model parameters to use
   */
  public static getEffectiveParameters(
    modelConfig: ModelConfig,
    overrides: ModelParameterOverrides = {}
  ): ModelParameters {
    return {
      temperature: overrides.temperatureOverride ?? modelConfig.temperature ?? this.DEFAULT_TEMPERATURE,
      repeatPenalty: overrides.repeatPenalty,
      topP: overrides.topP,
      topK: overrides.topK,
      frequencyPenalty: overrides.frequencyPenalty,
      presencePenalty: overrides.presencePenalty,
      repeatLastN: overrides.repeatLastN
    };
  }

  /**
   * Validate parameter values are within acceptable ranges
   * @param parameters The parameters to validate
   * @returns Validated parameters with any out-of-range values corrected
   */
  public static validateParameters(parameters: ModelParameters): ModelParameters {
    const validated = { ...parameters };

    // Temperature should be between 0 and 2
    if (validated.temperature < 0) validated.temperature = 0;
    if (validated.temperature > 2) validated.temperature = 2;

    // Repeat penalty should be > 0
    if (validated.repeatPenalty !== undefined) {
      if (validated.repeatPenalty <= 0) validated.repeatPenalty = 1.0;
    }

    // Top-p should be between 0 and 1
    if (validated.topP !== undefined) {
      if (validated.topP < 0) validated.topP = 0;
      if (validated.topP > 1) validated.topP = 1;
    }

    // Top-k should be positive integer
    if (validated.topK !== undefined) {
      if (validated.topK < 1) validated.topK = 1;
      validated.topK = Math.round(validated.topK);
    }

    // Frequency penalty should be between 0 and 2
    if (validated.frequencyPenalty !== undefined) {
      if (validated.frequencyPenalty < 0) validated.frequencyPenalty = 0;
      if (validated.frequencyPenalty > 2) validated.frequencyPenalty = 2;
    }

    // Presence penalty should be between 0 and 2
    if (validated.presencePenalty !== undefined) {
      if (validated.presencePenalty < 0) validated.presencePenalty = 0;
      if (validated.presencePenalty > 2) validated.presencePenalty = 2;
    }

    // repeatLastN should be a positive number or -1 for num_ctx
    if (validated.repeatLastN !== undefined) {
      if (validated.repeatLastN < -1) validated.repeatLastN = 64; // Default fallback
      // If not -1 (for num_ctx), round to whole number
      if (validated.repeatLastN !== -1) {
        validated.repeatLastN = Math.round(validated.repeatLastN);
      }
    }

    return validated;
  }

  /**
   * Create parameter subset for logging (only non-undefined values)
   * @param parameters The parameters to filter
   * @returns Object with only defined parameters
   */
  public static getDefinedParameters(parameters: ModelParameters): Record<string, any> {
    const result: Record<string, any> = {
      temperature: parameters.temperature
    };

    if (parameters.repeatPenalty !== undefined) {
      result.repeatPenalty = parameters.repeatPenalty;
    }
    if (parameters.topP !== undefined) {
      result.topP = parameters.topP;
    }
    if (parameters.topK !== undefined) {
      result.topK = parameters.topK;
    }
    if (parameters.frequencyPenalty !== undefined) {
      result.frequencyPenalty = parameters.frequencyPenalty;
    }
    if (parameters.presencePenalty !== undefined) {
      result.presencePenalty = parameters.presencePenalty;
    }
    if (parameters.repeatLastN !== undefined) {
      result.repeatLastN = parameters.repeatLastN;
    }

    return result;
  }

  /**
   * Create parameter object for Ollama API request
   * @param parameters The validated parameters
   * @returns Object suitable for the Ollama API options field
   */
  public static toOllamaOptions(parameters: ModelParameters): Record<string, any> {
    const options: Record<string, any> = {};

    // Add temperature (always included)
    options.temperature = parameters.temperature;

    // Add optional parameters with correct Ollama API names
    if (parameters.repeatPenalty !== undefined) {
      options.repeat_penalty = parameters.repeatPenalty;
    }
    if (parameters.topP !== undefined) {
      options.top_p = parameters.topP;
    }
    if (parameters.topK !== undefined) {
      options.top_k = parameters.topK;
    }
    if (parameters.frequencyPenalty !== undefined) {
      options.frequency_penalty = parameters.frequencyPenalty;
    }
    if (parameters.presencePenalty !== undefined) {
      options.presence_penalty = parameters.presencePenalty;
    }
    if (parameters.repeatLastN !== undefined) {
      options.repeat_last_n = parameters.repeatLastN;
    }

    return options;
  }

  /**
   * Create default parameters for a given model type or use case
   * @param modelType The type of model (e.g., 'creative', 'analytical', 'balanced')
   * @returns Default parameters for the model type
   */
  public static getDefaultParametersForType(modelType: string): ModelParameters {
    switch (modelType.toLowerCase()) {
      case 'creative':
        return {
          temperature: 1.0,
          topP: 0.95,
          repeatPenalty: 1.1
        };
      case 'analytical':
        return {
          temperature: 0.3,
          topP: 0.8,
          repeatPenalty: 1.05
        };
      case 'balanced':
      default:
        return {
          temperature: this.DEFAULT_TEMPERATURE,
          topP: 0.9,
          repeatPenalty: 1.1
        };
    }
  }

  /**
   * Compare two parameter sets and return the differences
   * @param params1 First parameter set
   * @param params2 Second parameter set
   * @returns Object showing differences
   */
  public static compareParameters(
    params1: ModelParameters, 
    params2: ModelParameters
  ): Record<string, { from: any; to: any }> {
    const differences: Record<string, { from: any; to: any }> = {};

    const allKeys = new Set([
      ...Object.keys(params1),
      ...Object.keys(params2)
    ]) as Set<keyof ModelParameters>;

    for (const key of allKeys) {
      if (params1[key] !== params2[key]) {
        differences[key] = {
          from: params1[key],
          to: params2[key]
        };
      }
    }

    return differences;
  }

  /**
   * Generate a summary string of the parameters for logging
   * @param parameters The parameters to summarize
   * @returns Human-readable parameter summary
   */
  public static summarizeParameters(parameters: ModelParameters): string {
    const defined = this.getDefinedParameters(parameters);
    const parts = Object.entries(defined).map(([key, value]) => `${key}=${value}`);
    return parts.join(', ');
  }
}