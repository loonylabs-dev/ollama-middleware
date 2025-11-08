import { Fixers } from '../../../src/middleware/services/json-cleaner/recipe-system/operations/fixers';

describe('Test Fixers on Valid Array JSON', () => {
  const validArrayJson = `[
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

  const mockContext = {
    currentJson: validArrayJson,
    hasDetection: () => false,
    originalJson: validArrayJson,
    detectedIssues: [],
    appliedOperations: [],
    qualityMetrics: {},
    checkpoints: new Map(),
    metadata: {}
  };

  it('should test controlCharacter fixer on valid array', async () => {
    console.log('=== TESTING controlCharacter FIXER ===');
    const fixer = Fixers.controlCharacter();
    const result = await fixer.apply(validArrayJson, mockContext as any);

    console.log('Success:', result.success);
    console.log('Cleaned length:', result.cleanedJson?.length);
    console.log('Original length:', validArrayJson.length);
    console.log('Changed:', result.cleanedJson !== validArrayJson);

    if (result.cleanedJson && result.cleanedJson !== validArrayJson) {
      console.log('CHANGED! First 100 chars:', result.cleanedJson.substring(0, 100));
      console.log('Changes:', result.changes);
    }
  });

  it('should test missingComma fixer on valid array', async () => {
    console.log('=== TESTING missingComma FIXER ===');
    const fixer = Fixers.missingComma();
    const result = await fixer.apply(validArrayJson, mockContext as any);

    console.log('Success:', result.success);
    console.log('Cleaned length:', result.cleanedJson?.length);
    console.log('Original length:', validArrayJson.length);
    console.log('Changed:', result.cleanedJson !== validArrayJson);

    if (result.cleanedJson && result.cleanedJson !== validArrayJson) {
      console.log('CHANGED! First 100 chars:', result.cleanedJson.substring(0, 100));
      console.log('Changes:', result.changes);
    }
  });

  it('should test structuralRepair fixer on valid array', async () => {
    console.log('=== TESTING structuralRepair FIXER ===');
    const fixer = Fixers.structuralRepair();
    const result = await fixer.apply(validArrayJson, mockContext as any);

    console.log('Success:', result.success);
    console.log('Cleaned length:', result.cleanedJson?.length);
    console.log('Original length:', validArrayJson.length);
    console.log('Changed:', result.cleanedJson !== validArrayJson);

    if (result.cleanedJson && result.cleanedJson !== validArrayJson) {
      console.log('CHANGED! First 100 chars:', result.cleanedJson.substring(0, 100));
      console.log('Changes:', result.changes);

      // Test if it's still valid JSON
      try {
        const parsed = JSON.parse(result.cleanedJson);
        console.log('Still valid JSON:', true);
        console.log('Is array:', Array.isArray(parsed));
      } catch (e) {
        console.log('NOW INVALID JSON!', e instanceof Error ? e.message : e);
      }
    }
  });
});
