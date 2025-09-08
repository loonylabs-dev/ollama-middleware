/**
 * Helper methods for analyzing and inspecting JSON strings
 * Useful for debugging and error analysis
 */
export class JsonInspector {
  
  /**
   * Inspects a JSON string and highlights suspicious areas
   * @param jsonStr The JSON string to inspect
   * @returns A diagnostic report about problems in the JSON
   */
  public static inspectJsonForIssues(jsonStr: string): string {
    const issues: string[] = [];
    
    // 1. Search for unescaped line breaks in strings
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr.charAt(i);
      
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
      
      // Search for problematic characters in strings
      if (inString) {
        if (char === '\n') {
          issues.push(`Unescaped newline in string at position ${i}`);
          // Show context
          const start = Math.max(0, i - 20);
          const end = Math.min(jsonStr.length, i + 20);
          issues.push(`Context: ${this.formatContextString(jsonStr.substring(start, end), i - start)}`);
        } else if (char === '\r') {
          issues.push(`Unescaped carriage return in string at position ${i}`);
          // Show context
          const start = Math.max(0, i - 20);
          const end = Math.min(jsonStr.length, i + 20);
          issues.push(`Context: ${this.formatContextString(jsonStr.substring(start, end), i - start)}`);
        } else if (char === '\t') {
          issues.push(`Unescaped tab in string at position ${i}`);
          // Show context
          const start = Math.max(0, i - 20);
          const end = Math.min(jsonStr.length, i + 20);
          issues.push(`Context: ${this.formatContextString(jsonStr.substring(start, end), i - start)}`);
        } else if (char.charCodeAt(0) < 32) {
          issues.push(`Control character (charCode ${char.charCodeAt(0)}) in string at position ${i}`);
          // Show context
          const start = Math.max(0, i - 20);
          const end = Math.min(jsonStr.length, i + 20);
          issues.push(`Context: ${this.formatContextString(jsonStr.substring(start, end), i - start)}`);
        }
      }
    }
    
    // 2. Search for missing commas between properties
    const propPattern = /"[^"]+"\s*:\s*(?:"[^"]*"|\{[^}]*\}|\[[^\]]*\]|[^,{}\[\]]+)(?=\s*")/g;
    let propMatch;
    while ((propMatch = propPattern.exec(jsonStr)) !== null) {
      issues.push(`Possible missing comma at position ${propMatch.index + propMatch[0].length}`);
      // Show context
      const start = Math.max(0, propMatch.index);
      const end = Math.min(jsonStr.length, propMatch.index + propMatch[0].length + 20);
      issues.push(`Context: ${jsonStr.substring(start, end)}`);
    }
    
    // 3. Test JSON parsing and show any errors
    try {
      JSON.parse(jsonStr);
      issues.push("JSON is valid according to JSON.parse()");
    } catch (error) {
      issues.push(`JSON Parse Error: ${error instanceof Error ? error.message : String(error)}`);
      
      // Try to extract error position
      const errorMessage = error instanceof Error ? error.message : String(error);
      const positionMatch = errorMessage.match(/position (\d+)/);
      if (positionMatch && positionMatch[1]) {
        const errorPos = parseInt(positionMatch[1]);
        issues.push(`Error position: ${errorPos}`);
        
        // Show context around error position
        const start = Math.max(0, errorPos - 50);
        const end = Math.min(jsonStr.length, errorPos + 50);
        issues.push(`Error context: ${this.formatContextString(jsonStr.substring(start, end), errorPos - start)}`);
        
        // Show the character at error position
        issues.push(`Character at error position: '${jsonStr.charAt(errorPos)}' (charCode: ${jsonStr.charCodeAt(errorPos)})`);
      }
    }
    
    return issues.join('\n');
  }

  /**
   * Formats a context string with highlighting of the change position
   * @param str The string to format
   * @param highlightPos The position to highlight in the string
   * @returns The formatted string with highlighting
   */
  public static formatContextString(str: string, highlightPos: number): string {
    // For readability, we replace some Control Characters
    const readable = str
      .replace(/\n/g, '↵')
      .replace(/\r/g, '⏎')
      .replace(/\t/g, '→');
      
    return readable.substring(0, highlightPos) + 
           '【' + readable.charAt(highlightPos) + '】' + 
           readable.substring(highlightPos + 1);
  }

  /**
   * Highlights differences between two strings
   * @param input The original string
   * @param output The modified string
   * @returns A description of the differences
   */
  public static highlightDifferences(input: string, output: string): string {
    if (input === output) return "[NO CHANGES]";
    
    // Find the first different position
    let firstDiffPos = 0;
    const minLength = Math.min(input.length, output.length);
    
    while (firstDiffPos < minLength && input[firstDiffPos] === output[firstDiffPos]) {
      firstDiffPos++;
    }
    
    // Show context around the first change
    const startPos = Math.max(0, firstDiffPos - 50);
    const inputContext = input.substring(startPos, firstDiffPos + 100);
    const outputContext = output.substring(startPos, firstDiffPos + 100);
    
    return `Difference starts at position ${firstDiffPos}:\n` +
           `INPUT (context):  ${this.formatContextString(inputContext, firstDiffPos - startPos)}\n` +
           `OUTPUT (context): ${this.formatContextString(outputContext, firstDiffPos - startPos)}`;
  }
}