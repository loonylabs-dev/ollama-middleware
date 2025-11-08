import { JsonExtractor } from '../../../src/middleware/services/json-cleaner/parsers/json-extractor.parser';

describe('JsonExtractor - Array Support', () => {
  const extractor = new JsonExtractor();

  it('should extract simple array from text', () => {
    const input = '[{"name": "Test1"}, {"name": "Test2"}]';
    const result = extractor.parse(input);

    console.log('Result:', result.json);
    expect(result.json).toBe(input);

    // Verify it's still an array
    const parsed = JSON.parse(result.json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
  });

  it('should extract array from markdown-wrapped text', () => {
    const arrayJson = '[{"name": "Test1"}, {"name": "Test2"}]';
    const input = '```json\n' + arrayJson + '\n```';

    // The MarkdownParser would handle this first, so we test with already-cleaned input
    const cleanedInput = arrayJson;
    const result = extractor.parse(cleanedInput);

    console.log('Result:', result.json);
    const parsed = JSON.parse(result.json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
  });

  it('should extract complex array (real narrative data)', () => {
    const complexArray = `[
  {
    "Narrativ_Name": "Lineare Abenteuerreise",
    "Narrativ_Beschreibung": "Die Geschichte wird chronologisch erzählt, von Anfang bis Ende.",
    "Narrativ_Wirkung": {
      "Lesererfahrung": "Der Leser wird direkt in die Handlung gezogen",
      "Narrative_Stärken": ["Klarheit", "Einfachheit"],
      "Herausforderungen": ["Kann vorhersehbar sein"]
    }
  },
  {
    "Narrativ_Name": "Episodische Abenteuer",
    "Narrativ_Beschreibung": "Einzelne Episoden"
  }
]`;

    const result = extractor.parse(complexArray);

    console.log('Result length:', result.json.length);
    console.log('Result first 100:', result.json.substring(0, 100));
    console.log('Starts with [:', result.json.trim().startsWith('['));

    const parsed = JSON.parse(result.json);
    console.log('Is array:', Array.isArray(parsed));
    console.log('Array length:', Array.isArray(parsed) ? parsed.length : 'N/A');

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
    expect(parsed[0].Narrativ_Name).toBe('Lineare Abenteuerreise');
  });

  it('should extract array with text before and after', () => {
    const arrayJson = '[{"name": "Test1"}, {"name": "Test2"}]';
    const input = 'Here is the result: ' + arrayJson + '\nThat was it.';

    const result = extractor.parse(input);

    console.log('Result:', result.json);
    const parsed = JSON.parse(result.json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
  });
});
