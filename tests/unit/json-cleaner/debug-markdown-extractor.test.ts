import { Fixers } from '../../../src/middleware/services/json-cleaner/recipe-system/operations/fixers';

describe('Debug: MarkdownBlockExtractor', () => {
  it('should show what regex extracts from EXACT real-world response', () => {
    // This is the EXACT response from the LLM log line 257
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

    console.log('=== EXACT LLM RESPONSE ===');
    console.log('Length:', exactResponse.length);
    console.log('First 100 chars:', exactResponse.substring(0, 100));
    console.log('Last 50 chars:', exactResponse.substring(exactResponse.length - 50));

    // Test the regex directly
    const codeBlockPattern = /```(?:json|javascript|js)?\s*([\s\S]*?)```/gi;
    const matches = [...exactResponse.matchAll(codeBlockPattern)];

    console.log('\n=== REGEX MATCHES ===');
    console.log('Number of matches:', matches.length);

    if (matches.length > 0) {
      const match = matches[0];
      console.log('Full match[0] length:', match[0]?.length);
      console.log('Captured group[1] length:', match[1]?.length);
      console.log('Captured group[1] first 100:', match[1]?.substring(0, 100));
      console.log('Captured group[1] last 100:', match[1]?.substring(match[1].length - 100));
      console.log('Trimmed length:', match[1]?.trim().length);
      console.log('Starts with [:', match[1]?.trim().startsWith('['));
      console.log('Ends with ]:', match[1]?.trim().endsWith(']'));
    }

    // Test parsing
    if (matches.length > 0) {
      const content = matches[0][1].trim();
      console.log('\n=== JSON PARSE TEST ===');
      try {
        const parsed = JSON.parse(content);
        console.log('Parse successful!');
        console.log('Is array:', Array.isArray(parsed));
        console.log('Length:', Array.isArray(parsed) ? parsed.length : 'N/A');
      } catch (e) {
        console.log('Parse failed:', e instanceof Error ? e.message : e);
      }
    }
  });

  it('should show what regex extracts from real-world data', () => {
    const inner = `[
  {
    "Narrativ_Name": "Lineare Abenteuerreise",
    "Narrativ_Beschreibung": "Die Geschichte wird chronologisch erzählt, von Anfang bis Ende. Der Fokus liegt auf einer klaren Handlung und dem Fortschritt der Charaktere auf ihrer Reise."
  },
  {
    "Narrativ_Name": "Episodische Abenteuer mit wiederkehrenden Themen",
    "Narrativ_Beschreibung": "Die Geschichte besteht aus einzelnen, abgeschlossenen Episoden, die aber durch wiederkehrende Charaktere, Orte oder Themen miteinander verbunden sind."
  }
]`;
    const input = '```json\n' + inner + '\n```';

    console.log('=== INPUT ===');
    console.log('Length:', input.length);
    console.log('First 100 chars:', input.substring(0, 100));
    console.log('Last 50 chars:', input.substring(input.length - 50));

    // Test the regex directly
    const codeBlockPattern = /```(?:json|javascript|js)?\s*([\s\S]*?)```/gi;
    const matches = [...input.matchAll(codeBlockPattern)];

    console.log('\n=== REGEX MATCHES ===');
    console.log('Number of matches:', matches.length);

    if (matches.length > 0) {
      const match = matches[0];
      console.log('Full match[0]:', match[0].substring(0, 100), '...');
      console.log('Captured group[1] length:', match[1]?.length);
      console.log('Captured group[1] first 100:', match[1]?.substring(0, 100));
      console.log('Captured group[1] last 50:', match[1]?.substring(match[1].length - 50));
      console.log('Trimmed length:', match[1]?.trim().length);
      console.log('Starts with [:', match[1]?.trim().startsWith('['));
      console.log('Ends with ]:', match[1]?.trim().endsWith(']'));
    }

    // Test parsing
    if (matches.length > 0) {
      const content = matches[0][1].trim();
      console.log('\n=== JSON PARSE TEST ===');
      try {
        const parsed = JSON.parse(content);
        console.log('Parse successful!');
        console.log('Is array:', Array.isArray(parsed));
        console.log('Length:', Array.isArray(parsed) ? parsed.length : 'N/A');
      } catch (e) {
        console.log('Parse failed:', e instanceof Error ? e.message : e);
      }
    }
  });
});
