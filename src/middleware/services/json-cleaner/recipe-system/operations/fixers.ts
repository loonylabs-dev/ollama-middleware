import { 
  CleaningOperation, 
  CleaningContext, 
  OperationResult, 
  OperationImpact,
  ChangeDescription 
} from '../types/operation.types';

// Base class for fixer operations
export abstract class BaseFixer implements CleaningOperation {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly priority: 'critical' | 'high' | 'medium' | 'low' = 'medium',
    public readonly config?: any
  ) {}

  abstract shouldApply(context: CleaningContext): boolean;
  abstract performFix(json: string, context: CleaningContext): FixResult;

  async apply(json: string, context: CleaningContext): Promise<OperationResult> {
    const startTime = Date.now();
    
    try {
      if (!this.shouldApply(context)) {
        return {
          success: true,
          changes: [],
          confidence: 1.0,
          shouldContinue: true,
          metrics: {
            executionTime: Date.now() - startTime
          }
        };
      }

      const fixResult = this.performFix(json, context);
      const executionTime = Date.now() - startTime;

      return {
        success: fixResult.success,
        cleanedJson: fixResult.success ? fixResult.fixedJson : undefined,
        changes: fixResult.changes,
        confidence: fixResult.confidence,
        shouldContinue: true,
        metrics: {
          executionTime,
          sizeChange: fixResult.success ? (fixResult.fixedJson.length - json.length) : 0
        },
        error: fixResult.error ? {
          code: fixResult.error.code,
          message: fixResult.error.message,
          recoverable: true
        } : undefined
      };
    } catch (error) {
      return {
        success: false,
        changes: [],
        confidence: 0.0,
        shouldContinue: true,
        error: {
          code: 'FIXER_ERROR',
          message: `Fix operation failed: ${error}`,
          recoverable: true
        },
        metrics: {
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  estimateImpact(json: string, context: CleaningContext): OperationImpact {
    if (!this.shouldApply(context)) {
      return {
        risk: 'low',
        estimatedChanges: 0,
        estimatedTime: 5,
        confidence: 1.0,
        mightBreakValid: false
      };
    }

    return this.calculateImpact(json, context);
  }

  abstract calculateImpact(json: string, context: CleaningContext): OperationImpact;

  conflictsWith(other: CleaningOperation): boolean {
    // Basic conflict detection - can be overridden
    return false;
  }
}

export interface FixResult {
  success: boolean;
  fixedJson: string;
  changes: ChangeDescription[];
  confidence: number;
  error?: {
    code: string;
    message: string;
  };
}

// Control Character Fixer
export class ControlCharacterFixer extends BaseFixer {
  private readonly controlCharMap = {
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\b': '\\b',
    '\f': '\\f',
    '\v': '\\v',
    '\\0': '\\0'
  } as Record<string, string>;

  constructor() {
    super(
      'control_char_fixer',
      'Control Character Fixer',
      'Escapes unescaped control characters in JSON strings'
    );
  }

  shouldApply(context: CleaningContext): boolean {
    return context.hasDetection('control_character') || /[\x00-\x1F\x7F]/.test(context.currentJson);
  }

  performFix(json: string, context: CleaningContext): FixResult {
    let fixedJson = json;
    const changes: ChangeDescription[] = [];
    let totalReplacements = 0;

    // Escape control characters, but only inside strings
    for (const [char, escaped] of Object.entries(this.controlCharMap)) {
      const regex = new RegExp(char, 'g');
      const matches = [...json.matchAll(regex)];
      
      if (matches.length > 0) {
        // More sophisticated approach: only escape chars inside JSON strings
        fixedJson = this.escapeInStrings(fixedJson, char, escaped);
        
        const newMatches = [...fixedJson.matchAll(regex)];
        const replacementCount = matches.length - newMatches.length;
        
        if (replacementCount > 0) {
          changes.push({
            type: 'escape',
            location: 0,
            from: char,
            to: escaped,
            count: replacementCount,
            context: `Escaped ${replacementCount} occurrences of control character`
          });
          totalReplacements += replacementCount;
        }
      }
    }

    const success = totalReplacements > 0;
    const confidence = success ? 0.9 : 1.0;

    return {
      success,
      fixedJson,
      changes,
      confidence
    };
  }

  private escapeInStrings(json: string, char: string, escaped: string): string {
    // Simplified implementation
    let result = '';
    let inString = false;
    let isEscaped = false;

    for (let i = 0; i < json.length; i++) {
      const c = json[i];
      
      if (isEscaped) {
        isEscaped = false;
        result += c;
        continue;
      }
      
      if (c === '\\') {
        isEscaped = true;
        result += c;
        continue;
      }
      
      if (c === '"') {
        inString = !inString;
        result += c;
        continue;
      }
      
      if (inString && c === char) {
        result += escaped;
      } else {
        result += c;
      }
    }

    return result;
  }

  calculateImpact(json: string, context: CleaningContext): OperationImpact {
    const controlChars = (json.match(/[\x00-\x1F\x7F]/g) || []).length;
    
    return {
      risk: 'low',
      estimatedChanges: controlChars,
      estimatedTime: Math.max(10, controlChars * 2),
      confidence: 0.9,
      mightBreakValid: false
    };
  }
}

// Missing Comma Fixer
export class MissingCommaFixer extends BaseFixer {
  constructor() {
    super(
      'missing_comma_fixer',
      'Missing Comma Fixer',
      'Adds missing commas between JSON elements'
    );
  }

  shouldApply(context: CleaningContext): boolean {
    // Only apply if:
    // 1. Missing comma was explicitly detected, OR
    // 2. JSON is currently invalid AND there are signs of missing commas
    const isCurrentlyValid = this.isValidJSON(context.currentJson);

    if (isCurrentlyValid) {
      // Never modify already valid JSON
      return false;
    }

    return context.hasDetection('missing_comma') || this.hasMissingCommas(context.currentJson);
  }

  private isValidJSON(json: string): boolean {
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  }

  private hasMissingCommas(json: string): boolean {
    // Cases:
    // 1) "a":1 "b":2
    // 2) "a": {...} "b":2
    // 3) "a": [..] "b":2
    // 4) } { and ] [ between elements
    const propToProp = /"[^"]*"\s*:\s*[^,}\]]+\s+"[^"]*"\s*:/;
    return propToProp.test(json) || /}\s*{/.test(json) || /]\s*\[/.test(json) || /"\s*"[^:\s]/.test(json);
  }

  performFix(json: string, context: CleaningContext): FixResult {
    let fixedJson = json;
    const changes: ChangeDescription[] = [];

    // Fix 1a: Missing commas between object properties with string values
    const propertyPatternString = /("[^"]*"\s*:\s*"[^"]*")\s+("[^"]*"\s*:)/g;
    const propertyMatchesString = [...fixedJson.matchAll(propertyPatternString)];
    fixedJson = fixedJson.replace(propertyPatternString, '$1, $2');
    if (propertyMatchesString.length > 0) {
      changes.push({
        type: 'add_comma',
        location: 0,
        count: propertyMatchesString.length,
        context: 'Added commas between object properties (string values)'
      });
    }

    // Fix 1b: Missing commas between object properties with non-string values (numbers, booleans, null, objects, arrays)
    const propertyPatternGeneral = /("[^"]*"\s*:\s*[^,}\]]+)\s+("[^"]*"\s*:)/g;
    const propertyMatchesGeneral = [...fixedJson.matchAll(propertyPatternGeneral)];
    fixedJson = fixedJson.replace(propertyPatternGeneral, '$1, $2');
    if (propertyMatchesGeneral.length > 0) {
      changes.push({
        type: 'add_comma',
        location: 0,
        count: propertyMatchesGeneral.length,
        context: 'Added commas between object properties (general values)'
      });
    }

    // Fix 2: Missing commas between objects in arrays
    const objectArrayPattern = /(})\s*({)/g;
    const objectArrayMatches = [...fixedJson.matchAll(objectArrayPattern)];
    
    fixedJson = fixedJson.replace(objectArrayPattern, '$1, $2');
    
    if (objectArrayMatches.length > 0) {
      changes.push({
        type: 'add_comma',
        location: 0,
        count: objectArrayMatches.length,
        context: 'Added commas between objects in array'
      });
    }

    // Fix 3: Missing commas between arrays
    const arrayPattern = /(])\s*(\[)/g;
    const arrayMatches = [...fixedJson.matchAll(arrayPattern)];
    
    fixedJson = fixedJson.replace(arrayPattern, '$1, $2');
    
    if (arrayMatches.length > 0) {
      changes.push({
        type: 'add_comma',
        location: 0,
        count: arrayMatches.length,
        context: 'Added commas between arrays'
      });
    }

    const success = changes.length > 0;
    const confidence = success ? 0.85 : 1.0;

    return {
      success,
      fixedJson,
      changes,
      confidence
    };
  }

  calculateImpact(json: string, context: CleaningContext): OperationImpact {
    const missingCommas = this.estimateMissingCommas(json);
    
    return {
      risk: 'medium',
      estimatedChanges: missingCommas,
      estimatedTime: Math.max(10, missingCommas * 3),
      confidence: 0.85,
      mightBreakValid: missingCommas > 0
    };
  }

  private estimateMissingCommas(json: string): number {
    const propertyIssues = (json.match(/"\s*"[^:\s]/g) || []).length;
    const objectIssues = (json.match(/}\s*{/g) || []).length;
    const arrayIssues = (json.match(/]\s*\[/g) || []).length;
    
    return propertyIssues + objectIssues + arrayIssues;
  }
}

// Markdown Block Extractor
export class MarkdownBlockExtractor extends BaseFixer {
  constructor() {
    super(
      'markdown_extractor',
      'Markdown Block Extractor',
      'Extracts JSON from markdown code blocks'
    );
  }

  shouldApply(context: CleaningContext): boolean {
    return context.hasDetection('markdown_code_block') || /```/.test(context.currentJson);
  }

  performFix(json: string, context: CleaningContext): FixResult {
    const changes: ChangeDescription[] = [];
    
    // Look for JSON inside markdown code blocks
    const codeBlockPattern = /```(?:json|javascript|js)?\s*([\s\S]*?)```/gi;
    const matches = [...json.matchAll(codeBlockPattern)];
    
    if (matches.length === 0) {
      return {
        success: false,
        fixedJson: json,
        changes: [],
        confidence: 0.0
      };
    }

    // For now, extract the first code block that looks like JSON
    let bestMatch = '';
    let bestConfidence = 0;
    
    for (const match of matches) {
      const content = match[1].trim();
      const confidence = this.assessJsonLikelihood(content);
      
      if (confidence > bestConfidence) {
        bestMatch = content;
        bestConfidence = confidence;
      }
    }

    if (bestMatch && bestConfidence > 0.5) {
      changes.push({
        type: 'extract',
        location: 0,
        from: json,
        to: bestMatch,
        context: 'Extracted JSON from markdown code block'
      });

      return {
        success: true,
        fixedJson: bestMatch,
        changes,
        confidence: bestConfidence
      };
    }

    return {
      success: false,
      fixedJson: json,
      changes: [],
      confidence: 0.0
    };
  }

  private assessJsonLikelihood(content: string): number {
    let score = 0;
    
    // Check for JSON-like patterns
    if (content.trim().startsWith('{') && content.trim().endsWith('}')) score += 0.4;
    if (content.trim().startsWith('[') && content.trim().endsWith(']')) score += 0.4;
    if (content.includes('"') && content.includes(':')) score += 0.3;
    if (/(true|false|null)/.test(content)) score += 0.2;
    
    // Penalize for non-JSON patterns
    if (/<[^>]+>/.test(content)) score -= 0.2; // HTML tags
    if (/^[A-Za-z\s]+$/.test(content)) score -= 0.3; // Plain text
    
    return Math.max(0, Math.min(1, score));
  }

  calculateImpact(json: string, context: CleaningContext): OperationImpact {
    const codeBlocks = (json.match(/```/g) || []).length / 2;
    
    return {
      risk: 'low',
      estimatedChanges: codeBlocks > 0 ? 1 : 0,
      estimatedTime: Math.max(5, codeBlocks * 10),
      confidence: 0.8,
      mightBreakValid: false
    };
  }
}

// Think Tag Extractor
export class ThinkTagExtractor extends BaseFixer {
  constructor() {
    super(
      'think_tag_extractor',
      'Think Tag Extractor',
      'Extracts JSON from <think> tags'
    );
  }

  shouldApply(context: CleaningContext): boolean {
    return context.hasDetection('think_tag') || /<think>/i.test(context.currentJson);
  }

  performFix(json: string, context: CleaningContext): FixResult {
    const changes: ChangeDescription[] = [];
    
    // Extract content from think tags
    const thinkTagPattern = /<think>([\s\S]*?)<\/think>/gi;
    const matches = [...json.matchAll(thinkTagPattern)];
    
    if (matches.length === 0) {
      return {
        success: false,
        fixedJson: json,
        changes: [],
        confidence: 0.0
      };
    }

    // Try to find JSON in think tags
    let bestContent = '';
    let bestConfidence = 0;
    
    for (const match of matches) {
      const content = match[1].trim();
      
      // Look for JSON patterns within the think tag content
      const jsonPatterns = [
        /(\{[\s\S]*\})/,  // Object
        /(\[[\s\S]*\])/   // Array
      ];
      
      for (const pattern of jsonPatterns) {
        const jsonMatch = content.match(pattern);
        if (jsonMatch) {
          const jsonCandidate = jsonMatch[1];
          const confidence = this.assessJsonQuality(jsonCandidate);
          
          if (confidence > bestConfidence) {
            bestContent = jsonCandidate;
            bestConfidence = confidence;
          }
        }
      }
    }

    if (bestContent && bestConfidence > 0.5) {
      changes.push({
        type: 'extract',
        location: 0,
        from: json,
        to: bestContent,
        context: 'Extracted JSON from think tag'
      });

      return {
        success: true,
        fixedJson: bestContent,
        changes,
        confidence: bestConfidence
      };
    }

    return {
      success: false,
      fixedJson: json,
      changes: [],
      confidence: 0.0
    };
  }

  private assessJsonQuality(content: string): number {
    try {
      JSON.parse(content);
      return 1.0; // Valid JSON gets highest score
    } catch {
      // Assess how JSON-like it is
      let score = 0;
      
      if (content.includes('{') && content.includes('}')) score += 0.3;
      if (content.includes('[') && content.includes(']')) score += 0.3;
      if (content.includes('"') && content.includes(':')) score += 0.3;
      if (/(true|false|null)/.test(content)) score += 0.1;
      
      return score;
    }
  }

  calculateImpact(json: string, context: CleaningContext): OperationImpact {
    const thinkTags = (json.match(/<think>/gi) || []).length;
    
    return {
      risk: 'low',
      estimatedChanges: thinkTags > 0 ? 1 : 0,
      estimatedTime: Math.max(5, thinkTags * 15),
      confidence: 0.75,
      mightBreakValid: false
    };
  }
}

// Structural Repair Fixer
export class StructuralRepairFixer extends BaseFixer {
  constructor() {
    super(
      'structural_repair',
      'Structural Repair Fixer',
      'Repairs basic structural issues like unbalanced brackets'
    );
  }

  shouldApply(context: CleaningContext): boolean {
    return context.hasDetection('unbalanced_braces') || 
           context.hasDetection('unbalanced_brackets') ||
           this.hasStructuralIssues(context.currentJson);
  }

  private hasStructuralIssues(json: string): boolean {
    const openBraces = (json.match(/\{/g) || []).length;
    const closeBraces = (json.match(/\}/g) || []).length;
    const openBrackets = (json.match(/\[/g) || []).length;
    const closeBrackets = (json.match(/\]/g) || []).length;
    
    return openBraces !== closeBraces || openBrackets !== closeBrackets;
  }

  performFix(json: string, context: CleaningContext): FixResult {
    let fixedJson = json;
    const changes: ChangeDescription[] = [];

    // Count brackets
    const openBraces = (fixedJson.match(/\{/g) || []).length;
    const closeBraces = (fixedJson.match(/\}/g) || []).length;
    const openBrackets = (fixedJson.match(/\[/g) || []).length;
    const closeBrackets = (fixedJson.match(/\]/g) || []).length;

    // Fix missing closing braces
    if (openBraces > closeBraces) {
      const needed = openBraces - closeBraces;
      fixedJson += '}' .repeat(needed);
      changes.push({
        type: 'add_bracket',
        location: fixedJson.length,
        count: needed,
        context: `Added ${needed} closing braces`
      });
    }

    // Fix missing closing brackets
    if (openBrackets > closeBrackets) {
      const needed = openBrackets - closeBrackets;
      fixedJson += ']'.repeat(needed);
      changes.push({
        type: 'add_bracket',
        location: fixedJson.length,
        count: needed,
        context: `Added ${needed} closing brackets`
      });
    }

    // Remove extra closing braces (simple approach)
    if (closeBraces > openBraces) {
      const excess = closeBraces - openBraces;
      let removed = 0;
      fixedJson = fixedJson.replace(/\}/g, (match) => {
        if (removed < excess) {
          removed++;
          return '';
        }
        return match;
      });
      
      if (removed > 0) {
        changes.push({
          type: 'remove_bracket',
          location: 0,
          count: removed,
          context: `Removed ${removed} excess closing braces`
        });
      }
    }

    // Remove extra closing brackets
    if (closeBrackets > openBrackets) {
      const excess = closeBrackets - openBrackets;
      let removed = 0;
      fixedJson = fixedJson.replace(/\]/g, (match) => {
        if (removed < excess) {
          removed++;
          return '';
        }
        return match;
      });
      
      if (removed > 0) {
        changes.push({
          type: 'remove_bracket',
          location: 0,
          count: removed,
          context: `Removed ${removed} excess closing brackets`
        });
      }
    }

    const success = changes.length > 0;
    const confidence = success ? 0.7 : 1.0; // Lower confidence as this is more risky

    return {
      success,
      fixedJson,
      changes,
      confidence
    };
  }

  calculateImpact(json: string, context: CleaningContext): OperationImpact {
    const imbalance = Math.abs((json.match(/\{/g) || []).length - (json.match(/\}/g) || []).length) +
                     Math.abs((json.match(/\[/g) || []).length - (json.match(/\]/g) || []).length);
    
    return {
      risk: 'high',
      estimatedChanges: imbalance,
      estimatedTime: Math.max(15, imbalance * 5),
      confidence: 0.7,
      mightBreakValid: imbalance > 0
    };
  }
}

// Export all fixers for easy use
export const Fixers = {
  controlCharacter: () => new ControlCharacterFixer(),
  missingComma: () => new MissingCommaFixer(),
  markdownExtractor: () => new MarkdownBlockExtractor(),
  thinkTagExtractor: () => new ThinkTagExtractor(),
  structuralRepair: () => new StructuralRepairFixer()
};
