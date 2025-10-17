# FlatFormatter System

A powerful utility system for converting complex JSON objects into flat, readable text formats optimized for Large Language Model (LLM) consumption.

## Overview

The FlatFormatter system consists of three main components:

1. **FlatFormatter** - Core formatting utility with advanced features
2. **Preset System** - Pre-configured formatters for common entity types
3. **LLMContextBuilder** - Specialized builder for creating comprehensive LLM contexts

## Core Features

### FlatFormatter Service

- **Multiple output formats**: sections, numbered, table, separator
- **Array slicing**: Process only specific portions of large arrays
- **Computed fields**: Add calculated fields during formatting
- **Custom formatters**: Define how specific properties are displayed
- **Flexible configuration**: Extensive customization options
- **Null-safe processing**: Robust handling of missing or corrupted data

### Preset System

Pre-configured formatters for common entities:

- **CharacterPreset** - Character information formatting
- **ChapterPreset** - Chapter overview formatting  
- **GenrePreset** - Genre specification formatting
- **SettingPreset** - World/setting description formatting
- **PlotPreset** - Plot structure formatting
- **TargetAudiencePreset** - Audience specification formatting
- **NarrativePreset** - Writing style/narrative formatting
- **ChapterDataPreset** - Detailed chapter data formatting
- **PageSummaryPreset** - Page/section summary formatting

### LLMContextBuilder

Specialized builder for creating comprehensive contexts:

- **buildFullContext()** - Complete context with all available data
- **buildMinimalContext()** - Essential information only
- **buildStoryContext()** - Story-focused elements
- **buildStyleContext()** - Writing style and format guidance
- **formatPreviousChapterSummaries()** - Smart chapter history
- **formatFollowingChapters()** - Upcoming chapter information

## Quick Start

### Basic Usage

```typescript
import { FlatFormatter, FormatConfigurator } from './flat-formatter';

// Simple formatting
const data = { title: "Example", content: "Sample content" };
const formatted = FlatFormatter.flatten(data, { format: 'sections' });

// Advanced configuration
const config = new FormatConfigurator()
  .withFormat('numbered')
  .withEntryTitleKey('title')
  .ignoreEmptyValues(true)
  .build();

const result = FlatFormatter.flatten(data, config);
```

### Using Presets

```typescript
import { characterPreset, Character } from './presets';

const character: Character = {
  Name: "John Doe",
  Description: "A mysterious protagonist",
  Role: "Main character"
};

const formatted = characterPreset.formatForLLM(character, "## CHARACTER INFO:");
```

### Using LLMContextBuilder

```typescript
import { LLMContextBuilder } from './llm-context-builder';

const builder = new LLMContextBuilder();
const context = builder.buildFullContext(promptData);
```

## Advanced Features

### Array Slicing

Process only specific portions of large arrays:

```typescript
const result = FlatFormatter.sliceArray(largeArray, 0, 10, {
  format: 'numbered',
  entryTitleKey: 'name'
});
```

### Computed Fields

Add calculated fields during formatting:

```typescript
const config = new FormatConfigurator()
  .withComputedField('position', (item, index, allItems) => 
    `${index + 1} of ${allItems.length}`
  )
  .withComputedField('category', (item) => 
    item.type === 'main' ? 'PRIMARY' : 'SECONDARY'
  )
  .build();
```

### Custom Formatters

Define how specific properties are displayed:

```typescript
const config = new FormatConfigurator()
  .withCustomFormatter('date', (date) => new Date(date).toLocaleDateString())
  .withCustomFormatter('tags', (tags) => tags.join(' | '))
  .withCustomFormatter('status', (status) => status.toUpperCase())
  .build();
```

## Entity Types

The system includes comprehensive TypeScript interfaces:

- **Character** - Character definitions with personality, background, relationships
- **Chapter** - Chapter information with goals, conflicts, settings
- **ChapterData** - Detailed chapter data with context
- **Genre** - Genre specifications with conventions and themes
- **Setting** - World-building elements with culture, politics, geography
- **Plot** - Plot structure with conflicts, climax, resolution
- **TargetAudience** - Audience specifications with preferences
- **Narrative** - Writing style with voice, tense, techniques

## Configuration Options

### Format Types

- **sections** - Markdown-style sections with headers
- **numbered** - Numbered list format with indentation  
- **table** - Table-like format with borders
- **separator** - Custom separator-divided sections

### Customization Options

- **itemPrefix/itemSuffix** - Custom entry headers/footers
- **entryTitleKey** - Property to use as entry titles
- **keyValueSeparator** - Custom separator between keys and values
- **ignoredKeys** - Properties to exclude from output
- **ignoreEmptyValues** - Skip null/empty properties
- **indentLevel** - Indentation depth for nested structures

## Best Practices

### For LLM Optimization

1. **Use meaningful entry titles** - Set `entryTitleKey` to improve readability
2. **Ignore irrelevant data** - Use `ignoredKeys` to remove noise
3. **Choose appropriate formats** - numbered for lists, sections for detailed content
4. **Handle large datasets** - Use array slicing for performance
5. **Validate input data** - Use presets for automatic null-safety

### Performance Considerations

1. **Array slicing** - Process only needed portions of large arrays
2. **Ignore empty values** - Reduce output size with `ignoreEmptyValues: true`
3. **Custom formatters** - Keep formatting functions simple and fast
4. **Computed fields** - Use sparingly for complex calculations

## Error Handling

The system includes comprehensive error handling:

- **Null-safe processing** - Automatic handling of missing data
- **Fallback entities** - Generated when data is corrupted
- **Type validation** - Runtime checks for data integrity  
- **Graceful degradation** - Continues processing when individual items fail

## Integration

The FlatFormatter integrates seamlessly with:

- **BaseAIUseCase** - Format prompts in use case implementations
- **Message Templates** - Structure user messages with formatted context
- **Ollama Service** - Format data for AI model consumption
- **JSON Cleaner** - Clean data before formatting
- **Response Processor** - Format API responses

### Integration with Use Cases

```typescript
import { BaseAIUseCase } from '../usecases/base/base-ai.usecase';
import { FlatFormatter, settingPreset } from '../services/flat-formatter';
import { MY_USE_CASE_USER_TEMPLATE } from '../messages/my-usecase.messages';

export class MyUseCase extends BaseAIUseCase<MyRequest, MyResult> {
  protected getUserTemplate(): (formattedPrompt: string) => string {
    return MY_USE_CASE_USER_TEMPLATE;
  }

  protected formatUserMessage(prompt: any): string {
    // Use FlatFormatter to structure the context
    const formattedSetting = settingPreset.formatForLLM(
      prompt.setting, 
      "## STORY SETTING:"
    );
    
    return formattedSetting;
  }
}
```

## Examples

See the comprehensive examples in the main README.md for detailed usage patterns and real-world scenarios.