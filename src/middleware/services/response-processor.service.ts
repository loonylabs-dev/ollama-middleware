import { JsonCleanerService, CleanedJsonResult } from './json-cleaner';

/**
 * Service for processing AI model responses
 * Handles JSON cleaning, content extraction, and response validation
 */
export class ResponseProcessorService {

  /**
   * Process the raw AI response by cleaning JSON and extracting thinking content
   * Uses the modern Recipe System for better results
   * @param response The raw response from the AI model
   * @returns Processed content with thinking extracted
   */
  public static async processResponseAsync(response: string): Promise<CleanedJsonResult> {
    // Delegate to JsonCleanerService's modern async method
    return JsonCleanerService.processResponseAsync(response);
  }

  /**
   * Extract only the thinking content from a response
   * @param response The raw response from the AI model
   * @returns Extracted thinking content or empty string
   */
  public static extractThinking(response: string): string {
    const thinkMatch = response.match(/<think>([\s\S]*?)<\/think>/);
    return thinkMatch && thinkMatch[1] ? thinkMatch[1].trim() : '';
  }

  /**
   * Extract only the non-thinking content from a response
   * @param response The raw response from the AI model
   * @returns Response without thinking blocks
   */
  public static extractContent(response: string): string {
    return response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  }

  /**
   * Extract content from multiple thinking tag types
   * @param response The raw response from the AI model
   * @returns Object with different types of extracted content
   */
  public static extractAllThinkingTypes(response: string): {
    thinking: string;
    reasoning: string;
    analysis: string;
    planning: string;
  } {
    return {
      thinking: this.extractByTag(response, 'think'),
      reasoning: this.extractByTag(response, 'reasoning'),
      analysis: this.extractByTag(response, 'analysis'),
      planning: this.extractByTag(response, 'planning')
    };
  }

  /**
   * Extract content by specific tag
   * @param response The response text
   * @param tag The tag name to extract
   * @returns Extracted content or empty string
   */
  private static extractByTag(response: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = response.match(regex);
    return match && match[1] ? match[1].trim() : '';
  }

