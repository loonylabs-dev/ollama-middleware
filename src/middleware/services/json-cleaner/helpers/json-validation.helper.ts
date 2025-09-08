/**
 * Central class for JSON validation with extended debug functions
 * Replaces all distributed isValidJson() implementations in the code
 */
export class JsonValidationHelper {
  
  // Debug mode can be activated via environment variable
  private static readonly DEBUG_MODE = process.env.JSON_VALIDATION_DEBUG === 'true' || 
                                       process.env.NODE_ENV === 'development';
  
  // Statistics for monitoring
  private static stats = {
    totalValidations: 0,
    successfulValidations: 0,
    failedValidations: 0,
    commonErrors: new Map<string, number>()
  };

  /**
   * MAIN METHOD: Validates JSON with extended debug functions
   * Replaces all isValidJson() calls in the code
   */
  public static isValid(jsonStr: string, context?: string): boolean {
    this.stats.totalValidations++;
    
    if (this.DEBUG_MODE && context) {
      console.log(`\n🔍 [JsonValidation] Validating in context: ${context}`);
    }

    // Step 1: Basic validation
    if (!jsonStr || typeof jsonStr !== 'string') {
      this.logValidationResult(false, 'Empty or non-string input', context);
      return false;
    }

    // Step 2: String analysis before parsing
    const analysis = this.analyzeJsonString(jsonStr, context);
    
    // Step 3: JSON.parse() with detailed error handling
    try {
      const parsed = JSON.parse(jsonStr);
      
      // Step 4: Additional validation of the parsed object
      const isValidObject = this.validateParsedObject(parsed, context);
      
      if (isValidObject) {
        this.stats.successfulValidations++;
        this.logValidationResult(true, 'Valid JSON', context, analysis);
        return true;
      } else {
        this.stats.failedValidations++;
        this.logValidationResult(false, 'Parsed but invalid object structure', context, analysis);
        return false;
      }
      
    } catch (error) {
      this.stats.failedValidations++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.trackCommonError(errorMsg);
      this.logValidationResult(false, errorMsg, context, analysis, error as Error);
      return false;
    }
  }

  /**
   * Extended string analysis before parsing
   */
  private static analyzeJsonString(jsonStr: string, context?: string): {
    length: number;
    firstChar: string;
    lastChar: string;
    hasControlChars: boolean;
    hasBOM: boolean;
    encoding: string;
    suspiciousPositions: number[];
  } {
    const analysis = {
      length: jsonStr.length,
      firstChar: jsonStr.charAt(0),
      lastChar: jsonStr.charAt(jsonStr.length - 1),
      hasControlChars: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(jsonStr),
      hasBOM: jsonStr.charCodeAt(0) === 0xFEFF,
      encoding: this.detectStringEncoding(jsonStr),
      suspiciousPositions: this.findSuspiciousPositions(jsonStr)
    };

    if (this.DEBUG_MODE && (analysis.hasControlChars || analysis.hasBOM || analysis.suspiciousPositions.length > 0)) {
      console.log(`🚨 [JsonValidation] Suspicious string analysis:`, {
        context,
        hasControlChars: analysis.hasControlChars,
        hasBOM: analysis.hasBOM,
        suspiciousPositions: analysis.suspiciousPositions,
        firstChar: JSON.stringify(analysis.firstChar),
        lastChar: JSON.stringify(analysis.lastChar)
      });
    }

    return analysis;
  }

  /**
   * Detailed error logging with context information
   */
  private static logValidationResult(
    isValid: boolean, 
    message: string, 
    context?: string,
    analysis?: any,
    error?: Error
  ): void {
    const logData = {
      context: context || 'unknown',
      isValid,
      message,
      stats: this.stats
    };

    if (isValid) {
      if (this.DEBUG_MODE) {
        console.log(`✅ [JsonValidation] Success in ${context}: ${message}`);
      }
      console.debug('JSON validation successful', logData);
    } else {
      console.log(`❌ [JsonValidation] Failed in ${context}: ${message}`);
      
      if (this.DEBUG_MODE && error && analysis) {
        this.logDetailedError(error, analysis, context);
      }
      
      console.warn('JSON validation failed', {
        ...logData
      });
    }
  }

