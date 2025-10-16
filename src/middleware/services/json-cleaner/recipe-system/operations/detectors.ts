import { 
  CleaningOperation, 
  CleaningContext, 
  OperationResult, 
  OperationImpact 
} from '../types/operation.types';

// Base class for detector operations
export abstract class BaseDetector implements CleaningOperation {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'
  ) {}

  abstract shouldApply(context: CleaningContext): boolean;
  abstract detectIssues(json: string, context: CleaningContext): DetectionResult[];

  async apply(json: string, context: CleaningContext): Promise<OperationResult> {
    const startTime = Date.now();
    
    try {
      const detections = this.detectIssues(json, context);
      
      // Add detections to context
      detections.forEach(detection => {
        context.addDetection(
          detection.type,
          detection.location,
          detection.confidence,
          detection.metadata
        );
      });

      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        changes: detections.map(d => ({
          type: 'detection' as any,
          location: d.location,
          context: `Detected ${d.type}: ${d.description}`
        })),
        confidence: detections.length > 0 ? 0.9 : 1.0,
        shouldContinue: true,
        metrics: {
          executionTime
        }
      };
    } catch (error) {
      return {
        success: false,
        changes: [],
        confidence: 0.0,
        shouldContinue: true,
        error: {
          code: 'DETECTION_ERROR',
          message: `Detection failed: ${error}`,
          recoverable: true
        }
      };
    }
  }

  estimateImpact(json: string, context: CleaningContext): OperationImpact {
    const detections = this.detectIssues(json, context);
    
    return {
      risk: 'low', // Detectors don't modify content
      estimatedChanges: 0,
      estimatedTime: Math.max(10, json.length / 1000), // Rough estimate
      confidence: 0.95,
      mightBreakValid: false
    };
  }

  conflictsWith(other: CleaningOperation): boolean {
    // Detectors generally don't conflict with anything
    return false;
  }
}

export interface DetectionResult {
  type: string;
  location: number;
  confidence: number;
  description: string;
  metadata?: Record<string, any>;
}

// Control Character Detector
export class ControlCharacterDetector extends BaseDetector {
  constructor() {
    super(
      'control_char_detector',
      'Control Character Detector',
      'Detects unescaped control characters in JSON'
    );
  }

  shouldApply(context: CleaningContext): boolean {
    return /[\x00-\x1F\x7F]/.test(context.currentJson);
  }

  detectIssues(json: string, context: CleaningContext): DetectionResult[] {
    const detections: DetectionResult[] = [];
    const controlCharPattern = /[\x00-\x1F\x7F]/g;
    let match;

    while ((match = controlCharPattern.exec(json)) !== null) {
      const char = match[0];
      const charCode = char.charCodeAt(0);
      
      detections.push({
        type: 'control_character',
        location: match.index,
        confidence: 0.95,
        description: `Control character found: 0x${charCode.toString(16).padStart(2, '0')}`,
        metadata: {
          character: char,
          charCode,
          isNewline: char === '\n',
          isTab: char === '\t',
          isCarriageReturn: char === '\r'
        }
      });
    }

    return detections;
  }
}

// Missing Comma Detector
export class MissingCommaDetector extends BaseDetector {
  constructor() {
    super(
      'missing_comma_detector',
      'Missing Comma Detector',
      'Detects missing commas in JSON objects and arrays'
    );
  }

  shouldApply(context: CleaningContext): boolean {
    const json = context.currentJson;
    return /"\s*"[^:\s]/.test(json) || /}\s*{/.test(json) || /]\s*\[/.test(json);
  }

  detectIssues(json: string, context: CleaningContext): DetectionResult[] {
    const detections: DetectionResult[] = [];

    // Pattern 1: Missing comma between object properties
    // "key": "value" "nextKey"
    const propertyPattern = /"[^"]*"\s*:\s*"[^"]*"\s+"[^"]*"\s*:/g;
    let match;

    while ((match = propertyPattern.exec(json)) !== null) {
      detections.push({
        type: 'missing_comma',
        location: match.index + match[0].indexOf('" "'),
        confidence: 0.9,
        description: 'Missing comma between object properties',
        metadata: {
          pattern: 'property_separator',
          context: match[0]
        }
      });
    }

    // Pattern 2: Missing comma between objects in array
    // } {
    const objectArrayPattern = /}\s*{/g;
    while ((match = objectArrayPattern.exec(json)) !== null) {
      detections.push({
        type: 'missing_comma',
        location: match.index + 1,
        confidence: 0.85,
        description: 'Missing comma between objects in array',
        metadata: {
          pattern: 'object_array_separator',
          context: match[0]
        }
      });
    }

    // Pattern 3: Missing comma between arrays
    // ] [
    const arrayPattern = /]\s*\[/g;
    while ((match = arrayPattern.exec(json)) !== null) {
      detections.push({
        type: 'missing_comma',
        location: match.index + 1,
        confidence: 0.85,
        description: 'Missing comma between arrays',
        metadata: {
          pattern: 'array_separator',
          context: match[0]
        }
      });
    }

    return detections;
  }
}

// Structural Issue Detector
export class StructuralIssueDetector extends BaseDetector {
  constructor() {
    super(
      'structural_detector',
      'Structural Issue Detector',
      'Detects structural problems like unbalanced brackets'
    );
  }

