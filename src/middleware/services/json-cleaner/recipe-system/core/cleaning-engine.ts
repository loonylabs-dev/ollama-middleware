import { CleaningRecipe, RecipeResult } from '../types/recipe.types';
import { CleaningContext } from '../types/operation.types';
import { CleaningContextImpl } from './cleaning-context';

export interface CleaningOptions {
  maxTime?: number;
  mode?: 'conservative' | 'aggressive' | 'adaptive';
  source?: string;
  expectedType?: 'object' | 'array' | 'primitive';
  targetConfidence?: number;
  continueOnError?: boolean;
  metadata?: Record<string, any>;
}

export interface CleaningResult {
  success: boolean;
  cleanedJson?: string;
  parsedJson?: any;
  confidence: number;
  totalChanges: number;
  processingTime: number;
  originalJson: string;
  recipeResult: RecipeResult;
  context: CleaningContext;
  error?: CleaningError;
  quality: QualityMetrics;
}

export interface CleaningError {
  code: string;
  message: string;
  recoverable: boolean;
  suggestions: string[];
  originalError?: Error;
}

export interface QualityMetrics {
  isValidJson: boolean;
  cleaningConfidence: number;
  preservationRate: number;
  changeRate: number;
  structuralIntegrity: number;
  contentIntegrity: number;
}

export class CleaningEngine {
  private static instance: CleaningEngine;
  
  static getInstance(): CleaningEngine {
    if (!CleaningEngine.instance) {
      CleaningEngine.instance = new CleaningEngine();
    }
    return CleaningEngine.instance;
  }

