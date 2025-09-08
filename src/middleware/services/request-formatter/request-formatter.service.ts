/**
 * Service for formatting and validating requests to AI models
 * Handles various prompt formats and provides utilities for request processing
 */
export class RequestFormatterService {
  
  /**
   * Format user message based on the prompt type and use case template
   * @param prompt The prompt (string or object)
   * @param templateFunction The template function specific to the use case
   * @param useCaseName Name of the use case for debugging
   * @returns Formatted user message
   */
  public static formatUserMessage(
    prompt: any,
    templateFunction: (formattedPrompt: string) => string,
    useCaseName: string
  ): string {
    // Check if it's the old string format
    if (typeof prompt === 'string') {
      // Old format - directly process with the template function
      return templateFunction(prompt);
    }
    
    // For objects: Extract text content and format it
    const formattedPrompt = this.extractTextFromObject(prompt, useCaseName);
    
    // Apply the template function
    return templateFunction(formattedPrompt);
  }

  /**
   * Extract text content from various object structures
   * @param obj The object to extract text from
   * @param context Context for debugging
   * @returns Extracted text content
   */
  private static extractTextFromObject(obj: any, context: string): string {
    if (typeof obj === 'string') return obj;
    if (!obj || typeof obj !== 'object') return '';
    
    // Common text fields to check
    const textFields = [
      'text', 'content', 'message', 'prompt', 'instruction', 
      'userInstruction', 'query', 'input', 'description'
    ];
    
    // Try to find text in common fields
    for (const field of textFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        return obj[field];
      }
    }
    
    // If nested object, try to extract from nested structure
    if (obj.prompt && typeof obj.prompt === 'object') {
      return this.extractTextFromObject(obj.prompt, context);
    }
    
    // Fallback: join all string values
    const stringValues = Object.values(obj)
      .filter(value => typeof value === 'string' && value.trim().length > 0)
      .join(' ');
    
    return stringValues || '';
  }

  /**
   * Validate that a prompt is not empty
   * @param prompt The prompt to validate
   * @returns True if prompt is valid
   */
  public static isValidPrompt(prompt: any): boolean {
    if (!prompt) return false;
    
    if (typeof prompt === 'string') {
      return prompt.trim().length > 0;
    }
    
    if (typeof prompt === 'object') {
      // Check if the object has meaningful content
      return Object.keys(prompt).some(key => {
        const value = prompt[key];
        if (typeof value === 'string') return value.trim().length > 0;
        if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
        return false;
      });
    }
    
    return false;
  }

  /**
   * Extract context information from various prompt formats
   * @param prompt The prompt to extract from
   * @returns Extracted context or null
   */
  public static extractContext(prompt: any): any | null {
    if (typeof prompt !== 'object') return null;
    
    // Check for common context fields
    const contextFields = ['context', 'bookContext', 'sessionContext', 'metadata'];
    
    for (const field of contextFields) {
      if (prompt[field]) {
        return prompt[field];
      }
    }
    
    // Check for nested prompt structure
    if (prompt.prompt && typeof prompt.prompt === 'object') {
      return this.extractContext(prompt.prompt);
    }
    
    return null;
  }

  /**
   * Extract user instruction from various prompt formats
   * @param prompt The prompt to extract from
   * @returns Extracted user instruction or empty string
   */
  public static extractUserInstruction(prompt: any): string {
    if (typeof prompt === 'string') return prompt;
    if (typeof prompt !== 'object') return '';
    
    // Check for nested prompt structure
    if (prompt.prompt?.userInstruction) {
      return prompt.prompt.userInstruction;
    }
    
    // Check for direct userInstruction
    if (prompt.userInstruction) {
      return prompt.userInstruction;
    }
    
    // Fallback to general text extraction
    return this.extractTextFromObject(prompt, 'userInstruction');
  }

  /**
   * Create a structured prompt object from simple inputs
   * @param instruction The main instruction text
   * @param context Optional context information
   * @returns Structured prompt object
   */
  public static createStructuredPrompt(instruction: string, context?: any): object {
    const prompt: any = {
      userInstruction: instruction
    };

    if (context) {
      prompt.context = context;
    }

    return prompt;
  }

  /**
   * Merge multiple prompt components into a single formatted prompt
   * @param components Array of prompt components
   * @returns Merged prompt string
   */
  public static mergePromptComponents(components: Array<string | object>): string {
    const textParts: string[] = [];

    for (const component of components) {
      if (typeof component === 'string' && component.trim()) {
        textParts.push(component.trim());
      } else if (typeof component === 'object') {
        const extracted = this.extractTextFromObject(component, 'merge');
        if (extracted.trim()) {
          textParts.push(extracted.trim());
        }
      }
    }

    return textParts.join('\n\n');
  }

  /**
   * Sanitize prompt content to remove potentially problematic characters
   * @param prompt The prompt to sanitize
   * @returns Sanitized prompt
   */
  public static sanitizePrompt(prompt: string): string {
    return prompt
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')   // Normalize line endings
      .trim();
  }

  /**
   * Get statistics about a prompt
   * @param prompt The prompt to analyze
   * @returns Prompt statistics
   */
  public static getPromptStats(prompt: any): {
    type: 'string' | 'object' | 'unknown';
    charCount: number;
    wordCount: number;
    hasContext: boolean;
    isValid: boolean;
  } {
    const type = typeof prompt === 'string' ? 'string' : 
                 typeof prompt === 'object' ? 'object' : 'unknown';
    
    const text = type === 'string' ? prompt : this.extractTextFromObject(prompt, 'stats');
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const hasContext = type === 'object' && this.extractContext(prompt) !== null;
    const isValid = this.isValidPrompt(prompt);

    return {
      type,
      charCount,
      wordCount,
      hasContext,
      isValid
    };
  }
}