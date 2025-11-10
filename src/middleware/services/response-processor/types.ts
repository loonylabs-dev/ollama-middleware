/**
 * Options for configuring response processing behavior
 *
 * @since 2.8.0
 */
export interface ResponseProcessingOptions {
  /**
   * Whether to extract and remove <think> tags from the response
   *
   * @default true
   * @example
   * ```typescript
   * // Extract thinking content
   * const result = await processResponseAsync(response, { extractThinkTags: true });
   * console.log(result.thinking); // Content from <think> tags
   *
   * // Keep thinking in main content
   * const result = await processResponseAsync(response, { extractThinkTags: false });
   * console.log(result.thinking); // Empty string
   * ```
   */
  extractThinkTags?: boolean;

  /**
   * Whether to extract content from markdown code blocks (```json, ```text, etc.)
   *
   * @default true
   * @example
   * ```typescript
   * // Extract from markdown blocks
   * const result = await processResponseAsync('```json\n{"key": "value"}\n```', {
   *   extractMarkdown: true
   * });
   * console.log(result.cleanedJson); // '{"key": "value"}'
   *
   * // Keep markdown syntax
   * const result = await processResponseAsync('```json\n{"key": "value"}\n```', {
   *   extractMarkdown: false
   * });
   * console.log(result.cleanedJson); // '```json\n{"key": "value"}\n```'
   * ```
   */
  extractMarkdown?: boolean;

  /**
   * Whether to validate that the response is valid JSON
   *
   * Set to `false` for use cases that expect plain text responses
   * (e.g., compression, summarization, plain text generation)
   *
   * @default true
   * @example
   * ```typescript
   * // For plain text responses (no JSON validation)
   * const result = await processResponseAsync('This is plain text', {
   *   validateJson: false
   * });
   * // No JSON validation errors
   *
   * // For JSON responses (with validation)
   * const result = await processResponseAsync('{"key": "value"}', {
   *   validateJson: true
   * });
   * // Validates JSON structure
   * ```
   */
  validateJson?: boolean;

  /**
   * Whether to apply JSON cleaning strategies to fix common issues
   *
   * Set to `false` for use cases that expect plain text or pre-validated JSON
   * Has no effect if `validateJson` is `false`
   *
   * @default true
   * @example
   * ```typescript
   * // For responses that might have JSON issues
   * const result = await processResponseAsync('{"key": "value",}', {
   *   cleanJson: true
   * });
   * // Fixes trailing comma
   *
   * // For pre-validated or plain text responses
   * const result = await processResponseAsync('Plain text response', {
   *   cleanJson: false,
   *   validateJson: false
   * });
   * // No cleaning applied
   * ```
   */
  cleanJson?: boolean;

  /**
   * Recipe system mode for JSON cleaning (only used if cleanJson is true)
   *
   * - 'conservative': Minimal fixes, preserves original structure
   * - 'aggressive': More fixes, may modify structure for valid JSON
   * - 'adaptive': Automatically chooses strategy based on response
   *
   * @default 'adaptive'
   */
  recipeMode?: 'conservative' | 'aggressive' | 'adaptive';
}

/**
 * Default options for response processing
 * Ensures backward compatibility with existing behavior
 */
export const DEFAULT_RESPONSE_PROCESSING_OPTIONS: Required<ResponseProcessingOptions> = {
  extractThinkTags: true,
  extractMarkdown: true,
  validateJson: true,
  cleanJson: true,
  recipeMode: 'adaptive'
};