  /**
   * Detailed error logging with position and context
   */
  private static logDetailedError(error: Error, analysis: any, context?: string): void {
    console.log(`\n🔬 [JsonValidation] Detailed Error Analysis for ${context}:`);
    console.log('├─ Error Message:', error.message);
    console.log('├─ String Length:', analysis.length);
    console.log('├─ First Char:', JSON.stringify(analysis.firstChar), `(code: ${analysis.firstChar.charCodeAt(0)})`);
    console.log('├─ Last Char:', JSON.stringify(analysis.lastChar), `(code: ${analysis.lastChar.charCodeAt(0)})`);
    console.log('├─ Has BOM:', analysis.hasBOM);
    console.log('├─ Has Control Chars:', analysis.hasControlChars);
    console.log('├─ Encoding:', analysis.encoding);
    
    // Position-specific analysis
    const positionMatch = error.message.match(/position (\d+)/);
    if (positionMatch) {
      const errorPos = parseInt(positionMatch[1], 10);
      this.logPositionContext(errorPos, analysis, context);
    }
    
    console.log('└─ Suspicious Positions:', analysis.suspiciousPositions);
  }

  /**
   * Analyze context around an error position
   */
  private static logPositionContext(position: number, analysis: any, context?: string): void {
    // This method needs access to the original string
    // We'll extend the signature later if needed
    console.log('├─ Error Position:', position);
    console.log('├─ Context needed: Original string not available in analysis');
  }

  /**
   * Extended context logging method (when original string is available)
   */
  public static logPositionContextWithString(position: number, jsonStr: string, context?: string): void {
    const contextSize = 20;
    const start = Math.max(0, position - contextSize);
    const end = Math.min(jsonStr.length, position + contextSize);
    
    const beforeError = jsonStr.substring(start, position);
    const errorChar = jsonStr.charAt(position);
    const afterError = jsonStr.substring(position + 1, end);
    
    console.log(`🎯 [JsonValidation] Position ${position} Context in ${context}:`);
    console.log('├─ Before:', JSON.stringify(beforeError));
    console.log('├─ Error Char:', JSON.stringify(errorChar), `(code: ${errorChar.charCodeAt(0)})`);
    console.log('├─ After:', JSON.stringify(afterError));
    console.log('└─ Full Context:', JSON.stringify(beforeError + '【' + errorChar + '】' + afterError));
  }

  /**
   * Detects string encoding problems
   */
  private static detectStringEncoding(jsonStr: string): string {
    // BOM Detection
    if (jsonStr.charCodeAt(0) === 0xFEFF) return 'UTF-8 with BOM';
    if (jsonStr.charCodeAt(0) === 0xFFFE) return 'UTF-16 LE';
    if (jsonStr.charCodeAt(0) === 0x0000 && jsonStr.charCodeAt(1) === 0xFEFF) return 'UTF-32 BE';
    
    // High-bit character detection
    for (let i = 0; i < Math.min(jsonStr.length, 100); i++) {
      const code = jsonStr.charCodeAt(i);
      if (code > 127 && code < 160) return 'Possible Latin-1/ISO-8859-1';
      if (code > 255) return 'Unicode/UTF-8';
    }
    
    return 'ASCII/UTF-8';
  }

  /**
   * Finds suspicious positions in the string
   */
  private static findSuspiciousPositions(jsonStr: string): number[] {
    const suspicious: number[] = [];
    
    for (let i = 0; i < jsonStr.length; i++) {
      const code = jsonStr.charCodeAt(i);
      
      // Control characters (except allowed ones like \n, \r, \t)
      if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
        suspicious.push(i);
      }
      
      // Non-printable high characters
      if (code > 127 && code < 160) {
        suspicious.push(i);
      }
      
      // BOM in the middle of the string
      if (code === 0xFEFF && i > 0) {
        suspicious.push(i);
      }
    }
    
