import { CleaningContext, CleaningStrategyResult } from '../json-cleaner.types';
import { BaseCleaningStrategy } from './base-cleaner.strategy';
import { JsonCleanerLogger, JsonCleanerLogLevel } from '../json-cleaner-logger';

/**
 * NEW STRATEGY: Structural Repair Cleaner
 * 
 * Fixes fundamental JSON structural problems such as:
 * - Objects that should actually be strings
 * - "field": { "text without quotes" } → "field": "text with proper escaping"
 */
export class StructuralRepairCleaner extends BaseCleaningStrategy {
  public name = 'Structural Repair Cleaner';

  /**
   * Detects structural problems
   */
  public canHandle(context: CleaningContext): boolean {
    const input = context.intermediateResult;
    
    // Look for the specific problem: Object with text content instead of string
    const hasObjectWithTextContent = this.detectObjectsWithTextContent(input);
    
    return hasObjectWithTextContent.length > 0;
  }

  /**
   * Repairs structural JSON problems
   */
  public clean(context: CleaningContext): CleaningStrategyResult {
    const input = context.intermediateResult;
    
    try {
      console.log('[StructuralRepairCleaner] Starting structural repair...');
      
      // STEP 1: Detect problematic structures
      const problems = this.detectObjectsWithTextContent(input);
      
      if (problems.length === 0) {
        return { output: input, success: true, modified: false };
      }
      
      console.log(`[StructuralRepairCleaner] Found ${problems.length} structural problems:`);
      problems.forEach((problem, index) => {
        console.log(`  ${index + 1}. Field "${problem.fieldName}": Object → String conversion needed`);
      });
      
      // STEP 2: Repair the structures
      let output = this.repairStructuralProblems(input, problems);
      
      // STEP 3: Validate the result
      const modified = input !== output;
      let success = false;
      let parseError: string | undefined;
      
      try {
        JSON.parse(output);
        success = true;
        console.log('[StructuralRepairCleaner] ✅ Structural repair successful - JSON is now valid');
      } catch (error) {
        parseError = error instanceof Error ? error.message : String(error);
        console.log(`[StructuralRepairCleaner] ⚠️ Structural repair completed but JSON still invalid: ${parseError}`);
        success = modified; // Partial success
      }
      
      if (modified) {
        JsonCleanerLogger.logOperation(
          'Structural Repair', 
          input, 
          output, 
          success, 
          parseError, 
          JsonCleanerLogLevel.STANDARD,
          {
            reason: success ? 
              `Successfully repaired ${problems.length} structural issues` :
              `Repaired ${problems.length} structural issues but JSON still invalid: ${parseError}`,
            detectedIssues: problems.map(p => `${p.fieldName}: Object→String conversion`),
            strategy: 'structural-object-to-string-repair'
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
      console.log('[StructuralRepairCleaner] ❌ Structural repair failed:', errorMsg);
      
      return {
        output: input,
        success: false,
        error: errorMsg,
        modified: false
      };
    }
  }

  /**
   * Detects Objects that should actually be strings
   */
  private detectObjectsWithTextContent(jsonStr: string): Array<{
    fieldName: string;
    objectStart: number;
    objectEnd: number;
    contentPreview: string;
  }> {
    const problems = [];
    
    // Pattern: "fieldname": { content_that_looks_like_text }
    const objectFieldPattern = /"([^"]+)"\s*:\s*\{([^{}]*?)\}/g;
    
    let match;
    while ((match = objectFieldPattern.exec(jsonStr)) !== null) {
      const fieldName = match[1];
      const objectContent = match[2].trim();
      
      // Check if the object content looks like text
      if (this.looksLikeTextContent(objectContent)) {
        problems.push({
          fieldName,
          objectStart: match.index + match[0].indexOf('{'),
          objectEnd: match.index + match[0].lastIndexOf('}'),
          contentPreview: objectContent.substring(0, 100) + (objectContent.length > 100 ? '...' : '')
        });
      }
    }
    
    return problems;
  }

  /**
   * Checks if content looks like text (not like JSON object properties)
   */
  private looksLikeTextContent(content: string): boolean {
    // Remove whitespace for analysis
    const trimmed = content.trim();
    
    // Empty or only whitespace → not interesting
    if (!trimmed) return false;
    
    // Contains JSON-typical structures → probably a real object
    if (trimmed.includes('":') || trimmed.includes('": ') || trimmed.match(/^"[^"]+"\s*:/)) {
      return false;
    }
    
    // Contains English words/sentences → probably text
    const textPatterns = [
      /\b(the|and|or|but|with|from|to|on|in|at|by|for|of|about|over|under|before|after|between)\b/i,
      /\b(story|adventure|landscape|flowers|animals|situation|character|description)\b/i,
      /[.!?]\s+[A-Z]/, // Sentences with periods
      /\w+\s+\w+\s+\w+/, // Multiple words in a row
    ];
    
    return textPatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * Repairs the structural problems
   */
  private repairStructuralProblems(jsonStr: string, problems: Array<any>): string {
    let result = jsonStr;
    
    // Sort problems from back to front (to avoid shifting indices)
    const sortedProblems = problems.sort((a, b) => b.objectStart - a.objectStart);
    
    for (const problem of sortedProblems) {
      console.log(`[StructuralRepairCleaner] Repairing field "${problem.fieldName}"...`);
      
      // Extract the object content
      const beforeObject = result.substring(0, problem.objectStart);
      const objectContent = result.substring(problem.objectStart + 1, problem.objectEnd);
      const afterObject = result.substring(problem.objectEnd + 1);
      
      // Clean and escape the content
      const cleanedText = this.cleanAndEscapeTextContent(objectContent);
      
      // Replace { content } with "escaped_content"
      result = beforeObject + '"' + cleanedText + '"' + afterObject;
      
      console.log(`[StructuralRepairCleaner] ✓ Converted "${problem.fieldName}" from Object to String`);
    }
    
    return result;
  }

  /**
   * Cleans and escapes text content for JSON
   */
  private cleanAndEscapeTextContent(textContent: string): string {
    let cleaned = textContent.trim();
    
    // Escape JSON-specific characters
    cleaned = cleaned
      .replace(/\\/g, '\\\\')    // Escape backslashes
      .replace(/"/g, '\\"')      // Escape quotes
      .replace(/\n/g, '\\n')     // Escape newlines
      .replace(/\r/g, '\\r')     // Escape carriage returns
      .replace(/\t/g, '\\t')     // Escape tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove other Control Characters
    
    return cleaned;
  }

  /**
   * Debug method for the specific problem
   */
  public analyzeRevisedContentProblem(jsonStr: string): {
    hasRevisedContentProblem: boolean;
    problemDetails?: {
      currentStructure: string;
      suggestedFix: string;
      contentPreview: string;
    };
  } {
    const revisedContentMatch = jsonStr.match(/"revised_content"\s*:\s*\{([^{}]*?)\}/);
    
    if (revisedContentMatch) {
      const content = revisedContentMatch[1].trim();
      const cleanedContent = this.cleanAndEscapeTextContent(content);
      
      return {
        hasRevisedContentProblem: true,
        problemDetails: {
          currentStructure: 'Object { text_without_quotes }',
          suggestedFix: `"revised_content": "${cleanedContent.substring(0, 200)}..."`,
          contentPreview: content.substring(0, 300) + (content.length > 300 ? '...' : '')
        }
      };
    }
    
    return { hasRevisedContentProblem: false };
  }
}