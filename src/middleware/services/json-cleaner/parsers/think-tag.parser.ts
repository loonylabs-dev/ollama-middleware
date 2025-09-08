import { JsonCleanerLogger, JsonCleanerLogLevel } from '../json-cleaner-logger';
import { Parser } from '../json-cleaner.types';

/**
 * Parser for removing <think>...</think> tags from input
 */
export class ThinkTagParser implements Parser {
  public name = 'Think Tag Parser';
  
  /**
   * Check if this parser can handle the input
   */
  public canParse(input: string): boolean {
    return input.includes('<think>') && input.includes('</think>');
  }
  
  /**
   * Parse and extract JSON by removing think tags
   */
  public parse(input: string): { json: string; thinking: string } {
    let thinking = '';
    
    // Extract thinking content first
    const thinkMatch = input.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch && thinkMatch[1]) {
      thinking = thinkMatch[1].trim();
    }
    
    // Remove <think>...</think> blocks from the text
    const result = input.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    if (input !== result) {
      JsonCleanerLogger.logParser(this.name, input, result);
    }
    
    return { json: result, thinking };
  }
}