import { CleaningContext, CleaningStrategyResult } from '../json-cleaner.types';
import { BaseCleaningStrategy } from './base-cleaner.strategy';
import { JsonCleanerLogger, JsonCleanerLogLevel } from '../json-cleaner-logger';
import { JsonValidationHelper } from '../helpers/json-validation.helper';

/**
 * Improved ControlCharacterCleaner
 * Focus on robust detection and repair of Control Characters
 */
export class ControlCharacterCleaner extends BaseCleaningStrategy {
  public name = 'Control Character Cleaner';

  /**
   * Enhanced canHandle - checks specifically for Control Characters
   */
  public canHandle(context: CleaningContext): boolean {
    const input = context.intermediateResult;
    
    // Quick pre-check for known Control Characters
    const hasNewlines = input.includes('\n') || input.includes('\r');
    const hasTabs = input.includes('\t');
    const hasOtherControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(input);
    
    return hasNewlines || hasTabs || hasOtherControlChars;
  }

  /**
   * Completely reworked clean method
   */
  public clean(context: CleaningContext): CleaningStrategyResult {
    const input = context.intermediateResult;
    
    try {
      // STEP 1: Detailed analysis BEFORE we change anything
      const analysis = this.comprehensiveControlCharAnalysis(input);
      
      if (analysis.totalIssues === 0) {
        console.log('[ControlCharacterCleaner] No control character issues found');
        return {
          output: input,
          success: true,
          modified: false
        };
      }
      
      console.log(`[ControlCharacterCleaner] Found ${analysis.totalIssues} control character issues`);
      console.log(`[ControlCharacterCleaner] Issue types: ${analysis.issueTypes.join(', ')}`);
      
      // STEP 2: Perform targeted repair
      const output = this.performControlCharacterRepair(input, analysis);
      const modified = input !== output;
      
      // STEP 3: Validate the result
      let success = false;
      let parseError: string | undefined;
      
      try {
        JSON.parse(output);
        success = true;
        console.log('[ControlCharacterCleaner] ✅ Repair successful - JSON is now valid');
      } catch (error) {
        parseError = error instanceof Error ? error.message : String(error);
        console.log(`[ControlCharacterCleaner] ⚠️ Repair completed but JSON still invalid: ${parseError}`);
        // Still consider as partially successful since we fixed problems
        success = modified;
      }
      
      // STEP 4: Detailed logging
      if (modified) {
        JsonCleanerLogger.logOperation(
          'Clean Control Characters', 
          input, 
          output, 
          success, 
          parseError, 
          JsonCleanerLogLevel.STANDARD,
          {
            reason: success ? 
              `Successfully fixed ${analysis.totalIssues} control character issues: ${analysis.issueTypes.join(', ')}` :
              `Fixed ${analysis.totalIssues} control character issues but JSON still invalid: ${parseError}`,
            detectedIssues: analysis.detailedIssues,
            strategy: 'comprehensive-control-character-escaping'
          }
        );
      }
      
      return {
        output,
        success,
        modified,
        error: parseError
      };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log('[ControlCharacterCleaner] ❌ Unexpected error during control character cleaning:', errorMsg);
      
      JsonCleanerLogger.logOperation(
        "Control Character Cleaning Failed", 
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
   * NEW METHOD: Comprehensive Control-Character Analysis
   */
  private comprehensiveControlCharAnalysis(jsonStr: string): {
    totalIssues: number;
    issueTypes: string[];
    detailedIssues: string[];
    affectedFields: string[];
    problemPositions: Array<{pos: number, char: string, code: number, context: string}>;
  } {
    const issues: string[] = [];
    const issueTypes: string[] = [];
    const affectedFields: string[] = [];
    const problemPositions: Array<{pos: number, char: string, code: number, context: string}> = [];
    let totalIssues = 0;
    
    let inString = false;
    let escapeNext = false;
    let currentField = '';
    let fieldStartPos = -1;
    
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr.charAt(i);
      const code = char.charCodeAt(0);
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        if (!inString) {
          // Starting a string
          fieldStartPos = i;
        } else {
          // Ending a string - check if it was a field name
          if (fieldStartPos >= 0) {
            const potentialField = jsonStr.substring(fieldStartPos + 1, i);
            // Check if this is followed by a colon (field name)
            const afterString = jsonStr.substring(i + 1).match(/^\s*:/);
            if (afterString) {
              currentField = potentialField;
            }
          }
        }
        inString = !inString;
        continue;
      }
      
      // Analyze Control Characters in Strings
      if (inString) {
        let isControlChar = false;
        let charType = '';
        
        if (char === '\n') {
          isControlChar = true;
          charType = 'unescaped-newlines';
          totalIssues++;
          const context = this.extractContext(jsonStr, i, 30);
          issues.push(`Unescaped newline at position ${i}`);
          problemPositions.push({pos: i, char: '\\n', code, context});
        } else if (char === '\r') {
          isControlChar = true;
          charType = 'unescaped-carriage-returns';
          totalIssues++;
          const context = this.extractContext(jsonStr, i, 30);
          issues.push(`Unescaped carriage return at position ${i}`);
          problemPositions.push({pos: i, char: '\\r', code, context});
        } else if (char === '\t') {
          isControlChar = true;
          charType = 'unescaped-tabs';
          totalIssues++;
          const context = this.extractContext(jsonStr, i, 30);
          issues.push(`Unescaped tab at position ${i}`);
          problemPositions.push({pos: i, char: '\\t', code, context});
        } else if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
          isControlChar = true;
          charType = 'other-control-chars';
          totalIssues++;
          const context = this.extractContext(jsonStr, i, 30);
          issues.push(`Control character (code ${code}) at position ${i}`);
          problemPositions.push({pos: i, char: `\\u${code.toString(16).padStart(4, '0')}`, code, context});
        }
        
        if (isControlChar) {
          if (!issueTypes.includes(charType)) {
            issueTypes.push(charType);
          }
          if (currentField && !affectedFields.includes(currentField)) {
            affectedFields.push(currentField);
          }
        }
      }
    }
    
    return {
      totalIssues,
      issueTypes,
      detailedIssues: issues,
      affectedFields,
      problemPositions
    };
  }

