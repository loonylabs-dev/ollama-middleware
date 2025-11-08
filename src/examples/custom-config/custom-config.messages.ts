/**
 * Custom Config Example - Message Templates
 *
 * Simple message templates for demonstrating custom model configuration provider
 */

/**
 * System message for the custom config example
 * Defines the AI's role and behavior
 */
export const CUSTOM_CONFIG_SYSTEM_MESSAGE = `You are a helpful AI assistant that responds to user queries in a clear and concise manner.

Your responses should be:
- Direct and to the point
- Accurate and factual
- Well-formatted in JSON when appropriate

Return your response in the following JSON format:
{
  "response": "Your response text here"
}`;

/**
 * User message template
 * Takes the formatted prompt and returns the user message
 */
export const CUSTOM_CONFIG_USER_TEMPLATE = (formattedPrompt: string): string => {
  return formattedPrompt;
};
