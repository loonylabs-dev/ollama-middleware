import { CleaningContext, CleaningStrategyResult } from '../json-cleaner.types';
import { BaseCleaningStrategy } from './base-cleaner.strategy';
import { JsonCleanerLogger, JsonCleanerLogLevel } from '../json-cleaner-logger';

/**
 * Drastically improved CommaFixerCleaner
 * Specifically developed for the "Array followed by property without comma" problem
 */
export class CommaFixerCleaner extends BaseCleaningStrategy {
  public name = 'Comma Fixer';

  /**
   * Enhanced canHandle method - checks specifically for missing commas
   */
  public canHandle(context: CleaningContext): boolean {
    const input = context.intermediateResult;
    
    // Check specifically for the most common problem: Array/Object followed by Property without comma
    const hasArrayToPropertyIssue = /\]\s*"[\w_]+"\s*:/.test(input);
    const hasObjectToPropertyIssue = /\}\s*"[\w_]+"\s*:/.test(input);
    const hasStringToPropertyIssue = /"\s{2,}"[\w_]+"\s*:/.test(input);
    
    return hasArrayToPropertyIssue || hasObjectToPropertyIssue || hasStringToPropertyIssue;
  }

  /**
   * Drastically improved comma repair
   */
  public clean(context: CleaningContext): CleaningStrategyResult {
    const input = context.intermediateResult;
    
    try {
      // STEP 1: Repair specific comma patterns
      let output = this.fixSpecificCommaPatterns(input);
      
      // STEP 2: If that's not enough, extended repair
      if (output === input) {
        output = this.fixAdvancedCommaPatterns(input);
      }
      
      // STEP 3: Validate the result
      const modified = input !== output;
      let isValid = false;
      let parseError: string | undefined;
      
      try {
        JSON.parse(output);
        isValid = true;
      } catch (error) {
        parseError = error instanceof Error ? error.message : String(error);
      }
      
      if (modified) {
        JsonCleanerLogger.logOperation(
          'Fix Missing Commas', 
          input, 
          output, 
          isValid, 
          parseError, 
          JsonCleanerLogLevel.STANDARD,
          {
            reason: isValid ? 
              'Successfully fixed missing commas between JSON properties and structures' :
              `Fixed some commas but JSON still invalid: ${parseError}`,
            strategy: 'enhanced-comma-fixing',
            detectedIssues: this.detectCommaIssues(input)
          }
        );
      }
      
      return {
        output,
        success: isValid || modified, // Success if valid OR changes were made
        modified,
        error: parseError
      };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn('Error during comma fixing', {
        context: 'CommaFixerCleaner',
        error: errorMsg
      });
      
      JsonCleanerLogger.logOperation(
        "Fix Missing Commas Failed", 
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
   * NEW METHOD: Detects specific comma problems
   */
  private detectCommaIssues(jsonStr: string): string[] {
    const issues: string[] = [];
    
    // Pattern 1: Array followed by property
    if (/\]\s*"[\w_]+"\s*:/.test(jsonStr)) {
      issues.push('Array followed by property without comma');
    }
    
    // Pattern 2: Object followed by property
    if (/\}\s*"[\w_]+"\s*:/.test(jsonStr)) {
      issues.push('Object followed by property without comma');
    }
    
    // Pattern 3: String with significant whitespace followed by property
    if (/"\s{2,}"[\w_]+"\s*:/.test(jsonStr)) {
      issues.push('String with whitespace followed by property without comma');
    }
    
    // Pattern 4: Primitive values followed by property
    if (/([0-9]+|true|false|null)\s+"[\w_]+"\s*:/.test(jsonStr)) {
      issues.push('Primitive value followed by property without comma');
    }
    
    return issues;
  }

  /**
   * NEW MAIN METHOD: Repairs specific comma patterns
   * Focus on the most common cases from the log
   */
  private fixSpecificCommaPatterns(jsonStr: string): string {
    let result = jsonStr;
    const before = result;
    
    console.log('[CommaFixerCleaner] Starting specific comma pattern fixes...');
    
    // PATTERN 1: Array followed by Property (THE MAIN PROBLEM!)
    // Example: "Summary_OpenQuestions": ["Question1", "Question2"] "Summary_EndingState": "text"
    const arrayToPropertyPattern = /(\]\s*)("[\w_äöüÄÖÜ\-]+"\s*:)/g;
    const beforeArrayFix = result;
    result = result.replace(arrayToPropertyPattern, '$1,$2');
    
    if (beforeArrayFix !== result) {
      console.log('[CommaFixerCleaner] ✅ Fixed array-to-property comma issues');
      JsonCleanerLogger.logOperation(
        "Fix Array → Property Comma", 
        beforeArrayFix, 
        result, 
        true, 
        undefined, 
        JsonCleanerLogLevel.VERBOSE,
        {
          reason: 'Added missing comma after array before property',
          strategy: 'array-to-property-comma'
        }
      );
    }
    
    // PATTERN 2: Object followed by Property
    // Example: "obj": {"key": "val"} "next": "value"
    const objectToPropertyPattern = /(\}\s*)("[\w_äöüÄÖÜ\-]+"\s*:)/g;
    const beforeObjectFix = result;
    result = result.replace(objectToPropertyPattern, '$1,$2');
    
    if (beforeObjectFix !== result) {
      console.log('[CommaFixerCleaner] ✅ Fixed object-to-property comma issues');
      JsonCleanerLogger.logOperation(
        "Fix Object → Property Comma", 
        beforeObjectFix, 
        result, 
        true, 
        undefined, 
        JsonCleanerLogLevel.VERBOSE,
        {
          reason: 'Added missing comma after object before property',
          strategy: 'object-to-property-comma'
        }
      );
    }
    
    // PATTERN 3: String with Whitespace followed by Property
    // Example: "text" "next": "value" (with at least 2 spaces)
    const stringWithWhitespacePattern = /(")\s{2,}("[\w_äöüÄÖÜ\-]+"\s*:)/g;
    const beforeStringFix = result;
    result = result.replace(stringWithWhitespacePattern, '$1,$2');
    
    if (beforeStringFix !== result) {
      console.log('[CommaFixerCleaner] ✅ Fixed string-with-whitespace-to-property comma issues');
      JsonCleanerLogger.logOperation(
        "Fix String+Whitespace → Property Comma", 
        beforeStringFix, 
        result, 
        true, 
        undefined, 
        JsonCleanerLogLevel.VERBOSE,
        {
          reason: 'Added missing comma after string with whitespace before property',
          strategy: 'string-whitespace-to-property-comma'
        }
      );
    }
    
    // PATTERN 4: Primitive Values followed by Property
    // Example: "count": 123 "next": "value"
    const primitiveToPropertyPattern = /([0-9]+|true|false|null)\s+("[\w_äöüÄÖÜ\-]+"\s*:)/g;
    const beforePrimitiveFix = result;
    result = result.replace(primitiveToPropertyPattern, '$1,$2');
    
    if (beforePrimitiveFix !== result) {
      console.log('[CommaFixerCleaner] ✅ Fixed primitive-to-property comma issues');
      JsonCleanerLogger.logOperation(
        "Fix Primitive → Property Comma", 
        beforePrimitiveFix, 
        result, 
        true, 
        undefined, 
        JsonCleanerLogLevel.VERBOSE,
        {
          reason: 'Added missing comma after primitive value before property',
          strategy: 'primitive-to-property-comma'
        }
      );
    }
    
    if (before !== result) {
      console.log('[CommaFixerCleaner] ✅ Specific comma pattern fixes completed');
    } else {
      console.log('[CommaFixerCleaner] ℹ️ No specific comma patterns found to fix');
    }
    
    return result;
  }

  /**
   * NEW METHOD: Extended comma repair for more complex cases
   */
  private fixAdvancedCommaPatterns(jsonStr: string): string {
    let result = jsonStr;
    const before = result;
    
    console.log('[CommaFixerCleaner] Starting advanced comma pattern fixes...');
    
    // EXTENDED PATTERN RECOGNITION with more flexibility
    
    // Pattern A: Property-value followed by Property-name (general)
    // Recognizes: "key": value "nextKey": nextValue
    const generalPropertyPattern = /("[\w_äöüÄÖÜ\-]+"\s*:\s*(?:"[^"]*"|\[[^\]]*\]|\{[^}]*\}|[^,}\]]+))\s+("[\w_äöüÄÖÜ\-]+"\s*:)/g;
    const beforeGeneral = result;
    result = result.replace(generalPropertyPattern, '$1,$2');
    
    if (beforeGeneral !== result) {
      console.log('[CommaFixerCleaner] ✅ Fixed general property-to-property comma issues');
      JsonCleanerLogger.logOperation(
        "Fix General Property → Property Comma", 
        beforeGeneral, 
        result, 
        true, 
        undefined, 
        JsonCleanerLogLevel.VERBOSE,
        {
          reason: 'Added missing comma between properties using general pattern',
          strategy: 'general-property-to-property-comma'
        }
      );
    }
    
    // Pattern B: Nested structures
    // Handles more complex nested arrays and objects
    result = this.fixNestedStructureCommas(result);
    
    if (before !== result) {
      console.log('[CommaFixerCleaner] ✅ Advanced comma pattern fixes completed');
    } else {
      console.log('[CommaFixerCleaner] ℹ️ No advanced comma patterns found to fix');
    }
    
    return result;
  }

  /**
   * NEW METHOD: Repairs commas in nested structures
   */
  private fixNestedStructureCommas(jsonStr: string): string {
    let result = jsonStr;
    
    try {
      // State-Machine approach for precise comma recognition
      result = this.stateBasedCommaFix(result);
    } catch (error) {
      console.log('[CommaFixerCleaner] ⚠️ State-based comma fix failed:', error);
      // Fallback to simpler regex-based fixes
      result = this.regexBasedCommaFix(result);
    }
    
    return result;
  }

  /**
   * NEW METHOD: State-Machine based comma repair
   */
  private stateBasedCommaFix(jsonStr: string): string {
    let result = '';
    let inString = false;
    let escapeNext = false;
    let depth = 0;
    let lastValueEnd = -1;
    let i = 0;
    
    while (i < jsonStr.length) {
      const char = jsonStr[i];
      const nextChar = jsonStr[i + 1];
      
      // Handle escaping
      if (escapeNext) {
        result += char;
        escapeNext = false;
        i++;
        continue;
      }
      
      if (char === '\\' && inString) {
        result += char;
        escapeNext = true;
        i++;
        continue;
      }
      
      // Handle strings
      if (char === '"') {
        inString = !inString;
        result += char;
        
        if (!inString) {
          // End of string - could be end of property name or value
          lastValueEnd = i;
        }
        
        i++;
        continue;
      }
      
      if (inString) {
        result += char;
        i++;
        continue;
      }
      
      // Handle brackets and braces
      if (char === '{' || char === '[') {
        depth++;
        result += char;
        i++;
        continue;
      }
      
      if (char === '}' || char === ']') {
        depth--;
        result += char;
        lastValueEnd = i;
        
        // Check if we need a comma after this closing bracket
        if (this.needsCommaAfterBracket(jsonStr, i)) {
          result += ',';
          console.log(`[CommaFixerCleaner] Added comma after ${char} at position ${i}`);
        }
        
        i++;
        continue;
      }
      
      // Handle other characters
      if (char === ':') {
        result += char;
        // After colon, we expect a value
        i++;
        continue;
      }
      
      if (char === ',') {
        result += char;
        i++;
        continue;
      }
      
      // Handle whitespace and detect missing commas
      if (/\s/.test(char)) {
        result += char;
        
        // If we're in a significant whitespace area, check for missing comma
        if (lastValueEnd >= 0 && i - lastValueEnd > 1) {
          const nextNonWhitespace = this.findNextNonWhitespace(jsonStr, i);
          if (nextNonWhitespace && jsonStr[nextNonWhitespace] === '"') {
            // Check if this looks like a property name
            if (this.looksLikePropertyName(jsonStr, nextNonWhitespace)) {
              result += ',';
              console.log(`[CommaFixerCleaner] Added comma in whitespace at position ${i}`);
              lastValueEnd = -1; // Reset
            }
          }
        }
        
        i++;
        continue;
      }
      
      // Handle primitive values (numbers, true, false, null)
      if (/[0-9tfn]/.test(char)) {
        const valueMatch = jsonStr.substring(i).match(/^(true|false|null|\d+(\.\d+)?)/);
        if (valueMatch) {
          result += valueMatch[0];
          lastValueEnd = i + valueMatch[0].length - 1;
          i += valueMatch[0].length;
          continue;
        }
      }
      
      result += char;
      i++;
    }
    
    return result;
  }

  /**
   * NEW HELPER METHOD: Checks if a comma is needed after a bracket
   */
  private needsCommaAfterBracket(jsonStr: string, bracketPos: number): boolean {
    const nextNonWhitespace = this.findNextNonWhitespace(jsonStr, bracketPos + 1);
    if (!nextNonWhitespace) return false;
    
    const nextChar = jsonStr[nextNonWhitespace];
    
    // No comma needed if already there or end of structure
    if (nextChar === ',' || nextChar === '}' || nextChar === ']') {
      return false;
    }
    
    // Comma needed if next character is a quote (probably property)
    if (nextChar === '"') {
      return this.looksLikePropertyName(jsonStr, nextNonWhitespace);
    }
    
    return false;
  }

  /**
   * NEW HELPER METHOD: Finds the next non-whitespace character
   */
  private findNextNonWhitespace(jsonStr: string, startPos: number): number | null {
    for (let i = startPos; i < jsonStr.length; i++) {
      if (!/\s/.test(jsonStr[i])) {
        return i;
      }
    }
    return null;
  }

  /**
   * NEW HELPER METHOD: Checks if a quote is probably a property name
   */
  private looksLikePropertyName(jsonStr: string, quotePos: number): boolean {
    // Find the end of the string
    let endQuote = quotePos + 1;
    while (endQuote < jsonStr.length && jsonStr[endQuote] !== '"') {
      if (jsonStr[endQuote] === '\\') endQuote++; // Skip escaped chars
      endQuote++;
    }
    
    if (endQuote >= jsonStr.length) return false;
    
    // Check if a colon comes after the closing quote
    const nextNonWhitespace = this.findNextNonWhitespace(jsonStr, endQuote + 1);
    return nextNonWhitespace !== null && jsonStr[nextNonWhitespace] === ':';
  }

  /**
   * FALLBACK METHOD: Regex-based comma repair
   */
  private regexBasedCommaFix(jsonStr: string): string {
    let result = jsonStr;
    
    // Simple regex patterns as fallback
    const patterns = [
      {
        pattern: /(\]|\}|"|\d)\s+("[\w_]+"\s*:)/g,
        replacement: '$1,$2',
        name: 'value-to-property'
      }
    ];
    
    patterns.forEach(({ pattern, replacement, name }) => {
      const before = result;
      result = result.replace(pattern, replacement);
      if (before !== result) {
        console.log(`[CommaFixerCleaner] Applied fallback regex fix: ${name}`);
      }
    });
    
    return result;
  }

  /**
   * DEBUGGING METHOD: Analyzes missing commas for logging
   */
  public analyzeMissingCommas(jsonStr: string): Array<{
    position: number;
    type: string;
    before: string;
    after: string;
    suggestion: string;
  }> {
    const issues = [];
    
    // Analysis for Arrays followed by Properties
    let match;
    const arrayPattern = /(\])\s*("[\w_äöüÄÖÜ\-]+"\s*:)/g;
    while ((match = arrayPattern.exec(jsonStr)) !== null) {
      issues.push({
        position: match.index + match[1].length,
        type: 'array-to-property',
        before: match[0],
        after: match[1] + ',' + match[2],
        suggestion: 'Insert comma after array before next property'
      });
    }
    
    // Analysis for Objects followed by Properties
    const objectPattern = /(\})\s*("[\w_äöüÄÖÜ\-]+"\s*:)/g;
    while ((match = objectPattern.exec(jsonStr)) !== null) {
      issues.push({
        position: match.index + match[1].length,
        type: 'object-to-property',
        before: match[0],
        after: match[1] + ',' + match[2],
        suggestion: 'Insert comma after object before next property'
      });
    }
    
    return issues;
  }
}