  /**
   * Validate if a response contains valid JSON
   * @param response The response to validate
   * @returns True if the response contains valid JSON
   */
  public static hasValidJson(response: string): boolean {
    try {
      const contentOnly = this.extractContent(response);
      JSON.parse(contentOnly);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Try to parse JSON from response with fallback handling
   * @param response The response to parse
   * @returns Parsed object or null if parsing fails
   */
  public static async tryParseJson(response: string): Promise<any | null> {
    try {
      const contentOnly = this.extractContent(response);
      return JSON.parse(contentOnly);
    } catch {
      // Try with JsonCleanerService if direct parsing fails
      try {
        const cleaned = await JsonCleanerService.processResponseAsync(response);
        return JSON.parse(cleaned.cleanedJson);
      } catch {
        return null;
      }
    }
  }

  /**
   * Process response and return both raw and processed versions
   * @param response The raw response
   * @returns Object containing both raw and processed versions
   */
  public static async processResponseDetailed(response: string): Promise<{
    raw: string;
    cleaned: CleanedJsonResult;
    parsedJson: any | null;
    hasThinking: boolean;
    thinking: string;
    contentOnly: string;
    isValidJson: boolean;
    stats: {
      originalLength: number;
      cleanedLength: number;
      thinkingLength: number;
      contentLength: number;
    };
  }> {
    const cleaned = await this.processResponseAsync(response);
    const parsedJson = await this.tryParseJson(response);
    const thinking = this.extractThinking(response);
    const contentOnly = this.extractContent(response);

    return {
      raw: response,
      cleaned,
      parsedJson,
      hasThinking: thinking.length > 0,
      thinking,
      contentOnly,
      isValidJson: parsedJson !== null,
      stats: {
        originalLength: response.length,
        cleanedLength: cleaned.cleanedJson.length,
        thinkingLength: thinking.length,
        contentLength: contentOnly.length
      }
    };
  }

  /**
   * Clean and format response for human readability
   * @param response The response to format
   * @returns Formatted response
   */
  public static formatForHuman(response: string): string {
    const thinking = this.extractThinking(response);
    const content = this.extractContent(response);
    
    let formatted = '';
    
    if (thinking) {
      formatted += '**Thinking Process:**\n```\n' + thinking + '\n```\n\n';
    }
    
    if (content) {
      formatted += '**Response:**\n';
      
      // Try to pretty-print JSON if possible
      try {
        const parsed = JSON.parse(content);
        formatted += '```json\n' + JSON.stringify(parsed, null, 2) + '\n```';
      } catch {
        formatted += content;
      }
    }
    
    return formatted.trim();
  }

  /**
   * Extract metadata from response headers or structured content
   * @param response The response to analyze
   * @returns Extracted metadata
   */
  public static extractMetadata(response: string): {
    hasThinkingTags: boolean;
    thinkingTagCount: number;
    contentType: 'json' | 'text' | 'mixed';
    estimatedTokens: number;
    language: 'en' | 'de' | 'unknown';
  } {
    const thinkingTags = response.match(/<think>/g) || [];
    const hasThinkingTags = thinkingTags.length > 0;
    
    let contentType: 'json' | 'text' | 'mixed' = 'text';
    const contentOnly = this.extractContent(response);
    
    if (this.hasValidJson(response)) {
      contentType = 'json';
    } else if (contentOnly.includes('{') || contentOnly.includes('[')) {
      contentType = 'mixed';
    }
    
    // Simple token estimation (approximate)
    const estimatedTokens = Math.ceil(response.length / 4);
    
    // Simple language detection
    const germanWords = /\b(und|oder|der|die|das|ist|sind|haben|werden|können)\b/gi;
    const englishWords = /\b(and|or|the|is|are|have|will|can|should)\b/gi;
    const germanMatches = response.match(germanWords)?.length || 0;
    const englishMatches = response.match(englishWords)?.length || 0;
    
    let language: 'en' | 'de' | 'unknown' = 'unknown';
    if (germanMatches > englishMatches && germanMatches > 2) {
      language = 'de';
    } else if (englishMatches > germanMatches && englishMatches > 2) {
      language = 'en';
    }
    
    return {
      hasThinkingTags,
      thinkingTagCount: thinkingTags.length,
      contentType,
      estimatedTokens,
      language
    };
  }

  /**
   * Validate response structure and content quality
   * @param response The response to validate
   * @returns Validation results
   */
  public static validateResponse(response: string): {
    isValid: boolean;
    issues: string[];
    quality: 'high' | 'medium' | 'low';
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Basic validation
    if (!response || response.trim().length === 0) {
      issues.push('Response is empty');
      return {
        isValid: false,
        issues,
        quality: 'low',
        suggestions: ['Request a new response from the model']
      };
    }
    
    // Check for truncated response
    if (response.length > 0 && !response.trim().endsWith('}') && !response.trim().endsWith('>')) {
      issues.push('Response may be truncated');
      suggestions.push('Consider increasing max tokens or checking model limits');
    }
    
    // Check JSON validity if response appears to contain JSON
    const contentOnly = this.extractContent(response);
    if ((contentOnly.includes('{') || contentOnly.includes('[')) && !this.hasValidJson(response)) {
      issues.push('Response contains malformed JSON');
      suggestions.push('Use JsonCleanerService to repair the JSON');
    }
    
    // Check for balanced thinking tags
    const openThinkTags = (response.match(/<think>/g) || []).length;
    const closeThinkTags = (response.match(/<\/think>/g) || []).length;
    if (openThinkTags !== closeThinkTags) {
      issues.push('Unbalanced thinking tags');
      suggestions.push('Manually balance or remove malformed thinking tags');
    }
    
    // Determine quality
    let quality: 'high' | 'medium' | 'low' = 'high';
    if (issues.length > 0) {
      quality = issues.length > 2 ? 'low' : 'medium';
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      quality,
      suggestions
    };
  }
}