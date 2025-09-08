import { CleaningContext, CleaningStrategyResult } from '../json-cleaner.types';
import { BaseCleaningStrategy } from './base-cleaner.strategy';
import { JsonCleanerLogger, JsonCleanerLogLevel } from '../json-cleaner-logger';

/**
 * Aggressive cleaning strategy as a last resort
 * Only applied when all other strategies have failed
 */
export class AggressiveCleaner extends BaseCleaningStrategy {
  public name = 'Aggressive Cleaner';

  /**
   * Checks if aggressive cleaning should be applied
   * Only use when other strategies have not succeeded
   * @param context The current cleaning context
   * @returns true if aggressive cleaning should be applied
   */
  public canHandle(context: CleaningContext): boolean {
    // We only apply this strategy if other strategies have failed
    return !context.success;
  }

  /**
   * Performs aggressive cleaning
   * @param context The current cleaning context
   * @returns The result of the cleaning strategy
   */
  public clean(context: CleaningContext): CleaningStrategyResult {
    const input = context.intermediateResult;
    
    try {
      // Perform aggressive cleaning
      const output = this.aggressiveJsonCleaning(input);
      const modified = input !== output;
      
      if (modified) {
        JsonCleanerLogger.logOperation(
          'Aggressive Cleaning', 
          input, 
          output, 
          true, 
          undefined, 
          JsonCleanerLogLevel.MINIMAL
        );
      }
      
      return {
        output,
        success: true,
        modified
      };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Aggressive cleaning failed', {
        context: 'AggressiveCleaner',
        error: errorMsg
      });
      
      JsonCleanerLogger.logOperation(
        "Aggressive Cleaning Failed", 
        input, 
        input, 
        false, 
        errorMsg, 
        JsonCleanerLogLevel.MINIMAL
      );
      
      return {
        output: input,
        success: false,
        error: errorMsg,
        modified: false
      };
    }
  }

  /**
   * Performs character-by-character reconstruction of the JSON string
   * @param jsonStr The JSON string to be cleaned
   * @returns The cleaned JSON string
   */
  private aggressiveJsonCleaning(jsonStr: string): string {
    try {
      // Character-by-character rebuilding
      let result = '';
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        
        if (escapeNext) {
          result += char;
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          result += char;
          escapeNext = true;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          result += char;
          continue;
        }
        
        if (inString) {
          // Inside a string
          if (char === '\n') {
            result += '\\n';
            JsonCleanerLogger.logOperation(
              "Replace newline in string", 
              "\n", 
              "\\n", 
              true, 
              undefined, 
              JsonCleanerLogLevel.VERBOSE
            );
          } else if (char === '\r') {
            result += '\\r';
            JsonCleanerLogger.logOperation(
              "Replace carriage return in string", 
              "\r", 
              "\\r", 
              true, 
              undefined, 
              JsonCleanerLogLevel.VERBOSE
            );
          } else if (char === '\t') {
            result += '\\t';
            JsonCleanerLogger.logOperation(
              "Replace tab in string", 
              "\t", 
              "\\t", 
              true, 
              undefined, 
              JsonCleanerLogLevel.VERBOSE
            );
          } else {
            result += char;
          }
        } else {
          // Outside of strings
          result += char;
        }
      }
      
      if (jsonStr !== result) {
        JsonCleanerLogger.logOperation(
          "Aggressive Cleaning", 
          jsonStr, 
          result, 
          true, 
          undefined, 
          JsonCleanerLogLevel.MINIMAL
        );
      }
      
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Aggressive cleaning failed', {
        context: 'AggressiveCleaner',
        error: errorMsg
      });
      
      JsonCleanerLogger.logOperation(
        "Aggressive Cleaning Failed", 
        jsonStr, 
        jsonStr, 
        false, 
        errorMsg, 
        JsonCleanerLogLevel.MINIMAL
      );
      return jsonStr;
    }
  }
}