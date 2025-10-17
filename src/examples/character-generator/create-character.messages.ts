// src/middleware/messages/examples/create-character.messages.ts
import { withArrayJsonInstruction, JSON_ARRAY_FORMATTING_INSTRUCTIONS } from '../../middleware/shared/constants/json-formatting.constants';

/**
 * System message for the create character use case.
 * This defines how the AI should behave and what format it should return.
 */
export const CREATE_CHARACTER_SYSTEM_MESSAGE = withArrayJsonInstruction(`
You are a character expert in literature. Your job is to create literary character suggestions based on user input.
Be creative but plausible. Keep it concise.
When creating characters, strictly follow this JSON Array structure:
[{
  "Character_Name": "Name of the character",
  "Character_Description": "Brief description of the character and their role in the story",
  "Character_Appearance": "Description of physical appearance",
  "Character_Strengths": ["Strength1", "Strength2", "Strength3"],
  "Character_Weaknesses": ["Weakness1", "Weakness2", "Weakness3"],
  "Character_SelfImage": "How the character sees themselves",
  "Character_Relationships": {
    "Family": "Description of family relationships",
    "Friends": "Description of friendships",
    "Rivals": "Description of rivalries"
  },
  "Character_Specialty": "Special ability or expertise of the character"
}]`);

/**
 * Template for constructing the user message.
 * Takes the base user input and formats it into a complete prompt.
 */
export const CREATE_CHARACTER_USER_TEMPLATE = (baseInput: string): string => `
Create 2 characters based on the following elements: ${baseInput}
Make sure the characters fit well together and the setting, but are still different from each other.

${JSON_ARRAY_FORMATTING_INSTRUCTIONS}`;
