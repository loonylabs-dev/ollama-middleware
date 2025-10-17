// tests/unit/messages/message-templates.test.ts

import { SIMPLE_CHAT_SYSTEM_MESSAGE, SIMPLE_CHAT_USER_TEMPLATE } from '../../../src/examples/simple-chat/chat.messages';
import { CHARACTER_GENERATOR_SYSTEM_MESSAGE, CHARACTER_GENERATOR_USER_TEMPLATE } from '../../../src/examples/character-generator/character-generator.messages';

describe('Message Templates', () => {
  
  describe('Simple Chat Messages', () => {
    it('should have a defined system message', () => {
      expect(SIMPLE_CHAT_SYSTEM_MESSAGE).toBeDefined();
      expect(SIMPLE_CHAT_SYSTEM_MESSAGE.length).toBeGreaterThan(0);
    });

    it('should contain appropriate instructions in system message', () => {
      expect(SIMPLE_CHAT_SYSTEM_MESSAGE).toContain('helpful');
      expect(SIMPLE_CHAT_SYSTEM_MESSAGE).toContain('assistant');
    });

    it('should have a user template function', () => {
      expect(SIMPLE_CHAT_USER_TEMPLATE).toBeDefined();
      expect(typeof SIMPLE_CHAT_USER_TEMPLATE).toBe('function');
    });

    it('should pass through user input unchanged', () => {
      const input = 'Hello, how are you?';
      const result = SIMPLE_CHAT_USER_TEMPLATE(input);
      
      expect(result).toBe(input);
    });

    it('should handle empty strings', () => {
      const result = SIMPLE_CHAT_USER_TEMPLATE('');
      expect(result).toBe('');
    });

    it('should handle multi-line input', () => {
      const input = 'Line 1\nLine 2\nLine 3';
      const result = SIMPLE_CHAT_USER_TEMPLATE(input);
      
      expect(result).toBe(input);
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
      expect(result).toContain('Line 3');
    });
  });

  describe('Character Generator Messages', () => {
    it('should have a defined system message', () => {
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).toBeDefined();
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE.length).toBeGreaterThan(0);
    });

    it('should contain JSON schema in system message', () => {
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).toContain('JSON object');
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).toContain('"Name"');
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).toContain('"Age"');
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).toContain('"Description"');
    });

    it('should contain JSON formatting instructions', () => {
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).toContain('Return exclusively JSON');
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).toContain('No code blocks');
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).toContain('no backticks');
    });

    it('should contain character creation rules', () => {
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).toContain('believable');
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).toContain('three-dimensional');
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).toContain('flaws and strengths');
    });

    it('should contain thinking tag instructions', () => {
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).toContain('<think>');
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).toContain('</think>');
    });

    it('should have a user template function', () => {
      expect(CHARACTER_GENERATOR_USER_TEMPLATE).toBeDefined();
      expect(typeof CHARACTER_GENERATOR_USER_TEMPLATE).toBe('function');
    });

    it('should pass through formatted context unchanged', () => {
      const context = `## CHARACTER ROLE REQUIREMENT:
Protagonist

## STORY SETTING:
Name: Medieval Castle
Location: Mountain Peak`;
      
      const result = CHARACTER_GENERATOR_USER_TEMPLATE(context);
      expect(result).toBe(context);
    });

    it('should handle complex formatted context', () => {
      const context = `## CHARACTER ROLE REQUIREMENT:
Hero

## STORY SETTING:
Name: Space Station
Time: Future

## GENRE REQUIREMENTS:
Name: Sci-Fi
Themes: Technology, Exploration`;
      
      const result = CHARACTER_GENERATOR_USER_TEMPLATE(context);
      expect(result).toContain('CHARACTER ROLE REQUIREMENT');
      expect(result).toContain('STORY SETTING');
      expect(result).toContain('GENRE REQUIREMENTS');
    });

    it('should specify all required character fields', () => {
      const requiredFields = [
        'Name', 'Age', 'Description', 'Appearance', 'Personality',
        'Background', 'Goals', 'Conflicts', 'Relationships',
        'Weaknesses', 'Motivation', 'CharacterArc', 'Dialogue_Style',
        'Key_Relationships', 'Character_Flaws', 'Strengths'
      ];

      requiredFields.forEach(field => {
        expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).toContain(`"${field}"`);
      });
    });

    it('should mark SpecialAbilities as optional', () => {
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).toContain('SpecialAbilities');
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).toContain('if any');
    });
  });

  describe('Message Template Integration', () => {
    it('should work with formatted prompts', () => {
      const chatMessage = 'Tell me a story';
      const chatResult = SIMPLE_CHAT_USER_TEMPLATE(chatMessage);
      
      expect(chatResult).toBe(chatMessage);
    });

    it('should maintain formatting in complex contexts', () => {
      const complexContext = `## SECTION 1:
Content 1

## SECTION 2:
Content 2`;
      
      const result = CHARACTER_GENERATOR_USER_TEMPLATE(complexContext);
      expect(result).toContain('## SECTION 1:');
      expect(result).toContain('## SECTION 2:');
    });

    it('should handle special characters in templates', () => {
      const textWithSpecialChars = 'Text with "quotes" and \'apostrophes\' and $pecial chars!';
      const chatResult = SIMPLE_CHAT_USER_TEMPLATE(textWithSpecialChars);
      
      expect(chatResult).toBe(textWithSpecialChars);
    });
  });

  describe('System Message Validation', () => {
    it('should have appropriate length for LLM processing', () => {
      // System messages should be comprehensive but not too long
      expect(SIMPLE_CHAT_SYSTEM_MESSAGE.length).toBeLessThan(1000);
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE.length).toBeGreaterThan(500);
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE.length).toBeLessThan(5000);
    });

    it('should not contain markdown code blocks in system messages', () => {
      // System messages should not have ```json formatting
      expect(SIMPLE_CHAT_SYSTEM_MESSAGE).not.toContain('```');
      expect(CHARACTER_GENERATOR_SYSTEM_MESSAGE).not.toContain('```json');
    });

    it('should use proper JSON structure in examples', () => {
      // Check that JSON examples use proper quotes
      const jsonMatch = CHARACTER_GENERATOR_SYSTEM_MESSAGE.match(/\{[^}]*"[A-Z][a-z]*":/);
      expect(jsonMatch).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long user input', () => {
      const longInput = 'A'.repeat(10000);
      const result = SIMPLE_CHAT_USER_TEMPLATE(longInput);
      
      expect(result.length).toBe(10000);
    });

    it('should handle unicode characters', () => {
      const unicodeText = 'Hello 世界 🌍 émojis';
      const result = SIMPLE_CHAT_USER_TEMPLATE(unicodeText);
      
      expect(result).toContain('世界');
      expect(result).toContain('🌍');
      expect(result).toContain('émojis');
    });

    it('should handle newlines and tabs correctly', () => {
      const formattedText = 'Line1\n\tIndented\n\t\tDouble indent';
      const result = CHARACTER_GENERATOR_USER_TEMPLATE(formattedText);
      
      expect(result).toContain('Line1');
      expect(result).toContain('\tIndented');
      expect(result).toContain('\t\tDouble indent');
    });
  });
});
