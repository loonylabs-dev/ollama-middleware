import { CleaningEngine } from '../../../src/middleware/services/json-cleaner/recipe-system/core/cleaning-engine';
import { Recipe } from '../../../src/middleware/services/json-cleaner/recipe-system/core/recipe-builder';
import { Conditions } from '../../../src/middleware/services/json-cleaner/recipe-system/core/conditions';
import { Fixers } from '../../../src/middleware/services/json-cleaner/recipe-system/operations/fixers';
import { Detectors } from '../../../src/middleware/services/json-cleaner/recipe-system/operations/detectors';

describe('Minimal Markdown Recipe Test', () => {
  it('should clean markdown with minimal custom recipe', async () => {
    const engine = CleaningEngine.getInstance();

    // Create a minimal recipe that just extracts markdown
    const minimalRecipe = Recipe.adaptive()
      .checkpoint('start')
      .use(Detectors.markdownBlock())
      .when(Conditions.hasDetection('markdown_code_block'))
        .use(Fixers.markdownExtractor())
      .validate()
      .configure({
        maxExecutionTime: 5000,
        targetConfidence: 0.7,
        continueOnError: true
      })
      .build();

    const inner = `[
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
    const input = '```json\n' + inner + '\n```';

    console.log('=== MINIMAL RECIPE TEST WITH FULL DATA ===');
    console.log('Input length:', input.length);

    const res = await engine.clean(input, minimalRecipe, { source: 'unit-test', mode: 'adaptive' });

    console.log('Success:', res.success);
    console.log('Valid JSON:', res.quality.isValidJson);
    console.log('Cleaned length:', res.cleanedJson?.length);
    console.log('Cleaned preview:', res.cleanedJson?.substring(0, 100));

    if (!res.success) {
      console.log('Error:', res.error);
      console.log('Quality:', res.quality);
    }

    if (res.cleanedJson) {
      try {
        const parsed = JSON.parse(res.cleanedJson);
        console.log('Is array:', Array.isArray(parsed));
        console.log('Length:', Array.isArray(parsed) ? parsed.length : 'N/A');
      } catch (e) {
        console.log('Parse error:', e instanceof Error ? e.message : e);
      }
    }

    expect(res.success).toBe(true);
    expect(res.quality.isValidJson).toBe(true);
  });
});
