import { ResponseProcessorService } from '../../../src/middleware/services/response-processor.service';

describe('ResponseProcessorService', () => {
  describe('extractThinking()', () => {
    it('should extract thinking content from <think> tags', () => {
      const response = '<think>This is my thought process</think>{"result": "success"}';
      const thinking = ResponseProcessorService.extractThinking(response);

      expect(thinking).toBe('This is my thought process');
    });

    it('should return empty string when no thinking tags present', () => {
      const response = '{"result": "success"}';
      const thinking = ResponseProcessorService.extractThinking(response);

      expect(thinking).toBe('');
    });

    it('should handle multiline thinking content', () => {
      const response = `<think>
Line 1
Line 2
Line 3
</think>{"result": "success"}`;
      const thinking = ResponseProcessorService.extractThinking(response);

      expect(thinking).toContain('Line 1');
      expect(thinking).toContain('Line 2');
      expect(thinking).toContain('Line 3');
    });

    it('should trim whitespace from extracted thinking', () => {
      const response = '<think>   whitespace   </think>{"result": "success"}';
      const thinking = ResponseProcessorService.extractThinking(response);

      expect(thinking).toBe('whitespace');
    });

    it('should extract only the first thinking block', () => {
      const response = '<think>First</think>{"data": "test"}<think>Second</think>';
      const thinking = ResponseProcessorService.extractThinking(response);

      expect(thinking).toBe('First');
    });
  });

  describe('extractContent()', () => {
    it('should remove thinking tags and return content only', () => {
      const response = '<think>My thoughts</think>{"result": "success"}';
      const content = ResponseProcessorService.extractContent(response);

      expect(content).toBe('{"result": "success"}');
      expect(content).not.toContain('<think>');
    });

    it('should return original content when no thinking tags', () => {
      const response = '{"result": "success"}';
      const content = ResponseProcessorService.extractContent(response);

      expect(content).toBe('{"result": "success"}');
    });

    it('should remove multiple thinking blocks', () => {
      const response = '<think>First</think>{"data": "test"}<think>Second</think>';
      const content = ResponseProcessorService.extractContent(response);

      expect(content).toBe('{"data": "test"}');
      expect(content).not.toContain('<think>');
      expect(content).not.toContain('First');
      expect(content).not.toContain('Second');
    });

    it('should trim whitespace from extracted content', () => {
      const response = '<think>Thoughts</think>   {"result": "success"}   ';
      const content = ResponseProcessorService.extractContent(response);

      expect(content).toBe('{"result": "success"}');
    });
  });

  describe('hasValidJson()', () => {
    it('should return true for valid JSON', () => {
      const response = '{"result": "success", "data": {"nested": true}}';
      const isValid = ResponseProcessorService.hasValidJson(response);

      expect(isValid).toBe(true);
    });

    it('should return true for valid JSON with thinking tags', () => {
      const response = '<think>Processing</think>{"result": "success"}';
      const isValid = ResponseProcessorService.hasValidJson(response);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      const response = '{result: "invalid"}';
      const isValid = ResponseProcessorService.hasValidJson(response);

      expect(isValid).toBe(false);
    });

    it('should return false for plain text', () => {
      const response = 'This is plain text';
      const isValid = ResponseProcessorService.hasValidJson(response);

      expect(isValid).toBe(false);
    });

    it('should return true for valid JSON arrays', () => {
      const response = '[{"id": 1}, {"id": 2}]';
      const isValid = ResponseProcessorService.hasValidJson(response);

      expect(isValid).toBe(true);
    });
  });

  describe('tryParseJson()', () => {
    it('should parse valid JSON successfully', () => {
      const response = '{"result": "success", "count": 42}';
      const parsed = ResponseProcessorService.tryParseJson(response);

      expect(parsed).not.toBeNull();
      expect(parsed.result).toBe('success');
      expect(parsed.count).toBe(42);
    });

    it('should parse JSON with thinking tags', () => {
      const response = '<think>Thinking</think>{"result": "success"}';
      const parsed = ResponseProcessorService.tryParseJson(response);

      expect(parsed).not.toBeNull();
      expect(parsed.result).toBe('success');
    });

    it('should return null for invalid JSON', () => {
      const response = 'This is not JSON';
      const parsed = ResponseProcessorService.tryParseJson(response);

      expect(parsed).toBeNull();
    });

    it('should parse arrays', () => {
      const response = '[1, 2, 3]';
      const parsed = ResponseProcessorService.tryParseJson(response);

      expect(parsed).not.toBeNull();
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(3);
    });

    it('should handle nested objects', () => {
      const response = '{"user": {"name": "Alice", "age": 30}}';
      const parsed = ResponseProcessorService.tryParseJson(response);

      expect(parsed).not.toBeNull();
      expect(parsed.user.name).toBe('Alice');
      expect(parsed.user.age).toBe(30);
    });
  });

  describe('processResponse()', () => {
    it('should process response and return cleaned JSON and thinking', () => {
      const response = '<think>My thoughts</think>{"result": "success"}';
      const result = ResponseProcessorService.processResponse(response);

      expect(result).toHaveProperty('cleanedJson');
      expect(result).toHaveProperty('thinking');
      expect(result.thinking).toContain('My thoughts');
    });

    it('should handle response without thinking tags', () => {
      const response = '{"result": "success"}';
      const result = ResponseProcessorService.processResponse(response);

      expect(result.cleanedJson).toBeTruthy();
      expect(result.thinking).toBe('');
    });
  });

  describe('processResponseAsync()', () => {
    it('should process response asynchronously', async () => {
      const response = '<think>Processing async</think>{"result": "success"}';
      const result = await ResponseProcessorService.processResponseAsync(response);

      expect(result).toHaveProperty('cleanedJson');
      expect(result).toHaveProperty('thinking');
    });

    it('should handle valid JSON efficiently', async () => {
      const response = '{"result": "success", "data": "test"}';
      const result = await ResponseProcessorService.processResponseAsync(response);

      expect(result.cleanedJson).toBeTruthy();
      expect(result.thinking).toBe('');
    });

    it('should clean malformed JSON', async () => {
      const response = '```json\n{"result": "success"}\n```';
      const result = await ResponseProcessorService.processResponseAsync(response);

      expect(result.cleanedJson).toBeTruthy();
      // Should have removed markdown wrapper
      expect(result.cleanedJson).not.toContain('```');
    });
  });

  describe('extractAllThinkingTypes()', () => {
    it('should extract all types of thinking tags', () => {
      const response = `
        <think>Main thinking</think>
        <reasoning>My reasoning</reasoning>
        <analysis>Data analysis</analysis>
        <planning>Project plan</planning>
        {"result": "success"}
      `;

      const extracted = ResponseProcessorService.extractAllThinkingTypes(response);

      expect(extracted.thinking).toContain('Main thinking');
      expect(extracted.reasoning).toContain('My reasoning');
      expect(extracted.analysis).toContain('Data analysis');
      expect(extracted.planning).toContain('Project plan');
    });

    it('should return empty strings for missing tag types', () => {
      const response = '<think>Only thinking</think>{"result": "success"}';
      const extracted = ResponseProcessorService.extractAllThinkingTypes(response);

      expect(extracted.thinking).toContain('Only thinking');
      expect(extracted.reasoning).toBe('');
      expect(extracted.analysis).toBe('');
      expect(extracted.planning).toBe('');
    });
  });

  describe('formatForHuman()', () => {
    it('should format response with thinking and JSON content', () => {
      const response = '<think>Processing</think>{"result": "success"}';
      const formatted = ResponseProcessorService.formatForHuman(response);

      expect(formatted).toContain('Thinking Process');
      expect(formatted).toContain('Response');
      expect(formatted).toContain('Processing');
    });

    it('should pretty-print valid JSON', () => {
      const response = '{"result":"success","nested":{"value":42}}';
      const formatted = ResponseProcessorService.formatForHuman(response);

      expect(formatted).toContain('```json');
      expect(formatted).toContain('"result"');
      // Should be pretty-printed with indentation
      expect(formatted.split('\n').length).toBeGreaterThan(3);
    });

    it('should handle plain text responses', () => {
      const response = 'This is plain text';
      const formatted = ResponseProcessorService.formatForHuman(response);

      expect(formatted).toContain('This is plain text');
    });
  });

  describe('extractMetadata()', () => {
    it('should detect thinking tags', () => {
      const response = '<think>Thinking</think>{"result": "success"}';
      const metadata = ResponseProcessorService.extractMetadata(response);

      expect(metadata.hasThinkingTags).toBe(true);
      expect(metadata.thinkingTagCount).toBe(1);
    });

    it('should identify JSON content type', () => {
      const response = '{"result": "success"}';
      const metadata = ResponseProcessorService.extractMetadata(response);

      expect(metadata.contentType).toBe('json');
    });

    it('should identify text content type', () => {
      const response = 'This is plain text without JSON';
      const metadata = ResponseProcessorService.extractMetadata(response);

      expect(metadata.contentType).toBe('text');
    });

    it('should estimate token count', () => {
      const response = 'This is a test message';
      const metadata = ResponseProcessorService.extractMetadata(response);

      expect(metadata.estimatedTokens).toBeGreaterThan(0);
    });

    it('should detect language (English)', () => {
      const response = 'The quick brown fox jumps over the lazy dog and will run';
      const metadata = ResponseProcessorService.extractMetadata(response);

      expect(metadata.language).toBe('en');
    });

    it('should detect language (German)', () => {
      const response = 'Das ist ein Test und der Text ist auf Deutsch';
      const metadata = ResponseProcessorService.extractMetadata(response);

      expect(metadata.language).toBe('de');
    });
  });

  describe('validateResponse()', () => {
    it('should validate a good response', () => {
      const response = '{"result": "success", "data": {"value": 42}}';
      const validation = ResponseProcessorService.validateResponse(response);

      expect(validation.isValid).toBe(true);
      expect(validation.quality).toBe('high');
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect empty response', () => {
      const response = '';
      const validation = ResponseProcessorService.validateResponse(response);

      expect(validation.isValid).toBe(false);
      expect(validation.quality).toBe('low');
      expect(validation.issues).toContain('Response is empty');
    });

    it('should detect malformed JSON', () => {
      const response = '{result: "invalid"}';
      const validation = ResponseProcessorService.validateResponse(response);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('malformed JSON'))).toBe(true);
    });

    it('should detect unbalanced thinking tags', () => {
      const response = '<think>Thinking without closing tag{"result": "success"}';
      const validation = ResponseProcessorService.validateResponse(response);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('Unbalanced'))).toBe(true);
    });

    it('should provide suggestions for issues', () => {
      const response = '{invalid: json}';
      const validation = ResponseProcessorService.validateResponse(response);

      expect(validation.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('processResponseDetailed()', () => {
    it('should provide comprehensive response analysis', () => {
      const response = '<think>Thinking</think>{"result": "success"}';
      const detailed = ResponseProcessorService.processResponseDetailed(response);

      expect(detailed).toHaveProperty('raw');
      expect(detailed).toHaveProperty('cleaned');
      expect(detailed).toHaveProperty('parsedJson');
      expect(detailed).toHaveProperty('hasThinking');
      expect(detailed).toHaveProperty('thinking');
      expect(detailed).toHaveProperty('contentOnly');
      expect(detailed).toHaveProperty('isValidJson');
      expect(detailed).toHaveProperty('stats');

      expect(detailed.hasThinking).toBe(true);
      expect(detailed.isValidJson).toBe(true);
    });

    it('should calculate accurate statistics', () => {
      const response = '<think>Test</think>{"result": "success"}';
      const detailed = ResponseProcessorService.processResponseDetailed(response);

      expect(detailed.stats.originalLength).toBe(response.length);
      expect(detailed.stats.thinkingLength).toBeGreaterThan(0);
      expect(detailed.stats.contentLength).toBeGreaterThan(0);
    });

    it('should handle responses without thinking', () => {
      const response = '{"result": "success"}';
      const detailed = ResponseProcessorService.processResponseDetailed(response);

      expect(detailed.hasThinking).toBe(false);
      expect(detailed.thinking).toBe('');
      expect(detailed.stats.thinkingLength).toBe(0);
    });
  });
});
