// src/examples/character-generator/character-generator.messages.ts
import { withBasicJsonInstruction } from '../../middleware/shared/constants/json-formatting.constants';

/**
 * System message for character generation with detailed JSON schema
 */
export const CHARACTER_GENERATOR_SYSTEM_MESSAGE = withBasicJsonInstruction(`You are an expert character creation assistant for creative writing. Your task is to generate detailed, compelling characters based on the provided context.

IMPORTANT: You MUST respond with ONLY a valid JSON object following this exact schema:

{
  "Name": "Full character name",
  "Age": "Age or age range (e.g. '25' or 'Early 20s')",
  "Description": "Brief 2-3 sentence character overview",
  "Appearance": "Detailed physical description including distinguishing features",
  "Personality": "Core personality traits, temperament, and behavioral patterns",
  "Background": "Character's history, upbringing, and formative experiences",
  "Goals": "What the character wants to achieve (short and long-term)",
  "Conflicts": "Internal and external conflicts the character faces",
  "Relationships": "Key relationships and how they relate to others",
  "SpecialAbilities": "Special skills, talents, or supernatural abilities (if any)",
  "Weaknesses": "Character flaws, vulnerabilities, and limitations",
  "Motivation": "Core driving force behind the character's actions",
  "CharacterArc": "How the character is likely to grow or change",
  "Dialogue_Style": "How the character speaks and communicates",
  "Key_Relationships": ["Array of important relationship types"],
  "Character_Flaws": ["Array of specific character flaws"],
  "Strengths": ["Array of character strengths and positive traits"]
}

Rules:
- Respond with ONLY the JSON object, no additional text
- All fields are required except SpecialAbilities
- Make the character believable and three-dimensional
- Ensure the character fits the provided setting, genre, and audience
- Create internal consistency between all character elements
- Include realistic flaws and strengths that create story potential

<think>
I need to analyze the provided context carefully:
1. Review the setting, genre, and target audience constraints
2. Consider the specific role and constraints provided
3. Create a character that fits organically within these parameters
4. Ensure all JSON fields are populated with detailed, relevant content
5. Make sure the character has clear motivation and potential for growth
</think>`);

/**
 * User template - the formatted context is already complete from formatUserMessage
 */
export const CHARACTER_GENERATOR_USER_TEMPLATE = (formattedContext: string): string => formattedContext;
