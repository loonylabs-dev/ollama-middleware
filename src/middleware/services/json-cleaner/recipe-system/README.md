# Recipe-Based JSON Cleaning System

Ein flexibles, erweiterbares System zur Bereinigung und Reparatur von fehlerhaftem JSON aus LLM-Antworten.

## Überblick

Das Recipe-System wurde von scribomate migriert und bietet:

- **Modulare Operationen**: Detektoren finden Probleme, Fixer reparieren sie
- **Flexible Rezepte**: Conservative, Aggressive und Adaptive Templates
- **Konditionslogik**: Bedingte Ausführung basierend auf JSON-Zustand
- **Rollback-Support**: Checkpoints ermöglichen sicheres Experimentieren
- **Detaillierte Metriken**: Tracking von Änderungen, Confidence und Performance

## Schnellstart

### 1. Quick Clean (einfachste Methode)

```typescript
import { JsonCleanerFactory } from './recipe-system';

const malformedJson = '{"name": "John" "age": 30}';
const result = await JsonCleanerFactory.quickClean(malformedJson);

if (result.success) {
  console.log('Gereinigtes JSON:', result.cleanedJson);
  console.log('Änderungen:', result.totalChanges);
  console.log('Confidence:', result.confidence);
}
```

### 2. Mit spezifischem Template

```typescript
import { CleaningEngine, RecipeTemplates } from './recipe-system';

const engine = CleaningEngine.getInstance();
const recipe = RecipeTemplates.adaptive();
const result = await engine.clean(malformedJson, recipe);
```

### 3. Über JsonCleanerService (empfohlen)

```typescript
import { JsonCleanerService } from './json-cleaner.service';

// Async mit neuem Recipe-System (mit Legacy-Fallback)
const result = await JsonCleanerService.processResponseAsync(response);

// Sync mit Legacy-System (bestehende Kompatibilität)
const result = JsonCleanerService.processResponse(response);
```

## Verfügbare Templates

### Conservative
- Minimale Änderungen
- Nur sichere Operationen
- Beste Wahl für bereits fast valides JSON

```typescript
const recipe = RecipeTemplates.conservative();
```

### Aggressive
- Maximale Reparaturversuche
- Extraktion aus Markdown/Think-Tags
- Strukturelle Reparaturen
- Beste Wahl bei schweren Problemen

```typescript
const recipe = RecipeTemplates.aggressive();
```

### Adaptive (Standard)
- Intelligente Analyse und Strategie-Auswahl
- Balance zwischen Conservative und Aggressive
- Beste Wahl für unbekannte Eingaben

```typescript
const recipe = RecipeTemplates.adaptive();
```

## Custom Recipes

### Beispiel 1: Einfaches Custom Recipe

```typescript
import { Recipe, Conditions, Fixers } from './recipe-system';

const customRecipe = Recipe.create('my-recipe', 'Custom JSON Cleaner')
  .checkpoint('start')
  
  // Conditional fixing
  .when(Conditions.hasControlChars())
    .use(Fixers.controlCharacter())
    
  .when(Conditions.hasMissingCommas())
    .use(Fixers.missingComma())
    
  .validate()
  .build();
```

### Beispiel 2: Mit Rollback

```typescript
const safeRecipe = Recipe.create('safe-recipe', 'Safe with Rollback')
  .checkpoint('original')
  
  .use(Fixers.missingComma())
  .validate()
  
  // Bei Fehler: zurück zum Original
  .when(Conditions.isInvalid())
    .rollbackTo('original')
    .use(Fixers.structuralRepair())
    
  .build();
```

### Beispiel 3: Parallele Versuche (tryBest)

```typescript
const parallelRecipe = Recipe.create('parallel', 'Try Multiple Approaches')
  .tryBest(
    Fixers.markdownExtractor(),
    Fixers.thinkTagExtractor(),
    Fixers.controlCharacter()
  )
  .validate()
  .build();
```

## Verfügbare Detektoren

```typescript
import { Detectors } from './recipe-system';

// Alle verfügbaren Detektoren:
Detectors.controlCharacter()  // \n, \t, etc.
Detectors.missingComma()      // Fehlende Kommas
Detectors.structural()        // Unbalancierte Brackets
Detectors.markdownBlock()     // ```json...```
Detectors.thinkTag()          // <think>...</think>
```

## Verfügbare Fixer

```typescript
import { Fixers } from './recipe-system';

// Alle verfügbaren Fixer:
Fixers.controlCharacter()      // Escaped Control Chars
Fixers.missingComma()          // Fügt fehlende Kommas ein
Fixers.markdownExtractor()     // Extrahiert aus Markdown
Fixers.thinkTagExtractor()     // Extrahiert aus Think-Tags
Fixers.structuralRepair()      // Repariert Brackets
```

