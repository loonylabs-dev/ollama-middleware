/**
 * Specialized class for analyzing JSON problems
 * Detects specific error types and suggests solution strategies
 */
export class JsonCleanerAnalyzer {
  
  /**
   * Extended JSON problem analysis with specific solution suggestions
   */
  public static analyzeJsonProblems(jsonStr: string): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
    canBeFixed: boolean;
    severity: 'low' | 'medium' | 'high';
    specificIssues: {
      hasCommaIssues: boolean;
      hasControlCharIssues: boolean;
      hasBracketIssues: boolean;
      hasQuoteIssues: boolean;
    };
    repairStrategy: string[];
    errorPosition?: number;
    problemContext?: string;
  } {
    let isValid = false;
    const errors: string[] = [];
    const suggestions: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';
    const repairStrategy: string[] = [];
    let errorPosition: number | undefined;
    let problemContext: string | undefined;
    
    const specificIssues = {
      hasCommaIssues: false,
      hasControlCharIssues: false,
      hasBracketIssues: false,
      hasQuoteIssues: false
    };
    
    // Test JSON validity and analyze errors
    try {
      JSON.parse(jsonStr);
      isValid = true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`JSON Parse Error: ${errorMsg}`);
      
      // Extract error position
      const posMatch = errorMsg.match(/position (\d+)/);
      if (posMatch) {
        errorPosition = parseInt(posMatch[1], 10);
        problemContext = this.extractErrorContext(jsonStr, errorPosition);
      }
      
      // Detailed error analysis
      if (errorMsg.includes('Expected') && errorMsg.includes('comma')) {
        specificIssues.hasCommaIssues = true;
        errors.push('Missing comma between JSON properties');
        suggestions.push('Use CommaFixerCleaner to add missing commas');
        repairStrategy.push('comma-fixer');
        severity = 'medium';
      }
      
      if (errorMsg.includes('control character')) {
        specificIssues.hasControlCharIssues = true;
        errors.push('Invalid control characters in JSON strings');
        suggestions.push('Use ControlCharacterCleaner to escape control characters');
        repairStrategy.push('control-character-cleaner');
        severity = 'high';
      }
      
      if (errorMsg.includes('Expected') && (errorMsg.includes('}') || errorMsg.includes(']'))) {
        specificIssues.hasBracketIssues = true;
        errors.push('Missing closing brackets');
        suggestions.push('Check for unbalanced brackets and quote marks');
        repairStrategy.push('bracket-balancer');
        severity = 'high';
      }
      
      if (errorMsg.includes('Unexpected string') || errorMsg.includes('quote')) {
        specificIssues.hasQuoteIssues = true;
        errors.push('Unescaped quotes in JSON strings');
        suggestions.push('Use StringEscaperCleaner to escape quotes properly');
        repairStrategy.push('string-escaper');
        severity = severity === 'high' ? 'high' : 'medium';
      }
    }
    
    // Structural analysis (also for valid JSON)
    const structuralAnalysis = this.analyzeStructuralIssues(jsonStr);
    
    // Merge structural problems
    if (structuralAnalysis.hasCommaIssues) {
      specificIssues.hasCommaIssues = true;
      errors.push(...structuralAnalysis.commaErrors);
      suggestions.push(...structuralAnalysis.commaSuggestions);
      repairStrategy.push('comma-fixer');
      severity = severity === 'high' ? 'high' : 'medium';
    }
    
    if (structuralAnalysis.hasBracketIssues) {
      specificIssues.hasBracketIssues = true;
      errors.push(...structuralAnalysis.bracketErrors);
      suggestions.push(...structuralAnalysis.bracketSuggestions);
      repairStrategy.push('bracket-balancer');
      severity = 'high';
    }
    
    // Determine if repairable
    const canBeFixed = errors.length > 0 && severity !== 'high' && 
                      !errors.some(e => e.includes('unexpected end') || e.includes('malformed'));
    
    // Remove duplicates from repairStrategy
    const uniqueStrategy = [...new Set(repairStrategy)];
    
    return {
      isValid,
      errors,
      suggestions,
      canBeFixed,
      severity,
      specificIssues,
      repairStrategy: uniqueStrategy,
      errorPosition,
      problemContext
    };
  }

  /**
   * Analyzes structural problems in JSON
   */
  private static analyzeStructuralIssues(jsonStr: string): {
    hasCommaIssues: boolean;
    hasBracketIssues: boolean;
    commaErrors: string[];
    bracketErrors: string[];
    commaSuggestions: string[];
    bracketSuggestions: string[];
  } {
    const commaErrors: string[] = [];
    const bracketErrors: string[] = [];
    const commaSuggestions: string[] = [];
    const bracketSuggestions: string[] = [];
    
    // Check for comma problems
    if (jsonStr.match(/\]\s*"/g)) {
      commaErrors.push('Array followed by property without comma');
      commaSuggestions.push('Add comma after array before next property');
    }
    
    if (jsonStr.match(/\}\s*"/g)) {
      commaErrors.push('Object followed by property without comma');
      commaSuggestions.push('Add comma after object before next property');
    }
    
    if (jsonStr.match(/"\s{2,}"/g)) {
      commaErrors.push('String followed by property without comma (significant whitespace)');
      commaSuggestions.push('Add comma after string value before next property');
    }
    
    if (jsonStr.match(/([0-9]+|true|false|null)\s+"[\w_]+"\s*:/g)) {
      commaErrors.push('Primitive value followed by property without comma');
      commaSuggestions.push('Add comma after primitive value before next property');
    }
    
    // Check for bracket problems
    const openBrackets = (jsonStr.match(/\{/g) || []).length;
    const closeBrackets = (jsonStr.match(/\}/g) || []).length;
    const openSquare = (jsonStr.match(/\[/g) || []).length;
    const closeSquare = (jsonStr.match(/\]/g) || []).length;
    
    if (openBrackets !== closeBrackets) {
      bracketErrors.push(`Unbalanced curly brackets: ${openBrackets} open, ${closeBrackets} close`);
      bracketSuggestions.push('Balance opening and closing curly brackets');
    }
    
    if (openSquare !== closeSquare) {
      bracketErrors.push(`Unbalanced square brackets: ${openSquare} open, ${closeSquare} close`);
      bracketSuggestions.push('Balance opening and closing square brackets');
    }
    
    // Check for mixed brackets
    if (jsonStr.match(/\}\]/g) || jsonStr.match(/\]\}/g)) {
      bracketErrors.push('Mixed closing brackets detected');
      bracketSuggestions.push('Fix mixed closing bracket types');
    }
    
    return {
      hasCommaIssues: commaErrors.length > 0,
      hasBracketIssues: bracketErrors.length > 0,
      commaErrors,
      bracketErrors,
      commaSuggestions,
      bracketSuggestions
    };
  }

  /**
   * Extracts context around an error position
   */
  private static extractErrorContext(jsonStr: string, errorPos: number): string {
    const contextSize = 50;
    const start = Math.max(0, errorPos - contextSize);
    const end = Math.min(jsonStr.length, errorPos + contextSize);
    
    const beforeError = jsonStr.substring(start, errorPos);
    const errorChar = jsonStr.charAt(errorPos);
    const afterError = jsonStr.substring(errorPos + 1, end);
    
    // Format for better readability
    const formattedBefore = beforeError.replace(/\n/g, '↵').replace(/\r/g, '⏎').replace(/\t/g, '→');
    const formattedAfter = afterError.replace(/\n/g, '↵').replace(/\r/g, '⏎').replace(/\t/g, '→');
    
    return `...${formattedBefore}【${errorChar}】${formattedAfter}...`;
  }

  /**
   * Counts different types of problems
   */
  public static getIssueCounts(jsonStr: string): {
    totalIssues: number;
    commaIssues: number;
    bracketIssues: number;
    quoteIssues: number;
    controlCharIssues: number;
  } {
    let commaIssues = 0;
    let bracketIssues = 0;
    let quoteIssues = 0;
    let controlCharIssues = 0;
    
    // Count comma problems
    commaIssues += (jsonStr.match(/\]\s*"/g) || []).length;
    commaIssues += (jsonStr.match(/\}\s*"/g) || []).length;
    commaIssues += (jsonStr.match(/"\s{2,}"/g) || []).length;
    
    // Count bracket problems
    const openBrackets = (jsonStr.match(/\{/g) || []).length;
    const closeBrackets = (jsonStr.match(/\}/g) || []).length;
    const openSquare = (jsonStr.match(/\[/g) || []).length;
    const closeSquare = (jsonStr.match(/\]/g) || []).length;
    
    if (openBrackets !== closeBrackets) bracketIssues++;
    if (openSquare !== closeSquare) bracketIssues++;
    bracketIssues += (jsonStr.match(/\}\]/g) || []).length;
    bracketIssues += (jsonStr.match(/\]\}/g) || []).length;
    
    // Count Control Character problems
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (inString) {
        const code = char.charCodeAt(0);
        if (code < 32 || char === '\n' || char === '\r' || char === '\t') {
          controlCharIssues++;
        }
      }
    }
    
    // Count quote problems (simplified)
    const unescapedQuotes = (jsonStr.match(/(?<!\\)"/g) || []).length;
    const expectedQuotes = this.countExpectedQuotes(jsonStr);
    if (unescapedQuotes % 2 !== 0) {
      quoteIssues++;
    }
    
    const totalIssues = commaIssues + bracketIssues + quoteIssues + controlCharIssues;
    
    return {
      totalIssues,
      commaIssues,
      bracketIssues,
      quoteIssues,
      controlCharIssues
    };
  }

  /**
   * Helper method: Counts expected quotes (simplified)
   */
  private static countExpectedQuotes(jsonStr: string): number {
    // Simplified heuristic: Number of property names and string values
    const propertyMatches = (jsonStr.match(/"[^"]+"\s*:/g) || []).length;
    const stringValueMatches = (jsonStr.match(/:\s*"[^"]*"/g) || []).length;
    
    return (propertyMatches + stringValueMatches) * 2; // Each string needs 2 quotes
  }

  /**
   * Prioritizes repair strategies based on analysis
   */
  public static prioritizeRepairStrategies(analysis: ReturnType<typeof JsonCleanerAnalyzer.analyzeJsonProblems>): string[] {
    const prioritized: string[] = [];
    
    // Highest priority: Comma problems (usually solve the main problem)
    if (analysis.specificIssues.hasCommaIssues) {
      prioritized.push('comma-fixer');
    }
    
    // Second priority: Control Characters (prevent parsing)
    if (analysis.specificIssues.hasControlCharIssues) {
      prioritized.push('control-character-cleaner');
    }
    
    // Third priority: Quote problems
    if (analysis.specificIssues.hasQuoteIssues) {
      prioritized.push('string-escaper');
    }
    
    // Lowest priority: Bracket problems (usually more serious)
    if (analysis.specificIssues.hasBracketIssues) {
      prioritized.push('bracket-balancer');
    }
    
    // Fallback: Aggressive Cleaner
    if (analysis.severity === 'high') {
      prioritized.push('aggressive-cleaner');
    }
    
    return prioritized;
  }
}