    return suspicious;
  }

  /**
   * Validates the parsed object
   */
  private static validateParsedObject(parsed: any, context?: string): boolean {
    // Basic validation
    if (parsed === null || parsed === undefined) {
      if (this.DEBUG_MODE) {
        console.log(`⚠️ [JsonValidation] Parsed object is null/undefined in ${context}`);
      }
      return false;
    }

    // For our application, we should mainly expect Objects or Arrays
    if (typeof parsed !== 'object') {
      if (this.DEBUG_MODE) {
        console.log(`⚠️ [JsonValidation] Parsed result is primitive (${typeof parsed}) in ${context}`);
      }
      // Primitive values are technically valid JSON, but might not be what we expect
      return true; // But still consider as valid
    }

    return true;
  }

  /**
   * Tracks common error patterns for analysis
   */
  private static trackCommonError(errorMessage: string): void {
    // Normalize Error Messages for better grouping
    const normalizedError = errorMessage
      .replace(/position \d+/, 'position X')
      .replace(/line \d+/, 'line X')
      .replace(/column \d+/, 'column X');
    
    const currentCount = this.stats.commonErrors.get(normalizedError) || 0;
    this.stats.commonErrors.set(normalizedError, currentCount + 1);
  }

  /**
   * Cleans a string from common problems before validation
   */
  public static sanitizeBeforeValidation(jsonStr: string): string {
    let sanitized = jsonStr;
    
    // Remove BOM
    if (sanitized.charCodeAt(0) === 0xFEFF) {
      sanitized = sanitized.slice(1);
      if (this.DEBUG_MODE) {
        console.log('🧹 [JsonValidation] Removed UTF-8 BOM');
      }
    }
    
    // Trailing/Leading Whitespace
    const trimmed = sanitized.trim();
    if (trimmed !== sanitized) {
      sanitized = trimmed;
      if (this.DEBUG_MODE) {
        console.log('🧹 [JsonValidation] Trimmed whitespace');
      }
    }
    
    // Control Characters in Strings (very carefully!)
    // This is dangerous and should only be done for obvious problems
    
    return sanitized;
  }

  /**
   * Extended validation with automatic sanitization
   */
  public static isValidWithSanitization(jsonStr: string, context?: string): {
    isValid: boolean;
    sanitized: string;
    sanitizationApplied: boolean;
  } {
    const original = jsonStr;
    const sanitized = this.sanitizeBeforeValidation(jsonStr);
    const sanitizationApplied = original !== sanitized;
    
    const isValid = this.isValid(sanitized, context);
    
    return {
      isValid,
      sanitized,
      sanitizationApplied
    };
  }

  /**
   * Returns validation statistics
   */
  public static getStats(): {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    commonErrors: Array<{error: string, count: number}>;
  } {
    const successRate = this.stats.totalValidations > 0 
      ? (this.stats.successfulValidations / this.stats.totalValidations) * 100 
      : 0;
    
    const commonErrors = Array.from(this.stats.commonErrors.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
    
    return {
      total: this.stats.totalValidations,
      successful: this.stats.successfulValidations,
      failed: this.stats.failedValidations,
      successRate: Math.round(successRate * 100) / 100,
      commonErrors
    };
  }

  /**
   * Reset statistics (for tests or restart)
   */
  public static resetStats(): void {
    this.stats.totalValidations = 0;
    this.stats.successfulValidations = 0;
    this.stats.failedValidations = 0;
    this.stats.commonErrors.clear();
  }

  /**
   * Debug helper method: Complete analysis of a JSON string
   */
  public static debugAnalyze(jsonStr: string, context?: string): void {
    console.log(`\n🔬 [JsonValidation] FULL DEBUG ANALYSIS for ${context}:`);
    console.log('═'.repeat(60));
    
    const analysis = this.analyzeJsonString(jsonStr, context);
    
    console.log('📊 Basic Info:');
    console.log('├─ Length:', analysis.length);
    console.log('├─ First 50 chars:', JSON.stringify(jsonStr.substring(0, 50)));
    console.log('├─ Last 50 chars:', JSON.stringify(jsonStr.substring(Math.max(0, jsonStr.length - 50))));
    console.log('├─ Has BOM:', analysis.hasBOM);
    console.log('├─ Has Control Chars:', analysis.hasControlChars);
    console.log('└─ Detected Encoding:', analysis.encoding);
    
    if (analysis.suspiciousPositions.length > 0) {
      console.log('\n🚨 Suspicious Positions:');
      analysis.suspiciousPositions.slice(0, 5).forEach(pos => {
        const char = jsonStr.charAt(pos);
        const code = jsonStr.charCodeAt(pos);
        console.log(`├─ Position ${pos}: ${JSON.stringify(char)} (code: ${code})`);
      });
    }
    
    console.log('\n🧪 Validation Test:');
    const isValid = this.isValid(jsonStr, context);
    console.log('└─ Result:', isValid ? '✅ VALID' : '❌ INVALID');
    
    console.log('═'.repeat(60));
  }
}