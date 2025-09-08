import { CleanedJsonResult, CleaningContext } from './json-cleaner.types';
import { JsonCleanerLogger } from './json-cleaner-logger';
import { ICleaningStrategy } from './strategies/base-cleaner.strategy';
import { JsonValidationHelper } from './helpers/json-validation.helper';
import { jsonConsole } from './utils/console-logger.util';

/**
 * Simplified orchestrator that coordinates parsers and cleaning strategies
 * Delegates complex logic to specialized managers
 */
export class JsonCleanerOrchestrator {
  public strategies: ICleaningStrategy[] = [];
  public fallbackStrategies: ICleaningStrategy[] = [];
  public parsers: Array<{name: string; parse: (text: string) => {json: string; thinking: string}}> = [];

  constructor() {
    // Initialize empty - strategies and parsers will be added via methods
  }

  /**
   * Adds a parser
   */
  public addParser(parser: {name: string; parse: (text: string) => {json: string; thinking: string}}): void {
    this.parsers.push(parser);
  }

  /**
   * Adds a strategy
   */
  public addStrategy(strategy: ICleaningStrategy, isFallback: boolean = false): void {
    if (isFallback) {
      this.fallbackStrategies.push(strategy);
    } else {
      this.strategies.push(strategy);
    }
  }

  /**
   * MAIN METHOD: Processes a response (SIMPLIFIED)
   */
  public processResponse(response: string): CleanedJsonResult {
    const sessionId = JsonCleanerLogger.startSession(response, {
      responseLength: response.length,
      hasThinkTag: response.includes('<think>'),
    });

    try {
      const result = this.cleanJson(response);
      
      // Validate the final result
      let success = false;
      let errorMessage = '';
      
      try {
        JSON.parse(result.cleanedJson);
        success = true;
        jsonConsole.logWithPrefix('[JsonCleanerOrchestrator] ✅ Final JSON is valid');
      } catch (error) {
        success = false;
        errorMessage = error instanceof Error ? error.message : String(error);
        jsonConsole.logWithPrefix('[JsonCleanerOrchestrator] ❌ Final JSON is still invalid:', true, errorMessage);
      }
      
      JsonCleanerLogger.endSession(result.cleanedJson, success, errorMessage);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error during JSON cleaning', {
        context: 'JsonCleanerOrchestrator',
        error: errorMsg
      });
      JsonCleanerLogger.endSession('', false, errorMsg);
      throw error;
    }
  }

  /**
   * SIMPLIFIED main method for JSON cleaning
   */
  private cleanJson(response: string): CleanedJsonResult {
    // Extract the <think> block
    let thinking = '';
    const thinkMatch = response.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch && thinkMatch[1]) {
      thinking = thinkMatch[1].trim();
    }

    // PHASE 1: Run parsers
    let cleanResponse = this.processAllParsers(response);

    // PHASE 2: Validation and strategies
    const finalJson = this.processJsonCleaning(cleanResponse);

    return { cleanedJson: finalJson, thinking };
  }

  /**
   * Processes text through all parsers
   */
  private processAllParsers(input: string): string {
    let result = input;
    
    jsonConsole.logWithPrefix('[ParserManager] Starting parser phase...');
    
    for (const parser of this.parsers) {
      const before = result;
      const parseResult = parser.parse(result);
      result = parseResult.json;
      
      if (before !== result) {
        jsonConsole.logWithPrefix(`[ParserManager] Parser ${parser.name} made changes`);
      }
    }

    if (result !== input) {
      jsonConsole.logWithPrefix('[ParserManager] ✅ Parser phase completed with modifications');
    } else {
      jsonConsole.logWithPrefix('[ParserManager] ℹ️ Parser phase completed with no modifications');
    }
    
    return result;
  }

  /**
   * Main JSON cleaning processing
   */
  private processJsonCleaning(cleanResponse: string): string {
    console.log('[OrchestrationEngine] Starting JSON cleaning process...');
    
    // Quick validation
    if (JsonValidationHelper.isValid(cleanResponse)) {
      jsonConsole.logWithPrefix('[OrchestrationEngine] ✅ JSON is already valid after parsers');
      return cleanResponse;
    }

    // Try strategies in order
    let result = cleanResponse;
    let context: CleaningContext = {
      originalInput: cleanResponse,
      intermediateResult: result,
      success: false,
      modificationHistory: []
    };

    // Apply strategies
    const allStrategies = [...this.strategies];
    
    for (const strategy of allStrategies) {
      if (strategy.canHandle(context)) {
        jsonConsole.logWithPrefix(`[OrchestrationEngine] Applying strategy: ${strategy.name}`);
        
        const strategyResult = strategy.clean(context);
        
        if (strategyResult.modified) {
          result = strategyResult.output;
          context.intermediateResult = result;
          context.modificationHistory.push({
            strategy: strategy.name,
            before: context.intermediateResult,
            after: result,
            success: strategyResult.success
          });
          
          // Check if we're now valid
          if (JsonValidationHelper.isValid(result)) {
            jsonConsole.logWithPrefix(`[OrchestrationEngine] ✅ Strategy ${strategy.name} produced valid JSON`);
            context.success = true;
            return result;
          }
        }
      }
    }

    // If main strategies failed, try fallback strategies
    if (!context.success && this.fallbackStrategies.length > 0) {
      jsonConsole.logWithPrefix('[OrchestrationEngine] Trying fallback strategies...');
      
      for (const strategy of this.fallbackStrategies) {
        if (strategy.canHandle(context)) {
          jsonConsole.logWithPrefix(`[OrchestrationEngine] Applying fallback strategy: ${strategy.name}`);
          
          const strategyResult = strategy.clean(context);
          
          if (strategyResult.modified) {
            result = strategyResult.output;
            context.intermediateResult = result;
          }
          
          // Even if fallback doesn't produce valid JSON, we use its result
          break;
        }
      }
    }

    return result;
  }

  /**
   * Configuration methods
   */
  public static configureLogger(config: {
    logOnly?: 'all' | 'failures' | 'none';
    verbosity?: 'minimal' | 'standard' | 'verbose' | 'debug';
  }): void {
    // Basic configuration
    console.log('Logger configuration updated:', config);
  }
}