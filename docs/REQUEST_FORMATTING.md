# Request Formatting Guide

This guide explains when and how to use **FlatFormatter** vs **RequestFormatterService** for formatting data for LLM consumption.

## Table of Contents

- [Overview](#overview)
- [FlatFormatter](#flatformatter)
- [RequestFormatterService](#requestformatterservice)
- [When to Use What](#when-to-use-what)
- [Examples](#examples)
- [Best Practices](#best-practices)

---

## Overview

Ollama Middleware provides two main tools for formatting data:

| Tool | Purpose | Best For |
|------|---------|----------|
| **FlatFormatter** | Object-to-string formatting | Simple, flat data structures |
| **RequestFormatterService** | Complex prompt handling | Nested prompts with context + instruction |

---

## FlatFormatter

**Purpose:** Convert flat or structured objects into LLM-readable strings.

### Quick Start

```typescript
import { FlatFormatter } from 'llm-middleware';

const data = { name: 'Alice', age: 30, role: 'Engineer' };

const formatted = FlatFormatter.flatten(data, {
  format: 'numbered',
  keyValueSeparator: ': '
});

// Output:
// 1. name: Alice
// 2. age: 30
// 3. role: Engineer
```

### Advanced Features

- **Presets** for common entities (Character, Chapter, Genre, etc.)
- **Computed fields** for dynamic values
- **Array slicing** for large datasets
- **Custom formatting** options

**Full documentation:**
- [FlatFormatter README](../src/middleware/services/flat-formatter/README.md)
- [FlatFormatter Examples](../src/middleware/services/flat-formatter/EXAMPLE.md)

---

## RequestFormatterService

**Purpose:** Handle complex, nested prompt structures with context and instruction separation.

### Quick Start

```typescript
import { RequestFormatterService } from 'llm-middleware';

const prompt = {
  context: {
    genre: 'sci-fi',
    tone: 'dark',
    setting: 'dystopian future'
  },
  instruction: 'Write the opening paragraph'
};

const formatted = RequestFormatterService.formatUserMessage(
  prompt,
  (s) => s,  // template function
  'MyUseCase'
);
```

**Output:**
```
## CONTEXT:
genre: sci-fi
tone: dark
setting: dystopian future

## INSTRUCTION:
Write the opening paragraph
```

### Supported Prompt Formats

RequestFormatterService handles multiple input formats:

#### 1. Simple String
```typescript
const prompt = "Write a story about dragons";
```

#### 2. Object with Context + Instruction
```typescript
const prompt = {
  context: { genre: 'fantasy', tone: 'epic' },
  instruction: 'Write the battle scene'
};
```

#### 3. Nested Prompt Structure
```typescript
const prompt = {
  prompt: {
    context: { /* ... */ },
    instruction: 'Write something'
  }
};
```

### Key Methods

#### `formatUserMessage()`
Main formatting method - handles all prompt types.

```typescript
RequestFormatterService.formatUserMessage(
  prompt,           // string | object
  templateFn,       // (formatted: string) => string
  'MyUseCase'      // use case name for debugging
);
```

#### `extractContext()`
Extract context from various prompt formats.

```typescript
const ctx = RequestFormatterService.extractContext(prompt);
// Returns: { genre: 'fantasy', tone: 'epic' } or null
```

#### `extractInstruction()`
Extract user instruction from prompt.

```typescript
const instruction = RequestFormatterService.extractInstruction(prompt);
// Returns: "Write the battle scene"
```

#### `isValidPrompt()`
Validate that a prompt is not empty.

```typescript
if (!RequestFormatterService.isValidPrompt(prompt)) {
  throw new Error('Invalid prompt');
}
```

---

## When to Use What

### Use FlatFormatter When:

✅ You have **simple, flat data structures**
```typescript
const character = { name: 'Alice', age: 30, role: 'Hero' };
```

✅ You need **preset formatting** for entities
```typescript
// Create your own preset (see examples/flat-formatter-demo/)
import { BasePreset } from 'llm-middleware';
class MyEntityPreset extends BasePreset<MyEntity, ProcessedMyEntity> { /* ... */ }
const formatted = myEntityPreset.formatForLLM(entity);
```

✅ You're building **custom context** piece by piece
```typescript
const context = FlatFormatter.flatten(setting) + '\n\n' +
                FlatFormatter.flatten(genre);
```

✅ You need **fine-grained control** over formatting
```typescript
FlatFormatter.flatten(data, {
  format: 'bulleted',
  indent: 4,
  ignoredKeys: ['id', 'internal'],
  computedFields: { fullName: (d) => `${d.first} ${d.last}` }
});
```

### Use RequestFormatterService When:

✅ You have **nested prompt structures** from API requests
```typescript
// API receives this complex structure
{ prompt: { context: {...}, instruction: '...' } }
```

✅ You need **automatic context/instruction separation**
```typescript
// Automatically formatted into sections:
// ## CONTEXT:
// ...
// ## INSTRUCTION:
// ...
```

✅ You want **flexible prompt format support**
```typescript
// Handles string, object, nested - all in one
RequestFormatterService.formatUserMessage(anyPrompt, templateFn, 'UseCase');
```

✅ You need to **extract metadata** from prompts
```typescript
const context = RequestFormatterService.extractContext(prompt);
const instruction = RequestFormatterService.extractInstruction(prompt);
```

---

## Examples

### Example 1: Data Formatting (FlatFormatter)

```typescript
import { FlatFormatter } from 'llm-middleware';

class DataFormatterUseCase extends BaseAIUseCase {
  protected formatUserMessage(prompt: any): string {
    const { userData, preferences, constraints } = prompt;
    
    // Use FlatFormatter for any structured data
    const contextSections = [
      `## USER INFO:\n${FlatFormatter.flatten(userData, { format: 'separator' })}`,
      
      // Use FlatFormatter for custom structures
      `## PREFERENCES:\n${FlatFormatter.flatten(preferences, {
        format: 'bulleted',
        keyValueSeparator: ': '
      })}`,
      
      `## CONSTRAINTS:\n${FlatFormatter.flatten(
        constraints.map(c => ({ constraint: c, priority: "MUST FOLLOW" })),
        { format: 'numbered', ignoredKeys: ['constraint'] }
      )}`
    ];
    
    return contextSections.join('\n\n');
  }
}
```

### Example 2: Story Generator (RequestFormatterService)

```typescript
import { RequestFormatterService } from 'llm-middleware';

class StoryGeneratorUseCase extends BaseAIUseCase {
  protected formatUserMessage(prompt: any): string {
    // RequestFormatterService handles all formats automatically
    return RequestFormatterService.formatUserMessage(
      prompt,
      this.getUserTemplate(),
      'StoryGeneratorUseCase'
    );
  }
  
  protected createResult(content: string, usedPrompt: string): StoryResult {
    // Extract metadata for result
    const context = RequestFormatterService.extractContext(this.currentRequest?.prompt);
    const instruction = RequestFormatterService.extractInstruction(this.currentRequest?.prompt);
    
    return {
      generatedContent: content,
      story: content,
      extractedContext: context,
      extractedInstruction: instruction,
      // ...
    };
  }
}
```

---

## Best Practices

### 1. Choose the Right Tool

**Don't use RequestFormatterService for simple formatting:**
```typescript
// ❌ Overkill
RequestFormatterService.formatUserMessage({ name: 'Alice' }, t => t, 'X');

// ✅ Better
FlatFormatter.flatten({ name: 'Alice' });
```

### 2. Create Custom Presets

Create your own presets for your domain entities:

```typescript
import { BasePreset, ProcessedEntity } from 'llm-middleware';

// Define your entity and processed types
interface MyEntity { /* ... */ }
interface ProcessedMyEntity extends ProcessedEntity {
  [key: string]: string | number | boolean;
  /* ... normalized fields */ 
}

// Create preset class
class MyEntityPreset extends BasePreset<MyEntity, ProcessedMyEntity> {
  protected preprocessEntity(entity: MyEntity): ProcessedMyEntity {
    // Transform and normalize your data
    return { /* ... */ };
  }
}

// See src/examples/flat-formatter-demo/ for complete examples
```

### 3. Validate Prompts

```typescript
if (!RequestFormatterService.isValidPrompt(prompt)) {
  throw new Error('Prompt cannot be empty');
}
```

### 4. Extract Metadata

Use extraction methods to get structured data from prompts:

```typescript
const context = RequestFormatterService.extractContext(prompt);
const instruction = RequestFormatterService.extractInstruction(prompt);

// Use in results or logging
logger.info('Processing request', { 
  context, 
  instruction,
  useCaseName: this.constructor.name 
});
```

### 5. Combine Tools

You can use both together:

```typescript
protected formatUserMessage(prompt: any): string {
  // Use RequestFormatterService for overall structure
  const extracted = RequestFormatterService.extractPromptData(prompt);
  
  // Use FlatFormatter for specific nested objects
  const formattedContext = FlatFormatter.flatten(extracted.context, {
    format: 'numbered',
    ignoreEmptyValues: true
  });
  
  return `## CONTEXT:\n${formattedContext}\n\n## INSTRUCTION:\n${extracted.instruction}`;
}
```

---

## API Reference

### FlatFormatter

See [FlatFormatter README](../src/middleware/services/flat-formatter/README.md) for complete API.

### RequestFormatterService

| Method | Parameters | Returns | Purpose |
|--------|-----------|---------|---------|
| `formatUserMessage()` | `prompt, templateFn, useCaseName` | `string` | Main formatting method |
| `extractContext()` | `prompt` | `any \| null` | Extract context object |
| `extractInstruction()` | `prompt` | `string` | Extract instruction string |
| `isValidPrompt()` | `prompt` | `boolean` | Check if prompt is valid |
| `getPromptStats()` | `prompt` | `PromptStats` | Get prompt metadata |
| `mergePromptComponents()` | `components[]` | `string` | Merge multiple parts |
| `sanitizePrompt()` | `prompt` | `string` | Remove control chars |

---

## Related Documentation

- [FlatFormatter README](../src/middleware/services/flat-formatter/README.md)
- [FlatFormatter Examples](../src/middleware/services/flat-formatter/EXAMPLE.md)
- [Getting Started Guide](GETTING_STARTED.md)
- [Architecture Overview](ARCHITECTURE.md)
