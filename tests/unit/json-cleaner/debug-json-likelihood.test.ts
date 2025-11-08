describe('Debug: assessJsonLikelihood for arrays', () => {
  // Copy the assessJsonLikelihood logic from MarkdownBlockExtractor
  function assessJsonLikelihood(content: string): number {
    let score = 0;

    // Check for JSON-like patterns
    if (content.trim().startsWith('{') && content.trim().endsWith('}')) score += 0.4;
    if (content.trim().startsWith('[') && content.trim().endsWith(']')) score += 0.4;
    if (content.includes('"') && content.includes(':')) score += 0.3;
    if (/(true|false|null)/.test(content)) score += 0.2;

    // Penalize for non-JSON patterns
    if (/<[^>]+>/.test(content)) score -= 0.2; // HTML tags
    if (/^[A-Za-z\s]+$/.test(content)) score -= 0.3; // Plain text

    return Math.max(0, Math.min(1, score));
  }

  it('should assess object JSON likelihood', () => {
    const objectJson = '{"key": "value", "number": 123}';
    const score = assessJsonLikelihood(objectJson);
    console.log('Object JSON score:', score);
    console.log('Starts with {:', objectJson.trim().startsWith('{'));
    console.log('Ends with }:', objectJson.trim().endsWith('}'));
    console.log('Has " and ::', objectJson.includes('"') && objectJson.includes(':'));
    expect(score).toBeGreaterThan(0.5);
  });

  it('should assess array JSON likelihood', () => {
    const arrayJson = '[{"key": "value"}, {"key2": "value2"}]';
    const score = assessJsonLikelihood(arrayJson);
    console.log('Array JSON score:', score);
    console.log('Starts with [:', arrayJson.trim().startsWith('['));
    console.log('Ends with ]:', arrayJson.trim().endsWith(']'));
    console.log('Has " and ::', arrayJson.includes('"') && arrayJson.includes(':'));
    expect(score).toBeGreaterThan(0.5);
  });

  it('should assess complex array JSON likelihood', () => {
    const complexArrayJson = `[
  {
    "Narrativ_Name": "Lineare Abenteuerreise",
    "Narrativ_Beschreibung": "Die Geschichte wird chronologisch erzählt",
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
    const score = assessJsonLikelihood(complexArrayJson);
    console.log('Complex Array JSON score:', score);
    console.log('Starts with [:', complexArrayJson.trim().startsWith('['));
    console.log('Ends with ]:', complexArrayJson.trim().endsWith(']'));
    console.log('Has " and ::', complexArrayJson.includes('"') && complexArrayJson.includes(':'));
    console.log('Has true/false/null:', /(true|false|null)/.test(complexArrayJson));
    expect(score).toBeGreaterThan(0.5);
  });
});
