import { CleaningEngine } from '../../../src/middleware/services/json-cleaner/recipe-system/core/cleaning-engine';
import { RecipeTemplates } from '../../../src/middleware/services/json-cleaner/recipe-system/recipes/templates';
import { JsonCleanerService } from '../../../src/middleware/services/json-cleaner/json-cleaner.service';

describe('Scribomate Narrative Issue - Exact reproduction', () => {
  it('should handle the exact response from Scribomate logs', async () => {
    // This is the EXACT response from the Scribomate logs (line 258 in the log file)
    const exactResponse = `\`\`\`json
[
  {
    "Narrativ_Name": "Lineare Abenteuerreise",
    "Narrativ_Beschreibung": "Die Geschichte wird in chronologischer Reihenfolge erzählt, von Anfang bis Ende. Der Fokus liegt auf einer klaren Handlung und den Abenteuern der Charaktere.",
    "Narrativ_Erzähltechnik": "Allwissender Erzähler, der die Gedanken und Gefühle der Charaktere kennt und die Handlung vorantreibt.",
    "Narrativ_Zeitliche_Struktur": "Chronologisch, die Ereignisse werden in der Reihenfolge ihres Auftretens erzählt.",
    "Narrativ_Perspektive": "Dritte Person, allwissend.",
    "Narrativ_Wirkung": {
      "Lesererfahrung": "Der Leser wird direkt in das Abenteuer hineingezogen und kann die Reise der Charaktere mühelos verfolgen. Die klare Struktur ermöglicht ein leichtes Verständnis der Handlung.",
      "Narrative_Stärken": ["Klarheit", "Leicht verständlich", "Spannung durch linearen Fortschritt"],
      "Herausforderungen": ["Kann vorhersehbar wirken", "Weniger Raum für komplexe Interpretationen"]
    },
    "Narrativ_Stilistische_Elemente": {
      "Dialog_Anteil": "Mittel",
      "Dialog_Stil": "Lebendig und natürlich, passend zur jeweiligen Figur.",
      "Sprachlicher_Stil": "Bildhaft und beschreibend, um die Welt und die Charaktere lebendig zu machen.",
      "Satzkomplexität": "Einfach bis mittel, um die Lesbarkeit zu gewährleisten.",
      "Rhythmus": "Gemischt mit variierender Länge, um die Spannung zu halten und die Atmosphäre zu unterstützen."
    }
  },
  {
    "Narrativ_Name": "Episodische Reise mit Kernhandlung",
    "Narrativ_Beschreibung": "Die Geschichte besteht aus einzelnen Episoden, die jeweils ein kleines Abenteuer oder eine Herausforderung darstellen. Diese Episoden sind durch eine übergreifende Kernhandlung miteinander verbunden.",
    "Narrativ_Erzähltechnik": "Dritter Erzähler, der sich auf die einzelnen Episoden konzentriert und die Verbindung zur Kernhandlung hervorhebt.",
    "Narrativ_Zeitliche_Struktur": "Die Episoden können in chronologischer Reihenfolge erzählt werden oder leicht verschachtelt sein, solange die Kernhandlung erkennbar bleibt.",
    "Narrativ_Perspektive": "Dritte Person, wechselnd innerhalb der Episoden, aber immer mit Fokus auf die Kernhandlung.",
    "Narrativ_Wirkung": {
      "Lesererfahrung": "Der Leser erlebt eine Vielzahl von Abenteuern und lernt die Charaktere in verschiedenen Situationen kennen. Die Episodenstruktur ermöglicht es, die Geschichte in kleinen Häppchen zu erleben und die Spannung aufrechtzuerhalten.",
      "Narrative_Stärken": ["Abwechslungsreich", "Spannung durch einzelne Abenteuer", "Charakterentwicklung durch verschiedene Situationen"],
      "Herausforderungen": ["Kann zerfahren wirken, wenn die Verbindung zur Kernhandlung nicht klar ist", "Erfordert eine gute Strukturierung der Episoden"]
    },
    "Narrativ_Stilistische_Elemente": {
      "Dialog_Anteil": "Hoch",
      "Dialog_Stil": "Lebendig und natürlich, um die Persönlichkeit der Charaktere zu betonen und die Atmosphäre zu schaffen.",
      "Sprachlicher_Stil": "Bildhaft und beschreibend, um die Welt und die Charaktere lebendig zu machen.",
      "Satzkomplexität": "Einfach bis mittel, um die Lesbarkeit zu gewährleisten.",
      "Rhythmus": "Gemischt mit variierender Länge, um die Spannung zu halten und die Atmosphäre zu unterstützen."
    }
  }
]
\`\`\``;

    console.log('=== EXACT RESPONSE FROM LOGS ===');
    console.log('Length:', exactResponse.length);
    console.log('First char:', exactResponse.charAt(0), '(code:', exactResponse.charCodeAt(0), ')');
    console.log('Last char:', exactResponse.charAt(exactResponse.length - 1), '(code:', exactResponse.charCodeAt(exactResponse.length - 1), ')');
    console.log('Starts with backticks:', exactResponse.startsWith('```'));
    console.log('Ends with backticks:', exactResponse.endsWith('```'));
    console.log('\n');

    // Test with JsonCleanerService (like Scribomate does)
    const result = await JsonCleanerService.processResponseAsync(exactResponse);

    console.log('=== CLEANING RESULT ===');
    console.log('Cleaned length:', result.cleanedJson.length);
    console.log('Cleaned preview:', result.cleanedJson.substring(0, 100));
    console.log('Starts with [:', result.cleanedJson.trim().startsWith('['));
    console.log('\n');

    // Verify it's valid JSON
    expect(result.cleanedJson).toBeDefined();

    let parsed;
    try {
      parsed = JSON.parse(result.cleanedJson);
      console.log('✅ JSON.parse() successful');
      console.log('Is array:', Array.isArray(parsed));
      console.log('Length:', parsed.length);
    } catch (error) {
      console.log('❌ JSON.parse() failed:', error);
      throw error;
    }

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
    expect(parsed[0].Narrativ_Name).toBe('Lineare Abenteuerreise');
    expect(parsed[1].Narrativ_Name).toBe('Episodische Reise mit Kernhandlung');
  });

  it('should also work with the adaptive recipe directly', async () => {
    const exactResponse = `\`\`\`json
[
  {
    "Narrativ_Name": "Lineare Abenteuerreise",
    "Narrativ_Beschreibung": "Die Geschichte wird in chronologischer Reihenfolge erzählt, von Anfang bis Ende. Der Fokus liegt auf einer klaren Handlung und den Abenteuern der Charaktere.",
    "Narrativ_Erzähltechnik": "Allwissender Erzähler, der die Gedanken und Gefühle der Charaktere kennt und die Handlung vorantreibt.",
    "Narrativ_Zeitliche_Struktur": "Chronologisch, die Ereignisse werden in der Reihenfolge ihres Auftretens erzählt.",
    "Narrativ_Perspektive": "Dritte Person, allwissend.",
    "Narrativ_Wirkung": {
      "Lesererfahrung": "Der Leser wird direkt in das Abenteuer hineingezogen und kann die Reise der Charaktere mühelos verfolgen. Die klare Struktur ermöglicht ein leichtes Verständnis der Handlung.",
      "Narrative_Stärken": ["Klarheit", "Leicht verständlich", "Spannung durch linearen Fortschritt"],
      "Herausforderungen": ["Kann vorhersehbar wirken", "Weniger Raum für komplexe Interpretationen"]
    },
    "Narrativ_Stilistische_Elemente": {
      "Dialog_Anteil": "Mittel",
      "Dialog_Stil": "Lebendig und natürlich, passend zur jeweiligen Figur.",
      "Sprachlicher_Stil": "Bildhaft und beschreibend, um die Welt und die Charaktere lebendig zu machen.",
      "Satzkomplexität": "Einfach bis mittel, um die Lesbarkeit zu gewährleisten.",
      "Rhythmus": "Gemischt mit variierender Länge, um die Spannung zu halten und die Atmosphäre zu unterstützen."
    }
  },
  {
    "Narrativ_Name": "Episodische Reise mit Kernhandlung",
    "Narrativ_Beschreibung": "Die Geschichte besteht aus einzelnen Episoden, die jeweils ein kleines Abenteuer oder eine Herausforderung darstellen. Diese Episoden sind durch eine übergreifende Kernhandlung miteinander verbunden.",
    "Narrativ_Erzähltechnik": "Dritter Erzähler, der sich auf die einzelnen Episoden konzentriert und die Verbindung zur Kernhandlung hervorhebt.",
    "Narrativ_Zeitliche_Struktur": "Die Episoden können in chronologischer Reihenfolge erzählt werden oder leicht verschachtelt sein, solange die Kernhandlung erkennbar bleibt.",
    "Narrativ_Perspektive": "Dritte Person, wechselnd innerhalb der Episoden, aber immer mit Fokus auf die Kernhandlung.",
    "Narrativ_Wirkung": {
      "Lesererfahrung": "Der Leser erlebt eine Vielzahl von Abenteuern und lernt die Charaktere in verschiedenen Situationen kennen. Die Episodenstruktur ermöglicht es, die Geschichte in kleinen Häppchen zu erleben und die Spannung aufrechtzuerhalten.",
      "Narrative_Stärken": ["Abwechslungsreich", "Spannung durch einzelne Abenteuer", "Charakterentwicklung durch verschiedene Situationen"],
      "Herausforderungen": ["Kann zerfahren wirken, wenn die Verbindung zur Kernhandlung nicht klar ist", "Erfordert eine gute Strukturierung der Episoden"]
    },
    "Narrativ_Stilistische_Elemente": {
      "Dialog_Anteil": "Hoch",
      "Dialog_Stil": "Lebendig und natürlich, um die Persönlichkeit der Charaktere zu betonen und die Atmosphäre zu schaffen.",
      "Sprachlicher_Stil": "Bildhaft und beschreibend, um die Welt und die Charaktere lebendig zu machen.",
      "Satzkomplexität": "Einfach bis mittel, um die Lesbarkeit zu gewährleisten.",
      "Rhythmus": "Gemischt mit variierender Länge, um die Spannung zu halten und die Atmosphäre zu unterstützen."
    }
  }
]
\`\`\``;

    const engine = CleaningEngine.getInstance();
    const recipe = RecipeTemplates.adaptive();

    const result = await engine.clean(exactResponse, recipe, { source: 'unit-test', mode: 'adaptive' });

    console.log('=== ADAPTIVE RECIPE RESULT ===');
    console.log('Success:', result.success);
    console.log('IsValidJson:', result.quality.isValidJson);
    console.log('Cleaned length:', result.cleanedJson?.length);

    if (!result.success) {
      console.log('Error:', result.error);
    }

    expect(result.success).toBe(true);
    expect(result.quality.isValidJson).toBe(true);

    const parsed = JSON.parse(result.cleanedJson!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
  });
});
