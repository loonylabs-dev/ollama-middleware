import { CleaningEngine } from '../../../src/middleware/services/json-cleaner/recipe-system/core/cleaning-engine';
import { RecipeTemplates } from '../../../src/middleware/services/json-cleaner/recipe-system/recipes/templates';

describe('Adaptive recipe with markdown extraction - Array handling', () => {
  it('should extract JSON array from markdown code block', async () => {
    const engine = CleaningEngine.getInstance();
    const recipe = RecipeTemplates.adaptive();

    // Simple array test
    const inner = '[{"ok":true,"n":3}, {"ok":false,"n":5}]';
    const input = '```json\n' + inner + '\n```';

    const res = await engine.clean(input, recipe, { source: 'unit-test', mode: 'adaptive' });

    expect(res.success).toBe(true);
    expect(res.cleanedJson).toBe(inner);
    expect(res.quality.isValidJson).toBe(true);

    // Verify it's still an array
    expect(res.cleanedJson).toBeDefined();
    const parsed = JSON.parse(res.cleanedJson!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
  });

  it('should extract complex JSON array with aggressive recipe', async () => {
    const engine = CleaningEngine.getInstance();
    const recipe = RecipeTemplates.aggressive();

    // Real data from the narrative use case that's failing
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

    const res = await engine.clean(input, recipe, { source: 'unit-test', mode: 'aggressive' });

    // Debug output
    if (!res.success) {
      console.log('=== CLEANING FAILED with AGGRESSIVE ===');
      console.log('Success:', res.success);
      console.log('Error:', res.error);
      console.log('Cleaned JSON length:', res.cleanedJson?.length);
      console.log('Cleaned JSON preview:', res.cleanedJson?.substring(0, 200));
      console.log('Quality:', res.quality);
    }

    expect(res.success).toBe(true);
    expect(res.quality.isValidJson).toBe(true);

    // Verify it's still an array
    expect(res.cleanedJson).toBeDefined();
    const parsed = JSON.parse(res.cleanedJson!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
    expect(parsed[0].Narrativ_Name).toBe('Lineare Abenteuerreise');
    expect(parsed[1].Narrativ_Name).toBe('Episodische Abenteuer mit wiederkehrenden Themen');
  });

  it('should extract complex JSON array from markdown code block (real-world narrative data)', async () => {
    const engine = CleaningEngine.getInstance();
    const recipe = RecipeTemplates.adaptive();

    // Real data from the narrative use case that's failing
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

    const res = await engine.clean(input, recipe, { source: 'unit-test', mode: 'adaptive' });

    // Debug output
    if (!res.success) {
      console.log('=== CLEANING FAILED ===');
      console.log('Success:', res.success);
      console.log('Error:', res.error);
      console.log('Cleaned JSON length:', res.cleanedJson?.length);
      console.log('Cleaned JSON preview:', res.cleanedJson?.substring(0, 200));
      console.log('Quality:', res.quality);
    }

    expect(res.success).toBe(true);
    expect(res.quality.isValidJson).toBe(true);

    // Verify it's still an array
    expect(res.cleanedJson).toBeDefined();
    const parsed = JSON.parse(res.cleanedJson!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
    expect(parsed[0].Narrativ_Name).toBe('Lineare Abenteuerreise');
    expect(parsed[1].Narrativ_Name).toBe('Episodische Abenteuer mit wiederkehrenden Themen');
  });
});
