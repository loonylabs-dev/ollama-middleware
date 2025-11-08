import { Fixers } from '../../../src/middleware/services/json-cleaner/recipe-system/operations/fixers';
import { Detectors } from '../../../src/middleware/services/json-cleaner/recipe-system/operations/detectors';

describe('Debug Recipe Steps with Real Narrative Data', () => {
  const narrativeArray = `[
  {
    "Narrativ_Name": "Lineare Abenteuerreise",
    "Narrativ_Beschreibung": "Die Geschichte wird chronologisch erzählt, von Anfang bis Ende. Der Fokus liegt auf einer klaren Handlung und dem Fortschritt der Charaktere auf ihrer Reise.",
    "Narrativ_Erzähltechnik": "Einfache Erzählerstimme, die die Ereignisse aus der Sicht eines Hauptcharakters schildert.",
    "Narrativ_Zeitliche_Struktur": "Geradlinig und chronologisch. Ereignisse werden in der Reihenfolge ihres Auftretens erzählt.",
    "Narrativ_Perspektive": "Ich-Erzähler (aus der Sicht eines Kindes) oder Er/Sie-Erzähler (fokussiert auf einen Hauptcharakter).",
    "Narrativ_Wirkung": {
      "Lesererfahrung": "Der Leser wird direkt in die Handlung und die Welt hineingezogen und kann die Reise des Helden leicht nachvollziehen. Emotionale Verbindung durch einfache Erzählweise.",
      "Narrative_Stärken": ["Klarheit", "Einfachheit", "Emotionale Verbindung"],
      "Herausforderungen": ["Kann vorhersehbar sein", "Weniger Raum für komplexe Wendungen"]
    },
    "Narrativ_Stilistische_Elemente": {
      "Dialog_Anteil": "Hoch",
      "Dialog_Stil": "Lebendig und natürlich, mit kindgerechter Sprache.",
      "Sprachlicher_Stil": "Bildhaft und beschreibend, aber einfach gehalten.",
      "Satzkomplexität": "Einfach und kurz.",
      "Rhythmus": "Schnell und abwechslungsreich."
    }
  },
  {
    "Narrativ_Name": "Episodische Abenteuer mit wiederkehrenden Themen",
    "Narrativ_Beschreibung": "Die Geschichte besteht aus einzelnen, abgeschlossenen Episoden, die aber durch wiederkehrende Charaktere, Orte oder Themen miteinander verbunden sind. Jede Episode erzählt ein kleines Abenteuer, das zum großen Ganzen beiträgt.",
    "Narrativ_Erzähltechnik": "Erzählerstimme, die jede Episode einzeln einführt und abschließt.",
    "Narrativ_Zeitliche_Struktur": "Chronologisch, aber mit Fokus auf einzelne Episoden, die nicht unbedingt direkt aufeinander aufbauen.",
    "Narrativ_Perspektive": "Er/Sie-Erzähler, der verschiedene Charaktere und Orte beleuchtet.",
    "Narrativ_Wirkung": {
      "Lesererfahrung": "Der Leser erlebt verschiedene Abenteuer und lernt die Welt und ihre Charaktere auf spielerische Weise kennen. Spannung durch einzelne Episoden und Neugierde auf die nächste Geschichte.",
      "Narrative_Stärken": ["Abwechslung", "Spannung", "Weltaufbau"],
      "Herausforderungen": ["Kann fragmentiert wirken", "Braucht einen starken roten Faden"]
    },
    "Narrativ_Stilistische_Elemente": {
      "Dialog_Anteil": "Mittel",
      "Dialog_Stil": "Lebendig und altersgerecht, mit unterschiedlichen Stimmen für die Charaktere.",
      "Sprachlicher_Stil": "Bildhaft und beschreibend, mit Fokus auf die Atmosphäre der einzelnen Episoden.",
      "Satzkomplexität": "Einfach bis mittel.",
      "Rhythmus": "Abwechslungsreich, je nach Art der Episode."
    }
  }
]`;

  const createMockContext = (json: string) => ({
    currentJson: json,
    hasDetection: (key: string) => key === 'markdown_code_block',
    originalJson: json,
    detectedIssues: ['markdown_code_block'],
    appliedOperations: [],
    qualityMetrics: {},
    checkpoints: new Map(),
    metadata: {}
  });

  it('Step 1: Markdown extraction from wrapped array', async () => {
    const input = '```json\n' + narrativeArray + '\n```';
    const mockContext = createMockContext(input);

    console.log('=== STEP 1: Markdown Extraction ===');
    console.log('Input length:', input.length);
    console.log('Input starts with:', input.substring(0, 50));

    const extractor = Fixers.markdownExtractor();
    const result = await extractor.apply(input, mockContext as any);

    console.log('Success:', result.success);
    console.log('Cleaned length:', result.cleanedJson?.length);
    console.log('Cleaned starts with:', result.cleanedJson?.substring(0, 50));
    console.log('Cleaned ends with:', result.cleanedJson?.substring(result.cleanedJson.length - 20));

    expect(result.success).toBe(true);
    expect(result.cleanedJson).toBeDefined();

    const parsed = JSON.parse(result.cleanedJson!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);

    console.log('✓ Array extracted successfully\n');
  });

  it('Step 2: Control character cleaning on extracted array', async () => {
    const mockContext = createMockContext(narrativeArray);

    console.log('=== STEP 2: Control Character Cleaning ===');
    console.log('Input is valid JSON:', isValidJSON(narrativeArray));

    const fixer = Fixers.controlCharacter();
    const result = await fixer.apply(narrativeArray, mockContext as any);

    console.log('Success:', result.success);
    console.log('Changed:', result.cleanedJson !== narrativeArray);
    console.log('Changes:', result.changes);

    if (result.cleanedJson) {
      const stillValid = isValidJSON(result.cleanedJson);
      console.log('Still valid JSON:', stillValid);

      if (stillValid) {
        const parsed = JSON.parse(result.cleanedJson);
        console.log('Still an array:', Array.isArray(parsed));
        console.log('Array length:', Array.isArray(parsed) ? parsed.length : 'N/A');
      }
    }

    console.log('✓ Control character step completed\n');
  });

  it('Step 3: Missing comma fixer on extracted array', async () => {
    const mockContext = createMockContext(narrativeArray);

    console.log('=== STEP 3: Missing Comma Fixer ===');
    console.log('Input is valid JSON:', isValidJSON(narrativeArray));

    const fixer = Fixers.missingComma();
    const result = await fixer.apply(narrativeArray, mockContext as any);

    console.log('Success:', result.success);
    console.log('Changed:', result.cleanedJson !== narrativeArray);
    console.log('Changes:', result.changes);

    if (result.cleanedJson) {
      const stillValid = isValidJSON(result.cleanedJson);
      console.log('Still valid JSON:', stillValid);

      if (stillValid) {
        const parsed = JSON.parse(result.cleanedJson);
        console.log('Still an array:', Array.isArray(parsed));
        console.log('Array length:', Array.isArray(parsed) ? parsed.length : 'N/A');
      } else {
        console.log('⚠️  BROKEN! This fixer corrupted the JSON!');
        console.log('Result preview:', result.cleanedJson.substring(0, 200));
      }
    }

    console.log('✓ Missing comma step completed\n');
  });

  it('Step 4: Structural repair on extracted array', async () => {
    const mockContext = createMockContext(narrativeArray);

    console.log('=== STEP 4: Structural Repair ===');
    console.log('Input is valid JSON:', isValidJSON(narrativeArray));

    const fixer = Fixers.structuralRepair();
    const result = await fixer.apply(narrativeArray, mockContext as any);

    console.log('Success:', result.success);
    console.log('Changed:', result.cleanedJson !== narrativeArray);
    console.log('Changes:', result.changes);

    if (result.cleanedJson) {
      const stillValid = isValidJSON(result.cleanedJson);
      console.log('Still valid JSON:', stillValid);

      if (stillValid) {
        const parsed = JSON.parse(result.cleanedJson);
        console.log('Still an array:', Array.isArray(parsed));
        console.log('Array length:', Array.isArray(parsed) ? parsed.length : 'N/A');
      } else {
        console.log('⚠️  BROKEN! This fixer corrupted the JSON!');
        console.log('Result preview:', result.cleanedJson?.substring(0, 200));
      }
    }

    console.log('✓ Structural repair step completed\n');
  });
});

function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}