## Conditions (Bedingungen)

```typescript
import { Conditions } from './recipe-system';

// Einfache Conditions:
Conditions.hasDetection('control_character')
Conditions.isValid()
Conditions.isInvalid()
Conditions.hasControlChars()
Conditions.hasMissingCommas()
Conditions.hasMarkdownCode()
Conditions.hasThinkTags()

// Kombinierte Conditions:
Conditions.and(...conditions)
Conditions.or(...conditions)
Conditions.not(condition)

// Threshold-basiert:
Conditions.confidenceAbove(0.8)
Conditions.changesBelow(10)
Conditions.timeElapsed(5000)
```

## Analyse und Validierung

```typescript
import { JsonCleanerFactory } from './recipe-system';

// Analysiere JSON und erhalte Empfehlung
const analysis = JsonCleanerFactory.analyzeJson(malformedJson);
console.log('Empfohlenes Recipe:', analysis.recommendedRecipe);
console.log('Gefundene Probleme:', analysis.detectedIssues);
console.log('Schwierigkeit:', analysis.estimatedDifficulty);

// Nur Validierung ohne Cleaning
const validation = JsonCleanerFactory.validateJson(json);
console.log('Ist valide:', validation.isValid);
console.log('Fehler:', validation.error);
console.log('Vorschläge:', validation.suggestions);
```

## Metriken und Debugging

Jedes Cleaning-Result enthält detaillierte Metriken:

```typescript
const result = await engine.clean(json, recipe);

console.log('Quality Metrics:', result.quality);
// - isValidJson
// - cleaningConfidence
// - preservationRate
// - changeRate
// - structuralIntegrity

console.log('Recipe Metrics:', result.recipeResult.metrics);
// - totalTime
// - stepsExecuted
// - operationsPerformed
// - rollbacks

console.log('Changes:', result.totalChanges);
console.log('Confidence:', result.confidence);
```

## Architecture

```
recipe-system/
├── types/              # TypeScript Interfaces
│   ├── operation.types.ts
│   └── recipe.types.ts
├── core/              # Kern-Komponenten
│   ├── cleaning-context.ts
│   ├── cleaning-engine.ts
│   ├── cleaning-recipe.ts
│   ├── recipe-builder.ts
│   ├── recipe-steps.ts
│   └── conditions.ts
├── operations/        # Detektoren & Fixer
│   ├── detectors.ts
│   └── fixers.ts
├── recipes/          # Vordefinierte Templates
│   └── templates.ts
├── factory.ts        # Convenience Factory
└── index.ts          # Barrel Export
```

## Testing

Unit Tests im Verzeichnis `tests/unit/json-cleaner/`:

```bash
npm run test:unit
```

Tests decken ab:
- ✅ Conservative Recipe mit validem JSON
- ✅ Markdown-Extraktion
- ✅ Think-Tag-Extraktion
- ✅ Missing Comma Fixes
- ✅ Structural Repair

## Migration vom Legacy System

Das neue Recipe-System ist bereits in `JsonCleanerService` integriert:

```typescript
// Neue async Methode (nutzt Recipe-System mit Fallback)
const result = await JsonCleanerService.processResponseAsync(json);

// Legacy sync Methode (unverändert, für Kompatibilität)
const result = JsonCleanerService.processResponse(json);
```

Bei Migration zu `processResponseAsync`:
- Automatische Recipe-Auswahl
- Bessere Fehlerbehandlung
- Detailliertere Metriken
- Fallback zu Legacy-System bei Problemen

## Best Practices

1. **Verwende `processResponseAsync()` für neue Code**
   - Nutzt modernes Recipe-System
   - Fallback zu Legacy garantiert

2. **Quick Clean für einfache Fälle**
   ```typescript
   const result = await JsonCleanerFactory.quickClean(json);
   ```

3. **Custom Recipes für spezielle Use Cases**
   - Wiederverwendbare Cleaning-Logik
   - Projekt-spezifische Anforderungen

4. **Metriken überwachen**
   - Confidence-Level beachten
   - Quality-Metriken tracken
   - Bei niedriger Confidence: aggressiveres Recipe

5. **Checkpoints nutzen**
   - Für experimentelle Fixer
   - Zum sicheren Rollback

## Nächste Schritte

- [ ] Integration Tests schreiben
- [ ] Performance Benchmarks
- [ ] Dokumentation erweitern
- [ ] Weitere Custom Recipes für spezifische Use Cases
- [ ] Migration Guide für bestehende Projekte

## Credits

Migriert von `scribomate-backend/temp_recipe_files` mit Verbesserungen und Anpassungen für ollama-middleware.
