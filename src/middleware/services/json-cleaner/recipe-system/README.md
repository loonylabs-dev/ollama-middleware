# Recipe-Based JSON Cleaning System

A flexible, extensible system for cleaning and repairing malformed JSON from LLM responses.

## Overview

The Recipe System provides:

- **Modular Operations**: Detectors find problems, Fixers repair them
- **Flexible Recipes**: Conservative, Aggressive, and Adaptive templates
- **Conditional Logic**: Conditional execution based on JSON state
- **Rollback Support**: Checkpoints enable safe experimentation
- **Detailed Metrics**: Tracking of changes, confidence, and performance

## Quick Start

### 1. Quick Clean (Easiest Method)

```typescript
import { JsonCleanerFactory } from './recipe-system';

const malformedJson = '{"name": "John" "age": 30}';
const result = await JsonCleanerFactory.quickClean(malformedJson);

if (result.success) {
  console.log('Cleaned JSON:', result.cleanedJson);
  console.log('Changes:', result.totalChanges);
  console.log('Confidence:', result.confidence);
}
```

### 2. With Specific Template

```typescript
import { CleaningEngine, RecipeTemplates } from './recipe-system';

const engine = CleaningEngine.getInstance();
const recipe = RecipeTemplates.adaptive();
const result = await engine.clean(malformedJson, recipe);
```

### 3. Via JsonCleanerService (Recommended)

```typescript
import { JsonCleanerService } from './json-cleaner.service';

// Async with new Recipe System (recommended)
const result = await JsonCleanerService.processResponseAsync(response);

// Sync for backwards compatibility (if needed)
const result = JsonCleanerService.processResponse(response);
```

## Available Templates

### Conservative
- Minimal changes
- Only safe operations
- Best choice for nearly-valid JSON

```typescript
const recipe = RecipeTemplates.conservative();
```

### Aggressive
- Maximum repair attempts
- Extraction from Markdown/Think-Tags
- Structural repairs
- Best choice for severe problems

```typescript
const recipe = RecipeTemplates.aggressive();
```

### Adaptive (Default)
- Intelligent analysis and strategy selection
- Balance between Conservative and Aggressive
- Best choice for unknown inputs

```typescript
const recipe = RecipeTemplates.adaptive();
```

## Custom Recipes

### Example 1: Simple Custom Recipe

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

### Example 2: With Rollback

```typescript
const safeRecipe = Recipe.create('safe-recipe', 'Safe with Rollback')
  .checkpoint('original')

  .use(Fixers.missingComma())
  .validate()

  // On error: rollback to original
  .when(Conditions.isInvalid())
    .rollbackTo('original')
    .use(Fixers.structuralRepair())

  .build();
```

### Example 3: Parallel Attempts (tryBest)

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

## Available Detectors

```typescript
import { Detectors } from './recipe-system';

// All available detectors:
Detectors.controlCharacter()  // \n, \t, etc.
Detectors.missingComma()      // Missing commas
Detectors.structural()        // Unbalanced brackets
Detectors.markdownBlock()     // ```json...```
Detectors.thinkTag()          // <think>...</think>
```

## Available Fixers

```typescript
import { Fixers } from './recipe-system';

// All available fixers:
Fixers.controlCharacter()      // Escape control chars
Fixers.missingComma()          // Insert missing commas
Fixers.markdownExtractor()     // Extract from Markdown
Fixers.thinkTagExtractor()     // Extract from Think-Tags
Fixers.structuralRepair()      // Repair brackets
```

## Conditions

```typescript
import { Conditions } from './recipe-system';

// Simple conditions:
Conditions.hasDetection('control_character')
Conditions.isValid()
Conditions.isInvalid()
Conditions.hasControlChars()
Conditions.hasMissingCommas()
Conditions.hasMarkdownCode()
Conditions.hasThinkTags()

// Combined conditions:
Conditions.and(...conditions)
Conditions.or(...conditions)
Conditions.not(condition)

// Threshold-based:
Conditions.confidenceAbove(0.8)
Conditions.changesBelow(10)
Conditions.timeElapsed(5000)
```

## Analysis and Validation

```typescript
import { JsonCleanerFactory } from './recipe-system';

// Analyze JSON and get recommendation
const analysis = JsonCleanerFactory.analyzeJson(malformedJson);
console.log('Recommended recipe:', analysis.recommendedRecipe);
console.log('Detected issues:', analysis.detectedIssues);
console.log('Difficulty:', analysis.estimatedDifficulty);

// Validation only, no cleaning
const validation = JsonCleanerFactory.validateJson(json);
console.log('Is valid:', validation.isValid);
console.log('Error:', validation.error);
console.log('Suggestions:', validation.suggestions);
```

## Metrics and Debugging

Each cleaning result contains detailed metrics:

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
├── core/              # Core Components
│   ├── cleaning-context.ts
│   ├── cleaning-engine.ts
│   ├── cleaning-recipe.ts
│   ├── recipe-builder.ts
│   ├── recipe-steps.ts
│   └── conditions.ts
├── operations/        # Detectors & Fixers
│   ├── detectors.ts
│   └── fixers.ts
├── recipes/          # Predefined Templates
│   └── templates.ts
├── factory.ts        # Convenience Factory
└── index.ts          # Barrel Export
```

## Testing

Unit tests in `tests/unit/json-cleaner/` directory:

```bash
npm run test:unit
```

Tests cover:
- ✅ Conservative recipe with valid JSON
- ✅ Markdown extraction
- ✅ Think-Tag extraction
- ✅ Missing comma fixes
- ✅ Structural repair

## Using the Recipe System

The Recipe System is fully integrated in `JsonCleanerService`:

```typescript
// ✅ Modern approach: Async method with Recipe System
const result = await JsonCleanerService.processResponseAsync(json);
```

Benefits of the Recipe System:
- Automatic recipe selection based on content analysis
- Better error handling with intelligent fallbacks
- More detailed metrics and quality scores
- Support for different cleaning strategies (conservative, aggressive, adaptive)

## Best Practices

1. **Use `processResponseAsync()` for new code**
   - Uses modern Recipe System
   - Legacy fallback guaranteed

2. **Quick Clean for simple cases**
   ```typescript
   const result = await JsonCleanerFactory.quickClean(json);
   ```

3. **Custom Recipes for special use cases**
   - Reusable cleaning logic
   - Project-specific requirements

4. **Monitor metrics**
   - Watch confidence levels
   - Track quality metrics
   - Low confidence → use more aggressive recipe

5. **Use checkpoints**
   - For experimental fixers
   - For safe rollback

## Next Steps

- [ ] Write integration tests
- [ ] Performance benchmarks
- [ ] Expand documentation
- [ ] Additional custom recipes for specific use cases
- [ ] Migration guide for existing projects

## Credits

Developed for the ollama-middleware project to provide robust JSON cleaning capabilities for LLM responses.