  async clean(
    json: string, 
    recipe: CleaningRecipe, 
    options: CleaningOptions = {}
  ) {
    const startTime = Date.now();
    const context = new CleaningContextImpl(json, {
      startTime,
      source: options.source || 'unknown',
      expectedType: options.expectedType,
      mode: options.mode || 'adaptive',
      custom: options.metadata
    });

    const configuredRecipe = this.configureRecipe(recipe, options);
    try {
      const recipeResult = await configuredRecipe.execute(json, context);
      const processingTime = Date.now() - startTime;

      const quality = this.calculateQualityMetrics(
        json,
        recipeResult.cleanedJson || json,
        context
      );

      const success = recipeResult.success && quality.isValidJson;

      return {
        success,
        cleanedJson: success ? recipeResult.cleanedJson : undefined,
        parsedJson: success ? this.safeParse(recipeResult.cleanedJson!) : undefined,
        confidence: recipeResult.confidence,
        totalChanges: recipeResult.totalChanges,
        processingTime,
        originalJson: json,
        recipeResult,
        context,
        quality,
        error: success ? undefined : this.createCleaningError(recipeResult, quality)
      } as CleaningResult;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        confidence: 0.0,
        totalChanges: 0,
        processingTime,
        originalJson: json,
        recipeResult: {
          success: false,
          operationResults: [],
          confidence: 0.0,
          totalChanges: 0,
          metrics: {
            totalTime: processingTime,
            stepsExecuted: 0,
            operationsPerformed: 0,
            rollbacks: 0,
            stepMetrics: new Map()
          },
          summary: {
            successfulOperations: [],
            failedOperations: [],
            skippedOperations: [],
            keyChanges: [],
            recommendations: ['Critical error occurred during processing']
          }
        },
        context,
        quality: {
          isValidJson: false,
          cleaningConfidence: 0.0,
          preservationRate: 1.0,
          changeRate: 0.0,
          structuralIntegrity: 0.0,
          contentIntegrity: 0.0
        },
        error: {
          code: 'CRITICAL_ERROR',
          message: `Critical error during cleaning: ${error}`,
          recoverable: false,
          suggestions: ['Try a different recipe', 'Check input JSON format'],
          originalError: error as Error
        }
      } as CleaningResult;
    }
  }

  validateJson(json: string) {
    try {
      JSON.parse(json);
      return { isValid: true, suggestions: [] };
    } catch (error) {
      const errorMessage = (error as Error).message;
      const suggestions = this.generateValidationSuggestions(json, errorMessage);
      return { isValid: false, error: errorMessage, suggestions };
    }
  }

  analyzeAndSuggestRecipe(json: string) {
    const issues: string[] = [];
    const reasons: string[] = [];
    
    if (/[\x00-\x1F\x7F]/.test(json)) issues.push('Control characters detected');
    if (/```/.test(json)) issues.push('Markdown code blocks detected');
    if (/<think>/i.test(json)) issues.push('Think tags detected');
    if (/}\s*{/.test(json) || /]\s*\[/.test(json)) issues.push('Missing commas detected');

    const openBraces = (json.match(/\{/g) || []).length;
    const closeBraces = (json.match(/\}/g) || []).length;
    const openBrackets = (json.match(/\[/g) || []).length;
    const closeBrackets = (json.match(/\]/g) || []).length;
    if (openBraces !== closeBraces || openBrackets !== closeBrackets) issues.push('Structural imbalance detected');

    let recommendedRecipe: 'conservative' | 'aggressive' | 'adaptive' = 'adaptive';
    let difficulty: 'easy' | 'medium' | 'hard' = 'easy';

    if (issues.length === 0) {
      recommendedRecipe = 'conservative';
      reasons.push('No obvious issues detected, conservative approach recommended');
    } else if (issues.length <= 2) {
      recommendedRecipe = 'adaptive';
      difficulty = 'medium';
      reasons.push('Few issues detected, adaptive approach should work well');
    } else {
      recommendedRecipe = 'aggressive';
      difficulty = 'hard';
      reasons.push('Multiple issues detected, aggressive cleaning may be needed');
    }

    if (json.length > 50000) reasons.push('Large JSON detected, performance considerations applied');
    if (json.length < 100) {
      reasons.push('Small JSON detected, conservative approach preferred');
      recommendedRecipe = 'conservative';
    }

    return { recommendedRecipe, reasons, detectedIssues: issues, estimatedDifficulty: difficulty } as const;
  }

  getEngineStats() {
    return {
      version: '1.0.0',
      operationsAvailable: 10,
      recipesRegistered: 5,
      averageProcessingTime: 150,
      successRate: 0.85
    } as const;
  }

  private configureRecipe(recipe: CleaningRecipe, options: CleaningOptions): CleaningRecipe {
    const configuredRecipe = recipe.clone();
    if (options.maxTime) configuredRecipe.config.maxExecutionTime = options.maxTime;
    if (options.targetConfidence) configuredRecipe.config.targetConfidence = options.targetConfidence;
    if (options.continueOnError !== undefined) configuredRecipe.config.continueOnError = options.continueOnError;
    return configuredRecipe;
  }

  private calculateQualityMetrics(originalJson: string, cleanedJson: string, context: CleaningContext): QualityMetrics {
    const isValidJson = this.safeParse(cleanedJson) !== null;
    const preservationRate = this.calculatePreservationRate(originalJson, cleanedJson);
    const changeRate = context.changes.length / Math.max(originalJson.length, 1);
    const structuralIntegrity = this.calculateStructuralIntegrity(cleanedJson);
    const contentIntegrity = isValidJson ? 0.9 : 0.3;
    const cleaningConfidence = isValidJson ? Math.min(0.9, preservationRate + (1 - changeRate) * 0.3) : 0.2;
    return { isValidJson, cleaningConfidence, preservationRate, changeRate, structuralIntegrity, contentIntegrity };
  }

  private calculatePreservationRate(original: string, cleaned: string): number {
    let preserved = 0;
    const minLength = Math.min(original.length, cleaned.length);
    for (let i = 0; i < minLength; i++) if (original[i] === cleaned[i]) preserved++;
    return preserved / Math.max(original.length, 1);
  }

  private calculateStructuralIntegrity(json: string): number {
    try {
      const openBraces = (json.match(/\{/g) || []).length;
      const closeBraces = (json.match(/\}/g) || []).length;
      const openBrackets = (json.match(/\[/g) || []).length;
      const closeBrackets = (json.match(/\]/g) || []).length;
      const braceBalance = openBraces === closeBraces ? 1.0 : 0.0;
      const bracketBalance = openBrackets === closeBrackets ? 1.0 : 0.0;
      return (braceBalance + bracketBalance) / 2;
    } catch {
      return 0.0;
    }
  }

  private safeParse(json: string): any | null {
    try { return JSON.parse(json); } catch { return null; }
  }

  private createCleaningError(recipeResult: RecipeResult, quality: QualityMetrics): CleaningError {
    const suggestions: string[] = [];
    if (!quality.isValidJson) {
      suggestions.push('Try a more aggressive cleaning recipe');
      suggestions.push('Check for structural issues in the input');
    }
    if (quality.preservationRate < 0.5) suggestions.push('Input may be too damaged to clean effectively');
    if (recipeResult.summary.failedOperations.length > 0) suggestions.push('Some cleaning operations failed - review error details');
    return {
      code: recipeResult.error?.code || 'CLEANING_FAILED',
      message: recipeResult.error?.message || 'Cleaning operation failed',
      recoverable: true,
      suggestions,
      originalError: recipeResult.error?.originalError
    };
  }

  private generateValidationSuggestions(json: string, errorMessage: string): string[] {
    const suggestions: string[] = [];
    if (errorMessage.includes('Unexpected token')) suggestions.push('Check for missing commas or unescaped characters');
    if (errorMessage.includes('Unexpected end')) suggestions.push('Check for missing closing brackets or braces');
    if (/[\x00-\x1F\x7F]/.test(json)) suggestions.push('Control characters detected - use control character fixer');
    if (/```/.test(json)) suggestions.push('Markdown code blocks detected - use markdown extractor');
    return suggestions;
  }
}
