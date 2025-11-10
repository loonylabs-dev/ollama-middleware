/**
 * Tests for ResponseProcessorService with options (v2.8.0)
 * Tests new configurable response processing behavior
 */

import { ResponseProcessorService } from '../../../src/middleware/services/response-processor.service';
import { ResponseProcessingOptions } from '../../../src/middleware/services/response-processor/types';

describe('ResponseProcessorService - Options (v2.8.0)', () => {
  describe('Plain Text Responses (Compression Use Case)', () => {
    const plainTextResponse = `Rashid der Rostsammler ist ein erfahrener Händler, der seit langem in den Ruinen der Rostwüste nach wertvollen Teilen und Artefakten sucht. Er ist pragmatisch und weiß, dass man in der Wüste stark sein muss.

Rashid kennt sich bestens mit Robotik und Magie aus und ist ein geschickter Verhandler. Allerdings kann seine Gier zu riskanten Entscheidungen führen und ihm altersbedingt zu schaffen machen.

Seine Spezialität ist die Artefakt-Deutung: Er erkennt die Herkunft und Funktion magischer Gegenstände und kann verborgene Kräfte freisetzen.`;

    it('should preserve full plain text when JSON validation is disabled', async () => {
      const options: ResponseProcessingOptions = {
        extractThinkTags: true,
        extractMarkdown: true,
        validateJson: false,
        cleanJson: false
      };

      const result = await ResponseProcessorService.processResponseAsync(plainTextResponse, options);

      expect(result.cleanedJson).toBe(plainTextResponse);
      expect(result.thinking).toBe('');
      expect(result.cleanedJson.length).toBe(plainTextResponse.length);
      // Should contain all 3 paragraphs
      expect(result.cleanedJson.split('\n\n')).toHaveLength(3);
    });

    it('should not truncate multi-paragraph plain text', async () => {
      const options: ResponseProcessingOptions = {
        validateJson: false,
        cleanJson: false
      };

      const result = await ResponseProcessorService.processResponseAsync(plainTextResponse, options);

      // Should NOT be truncated to first paragraph only
      expect(result.cleanedJson).toContain('Artefakt-Deutung');
      expect(result.cleanedJson).toContain('verborgene Kräfte freisetzen');
    });
  });

  describe('Think Tag Extraction', () => {
    const responseWithThinking = `<think>
Let me analyze this character carefully.
I need to focus on key traits and compress effectively.
</think>
Rashid der Rostsammler - Alter Händler, pragmatisch, expert in artifacts`;

    it('should extract think tags when extractThinkTags is true', async () => {
      const options: ResponseProcessingOptions = {
        extractThinkTags: true,
        validateJson: false,
        cleanJson: false
      };

      const result = await ResponseProcessorService.processResponseAsync(responseWithThinking, options);

      expect(result.thinking).toContain('analyze this character');
      expect(result.cleanedJson).not.toContain('<think>');
      expect(result.cleanedJson).toBe('Rashid der Rostsammler - Alter Händler, pragmatisch, expert in artifacts');
    });

    it('should NOT extract think tags when extractThinkTags is false', async () => {
      const options: ResponseProcessingOptions = {
        extractThinkTags: false,
        validateJson: false,
        cleanJson: false
      };

      const result = await ResponseProcessorService.processResponseAsync(responseWithThinking, options);

      expect(result.thinking).toBe('');
      expect(result.cleanedJson).toContain('<think>');
      expect(result.cleanedJson).toBe(responseWithThinking);
    });
  });

  describe('Markdown Extraction', () => {
    const responseWithMarkdown = '```text\nRashid der Rostsammler - compressed character data\n```';

    it('should extract markdown when extractMarkdown is true', async () => {
      const options: ResponseProcessingOptions = {
        extractMarkdown: true,
        validateJson: false,
        cleanJson: false
      };

      const result = await ResponseProcessorService.processResponseAsync(responseWithMarkdown, options);

      expect(result.cleanedJson).not.toContain('```');
      expect(result.cleanedJson).toBe('Rashid der Rostsammler - compressed character data');
    });

    it('should NOT extract markdown when extractMarkdown is false', async () => {
      const options: ResponseProcessingOptions = {
        extractMarkdown: false,
        validateJson: false,
        cleanJson: false
      };

      const result = await ResponseProcessorService.processResponseAsync(responseWithMarkdown, options);

      expect(result.cleanedJson).toContain('```');
      expect(result.cleanedJson).toBe(responseWithMarkdown);
    });

    it('should handle markdown with json type specifier', async () => {
      const jsonMarkdown = '```json\n{"name": "Rashid", "role": "Händler"}\n```';
      const options: ResponseProcessingOptions = {
        extractMarkdown: true,
        validateJson: false,
        cleanJson: false
      };

      const result = await ResponseProcessorService.processResponseAsync(jsonMarkdown, options);

      expect(result.cleanedJson).toBe('{"name": "Rashid", "role": "Händler"}');
    });
  });

  describe('Combined Extraction', () => {
    const complexResponse = `<think>
I should compress this to LOW level
</think>
\`\`\`text
Rashid der Rostsammler - erfahrener Händler in der Rostwüste
\`\`\``;

    it('should extract both think tags and markdown', async () => {
      const options: ResponseProcessingOptions = {
        extractThinkTags: true,
        extractMarkdown: true,
        validateJson: false,
        cleanJson: false
      };

      const result = await ResponseProcessorService.processResponseAsync(complexResponse, options);

      expect(result.thinking).toContain('compress this to LOW level');
      expect(result.cleanedJson).not.toContain('<think>');
      expect(result.cleanedJson).not.toContain('```');
      expect(result.cleanedJson).toBe('Rashid der Rostsammler - erfahrener Händler in der Rostwüste');
    });
  });

  describe('Backward Compatibility', () => {
    it('should use default options when none provided', async () => {
      const jsonResponse = '{"Character_Name": "Rashid", "Role": "Händler"}';

      // Call without options (backward compatible)
      const result = await ResponseProcessorService.processResponseAsync(jsonResponse);

      // Should behave as before (validate and clean JSON)
      expect(result.cleanedJson).toBeTruthy();
      expect(result.thinking).toBe('');
    });

    it('should validate and clean JSON by default', async () => {
      const malformedJson = '{"name": "Rashid",}'; // trailing comma

      // Default behavior should clean this
      const result = await ResponseProcessorService.processResponseAsync(malformedJson);

      // Should remove trailing comma
      const parsed = JSON.parse(result.cleanedJson);
      expect(parsed.name).toBe('Rashid');
    });
  });

  describe('Selective Options', () => {
    it('should allow extracting think tags while cleaning JSON', async () => {
      const response = '<think>analyzing</think>{"name": "Rashid"}';
      const options: ResponseProcessingOptions = {
        extractThinkTags: true,
        cleanJson: true,
        validateJson: true
      };

      const result = await ResponseProcessorService.processResponseAsync(response, options);

      expect(result.thinking).toContain('analyzing');
      expect(result.cleanedJson).toBe('{"name": "Rashid"}');
    });

    it('should extract markdown even when extractMarkdown is false if cleanJson is true', async () => {
      const response = '```json\n{"name": "Rashid"}\n```';
      const options: ResponseProcessingOptions = {
        extractMarkdown: false,
        cleanJson: true
      };

      const result = await ResponseProcessorService.processResponseAsync(response, options);

      // JsonCleaner will extract markdown as part of JSON cleaning
      // This is expected behavior - JSON cleaning requires markdown extraction
      expect(result.cleanedJson).toBe('{"name": "Rashid"}');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response', async () => {
      const options: ResponseProcessingOptions = {
        validateJson: false
      };

      const result = await ResponseProcessorService.processResponseAsync('', options);

      expect(result.cleanedJson).toBe('');
      expect(result.thinking).toBe('');
    });

    it('should handle response with only whitespace', async () => {
      const options: ResponseProcessingOptions = {
        validateJson: false
      };

      const result = await ResponseProcessorService.processResponseAsync('   \n  \n  ', options);

      expect(result.cleanedJson.trim()).toBe('');
    });

    it('should handle response with nested markdown blocks', async () => {
      const response = '```text\nOuter\n```inner```\nEnd\n```';
      const options: ResponseProcessingOptions = {
        extractMarkdown: true,
        validateJson: false
      };

      const result = await ResponseProcessorService.processResponseAsync(response, options);

      // Should extract first markdown block
      expect(result.cleanedJson).not.toContain('```text');
    });
  });
});
