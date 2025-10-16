/**
 * Specialized utility class for Control-Character diagnosis and repair
 * Can be used separately for debugging and analysis
 */
export class ControlCharDiagnostics {
  
  /**
   * Performs a complete diagnosis of Control Characters
   */
  public static diagnose(jsonStr: string): {
    summary: {
      isValid: boolean;
      hasControlChars: boolean;
      totalIssues: number;
      canBeFixed: boolean;
    };
    issues: Array<{
      position: number;
      char: string;
      charCode: number;
      type: string;
      severity: 'low' | 'medium' | 'high';
      context: string;
      fieldName?: string;
    }>;
    suggestions: string[];
    repairPreview: string;
  } {
    const issues: Array<{
      position: number;
      char: string;
      charCode: number;
      type: string;
      severity: 'low' | 'medium' | 'high';
      context: string;
      fieldName?: string;
    }> = [];
    
    const suggestions: string[] = [];
    
    // Phase 1: Check JSON validity
    let isValid = false;
    try {
      JSON.parse(jsonStr);
      isValid = true;
    } catch (error) {
      // JSON is invalid
    }
    
    // Phase 2: Find Control Characters
    let inString = false;
    let escapeNext = false;
    let currentField = '';
    let fieldStartPos = -1;
    
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];
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
          fieldStartPos = i;
        } else {
          // Check if this was a field name
          if (fieldStartPos >= 0) {
            const potentialField = jsonStr.substring(fieldStartPos + 1, i);
            const nextNonWhitespace = jsonStr.substring(i + 1).match(/^\s*:/);
            if (nextNonWhitespace) {
              currentField = potentialField;
            }
          }
        }
        inString = !inString;
        continue;
      }
      
      // Analyze Control Characters in strings
      if (inString) {
        let issueType = '';
        let severity: 'low' | 'medium' | 'high' = 'low';
        let charDisplay = char;
        
        if (char === '\n') {
          issueType = 'unescaped-newline';
          severity = 'high';
          charDisplay = '\\n';
        } else if (char === '\r') {
          issueType = 'unescaped-carriage-return';
          severity = 'high';
          charDisplay = '\\r';
        } else if (char === '\t') {
          issueType = 'unescaped-tab';
          severity = 'medium';
          charDisplay = '\\t';
        } else if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
          issueType = 'other-control-char';
          severity = 'high';
          charDisplay = `\\u${code.toString(16).padStart(4, '0')}`;
        }
        
        if (issueType) {
          const context = this.extractContext(jsonStr, i, 25);
          issues.push({
            position: i,
            char: charDisplay,
            charCode: code,
            type: issueType,
            severity,
            context,
            fieldName: currentField || undefined
          });
        }
      }
    }
    
    // Phase 3: Generate suggestions
    if (issues.length > 0) {
      const newlineIssues = issues.filter(i => i.type === 'unescaped-newline').length;
      const tabIssues = issues.filter(i => i.type === 'unescaped-tab').length;
      const crIssues = issues.filter(i => i.type === 'unescaped-carriage-return').length;
      const otherIssues = issues.filter(i => i.type === 'other-control-char').length;
      
      if (newlineIssues > 0) {
        suggestions.push(`Replace ${newlineIssues} unescaped newline(s) with \\n`);
      }
      if (tabIssues > 0) {
        suggestions.push(`Replace ${tabIssues} unescaped tab(s) with \\t`);
      }
      if (crIssues > 0) {
        suggestions.push(`Replace ${crIssues} unescaped carriage return(s) with \\r`);
      }
      if (otherIssues > 0) {
        suggestions.push(`Escape or remove ${otherIssues} other control character(s)`);
      }
      
      suggestions.push('Use ControlCharacterCleaner strategy for automatic repair');
    }
    
    // Phase 4: Generate repair preview
    const repairPreview = this.generateRepairPreview(jsonStr, issues);
    
    const canBeFixed = issues.length > 0 && issues.every(i => i.severity !== 'high' || i.type.includes('unescaped'));
    
    return {
      summary: {
        isValid,
        hasControlChars: issues.length > 0,
        totalIssues: issues.length,
        canBeFixed
      },
      issues,
      suggestions,
      repairPreview
    };
  }
  
  /**
   * Repairs Control Characters with detailed logging
   */
  public static repair(jsonStr: string): {
    success: boolean;
    repairedJson: string;
    appliedFixes: Array<{
      position: number;
      original: string;
      replacement: string;
      type: string;
    }>;
    errors?: string[];
  } {
    const appliedFixes: Array<{
      position: number;
      original: string;
      replacement: string;
      type: string;
    }> = [];
    
    const errors: string[] = [];
    
    try {
      let result = '';
      let inString = false;
      let escapeNext = false;
      let positionOffset = 0; // Track position changes due to replacements
      
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
          let replacement = char;
          let fixType = '';
          
          if (char === '\n') {
            replacement = '\\n';
            fixType = 'escape-newline';
            positionOffset += 1;
          } else if (char === '\r') {
            replacement = '\\r';
            fixType = 'escape-carriage-return';
            positionOffset += 1;
          } else if (char === '\t') {
            replacement = '\\t';
            fixType = 'escape-tab';
            positionOffset += 1;
          } else if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
            if (code === 8) {
              replacement = '\\b';
              fixType = 'escape-backspace';
              positionOffset += 1;
            } else if (code === 12) {
              replacement = '\\f';
              fixType = 'escape-form-feed';
              positionOffset += 1;
            } else {
              replacement = `\\u${code.toString(16).padStart(4, '0')}`;
              fixType = 'escape-unicode';
              positionOffset += 5;
            }
          }
          
          if (replacement !== char) {
            appliedFixes.push({
              position: i + positionOffset,
              original: char,
              replacement,
              type: fixType
            });
          }
          
          result += replacement;
        } else {
          result += char;
        }
      }
      
      // Validate the result
      let success = false;
      try {
        JSON.parse(result);
        success = true;
      } catch (error) {
        errors.push(`Repaired JSON is still invalid: ${(error as Error).message}`);
      }
      
      return {
        success,
        repairedJson: result,
        appliedFixes,
        errors: errors.length > 0 ? errors : undefined
      };
      
    } catch (error) {
      errors.push(`Repair failed: ${(error as Error).message}`);
      return {
        success: false,
        repairedJson: jsonStr,
        appliedFixes,
        errors
      };
    }
  }
  
  /**
   * Generates a detailed diagnosis report
   */
  public static generateReport(jsonStr: string): string {
    const diagnosis = this.diagnose(jsonStr);
    const lines: string[] = [];
    
    lines.push('=== CONTROL CHARACTER DIAGNOSIS REPORT ===');
    lines.push(`Timestamp: ${new Date().toISOString()}`);
    lines.push(`JSON Length: ${jsonStr.length} characters`);
    lines.push('');
    
    // Summary
    lines.push('=== SUMMARY ===');
    lines.push(`JSON Valid: ${diagnosis.summary.isValid ? 'YES' : 'NO'}`);
    lines.push(`Has Control Characters: ${diagnosis.summary.hasControlChars ? 'YES' : 'NO'}`);
    lines.push(`Total Issues: ${diagnosis.summary.totalIssues}`);
    lines.push(`Can Be Fixed: ${diagnosis.summary.canBeFixed ? 'YES' : 'NO'}`);
    lines.push('');
    
    // Issues
    if (diagnosis.issues.length > 0) {
      lines.push('=== DETECTED ISSUES ===');
      diagnosis.issues.forEach((issue, index) => {
        lines.push(`${index + 1}. Position ${issue.position}: ${issue.char} (code ${issue.charCode})`);
        lines.push(`   Type: ${issue.type}`);
        lines.push(`   Severity: ${issue.severity}`);
        if (issue.fieldName) {
          lines.push(`   Field: "${issue.fieldName}"`);
        }
        lines.push(`   Context: ${issue.context}`);
        lines.push('');
      });
    }
    
    // Suggestions
    if (diagnosis.suggestions.length > 0) {
      lines.push('=== SUGGESTIONS ===');
      diagnosis.suggestions.forEach((suggestion, index) => {
        lines.push(`${index + 1}. ${suggestion}`);
      });
      lines.push('');
    }
    
    // Repair Preview
    if (diagnosis.repairPreview !== jsonStr) {
      lines.push('=== REPAIR PREVIEW ===');
      lines.push('First 500 characters of repaired JSON:');
      lines.push(diagnosis.repairPreview.substring(0, 500));
      if (diagnosis.repairPreview.length > 500) {
        lines.push('...');
      }
    }
    
    return lines.join('\n');
  }
  
  /**
   * Quick fix for common cases
   */
  public static quickFix(jsonStr: string): string {
    // Simple regex-based repair for most common cases
    return jsonStr.replace(/(\"([^\"]+)\"\s*:\s*\")([\ \S]*?)(\"(?=\s*[,}]))/g, (match, prefix, fieldName, content, suffix) => {
      const cleanedContent = content
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      
      return prefix + cleanedContent + suffix;
    });
  }
  
  /**
   * Extracts context around a position
   */
  private static extractContext(str: string, pos: number, radius: number): string {
    const start = Math.max(0, pos - radius);
    const end = Math.min(str.length, pos + radius);
    const context = str.substring(start, end);
    
    // Format Control Characters for better readability
    const before = context.substring(0, pos - start);
    const char = context.substring(pos - start, pos - start + 1);
    const after = context.substring(pos - start + 1);
    
    const formattedBefore = before.replace(/\n/g, '↵').replace(/\r/g, '⏎').replace(/\t/g, '→');
    const formattedChar = char.replace(/\n/g, '↵').replace(/\r/g, '⏎').replace(/\t/g, '→');
    const formattedAfter = after.replace(/\n/g, '↵').replace(/\r/g, '⏎').replace(/\t/g, '→');
    
    return `${formattedBefore}【${formattedChar}】${formattedAfter}`;
  }
  
  /**
   * Generates a repair preview
   */
  private static generateRepairPreview(jsonStr: string, issues: any[]): string {
    if (issues.length === 0) {
      return jsonStr;
    }
    
    // Simple repair for preview
    return this.quickFix(jsonStr);
  }
}
