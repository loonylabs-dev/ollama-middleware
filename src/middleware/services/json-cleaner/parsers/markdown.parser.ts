import { JsonCleanerLogger, JsonCleanerLogLevel } from '../json-cleaner-logger';
import { Parser } from '../json-cleaner.types';

/**
 * Parser for removing Markdown formatting from input
 */
export class MarkdownParser implements Parser {
  public name = 'Markdown Parser';
  
  /**
   * Check if this parser can handle the input
   */
  public canParse(input: string): boolean {
    return input.startsWith('```') || input.includes('```json') || input.includes('```');
  }
  
  /**
   * Parse and extract JSON by removing markdown blocks
   */
  public parse(input: string): { json: string; thinking: string } {
    let result = input;
    
    // Remove Markdown JSON blocks
    if (result.startsWith('```json')) {
      const beforeMarkdown = result;
      result = result.replace(/```json\s*/, '').replace(/\s*```$/, '');
      
      if (beforeMarkdown !== result) {
        JsonCleanerLogger.logParser(this.name, beforeMarkdown, result);
      }
    } 
    // Remove general Markdown blocks
    else if (result.startsWith('```')) {
      const beforeMarkdown = result;
      result = result.replace(/```\s*/, '').replace(/\s*```$/, '');
      
      if (beforeMarkdown !== result) {
        JsonCleanerLogger.logParser(this.name, beforeMarkdown, result);
      }
    }
    
    return { json: result, thinking: '' };
  }
}