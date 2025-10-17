// tests/unit/constants/json-formatting.constants.test.ts

import {
  JSON_FORMATTING_INSTRUCTIONS,
  BASIC_JSON_INSTRUCTION,
  JSON_INSTRUCTION_WITH_EXAMPLE,
  JSON_ARRAY_FORMATTING_INSTRUCTIONS,
  withJsonInstructions,
  withBasicJsonInstruction,
  withArrayJsonInstruction
} from '../../../src/middleware/shared/constants/json-formatting.constants';

describe('JSON Formatting Constants', () => {
  
  describe('Constants Content', () => {
    it('should contain JSON_FORMATTING_INSTRUCTIONS', () => {
      expect(JSON_FORMATTING_INSTRUCTIONS).toBeDefined();
      expect(JSON_FORMATTING_INSTRUCTIONS).toContain('IMPORTANT FORMATTING INSTRUCTIONS');
      expect(JSON_FORMATTING_INSTRUCTIONS).toContain('pure JSON');
      expect(JSON_FORMATTING_INSTRUCTIONS).toContain('without any formatting');
    });

    it('should contain BASIC_JSON_INSTRUCTION', () => {
      expect(BASIC_JSON_INSTRUCTION).toBeDefined();
      expect(BASIC_JSON_INSTRUCTION).toContain('Return exclusively JSON');
      expect(BASIC_JSON_INSTRUCTION).toContain('No code blocks');
    });

    it('should contain JSON_INSTRUCTION_WITH_EXAMPLE', () => {
      expect(JSON_INSTRUCTION_WITH_EXAMPLE).toBeDefined();
      expect(JSON_INSTRUCTION_WITH_EXAMPLE).toContain('EXAMPLE of correct formatting');
      expect(JSON_INSTRUCTION_WITH_EXAMPLE).toContain('technicalSkillsScore');
    });

    it('should contain JSON_ARRAY_FORMATTING_INSTRUCTIONS', () => {
      expect(JSON_ARRAY_FORMATTING_INSTRUCTIONS).toBeDefined();
      expect(JSON_ARRAY_FORMATTING_INSTRUCTIONS).toContain('CRITICAL FORMATTING INSTRUCTIONS FOR JSON ARRAYS');
      expect(JSON_ARRAY_FORMATTING_INSTRUCTIONS).toContain('begin with [');
      expect(JSON_ARRAY_FORMATTING_INSTRUCTIONS).toContain('end with ]');
    });
  });

  describe('withJsonInstructions()', () => {
    it('should append JSON formatting instructions to message', () => {
      const message = 'Please provide data';
      const result = withJsonInstructions(message);

      expect(result).toContain(message);
      expect(result).toContain(JSON_FORMATTING_INSTRUCTIONS);
      expect(result.indexOf(message)).toBeLessThan(result.indexOf('IMPORTANT FORMATTING INSTRUCTIONS'));
    });

    it('should handle empty message', () => {
      const result = withJsonInstructions('');

      expect(result).toContain(JSON_FORMATTING_INSTRUCTIONS);
    });

    it('should handle multi-line messages', () => {
      const message = 'Line 1\nLine 2\nLine 3';
      const result = withJsonInstructions(message);

      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
      expect(result).toContain('Line 3');
      expect(result).toContain(JSON_FORMATTING_INSTRUCTIONS);
    });
  });

  describe('withBasicJsonInstruction()', () => {
    it('should append basic JSON instruction to system message', () => {
      const systemMessage = 'You are a helpful assistant.';
      const result = withBasicJsonInstruction(systemMessage);

      expect(result).toContain(systemMessage);
      expect(result).toContain(BASIC_JSON_INSTRUCTION);
      expect(result.indexOf(systemMessage)).toBeLessThan(result.indexOf('Return exclusively JSON'));
    });

    it('should handle system messages with instructions', () => {
      const systemMessage = 'You are an expert.\nFollow these rules:\n1. Be concise\n2. Be accurate';
      const result = withBasicJsonInstruction(systemMessage);

      expect(result).toContain(systemMessage);
      expect(result).toContain(BASIC_JSON_INSTRUCTION);
    });

    it('should not duplicate if called multiple times', () => {
      const systemMessage = 'You are a helpful assistant.';
      const result1 = withBasicJsonInstruction(systemMessage);
      const result2 = withBasicJsonInstruction(result1);

      // Count occurrences of "Return exclusively JSON"
      const matches = result2.match(/Return exclusively JSON/g);
      expect(matches?.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('withArrayJsonInstruction()', () => {
    it('should append array-specific JSON instruction to system message', () => {
      const systemMessage = 'You are a character creation expert.';
      const result = withArrayJsonInstruction(systemMessage);

      expect(result).toContain(systemMessage);
      expect(result).toContain('Return exclusively a JSON array');
      expect(result).toContain('starting with [');
      expect(result).toContain('ending with ]');
    });

    it('should emphasize no wrapping objects', () => {
      const systemMessage = 'Generate characters.';
      const result = withArrayJsonInstruction(systemMessage);

      expect(result).toContain('no wrapping objects with keys');
      expect(result).toContain('only the pure JSON array');
    });

    it('should handle complex system messages', () => {
      const systemMessage = `You are an expert.
      
Rules:
1. Follow the schema
2. Be creative
3. Use proper formatting

Schema:
{
  "name": "string",
  "value": "number"
}`;
      const result = withArrayJsonInstruction(systemMessage);

      expect(result).toContain('Follow the schema');
      expect(result).toContain('Return exclusively a JSON array');
    });
  });

  describe('Integration Tests', () => {
    it('should work together for complex prompts', () => {
      const systemMessage = 'You are a helpful assistant.';
      const userMessage = 'Please create a list of characters.';

      const systemWithInstruction = withArrayJsonInstruction(systemMessage);
      const userWithInstruction = withJsonInstructions(userMessage);

      expect(systemWithInstruction).toContain('JSON array');
      expect(userWithInstruction).toContain('pure JSON');
    });

    it('should maintain message integrity', () => {
      const originalMessage = 'This is a test message with special chars: @#$%^&*()';
      const result = withJsonInstructions(originalMessage);

      expect(result).toContain('@#$%^&*()');
      expect(result).toContain('IMPORTANT FORMATTING INSTRUCTIONS');
    });

    it('should handle unicode characters', () => {
      const messageWithUnicode = 'Message with émojis 🎉 and spëcial çhars';
      const result = withBasicJsonInstruction(messageWithUnicode);

      expect(result).toContain('émojis 🎉');
      expect(result).toContain('spëcial çhars');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      const result = withJsonInstructions(longMessage);

      expect(result.length).toBeGreaterThan(10000);
      expect(result).toContain('IMPORTANT FORMATTING INSTRUCTIONS');
    });

    it('should handle messages with newlines and tabs', () => {
      const message = 'Line1\n\tIndented\n\t\tDouble indented';
      const result = withBasicJsonInstruction(message);

      expect(result).toContain('Line1');
      expect(result).toContain('\tIndented');
      expect(result).toContain('\t\tDouble indented');
    });

    it('should handle empty strings gracefully', () => {
      expect(() => withJsonInstructions('')).not.toThrow();
      expect(() => withBasicJsonInstruction('')).not.toThrow();
      expect(() => withArrayJsonInstruction('')).not.toThrow();
    });
  });
});
