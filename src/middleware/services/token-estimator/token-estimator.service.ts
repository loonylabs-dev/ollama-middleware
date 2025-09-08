/**
 * Interface for token count estimates
 */
export interface TokenEstimate {
  estimated: number;
  method: 'gpt-tokenizer' | 'character-based' | 'word-based';
}

/**
 * Service for estimating token counts in text
 * Provides multiple estimation methods including GPT tokenizer fallback
 */
export class TokenEstimatorService {
  
  /**
   * Estimate token count based on text using the best available method
   * @param text The text to estimate token count for
   * @returns Token estimate with method used
   */
  public static estimateTokenCount(text: string): TokenEstimate {
    if (!text) {
      return { estimated: 0, method: 'character-based' };
    }

    // Try GPT tokenizer first if available
    try {
      // Try to use gpt-tokenizer if it's available
      const gptTokenizer = this.tryLoadGptTokenizer();
      if (gptTokenizer) {
        const tokens = gptTokenizer.encode(text).length;
        return { estimated: tokens, method: 'gpt-tokenizer' };
      }
    } catch (error) {
      console.warn('GPT tokenizer failed, falling back to estimation', error);
    }

    // Fallback to character-based estimation
    return this.estimateByCharacters(text);
  }

  /**
   * Try to load the GPT tokenizer if available
   * @returns The tokenizer or null if not available
   */
  private static tryLoadGptTokenizer(): any | null {
    try {
      // This will only work if gpt-tokenizer is installed
      const { encode } = require('gpt-tokenizer');
      return { encode };
    } catch (error) {
      // gpt-tokenizer is not available
      return null;
    }
  }

  /**
   * Estimate tokens using character-based method
   * @param text The text to estimate
   * @returns Token estimate
   */
  private static estimateByCharacters(text: string): TokenEstimate {
    // Rough estimation: 1 token ≈ 4 characters for English text
    // This is a conservative estimate that works reasonably well
    const estimated = Math.ceil(text.length / 4);
    return { estimated, method: 'character-based' };
  }

  /**
   * Estimate tokens using word-based method
   * @param text The text to estimate
   * @returns Token estimate
   */
  private static estimateByWords(text: string): TokenEstimate {
    // Alternative method: 1 token ≈ 0.75 words
    const words = text.trim().split(/\s+/).length;
    const estimated = Math.ceil(words / 0.75);
    return { estimated, method: 'word-based' };
  }

  /**
   * Calculate tokens per second based on token count and execution time
   * @param tokenCount Number of tokens
   * @param executionTimeSeconds Execution time in seconds
   * @returns Tokens per second as a formatted string
   */
  public static calculateTokensPerSecond(tokenCount: number, executionTimeSeconds: number): string {
    if (executionTimeSeconds === 0) return '0.00';
    return (tokenCount / executionTimeSeconds).toFixed(2);
  }

  /**
   * Estimate token count for system message and user prompt combined
   * @param systemMessage The system message
   * @param userPrompt The user prompt
   * @returns Combined token estimate
   */
  public static estimateInputTokens(systemMessage: string, userPrompt: string): TokenEstimate {
    return this.estimateTokenCount(systemMessage + userPrompt);
  }

  /**
   * Estimate tokens for a conversation with multiple messages
   * @param messages Array of message strings
   * @returns Token estimate for the entire conversation
   */
  public static estimateConversationTokens(messages: string[]): TokenEstimate {
    const combinedText = messages.join('\n');
    const baseEstimate = this.estimateTokenCount(combinedText);
    
    // Add some overhead for conversation formatting
    const overhead = messages.length * 2; // Rough estimate for formatting tokens
    
    return {
      estimated: baseEstimate.estimated + overhead,
      method: baseEstimate.method
    };
  }

  /**
   * Check if text exceeds a token limit
   * @param text The text to check
   * @param limit The token limit
   * @returns Object indicating if limit is exceeded and by how much
   */
  public static checkTokenLimit(text: string, limit: number): {
    exceeded: boolean;
    estimated: number;
    limit: number;
    overage: number;
    percentage: number;
  } {
    const estimate = this.estimateTokenCount(text);
    const exceeded = estimate.estimated > limit;
    const overage = exceeded ? estimate.estimated - limit : 0;
    const percentage = (estimate.estimated / limit) * 100;

    return {
      exceeded,
      estimated: estimate.estimated,
      limit,
      overage,
      percentage: Math.round(percentage * 100) / 100
    };
  }

  /**
   * Truncate text to fit within a token limit
   * @param text The text to truncate
   * @param limit The token limit
   * @param method Truncation method ('end' | 'start' | 'middle')
   * @returns Truncated text and information about the truncation
   */
  public static truncateToTokenLimit(
    text: string, 
    limit: number, 
    method: 'end' | 'start' | 'middle' = 'end'
  ): {
    truncatedText: string;
    originalTokens: number;
    finalTokens: number;
    truncated: boolean;
  } {
    const originalEstimate = this.estimateTokenCount(text);
    
    if (originalEstimate.estimated <= limit) {
      return {
        truncatedText: text,
        originalTokens: originalEstimate.estimated,
        finalTokens: originalEstimate.estimated,
        truncated: false
      };
    }

    // Rough estimation: if we need to reduce tokens by X, reduce characters by ~4X
    const targetLength = Math.floor((text.length * limit) / originalEstimate.estimated);
    let truncatedText: string;

    switch (method) {
      case 'start':
        truncatedText = text.slice(-targetLength);
        break;
      case 'middle':
        const halfLength = Math.floor(targetLength / 2);
        truncatedText = text.slice(0, halfLength) + '...' + text.slice(-halfLength);
        break;
      case 'end':
      default:
        truncatedText = text.slice(0, targetLength);
        break;
    }

    const finalEstimate = this.estimateTokenCount(truncatedText);

    return {
      truncatedText,
      originalTokens: originalEstimate.estimated,
      finalTokens: finalEstimate.estimated,
      truncated: true
    };
  }

  /**
   * Get statistics about text in terms of characters, words, and estimated tokens
   * @param text The text to analyze
   * @returns Detailed statistics
   */
  public static getTextStatistics(text: string): {
    characters: number;
    charactersNoSpaces: number;
    words: number;
    lines: number;
    tokens: TokenEstimate;
    averageWordsPerToken: number;
    averageCharsPerToken: number;
  } {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;
    const tokens = this.estimateTokenCount(text);
    
    const averageWordsPerToken = tokens.estimated > 0 ? words / tokens.estimated : 0;
    const averageCharsPerToken = tokens.estimated > 0 ? characters / tokens.estimated : 0;

    return {
      characters,
      charactersNoSpaces,
      words,
      lines,
      tokens,
      averageWordsPerToken: Math.round(averageWordsPerToken * 100) / 100,
      averageCharsPerToken: Math.round(averageCharsPerToken * 100) / 100
    };
  }
}