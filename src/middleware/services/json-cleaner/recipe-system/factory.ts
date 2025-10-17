import { CleaningEngine } from './core/cleaning-engine';
import { RecipeTemplates } from './recipes/templates';

/**
 * Factory class providing convenient access to the recipe-based JSON cleaning system
 */
export class JsonCleanerFactory {
  /**
   * Quick clean with automatic recipe selection
   */
  static async quickClean(json: string) {
    const engine = CleaningEngine.getInstance();
    const suggestion = engine.analyzeAndSuggestRecipe(json);
    const recipe = suggestion.recommendedRecipe === 'conservative'
      ? RecipeTemplates.conservative()
      : suggestion.recommendedRecipe === 'aggressive'
        ? RecipeTemplates.aggressive()
        : RecipeTemplates.adaptive();
    
    return engine.clean(json, recipe, { source: 'factory', mode: suggestion.recommendedRecipe });
  }

  /**
   * Create a new cleaning engine instance
   */
  static createEngine(): CleaningEngine {
    return CleaningEngine.getInstance();
  }

  /**
   * Validate JSON without cleaning
   */
  static validateJson(json: string) {
    const engine = CleaningEngine.getInstance();
    return engine.validateJson(json);
  }

  /**
   * Analyze JSON and get recipe recommendations
   */
  static analyzeJson(json: string) {
    const engine = CleaningEngine.getInstance();
    return engine.analyzeAndSuggestRecipe(json);
  }

  /**
   * Get engine statistics
   */
  static getStats() {
    const engine = CleaningEngine.getInstance();
    return engine.getEngineStats();
  }
}