  shouldApply(context: CleaningContext): boolean {
    return true; // Always check for structural issues
  }

  detectIssues(json: string, context: CleaningContext): DetectionResult[] {
    const detections: DetectionResult[] = [];

    // Count brackets and braces
    const brackets = this.analyzeBrackets(json);
    
    if (brackets.unbalancedBraces.length > 0) {
      brackets.unbalancedBraces.forEach(pos => {
        detections.push({
          type: 'unbalanced_braces',
          location: pos,
          confidence: 0.9,
          description: 'Unbalanced curly braces detected',
          metadata: {
            bracketType: 'curly'
          }
        });
      });
    }

    if (brackets.unbalancedBrackets.length > 0) {
      brackets.unbalancedBrackets.forEach(pos => {
        detections.push({
          type: 'unbalanced_brackets',
          location: pos,
          confidence: 0.9,
          description: 'Unbalanced square brackets detected',
          metadata: {
            bracketType: 'square'
          }
        });
      });
    }

    // Check for malformed strings
    const stringIssues = this.analyzeStrings(json);
    detections.push(...stringIssues);

    return detections;
  }

  private analyzeBrackets(json: string): {
    unbalancedBraces: number[];
    unbalancedBrackets: number[];
  } {
    const braceStack: number[] = [];
    const bracketStack: number[] = [];
    const unbalancedBraces: number[] = [];
    const unbalancedBrackets: number[] = [];
    
    let inString = false;
    let escaped = false;

    for (let i = 0; i < json.length; i++) {
      const char = json[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (inString) continue;
      
      switch (char) {
        case '{':
          braceStack.push(i);
          break;
        case '}':
          if (braceStack.length === 0) {
            unbalancedBraces.push(i);
          } else {
            braceStack.pop();
          }
          break;
        case '[':
          bracketStack.push(i);
          break;
        case ']':
          if (bracketStack.length === 0) {
            unbalancedBrackets.push(i);
          } else {
            bracketStack.pop();
          }
          break;
      }
    }
    
    // Remaining items in stacks are unmatched opening brackets
    unbalancedBraces.push(...braceStack);
    unbalancedBrackets.push(...bracketStack);
    
    return { unbalancedBraces, unbalancedBrackets };
  }

  private analyzeStrings(json: string): DetectionResult[] {
    const detections: DetectionResult[] = [];
    
    // Look for strings that might be improperly escaped or terminated
    const stringPattern = /"(?:[^"\\]|\\.)*"/g;
    const allQuotes = [...json.matchAll(/"/g)];
    const validStrings = [...json.matchAll(stringPattern)];
    
    // If we have unmatched quotes, there might be string issues
    const quoteCounts = allQuotes.length;
    const validStringQuotes = validStrings.length * 2;
    
    if (quoteCounts !== validStringQuotes) {
      detections.push({
        type: 'malformed_string',
        location: 0,
        confidence: 0.7,
        description: 'Potential malformed string detected',
        metadata: {
          totalQuotes: quoteCounts,
          validStringQuotes,
          issue: 'quote_mismatch'
        }
      });
    }

    return detections;
  }
}

// Markdown Block Detector
export class MarkdownBlockDetector extends BaseDetector {
  constructor() {
    super(
      'markdown_detector',
      'Markdown Block Detector',
      'Detects markdown code blocks that may contain JSON'
    );
  }

  shouldApply(context: CleaningContext): boolean {
    return /```/.test(context.currentJson);
  }

  detectIssues(json: string, context: CleaningContext): DetectionResult[] {
    const detections: DetectionResult[] = [];
    
    // Look for markdown code blocks
    const codeBlockPattern = /```(?:json|javascript|js)?\s*([\s\S]*?)```/gi;
    let match;

    while ((match = codeBlockPattern.exec(json)) !== null) {
      detections.push({
        type: 'markdown_code_block',
        location: match.index,
        confidence: 0.95,
        description: 'Markdown code block detected',
        metadata: {
          language: match[0].match(/```(\w+)/)?.[1] || 'unknown',
          content: match[1],
          fullMatch: match[0]
        }
      });
    }

    return detections;
  }
}

// Think Tag Detector
export class ThinkTagDetector extends BaseDetector {
  constructor() {
    super(
      'think_tag_detector',
      'Think Tag Detector',
      'Detects <think> tags that may wrap JSON content'
    );
  }

  shouldApply(context: CleaningContext): boolean {
    return /<think>/i.test(context.currentJson);
  }

  detectIssues(json: string, context: CleaningContext): DetectionResult[] {
    const detections: DetectionResult[] = [];
    
    // Look for think tags
    const thinkTagPattern = /<think>([\s\S]*?)<\/think>/gi;
    let match;

    while ((match = thinkTagPattern.exec(json)) !== null) {
      detections.push({
        type: 'think_tag',
        location: match.index,
        confidence: 0.95,
        description: 'Think tag detected',
        metadata: {
          content: match[1],
          fullMatch: match[0]
        }
      });
    }

    return detections;
  }
}

// Export all detectors for easy use
export const Detectors = {
  controlCharacter: () => new ControlCharacterDetector(),
  missingComma: () => new MissingCommaDetector(),
  structural: () => new StructuralIssueDetector(),
  markdownBlock: () => new MarkdownBlockDetector(),
  thinkTag: () => new ThinkTagDetector()
};
