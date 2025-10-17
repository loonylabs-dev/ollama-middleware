// src/middleware/shared/constants/json-formatting.constants.ts

/**
 * Central JSON formatting instructions for consistent AI responses
 * Use these constants in all AI message templates to ensure proper JSON output
 */

/**
 * Standard JSON formatting instructions for all AI responses
 * Append this to system messages or user templates
 */
export const JSON_FORMATTING_INSTRUCTIONS = `
IMPORTANT FORMATTING INSTRUCTIONS:
- Return EXCLUSIVELY pure JSON without any formatting
- Do NOT use HTML entities like <br> or &nbsp;
- Do NOT use Markdown formatting like \`\`\`json or \`\`\`
- Do NOT use line breaks within JSON strings
- Start your response directly with { and end with }
- All text in JSON values should be written as plain strings without additional formatting

Ensure your response is exclusively a valid JSON object that can be parsed directly.`;

/**
 * Basic JSON instruction for system messages (shorter version)
 */
export const BASIC_JSON_INSTRUCTION = `Return exclusively JSON. No code blocks, no backticks, just a single JSON object.`;

/**
 * Extended JSON instruction with example (for user templates)
 */
export const JSON_INSTRUCTION_WITH_EXAMPLE = `${JSON_FORMATTING_INSTRUCTIONS}

EXAMPLE of correct formatting:
{"technicalSkillsScore": 75, "experienceScore": 80, "analysis": "The candidate meets most requirements"}

INCORRECT would be:
\`\`\`json<br>{"technicalSkillsScore": 75<br>...`;

/**
 * Utility function to append JSON instructions to any message
 */
export function withJsonInstructions(message: string): string {
  return `${message}\n\n${JSON_FORMATTING_INSTRUCTIONS}`;
}

/**
 * Utility function to append basic JSON instruction to system messages
 */
export function withBasicJsonInstruction(systemMessage: string): string {
  return `${systemMessage}\n${BASIC_JSON_INSTRUCTION}`;
}

/**
 * JSON Array formatting instructions for AI responses that should return arrays
 * Use this when you expect the AI to return an array of items, not a single object
 */
export const JSON_ARRAY_FORMATTING_INSTRUCTIONS = `
CRITICAL FORMATTING INSTRUCTIONS FOR JSON ARRAYS:
- Return EXCLUSIVELY a JSON ARRAY - begin with [ and end with ]
- Make sure to close the array properly, with ] and not ]]
- NO wrapping object with a key - return the array directly!
- NO Markdown formatting like \`\`\`json or \`\`\`
- NO HTML entities like <br> or &nbsp;
- NO line breaks within JSON strings
- All text in JSON values should be written as plain strings without additional formatting

EXAMPLE - CORRECT:
[{"Name": "Example 1", "Values": ["A", "B"]}, {"Name": "Example 2", "Values": ["C", "D"]}]

EXAMPLE - INCORRECT (do not use):
{"Items": [{"Name": "Example 1"}]}
{"Results": [...]}

Ensure your response is exclusively a valid JSON array that can be parsed directly.`;

/**
 * Utility function to append array-specific JSON instruction to system messages
 * Use this for all AI use cases that expect an array response
 */
export function withArrayJsonInstruction(systemMessage: string): string {
  return `${systemMessage}\nReturn exclusively a JSON array. No code blocks, no backticks, no wrapping objects with keys - only the pure JSON array starting with [ and ending with ].`;
}
