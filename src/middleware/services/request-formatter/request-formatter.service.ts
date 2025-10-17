import { FlatFormatter } from '../flat-formatter';

/**
 * Generic RequestFormatterService for handling complex prompt objects.
 * - Removes domain-specific dependencies (no book-specific fields)
 * - Supports flexible extraction and formatting of nested request structures
 */
export class RequestFormatterService {
  /**
   * Format user message based on the prompt type and use case template.
   * Handles strings directly and formats objects into structured sections.
   */
  public static formatUserMessage(
    prompt: any,
    templateFunction: (formattedPrompt: string) => string,
    useCaseName: string
  ): string {
    if (typeof prompt === 'string') {
      return templateFunction(prompt);
    }

    const extracted = this.extractPromptData(prompt);
    const formattedPrompt = this.buildFormattedPrompt(extracted, useCaseName);
    return templateFunction(formattedPrompt);
  }

  /**
   * Validate that a prompt is not empty
   */
  public static isValidPrompt(prompt: any): boolean {
    if (!prompt) return false;

    if (typeof prompt === 'string') {
      return prompt.trim().length > 0;
    }

    if (typeof prompt === 'object') {
      return Object.keys(prompt).some(key => {
        const value = (prompt as any)[key];
        if (typeof value === 'string') return value.trim().length > 0;
        if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
        return false;
      });
    }

    return false;
  }

  /**
   * Extract context information from various prompt formats (generic)
   */
  public static extractContext(prompt: any): any | null {
    if (typeof prompt !== 'object' || prompt === null) return null;

    // Prefer explicit, generic context fields
    const contextFields = ['context', 'sessionContext', 'metadata'];
    for (const field of contextFields) {
      if ((prompt as any)[field]) {
        return (prompt as any)[field];
      }
    }

    // Nested prompt structure
    if ((prompt as any).prompt && typeof (prompt as any).prompt === 'object') {
      return this.extractContext((prompt as any).prompt);
    }

    return null;
  }

  /**
   * Extract user instruction from various prompt formats (generic)
   */
  public static extractInstruction(prompt: any): string {
    if (typeof prompt === 'string') return prompt;
    if (typeof prompt !== 'object' || prompt === null) return '';

    // Nested prompt structure support
    if ((prompt as any).prompt?.instruction) {
      return (prompt as any).prompt.instruction;
    }

    // Common instruction field names
    const candidates = ['instruction', 'userInstruction', 'task', 'message', 'text', 'content', 'query', 'input', 'description'];
    for (const key of candidates) {
      const v = (prompt as any)[key];
      if (typeof v === 'string' && v.trim()) return v;
    }

    // Fallback to general text extraction
    return this.extractTextFromObject(prompt, 'instruction');
  }

  /**
   * Backward-compat alias for extractInstruction()
   */
  public static extractUserInstruction(prompt: any): string {
    return this.extractInstruction(prompt);
  }

  /**
   * Create a structured prompt object from simple inputs
   */
  public static createStructuredPrompt(instruction: string, context?: any): object {
    const prompt: any = { userInstruction: instruction };
    if (context) prompt.context = context;
    return prompt;
  }

  /**
   * Merge multiple prompt components into a single formatted prompt string
   */
  public static mergePromptComponents(components: Array<string | object>): string {
    const textParts: string[] = [];

    for (const component of components) {
      if (typeof component === 'string' && component.trim()) {
        textParts.push(component.trim());
      } else if (typeof component === 'object' && component !== null) {
        const extracted = this.extractTextFromObject(component, 'merge');
        if (extracted.trim()) textParts.push(extracted.trim());
      }
    }

    return textParts.join('\n\n');
  }

  /**
   * Sanitize prompt content to remove potentially problematic characters
   */
  public static sanitizePrompt(prompt: string): string {
    return prompt
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
  }

  /**
   * Get statistics about a prompt
   */
  public static getPromptStats(prompt: any): {
    type: 'string' | 'object' | 'unknown';
    charCount: number;
    wordCount: number;
    hasContext: boolean;
    isValid: boolean;
  } {
    const type = typeof prompt === 'string' ? 'string' : typeof prompt === 'object' && prompt !== null ? 'object' : 'unknown';
    const text = type === 'string' ? (prompt as string) : this.extractTextFromObject(prompt, 'stats');
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const hasContext = type === 'object' && this.extractContext(prompt) !== null;
    const isValid = this.isValidPrompt(prompt);

    return { type, charCount, wordCount, hasContext, isValid };
  }

  // ===============
  // Internal helpers
  // ===============

  /**
   * Extract data from various prompt formats (context + instruction + raw)
   */
  private static extractPromptData(prompt: any): {
    context?: any;
    instruction?: string;
    rawPrompt?: any;
  } {
    if (prompt?.prompt && typeof prompt.prompt === 'object') {
      return {
        context: prompt.prompt.context ?? prompt.context,
        instruction: prompt.prompt.instruction ?? prompt.instruction ?? prompt.userInstruction,
        rawPrompt: prompt.prompt
      };
    }

    return {
      context: (prompt as any)?.context,
      instruction: (prompt as any)?.instruction ?? (prompt as any)?.userInstruction,
      rawPrompt: prompt
    };
  }

  /**
   * Build formatted prompt string from extracted data using FlatFormatter for context
   */
  private static buildFormattedPrompt(
    extracted: { context?: any; instruction?: string; rawPrompt?: any },
    useCaseName: string
  ): string {
    const sections: string[] = [];

    if (extracted.context && typeof extracted.context === 'object') {
      const contextStr = this.formatContext(extracted.context);
      if (contextStr) sections.push(`## CONTEXT:\n${contextStr}`);
    }

    if (extracted.instruction && typeof extracted.instruction === 'string') {
      sections.push(`## INSTRUCTION:\n${extracted.instruction}`);
    }

    if (sections.length === 0 && extracted.rawPrompt) {
      return this.formatRawPrompt(extracted.rawPrompt);
    }

    return sections.join('\n\n');
  }

  /**
   * Format a context object using FlatFormatter
   */
  private static formatContext(context: any): string {
    if (typeof context !== 'object' || context === null) {
      return String(context);
    }

    return FlatFormatter.flatten(context, {
      format: 'numbered',
      ignoreEmptyValues: true,
      keyValueSeparator: ': '
    });
  }

  /**
   * Format a raw prompt object that doesn't match expected structure
   */
  private static formatRawPrompt(rawPrompt: any): string {
    if (typeof rawPrompt === 'string') return rawPrompt;

    if (typeof rawPrompt === 'object' && rawPrompt !== null) {
      return FlatFormatter.flatten(rawPrompt, {
        format: 'numbered',
        ignoreEmptyValues: true
      });
    }

    return String(rawPrompt);
  }

  /**
   * Extract text content from various object structures (used by stats/merge fallbacks)
   */
  private static extractTextFromObject(obj: any, context: string): string {
    if (typeof obj === 'string') return obj;
    if (!obj || typeof obj !== 'object') return '';

    const textFields = [
      'instruction', 'userInstruction', 'task', 'message', 'text', 'content', 'query', 'input', 'description'
    ];

    for (const field of textFields) {
      if ((obj as any)[field] && typeof (obj as any)[field] === 'string') {
        return (obj as any)[field];
      }
    }

    if ((obj as any).prompt && typeof (obj as any).prompt === 'object') {
      return this.extractTextFromObject((obj as any).prompt, context);
    }

    const stringValues = Object.values(obj)
      .filter((value: any) => typeof value === 'string' && value.trim().length > 0)
      .join(' ');

    return stringValues || '';
  }
}
