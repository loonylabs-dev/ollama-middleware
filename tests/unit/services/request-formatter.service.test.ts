import { RequestFormatterService } from '../../../src/middleware/services/request-formatter';

describe('RequestFormatterService (generic)', () => {
  
  describe('formatUserMessage', () => {
    test('handles string prompts directly', () => {
      const prompt = 'Write a haiku about rain';
      const template = (s: string) => `USER:\n${s}`;

      const result = RequestFormatterService.formatUserMessage(prompt, template, 'TestUseCase');

      expect(result).toBe('USER:\nWrite a haiku about rain');
    });

    test('builds sections for object prompts with context and instruction', () => {
      const prompt = {
        context: { topic: 'dragons', style: 'epic fantasy' },
        instruction: 'Write the opening paragraph.'
      };
      const template = (s: string) => s; // identity

      const result = RequestFormatterService.formatUserMessage(prompt, template, 'StoryUseCase');

      expect(result).toContain('## CONTEXT:');
      expect(result).toContain('topic');
      expect(result).toContain('dragons');
      expect(result).toContain('## INSTRUCTION:');
      expect(result).toContain('Write the opening paragraph.');
    });

    test('handles nested prompt.prompt structure', () => {
      const prompt = {
        prompt: {
          context: { era: '1920s', place: 'New York' },
          instruction: 'Describe the scene.'
        }
      };
      const template = (s: string) => s;

      const result = RequestFormatterService.formatUserMessage(prompt, template, 'Test');

      expect(result).toContain('## CONTEXT:');
      expect(result).toContain('era');
      expect(result).toContain('1920s');
      expect(result).toContain('## INSTRUCTION:');
      expect(result).toContain('Describe the scene.');
    });

    test('formats arrays in context using FlatFormatter', () => {
      const prompt = {
        context: { 
          characters: ['Alice', 'Bob', 'Charlie'],
          themes: ['courage', 'friendship']
        },
        instruction: 'Write the introduction.'
      };
      const template = (s: string) => s;

      const result = RequestFormatterService.formatUserMessage(prompt, template, 'Test');

      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
      expect(result).toContain('courage');
    });
  });

  describe('extractContext', () => {
    test('supports nested prompt structures', () => {
      const nested = { prompt: { context: { a: 1, b: 2 }, instruction: 'do x' } };
      const ctx = RequestFormatterService.extractContext(nested);

      expect(ctx).toEqual({ a: 1, b: 2 });
    });

    test('extracts from direct context field', () => {
      const direct = { context: { key: 'value' }, instruction: 'task' };
      const ctx = RequestFormatterService.extractContext(direct);

      expect(ctx).toEqual({ key: 'value' });
    });

    test('returns null for non-object prompts', () => {
      expect(RequestFormatterService.extractContext('string prompt')).toBeNull();
      expect(RequestFormatterService.extractContext(null)).toBeNull();
      expect(RequestFormatterService.extractContext(undefined)).toBeNull();
    });

    test('prefers generic context fields over domain-specific ones', () => {
      const prompt = { context: { generic: true }, bookContext: { specific: true } };
      const ctx = RequestFormatterService.extractContext(prompt);

      expect(ctx).toEqual({ generic: true });
    });
  });

  describe('extractInstruction', () => {
    test('finds appropriate field and alias works', () => {
      const p1 = { instruction: 'Summarize this.' };
      const p2 = { userInstruction: 'Explain the code.' };
      const p3 = { prompt: { instruction: 'Generate a title.' } };

      expect(RequestFormatterService.extractInstruction(p1)).toBe('Summarize this.');
      expect(RequestFormatterService.extractInstruction(p2)).toBe('Explain the code.');
      expect(RequestFormatterService.extractInstruction(p3)).toBe('Generate a title.');
      expect(RequestFormatterService.extractUserInstruction(p3)).toBe('Generate a title.');
    });

    test('handles string prompts directly', () => {
      expect(RequestFormatterService.extractInstruction('Do this task')).toBe('Do this task');
    });

    test('checks multiple field candidates', () => {
      expect(RequestFormatterService.extractInstruction({ task: 'Task A' })).toBe('Task A');
      expect(RequestFormatterService.extractInstruction({ message: 'Message B' })).toBe('Message B');
      expect(RequestFormatterService.extractInstruction({ text: 'Text C' })).toBe('Text C');
    });

    test('returns empty string for objects without instruction', () => {
      expect(RequestFormatterService.extractInstruction({ context: { a: 1 } })).toBe('');
      expect(RequestFormatterService.extractInstruction({})).toBe('');
    });
  });

  describe('isValidPrompt', () => {
    test('detects empty vs non-empty prompts', () => {
      expect(RequestFormatterService.isValidPrompt('')).toBe(false);
      expect(RequestFormatterService.isValidPrompt('  ')).toBe(false);
      expect(RequestFormatterService.isValidPrompt('ok')).toBe(true);
      expect(RequestFormatterService.isValidPrompt({})).toBe(false);
      expect(RequestFormatterService.isValidPrompt({ instruction: 'do it' })).toBe(true);
      expect(RequestFormatterService.isValidPrompt({ context: { a: 1 } })).toBe(true);
    });

    test('returns false for null/undefined', () => {
      expect(RequestFormatterService.isValidPrompt(null)).toBe(false);
      expect(RequestFormatterService.isValidPrompt(undefined)).toBe(false);
    });

    test('validates complex nested structures', () => {
      expect(RequestFormatterService.isValidPrompt({
        prompt: { context: { a: 1 }, instruction: 'task' }
      })).toBe(true);
    });
  });

  describe('mergePromptComponents', () => {
    test('joins strings and extracted objects', () => {
      const merged = RequestFormatterService.mergePromptComponents([
        'Part A',
        { instruction: 'Part B' },
        { prompt: { userInstruction: 'Part C' } }
      ]);

      expect(merged).toContain('Part A');
      expect(merged).toContain('Part B');
      expect(merged).toContain('Part C');
    });

    test('ignores empty strings and objects', () => {
      const merged = RequestFormatterService.mergePromptComponents([
        'Valid',
        '',
        '   ',
        {},
        { instruction: 'Also valid' }
      ]);

      expect(merged).toContain('Valid');
      expect(merged).toContain('Also valid');
      expect(merged.split('\n\n')).toHaveLength(2);
    });
  });

  describe('utility methods', () => {
    test('sanitizePrompt removes control characters', () => {
      const dirty = 'Text\x00with\x07control\x1Fchars';
      const clean = RequestFormatterService.sanitizePrompt(dirty);

      expect(clean).toBe('Textwithcontrolchars');
    });

    test('sanitizePrompt normalizes line endings', () => {
      const mixed = 'Line1\r\nLine2\rLine3';
      const normalized = RequestFormatterService.sanitizePrompt(mixed);

      expect(normalized).toBe('Line1\nLine2\nLine3');
    });

    test('getPromptStats returns correct statistics', () => {
      const stats = RequestFormatterService.getPromptStats('Hello world test');

      expect(stats.type).toBe('string');
      expect(stats.wordCount).toBe(3);
      expect(stats.charCount).toBe(16);
      expect(stats.hasContext).toBe(false);
      expect(stats.isValid).toBe(true);
    });

    test('getPromptStats detects context in objects', () => {
      const stats = RequestFormatterService.getPromptStats({
        context: { a: 1 },
        instruction: 'Do something'
      });

      expect(stats.type).toBe('object');
      expect(stats.hasContext).toBe(true);
      expect(stats.isValid).toBe(true);
    });

    test('createStructuredPrompt builds correct object', () => {
      const prompt = RequestFormatterService.createStructuredPrompt(
        'Write a story',
        { genre: 'fantasy' }
      );

      expect(prompt).toEqual({
        userInstruction: 'Write a story',
        context: { genre: 'fantasy' }
      });
    });
  });
});
