import { CleanedJsonResult } from './json-cleaner.types';
import { JsonCleanerOrchestrator } from './json-cleaner.orchestrator';
import { JsonCleanerAnalyzer } from './helpers/json-cleaner.analyzer';
import { JsonValidationHelper } from './helpers/json-validation.helper';
import { JsonInspector } from './utils/json-inspector.util';
import { JsonCleanerLogger } from './json-cleaner-logger';
import { jsonConsole } from './utils/console-logger.util';

// Import parsers
import { ThinkTagParser } from './parsers/think-tag.parser';
import { MarkdownParser } from './parsers/markdown.parser';
import { JsonExtractor } from './parsers/json-extractor.parser';

// Import strategies
import { ControlCharacterCleaner } from './strategies/control-character.cleaner';
import { CommaFixerCleaner } from './strategies/comma-fixer.cleaner';
import { StringEscaperCleaner } from './strategies/string-escaper.cleaner';
import { DuplicateKeyCleaner } from './strategies/duplicate-key.cleaner';
import { StructuralRepairCleaner } from './strategies/structural-repair.cleaner';
import { AggressiveCleaner } from './strategies/aggressive.cleaner';

/**
 * Main service for cleaning JSON strings
 * Delegates complex logic to specialized helper classes with control character awareness
 */
export class JsonCleanerService {
  private static orchestrator: JsonCleanerOrchestrator;

  /**
   * Initializes the JsonCleanerOrchestrator with optimized strategy order
   */
  private static initialize() {
    if (!this.orchestrator) {
      this.orchestrator = new JsonCleanerOrchestrator();
      
      // Register parsers (with improved JsonExtractor)
      this.orchestrator.addParser(new ThinkTagParser());
      this.orchestrator.addParser(new MarkdownParser());
      this.orchestrator.addParser(new JsonExtractor());
      
      // Register strategies (CONTROL CHARACTER CLEANER FIRST!)
      this.orchestrator.addStrategy(new StructuralRepairCleaner()); // HIGHEST PRIORITY!
      this.orchestrator.addStrategy(new ControlCharacterCleaner()); // HIGH PRIORITY
      this.orchestrator.addStrategy(new CommaFixerCleaner());
      this.orchestrator.addStrategy(new StringEscaperCleaner());
      this.orchestrator.addStrategy(new DuplicateKeyCleaner());
      
      // Fallback strategies
      this.orchestrator.addStrategy(new AggressiveCleaner(), true);
      
      console.info('JsonCleanerService initialized with control character awareness');
    }
  }

  /**
   * MAIN METHOD: Processing and cleaning JSON with control character pre-check
   */
  public static processResponse(response: string): CleanedJsonResult {
    this.initialize();
    
    // STEP 1: Input validation
    if (!response || response.trim().length === 0) {
      throw new Error('Empty input provided - cannot process');
    }

    const trimmedResponse = response.trim();

    // STEP 2: Quick validation
    if (JsonValidationHelper.isValid(trimmedResponse)) {
      jsonConsole.logWithPrefix('[JsonCleanerService] ✅ Input JSON is already valid');
      return { cleanedJson: trimmedResponse, thinking: '' };
    }

    // STEP 3: Process through orchestrator
    jsonConsole.logWithPrefix('[JsonCleanerService] Processing through orchestrator...');
    const result = this.orchestrator.processResponse(trimmedResponse);
    
    // STEP 4: Final validation
    if (!JsonValidationHelper.isValid(result.cleanedJson)) {
      jsonConsole.logWithPrefix('[JsonCleanerService] ⚠️ Warning: Final result is not valid JSON');
    }

    return result;
  }

  /**
   * Analyzes JSON problems using the analyzer
   */
  public static analyzeJsonProblems(jsonStr: string) {
    return JsonCleanerAnalyzer.analyzeJsonProblems(jsonStr);
  }

  /**
   * Fixes specific problems with targeted strategies
   */
  public static fixSpecificProblem(jsonStr: string, problemType: 'comma' | 'control-chars' | 'quotes' | 'brackets'): string {
    this.initialize();
    
    let strategy;
    switch (problemType) {
      case 'comma':
        strategy = new CommaFixerCleaner();
        break;
      case 'control-chars':
        strategy = new ControlCharacterCleaner();
        break;
      case 'quotes':
        strategy = new StringEscaperCleaner();
        break;
      case 'brackets':
        strategy = new AggressiveCleaner();
        break;
      default:
        return jsonStr;
    }

    const context = {
      originalInput: jsonStr,
      intermediateResult: jsonStr,
      success: false,
      modificationHistory: []
    };

    const result = strategy.clean(context);
    return result.output;
  }

  /**
   * Configures the logger
   */
  public static configureLogger(config: {
    logOnly?: 'all' | 'failures' | 'none';
    verbosity?: 'minimal' | 'standard' | 'verbose' | 'debug';
  }): void {
    // Basic configuration - can be extended as needed
    console.log('Logger configuration updated:', config);
  }

  // ==================== LEGACY METHODS (Backwards Compatibility) ====================

  /**
   * Legacy method for fixing duplicate keys
   */
  public static fixDuplicateKeysInJson(jsonStr: string): string {
    const strategy = new DuplicateKeyCleaner();
    const context = {
      originalInput: jsonStr,
      intermediateResult: jsonStr,
      success: false,
      modificationHistory: []
    };
    const result = strategy.clean(context);
    return result.output;
  }

  /**
   * Legacy method for message formatting
   */
  public static formatMessage(message: string): string {
    return message.trim();
  }

  /**
   * Inspects JSON for issues
   */
  public static inspectJson(json: string): string {
    return JsonInspector.inspectJsonForIssues(json);
  }

  /**
   * Saves JSON inspection to file
   */
  public static async saveJsonInspection(json: string, filename?: string): Promise<string> {
    return JsonCleanerLogger.saveInspection(json, filename);
  }

  /**
   * Generates failure report
   */
  public static generateFailureReport(): void {
    JsonCleanerLogger.generateFailureReport();
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Provides access to the orchestrator
   */
  public static getOrchestrator(): JsonCleanerOrchestrator {
    this.initialize();
    return this.orchestrator;
  }

  /**
   * Gets service statistics
   */
  public static getServiceStats() {
    this.initialize();
    return {
      initialized: !!this.orchestrator,
      strategiesCount: this.orchestrator.strategies.length,
      fallbackStrategiesCount: this.orchestrator.fallbackStrategies.length,
      parsersCount: this.orchestrator.parsers.length,
      controlCharacterSupport: {
        available: true,
        diagnosticsEnabled: true,
        quickRepairEnabled: true,
        advancedRepairEnabled: true
      }
    };
  }

  /**
   * Extended service statistics with control character info
   */
  public static getExtendedServiceStats() {
    return this.getServiceStats();
  }
}