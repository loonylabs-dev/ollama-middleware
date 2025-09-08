import { CleaningContext, CleaningStrategyResult } from '../json-cleaner.types';
import { BaseCleaningStrategy } from './base-cleaner.strategy';
import { JsonCleanerLogger, JsonCleanerLogLevel } from '../json-cleaner-logger';

/**
 * Cleaning strategy for duplicate keys in JSON
 * Removes duplicate keys and entries in JSON objects
 */
export class DuplicateKeyCleaner extends BaseCleaningStrategy {
  public name = 'Duplicate Key Cleaner';

  /**
   * Known keys that often appear duplicated
   * Used for targeted handling of frequent problem cases
   */
  private commonKeys = [
    'Genre_Name', 'Genre_Description', 'Genre_CoreElements',
    'Character_Name', 'Character_Description', 'Character_Strengths', 'Character_Weaknesses',
    'Setting_Name', 'Setting_Description',
    'Plot_Name', 'Plot_Description',
    'Chapter_Name', 'Chapter_Description',
    'Page_Title', 'Page_Content',
    'Summary_ID', 'Summary_Title', 'Summary_Text', 'Summary_KeyElements',
    'Summary_OpenQuestions', 'Summary_EndingState'
  ];

  /**
   * Removes duplicate keys from JSON
   * @param context The current cleaning context
   * @returns The result of the cleaning strategy
   */
  public clean(context: CleaningContext): CleaningStrategyResult {
    const input = context.intermediateResult;
    const output = this.fixDuplicateKeysInJson(input);
    const modified = input !== output;
    
    if (modified) {
      JsonCleanerLogger.logOperation(
        'Fix Duplicate Keys', 
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
   * Removes duplicate keys from a JSON string
   * @param jsonStr The JSON string to be cleaned
   * @returns The cleaned JSON string without duplicate keys
   */
  private fixDuplicateKeysInJson(jsonStr: string): string {
    let fixedJson = jsonStr;
    const before = fixedJson;
    
    // Remove known duplicate keys
    this.commonKeys.forEach(key => {
      const regex = new RegExp(`("${key}"\\s*:\\s*"[^"]*",\\s*)(?="${key}")`, 'g');
      fixedJson = fixedJson.replace(regex, '');
    });
    
    if (before !== fixedJson) {
      JsonCleanerLogger.logOperation(
        "Fix Duplicate Keys", 
        before, 
        fixedJson, 
        true, 
        undefined, 
        JsonCleanerLogLevel.STANDARD
      );
    }
    
    try {
      // Try to remove duplicate entries in arrays
      const parsed = JSON.parse(fixedJson);
      if (Array.isArray(parsed)) {
        const uniqueEntries = parsed.filter((obj, index, self) => 
          index === self.findIndex(o => 
            JSON.stringify(o) === JSON.stringify(obj)
          )
        );
        
        const uniqueJson = JSON.stringify(uniqueEntries);
        if (fixedJson !== uniqueJson) {
          JsonCleanerLogger.logOperation(
            "Remove Duplicate Entries", 
            fixedJson, 
            uniqueJson, 
            true, 
            undefined, 
            JsonCleanerLogLevel.STANDARD
          );
        }
        
        return uniqueJson;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      JsonCleanerLogger.logOperation(
        "Fix Duplicate Keys Parse Failed", 
        fixedJson, 
        fixedJson, 
        false, 
        errorMsg, 
        JsonCleanerLogLevel.MINIMAL
      );
      // Return the fixed version even if parsing fails
    }
    
    return fixedJson;
  }
}