  /**
   * NEW METHOD: Targeted Control-Character Repair
   */
  private performControlCharacterRepair(jsonStr: string, analysis: any): string {
    console.log('[ControlCharacterCleaner] Starting targeted control character repair...');
    
    // METHOD 1: State-Machine based repair (precise)
    let result = this.stateMachineControlCharRepair(jsonStr);
    
    // METHOD 2: If State-Machine is insufficient, Regex fallback
    if (!JsonValidationHelper.isValid(result, 'ControlCharacterCleaner-state-machine')) {
      console.log('[ControlCharacterCleaner] State machine repair insufficient, trying regex fallback...');
      result = this.regexControlCharRepair(jsonStr);
    }
    
    // METHOD 3: As last resort - aggressive character-by-character repair
    if (!JsonValidationHelper.isValid(result, 'ControlCharacterCleaner-regex')) {
      console.log('[ControlCharacterCleaner] Regex repair insufficient, trying aggressive repair...');
      result = this.aggressiveControlCharRepair(jsonStr);
    }
    
    return result;
  }

  /**
   * NEW METHOD: State-Machine based Control-Character Repair
   */
  private stateMachineControlCharRepair(jsonStr: string): string {
    let result = '';
    let inString = false;
    let escapeNext = false;
    let currentFieldName = '';
    let isInFieldName = false;
    let fixes = 0;
    
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr.charAt(i);
      const nextChar = jsonStr[i + 1] || '';
      
      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\' && inString) {
        result += char;
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        if (!inString) {
          // Entering string - could be field name or value
          isInFieldName = this.isNextCharColon(jsonStr, i);
          currentFieldName = '';
        } else {
          // Exiting string
          isInFieldName = false;
        }
        inString = !inString;
        result += char;
        continue;
      }
      
