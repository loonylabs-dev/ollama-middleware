/**
 * Result type for the JSON cleaning process
 */
export interface CleanedJsonResult {
  /** The cleaned JSON */
  cleanedJson: string;
  /** Extracted content from <think> tags */
  thinking: string;
}

/**
 * Context for the cleaning process, passed between strategies
 */
export interface CleaningContext {
  /** Original input */
  originalInput: string;
  /** Current intermediate result during cleaning */
  intermediateResult: string;
  /** Flag indicating if the process has been successful so far */
  success: boolean;
  /** Error message if present */
  error?: string;
  /** Modification history */
  modificationHistory: Array<{
    strategy: string;
    before: string;
    after: string;
    success: boolean;
  }>;
  /** Additional context information for logging and debugging */
  additionalContext?: Record<string, any>;
}

/**
 * Result of a single cleaning strategy
 */
export interface CleaningStrategyResult {
  /** The cleaned JSON after applying the strategy */
  output: string;
  /** Flag indicating if the strategy was successful */
  success: boolean;
  /** Error message if the strategy fails */
  error?: string;
  /** Flag indicating if the input was modified by the strategy */
  modified: boolean;
}

/**
 * Configuration options for the logger
 */
export interface LoggerConfiguration {
  /** Whether only certain events should be logged */
  logOnly?: 'all' | 'failures' | 'none';
  /** Detail level of logs */
  verbosity?: 'minimal' | 'standard' | 'verbose' | 'debug';
}

/**
 * Base interface for all cleaning strategies
 */
export interface CleaningStrategy {
  /** Name of the strategy for logging */
  name: string;
  /** Whether this strategy can handle the given input */
  canHandle(input: string): boolean;
  /** Apply the cleaning strategy */
  clean(input: string, context?: CleaningContext): CleaningStrategyResult;
}

/**
 * Base interface for all parsers
 */
export interface Parser {
  /** Name of the parser for logging */
  name: string;
  /** Whether this parser can handle the given input */
  canParse(input: string): boolean;
  /** Parse the input and extract JSON */
  parse(input: string): { json: string; thinking: string };
}

/**
 * Configuration for JSON cleaning operations
 */
export interface JsonCleaningConfig {
  /** Maximum number of repair attempts */
  maxRepairAttempts?: number;
  /** Whether to enable aggressive cleaning strategies */
  enableAggressiveCleaning?: boolean;
  /** Custom timeout for cleaning operations */
  timeoutMs?: number;
  /** Logger configuration */
  logger?: LoggerConfiguration;
}