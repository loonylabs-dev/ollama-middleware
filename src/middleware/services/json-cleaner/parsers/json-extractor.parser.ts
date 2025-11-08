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
   * Extract JSON block by finding balanced braces or brackets
   * Supports both objects {...} and arrays [...]
   */
  private extractJsonBlock(text: string): string | null {
    let braceCount = 0;
    let bracketCount = 0;
    let startIndex = -1;
    let startChar: '{' | '[' | null = null;
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
          if (braceCount === 0 && bracketCount === 0) {
            startIndex = i;
            startChar = '{';
          }
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0 && bracketCount === 0 && startIndex >= 0 && startChar === '{') {
            const jsonCandidate = text.substring(startIndex, i + 1);
            try {
              JSON.parse(jsonCandidate);
              return jsonCandidate;
            } catch (e) {
              // Continue searching
            }
          }
        } else if (char === '[') {
          if (braceCount === 0 && bracketCount === 0) {
            startIndex = i;
            startChar = '[';
          }
          bracketCount++;
        } else if (char === ']') {
          bracketCount--;
          if (bracketCount === 0 && braceCount === 0 && startIndex >= 0 && startChar === '[') {
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
   * Supports both objects {...} and arrays [...]
   */
  private extractByPattern(text: string): string | null {
    // Pattern 1: JSON object after "response:" or similar
    const responseObjectPattern = /(?:response|result|json|output):\s*(\{.*\})/is;
    const responseObjectMatch = text.match(responseObjectPattern);
    if (responseObjectMatch) {
      try {
        JSON.parse(responseObjectMatch[1]);
        return responseObjectMatch[1];
      } catch (e) {
        // Continue with other patterns
      }
    }

    // Pattern 2: JSON array after "response:" or similar
    const responseArrayPattern = /(?:response|result|json|output):\s*(\[.*\])/is;
    const responseArrayMatch = text.match(responseArrayPattern);
    if (responseArrayMatch) {
      try {
        JSON.parse(responseArrayMatch[1]);
        return responseArrayMatch[1];
      } catch (e) {
        // Continue with other patterns
      }
    }

    // Pattern 3: JSON object in the middle of text
    const jsonObjectPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    const objectMatches = text.match(jsonObjectPattern);
    if (objectMatches) {
      for (const match of objectMatches) {
        try {
          JSON.parse(match);
          return match;
        } catch (e) {
          // Continue with next match
        }
      }
    }

    // Pattern 4: JSON array in the middle of text
    const jsonArrayPattern = /\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]/g;
    const arrayMatches = text.match(jsonArrayPattern);
    if (arrayMatches) {
      for (const match of arrayMatches) {
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