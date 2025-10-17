import { RequestFormatterService } from '../../src/middleware/services/request-formatter';
import { FlatFormatter } from '../../src/middleware/services/flat-formatter';

(async () => {
  console.log('--- RequestFormatterService Demo ---');

  const complexPrompt = {
    context: {
      topic: 'mythical creatures',
      tone: 'whimsical',
      constraints: ['200-300 words', 'third-person limited']
    },
    instruction: 'Write a short story opening.'
  };

  const formatted = RequestFormatterService.formatUserMessage(
    complexPrompt,
    (s) => s,
    'StoryGeneratorDemo'
  );

  console.log('\nFormatted (RequestFormatterService):\n');
  console.log(formatted);

  console.log('\n--- FlatFormatter Simple Demo ---');

  const contextOnly = {
    protagonist: 'Lina',
    setting: { place: 'misty harbor', era: 'late autumn' },
    goals: ['find the silver key', 'avoid the lighthouse keeper']
  };

  const flat = FlatFormatter.flatten(contextOnly, {
    format: 'numbered',
    ignoreEmptyValues: true,
    keyValueSeparator: ': '
  });

  console.log('\nFlattened Context (FlatFormatter):\n');
  console.log(flat);
})();
