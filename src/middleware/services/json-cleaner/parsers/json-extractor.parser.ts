import { JsonCleanerLogger } from '../json-cleaner-logger';
import { Parser } from '../json-cleaner.types';

/**
 * Advanced JSON extractor parser
 * Attempts to extract valid JSON from complex responses
 */
export class JsonExtractor implements Parser {
  public name = 'JSON Extractor';
  
  /**
   * Check if this parser can handle the input
   */
  public canParse(input: string): boolean {
    // Can handle any input as it's the fallback parser
    return true;
  }
  
  /**
   * Parse and extract JSON using multiple extraction strategies
   */
  public parse(input: string): { json: string; thinking: string } {
    const originalInput = input;
    let result = input.trim();
    
    // Strategy 1: Try to find JSON blocks between curly braces
    const jsonBlock = this.extractJsonBlock(result);
    if (jsonBlock) {
      JsonCleanerLogger.logParser(this.name, originalInput, jsonBlock);
      return { json: jsonBlock, thinking: '' };
    }
    
    // Strategy 2: Try to extract from patterns
    const patternExtracted = this.extractByPattern(result);
    if (patternExtracted) {
      JsonCleanerLogger.logParser(this.name, originalInput, patternExtracted);
      return { json: patternExtracted, thinking: '' };
    }
    
    // Strategy 3: Clean obvious issues
    const cleaned = this.basicCleanup(result);
    if (cleaned !== result) {
      JsonCleanerLogger.logParser(this.name, originalInput, cleaned);
      return { json: cleaned, thinking: '' };
    }
    
    return { json: result, thinking: '' };
  }
  
  /**
   * Extract JSON block by finding balanced braces
   */
  private extractJsonBlock(text: string): string | null {
    let braceCount = 0;
    let startIndex = -1;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          if (braceCount === 0) {
            startIndex = i;
          }
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0 && startIndex >= 0) {
            const jsonCandidate = text.substring(startIndex, i + 1);
            try {
              JSON.parse(jsonCandidate);
              return jsonCandidate;
            } catch (e) {
              // Continue searching
            }
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Extract JSON using common patterns
   */
  private extractByPattern(text: string): string | null {
    // Pattern 1: JSON after "response:" or similar
    const responsePattern = /(?:response|result|json|output):\s*(\{.*\})/is;
    const responseMatch = text.match(responsePattern);
    if (responseMatch) {
      try {
        JSON.parse(responseMatch[1]);
        return responseMatch[1];
      } catch (e) {
        // Continue with other patterns
      }
    }
    
    // Pattern 2: JSON in the middle of text
    const jsonPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    const matches = text.match(jsonPattern);
    if (matches) {
      for (const match of matches) {
        try {
          JSON.parse(match);
          return match;
        } catch (e) {
          // Continue with next match
        }
      }
    }
    
    return null;
  }
  
  /**
   * Basic cleanup of common JSON issues
   */
  private basicCleanup(text: string): string {
    let result = text;
    
    // Remove common prefixes
    result = result.replace(/^(?:Here's the|The|Response:|Result:)\s*/i, '');
    
    // Remove trailing text after JSON
    const jsonMatch = result.match(/^(.*?)(?:\n\n|$)/s);
    if (jsonMatch) {
      result = jsonMatch[1];
    }
    
    // Fix common JSON issues
    result = result
      // Remove trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix single quotes
      .replace(/'/g, '"')
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, '');
    
    return result.trim();
  }
}