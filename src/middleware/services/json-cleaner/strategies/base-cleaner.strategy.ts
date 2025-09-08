import { CleaningContext, CleaningStrategyResult } from '../json-cleaner.types';

/**
 * Base interface for all cleaning strategies
 * Implements the Strategy pattern for different JSON cleaning approaches
 */
export interface ICleaningStrategy {
  /** Name of the strategy for logging and debugging */
  name: string;
  
  /**
   * Main method that implements the cleaning logic
   * @param context The current cleaning context with intermediate results
   * @returns The result of the cleaning strategy
   */
  clean(context: CleaningContext): CleaningStrategyResult;
  
  /**
   * Checks if this strategy is applicable for the given context
   * @param context The current cleaning context
   * @returns true if this strategy should be applied
   */
  canHandle(context: CleaningContext): boolean;
}

/**
 * Abstract base class for cleaning strategies
 * Implements common logic for all strategies
 */
export abstract class BaseCleaningStrategy implements ICleaningStrategy {
  abstract name: string;
  
  /**
   * Default implementation of canHandle 
   * Can be overridden by derived classes
   */
  canHandle(context: CleaningContext): boolean {
    return true; // By default, always execute
  }
  
  /**
   * Abstract method that must be implemented by concrete strategies
   */
  abstract clean(context: CleaningContext): CleaningStrategyResult;
}