import { CleaningContext, CleaningStrategyResult } from '../json-cleaner.types';
import { BaseCleaningStrategy } from './base-cleaner.strategy';
import { JsonCleanerLogger, JsonCleanerLogLevel } from '../json-cleaner-logger';

/**
 * Cleaning strategy for escaping strings in JSON
 * Escapes quotes and other special characters correctly
 */
export class StringEscaperCleaner extends BaseCleaningStrategy {
  public name = 'String Escaper';

  /**
   * Escapes strings in JSON correctly
   * @param context The current cleaning context
   * @returns The result of the cleaning strategy
   */
  public clean(context: CleaningContext): CleaningStrategyResult {
    const input = context.intermediateResult;
    const output = this.minimalJsonEscaping(input);
    const modified = input !== output;
    
    if (modified) {
      JsonCleanerLogger.logOperation(
        'Minimal JSON Escaping', 
        input, 
        output, 
        true, 
        undefined, 
        JsonCleanerLogLevel.STANDARD
      );
    }
    
    return {
      output,
      success: true,
      modified
    };
  }

  /**
   * Minimal escaping for JSON strings
   * Only escapes what is really JSON-breaking (quotes)
   * @param jsonStr The JSON string to be processed
   * @returns The escaped JSON string
   */
  private minimalJsonEscaping(jsonStr: string): string {
    // Improved regex for property-name and value pairs, also supports umlauts
    const before = jsonStr;
    let result = jsonStr.replace(/("([^"]+)"\s*:\s*")([\s\S]*?)("(?=\s*[,}]))/g, (match: string, prefix: string, fieldName: string, content: string, suffix: string) => {
      let escapedContent = content;
      
      // Only escape unescaped quotes
      escapedContent = escapedContent.replace(/(?<!\\)"/g, '\\"');
      
      // Try to parse if the string is already valid
      try {
        JSON.parse('"' + escapedContent + '"');
        return prefix + escapedContent + suffix;
      } catch (error) {
        // Only if it doesn't parse, check for other problems
        JsonCleanerLogger.logOperation(
          `Escape quotes in field: ${fieldName}`, 
          content, 
          escapedContent, 
          false, 
          `Field ${fieldName} JSON parse failed: ${error instanceof Error ? error.message : String(error)}`,
          JsonCleanerLogLevel.VERBOSE
        );
        // Control characters have already been handled, so this shouldn't be necessary
      }
      
      return prefix + escapedContent + suffix;
    });
    
    if (before !== result) {
      JsonCleanerLogger.logOperation(
        "Minimal JSON Escaping", 
        before, 
        result, 
        true, 
        undefined, 
        JsonCleanerLogLevel.STANDARD
      );
    }
    
    return result;
  }
}