      // Handle characters inside strings
      if (inString) {
        if (isInFieldName) {
          currentFieldName += char;
          result += char;
          continue;
        }
        
        // We're in a string value - escape control characters
        if (char === '\n') {
          result += '\\n';
          fixes++;
          console.log(`[ControlCharacterCleaner] Fixed newline at position ${i} in field "${currentFieldName}"`);
        } else if (char === '\r') {
          result += '\\r';
          fixes++;
          console.log(`[ControlCharacterCleaner] Fixed carriage return at position ${i} in field "${currentFieldName}"`);
        } else if (char === '\t') {
          result += '\\t';
          fixes++;
          console.log(`[ControlCharacterCleaner] Fixed tab at position ${i} in field "${currentFieldName}"`);
        } else {
          const code = char.charCodeAt(0);
          if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
            result += `\\u${code.toString(16).padStart(4, '0')}`;
            fixes++;
            console.log(`[ControlCharacterCleaner] Fixed control character (code ${code}) at position ${i} in field "${currentFieldName}"`);
          } else {
            result += char;
          }
        }
      } else {
        // Outside strings - just copy
        result += char;
      }
    }
    
    if (fixes > 0) {
      console.log(`[ControlCharacterCleaner] State machine repair completed: ${fixes} fixes applied`);
    }
    
    return result;
  }

  /**
   * NEW METHOD: Regex-based Control-Character Repair (Fallback)
   */
  private regexControlCharRepair(jsonStr: string): string {
    console.log('[ControlCharacterCleaner] Applying regex-based control character repair...');
    
    // Regex for Property-Name and Value pairs
    let result = jsonStr.replace(/("([^"]+)"\s*:\s*")([\s\S]*?)("(?=\s*[,}]))/g, (match, prefix, fieldName, content, suffix) => {
      let cleanedContent = content;
      const originalContent = content;
      
      // Replace Control Characters
      cleanedContent = cleanedContent
        .replace(/\n/g, '\\n')     // Newlines
        .replace(/\r/g, '\\r')     // Carriage returns
        .replace(/\t/g, '\\t')     // Tabs
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove other Control Characters
      
      if (originalContent !== cleanedContent) {
        console.log(`[ControlCharacterCleaner] Fixed control characters in field "${fieldName}"`);
      }
      
      return prefix + cleanedContent + suffix;
    });
    
    return result;
  }

  /**
   * NEW METHOD: Aggressive Character-by-Character Repair (last resort)
   */
  private aggressiveControlCharRepair(jsonStr: string): string {
    console.log('[ControlCharacterCleaner] Applying aggressive character-by-character repair...');
    
    let result = '';
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];
      const code = char.charCodeAt(0);
      
      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\' && inString) {
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
        // In string - handle control characters
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else if (code < 32) {
          // Remove or escape other Control Characters
          if (code === 8) result += '\\b';      // Backspace
          else if (code === 12) result += '\\f'; // Form feed
          else result += `\\u${code.toString(16).padStart(4, '0')}`;
        } else {
          result += char;
        }
      } else {
        result += char;
      }
    }
    
    return result;
  }

  /**
   * HELPER METHOD: Checks if a colon comes after a quote
   */
  private isNextCharColon(jsonStr: string, quotePos: number): boolean {
    // Find the closing quote
    let endQuote = quotePos + 1;
    while (endQuote < jsonStr.length && jsonStr[endQuote] !== '"') {
      if (jsonStr[endQuote] === '\\') endQuote++; // Skip escaped chars
      endQuote++;
    }
    
    if (endQuote >= jsonStr.length) return false;
    
    // Check if a colon comes after the quote
    let nextPos = endQuote + 1;
    while (nextPos < jsonStr.length && /\s/.test(jsonStr[nextPos])) nextPos++;
    
    return nextPos < jsonStr.length && jsonStr[nextPos] === ':';
  }

  /**
   * HELPER METHOD: Extracts context around a position
   */
  private extractContext(str: string, pos: number, radius: number): string {
    const start = Math.max(0, pos - radius);
    const end = Math.min(str.length, pos + radius);
    const context = str.substring(start, end);
    
    // Replace Control Characters for better readability
    return context
      .replace(/\n/g, '↵')
      .replace(/\r/g, '⏎')
      .replace(/\t/g, '→');
  }

  /**
   * DEBUGGING: Analyze Control Characters for specific problem
   */
  public debugAnalyzeControlChars(jsonStr: string): void {
    console.log('\n=== CONTROL CHARACTER DEBUG ANALYSIS ===');
    
    const analysis = this.comprehensiveControlCharAnalysis(jsonStr);
    
    console.log(`Total issues: ${analysis.totalIssues}`);
    console.log(`Issue types: ${analysis.issueTypes.join(', ')}`);
    console.log(`Affected fields: ${analysis.affectedFields.join(', ')}`);
    
    console.log('\nDetailed problems:');
    analysis.problemPositions.forEach((problem, index) => {
      console.log(`${index + 1}. Position ${problem.pos}: ${problem.char} (code ${problem.code})`);
      console.log(`   Context: ${problem.context}`);
    });
  }
}