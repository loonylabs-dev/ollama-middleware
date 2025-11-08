import { CleaningEngine } from '../../../src/middleware/services/json-cleaner/recipe-system/core/cleaning-engine';
import { RecipeTemplates } from '../../../src/middleware/services/json-cleaner/recipe-system/recipes/templates';
import { Fixers } from '../../../src/middleware/services/json-cleaner/recipe-system/operations/fixers';

describe('Debug: Full Cleaning Flow for Array', () => {
  it('should manually test MarkdownBlockExtractor', async () => {
    const exactResponse = `\`\`\`json
[
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
]
\`\`\``;

    console.log('=== TESTING MANUAL MARKDOWN EXTRACTION ===');

    // Create a mock context
    const mockContext = {
      currentJson: exactResponse,
      hasDetection: (key: string) => key === 'markdown_code_block',
      originalJson: exactResponse,
      detectedIssues: ['markdown_code_block'],
      appliedOperations: [],
      qualityMetrics: {},
      checkpoints: new Map(),
      metadata: {}
    };

    const extractor = Fixers.markdownExtractor();
    const result = await extractor.apply(exactResponse, mockContext as any);

    console.log('Result success:', result.success);
    console.log('Result confidence:', result.confidence);
    console.log('Cleaned JSON length:', result.cleanedJson?.length);
    console.log('Cleaned JSON first 100:', result.cleanedJson?.substring(0, 100));
    console.log('Cleaned JSON last 100:', result.cleanedJson?.substring(result.cleanedJson.length - 100));
    console.log('Starts with [:', result.cleanedJson?.trim().startsWith('['));
    console.log('Ends with ]:', result.cleanedJson?.trim().endsWith(']'));

    if (result.cleanedJson) {
      try {
        const parsed = JSON.parse(result.cleanedJson);
        console.log('Parse successful!');
        console.log('Is array:', Array.isArray(parsed));
        console.log('Array length:', Array.isArray(parsed) ? parsed.length : 'N/A');
      } catch (e) {
        console.log('Parse failed:', e instanceof Error ? e.message : e);
      }
    }

    expect(result.success).toBe(true);
    expect(result.cleanedJson).toBeDefined();
  });
});
