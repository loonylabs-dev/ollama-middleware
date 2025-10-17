# FlatFormatter Presets - Usage Examples

## Overview

The Preset System provides pre-configured formatters for various entity types. Here are practical examples with expected outputs for different scenarios.

## Basic Usage

### 1. Simple Array Formatting

```typescript
import { characterPreset } from './presets';

const characters = [
  { Character_Name: "Alice", Character_Description: "Brave heroine" },
  { Character_Name: "Bob", Character_Description: "Wise mentor" }
];

// Standard formatting
const formatted = characterPreset.formatForLLM(characters);
```

**Output:**
```
[1] Alice
Name: Alice
Description: Brave heroine

[2] Bob
Name: Bob
Description: Wise mentor
```

### 2. Single Object vs Array

```typescript
// Single object (automatically without numbering)
const singleCharacter = characterPreset.formatForLLM(characters[0]);
```

**Output:**
```
=== CHARACTER ===
Name: Alice
Description: Brave heroine
```

## Custom Formats

### 3. Compact Format for Characters

```typescript
const compactFormat = characterPreset.createFormat()
  .withFormat('numbered')
  .ignoreKeys('Character_Strengths', 'Character_Weaknesses')
  .withCustomFormatter('Character_Description', (desc) => 
    desc.length > 50 ? desc.substring(0, 47) + '...' : desc
  )
  .build();

const compact = characterPreset.formatForLLM(characters, null, compactFormat);
```

**Output:**
```
[1] Alice
Name: Alice
Description: Brave heroine
Appearance: [if present]
Specialty: [if present]

[2] Bob
Name: Bob
Description: Wise mentor
Appearance: [if present]
Specialty: [if present]
```

### 4. Table Format for Settings

```typescript
const settings = [
  { Setting_Name: "Castle", Setting_Location: "Mountain Peak", Setting_Time: "Medieval" }
];

const tableFormat = settingPreset.createFormat()
  .withFormat('table')
  .withItemPrefix('|')
  .withItemSuffix('|')
  .withKeyValueSeparator(' | ')
  .build();

const tableOutput = settingPreset.formatForLLM(settings, "## SETTINGS ##", tableFormat);
```

**Output:**
```
## SETTINGS ##
| ENTRY 1 - Castle |
Name | Castle
Location | Mountain Peak
Time | Medieval
```

## Advanced Customizations

### 5. Custom Computed Fields

```typescript
const chapters = [
  { Chapter_Name: "Prologue", Chapter_Description: "A brief introduction to the world." },
  { Chapter_Name: "The Adventure Begins", Chapter_Description: "A very long description..." }
];

const enrichedFormat = chapterPreset.createFormat()
  .withComputedField('Length', (chapter, index, all) => 
    chapter.Chapter_Description.length > 100 ? 'Long' : 'Short'
  )
  .withComputedField('Order', (chapter, index, all) => {
    if (index === 0) return 'First Chapter';
    if (index === all.length - 1) return 'Last Chapter';
    return `Chapter ${index + 1} of ${all.length}`;
  })
  .withComputedField('Status', (chapter, index) => 
    index % 2 === 0 ? 'Even Position' : 'Odd Position'
  )
  .build();

const enriched = chapterPreset.formatForLLM(chapters, null, enrichedFormat);
```

**Output:**
```
=== CHAPTER 1 ===
Length: Short
Order: First Chapter
Status: Even Position
Name: Prologue
Description: A brief introduction to the world.

=== CHAPTER 2 ===
Length: Long
Order: Last Chapter
Status: Odd Position
Name: The Adventure Begins
Description: A very long description...
```

### 6. Array Slicing for Large Datasets

```typescript
const manyChapters = [
  { Chapter_Name: "Chapter 1", Chapter_Description: "First chapter" },
  { Chapter_Name: "Chapter 2", Chapter_Description: "Second chapter" },
  { Chapter_Name: "Chapter 3", Chapter_Description: "Third chapter" },
  { Chapter_Name: "Chapter 4", Chapter_Description: "Fourth chapter" },
  { Chapter_Name: "Chapter 5", Chapter_Description: "Fifth chapter" }
];

// Only first 3 chapters
const firstThree = chapterPreset.createFormat()
  .withArraySlice(0, 3)
  .withComputedField('Position', (item, index, all) => 
    `Showing ${index + 1} of ${Math.min(3, all.length)} (first 3 of ${all.length} total)`
  )
  .build();

const firstThreeOutput = chapterPreset.formatForLLM(manyChapters, null, firstThree);
```

**Output:**
```
=== CHAPTER 1 ===
Position: Showing 1 of 3 (first 3 of 5 total)
Name: Chapter 1
Description: First chapter

=== CHAPTER 2 ===
Position: Showing 2 of 3 (first 3 of 5 total)
Name: Chapter 2
Description: Second chapter

=== CHAPTER 3 ===
Position: Showing 3 of 3 (first 3 of 5 total)
Name: Chapter 3
Description: Third chapter
```

### 7. Middle Chapters (5-7)

```typescript
// Chapters 5-7 (0-based: Index 4-6)
const middleChapters = chapterPreset.createFormat()
  .withArraySlice(4, 7)
  .withIndexOffset(4)
  .withComputedField('Info', (item, index, all) => 
    `Showing Chapter ${index + 5} (Index ${index + 4})`
  )
  .build();
```

**Output (assuming we have 10 chapters):**
```
=== CHAPTER 5 ===
Info: Showing Chapter 5 (Index 4)
Name: Chapter 5
Description: Fifth chapter

=== CHAPTER 6 ===
Info: Showing Chapter 6 (Index 5)
Name: Chapter 6
Description: Sixth chapter
```

## Genre-Specific Applications

### 8. Horror Genre Focused Characters

```typescript
const horrorCharacters = [
  { 
    Character_Name: "Vladimir", 
    Character_Description: "A mysterious count with demonic powers",
    Character_Weaknesses: ["Fear of sunlight", "Garlic", "Dark past"]
  },
  { 
    Character_Name: "Emma", 
    Character_Description: "A brave detective",
    Character_Weaknesses: ["Fear of heights", "Claustrophobic"]
  }
];

const horrorCharacterFormat = characterPreset.createFormat()
  .withCustomFormatter('Character_Weaknesses', (weaknesses) => {
    const fearRelated = weaknesses.filter(w => 
      w.toLowerCase().includes('fear') || 
      w.toLowerCase().includes('dark')
    );
    return fearRelated.length > 0 
      ? `🦇 ${fearRelated.join(', ')}` 
      : weaknesses.join(', ');
  })
  .withComputedField('Horror-Factor', (character) => {
    const desc = character.Character_Description.toLowerCase();
    if (desc.includes('monster') || desc.includes('demon')) return '🔴 High';
    if (desc.includes('mysterious')) return '🟡 Medium';
    return '🟢 Low';
  })
  .build();

const horrorOutput = characterPreset.formatForLLM(horrorCharacters, null, horrorCharacterFormat);
```

**Output:**
```
[1] Vladimir
Horror-Factor: 🔴 High
Name: Vladimir
Description: A mysterious count with demonic powers
Weaknesses: 🦇 Fear of sunlight, Dark past

[2] Emma
Horror-Factor: 🟢 Low
Name: Emma
Description: A brave detective
Weaknesses: Fear of heights, Claustrophobic
```

## Performance Optimized Formats

### 9. Performance-Optimized Format

```typescript
// Simulate large dataset
const manyCharacters = Array.from({length: 100}, (_, i) => ({
  Character_Name: `Character ${i + 1}`,
  Character_Description: `Description for Character ${i + 1}`
}));

const performantFormat = characterPreset.createFormat()
  .withFormat('numbered')
  .ignoreEmptyValues(true)
  .withArraySlice(0, 3)  // Only show first 3
  .withComputedField('Batch-Info', (item, index, all) => 
    `${index + 1}/${Math.min(3, all.length)} (of ${all.length} total)`
  )
  .build();

const performantOutput = characterPreset.formatForLLM(manyCharacters, null, performantFormat);
```

**Output:**
```
[1] Character 1
Batch-Info: 1/3 (of 100 total)
Name: Character 1
Description: Description for Character 1

[2] Character 2
Batch-Info: 2/3 (of 100 total)
Name: Character 2
Description: Description for Character 2

[3] Character 3
Batch-Info: 3/3 (of 100 total)
Name: Character 3
Description: Description for Character 3
```

## Special Formatting

### 10. Separator Format with Custom Separators

```typescript
const separatorFormat = chapterPreset.createFormat()
  .withFormat('separator')
  .withSeparator('***')
  .withComputedField('Chapter-Type', (chapter, index, all) => {
    if (index === 0) return '🚀 Opening';
    if (index === all.length - 1) return '🏁 Finale';
    return '📖 Middle';
  })
  .build();

const separatorOutput = chapterPreset.formatForLLM(
  [
    { Chapter_Name: "Beginning", Chapter_Description: "The start" },
    { Chapter_Name: "Middle", Chapter_Description: "The development" },
    { Chapter_Name: "End", Chapter_Description: "The conclusion" }
  ], 
  null, 
  separatorFormat
);
```

**Output:**
```
*** ENTRY 1 - Beginning ***
Chapter-Type: 🚀 Opening
Name: Beginning
Description: The start

*** ENTRY 2 - Middle ***
Chapter-Type: 📖 Middle
Name: Middle
Description: The development

*** ENTRY 3 - End ***
Chapter-Type: 🏁 Finale
Name: End
Description: The conclusion
```

### 11. Combined Format with UseCase Integration

```typescript
// Example from a Use Case
const bookContext = {
  chapters: [
    { Chapter_Name: "Chapter 1", Chapter_Description: "First chapter" },
    { Chapter_Name: "Chapter 2", Chapter_Description: "Second chapter" }
  ],
  characters: [
    { Character_Name: "Hero", Character_Description: "Main character" },
    { Character_Name: "Villain", Character_Description: "Antagonist" }
  ]
};

const formattedChapters = chapterPreset.formatForLLM(
  bookContext.chapters,
  '## AVAILABLE CHAPTERS:'
);

const limitedCharacterFormat = characterPreset.createFormat()
  .withArraySlice(0, 2)
  .withComputedField('Importance', (char, index) => 
    index === 0 ? '⭐⭐⭐ Main Character' : '⭐⭐ Supporting Character'
  )
  .build();

const formattedCharacters = characterPreset.formatForLLM(
  bookContext.characters,
  '## CHARACTERS IN THE STORY:',
  limitedCharacterFormat
);

const combinedPrompt = `${formattedChapters}\n\n${formattedCharacters}`;
```

**Output:**
```
## AVAILABLE CHAPTERS:
=== CHAPTER 1 ===
Name: Chapter 1
Description: First chapter

=== CHAPTER 2 ===
Name: Chapter 2
Description: Second chapter

## CHARACTERS IN THE STORY:
[1] Hero
Importance: ⭐⭐⭐ Main Character
Name: Hero
Description: Main character

[2] Villain
Importance: ⭐⭐ Supporting Character
Name: Villain
Description: Antagonist
```

## Best Practices

### 12. Debug Format with Complete Data

```typescript
const debugCharacters = [
  { Character_Name: "Complete", Character_Description: "Full", Character_Strengths: ["A"] },
  { Character_Name: "Incomplete" } // Missing description
];

const debugFormat = characterPreset.createFormat()
  .withFormat('sections')
  .ignoreEmptyValues(false)
  .withComputedField('Debug-Info', (char, index) => ({
    index,
    hasAllFields: !!(char.Character_Name && char.Character_Description),
    fieldCount: Object.keys(char).length
  }))
  .withCustomFormatter('Debug-Info', (info) => 
    `Index: ${info.index}, Complete: ${info.hasAllFields}, Fields: ${info.fieldCount}`
  )
  .build();

const debugOutput = characterPreset.formatForLLM(debugCharacters, null, debugFormat);
```

**Output:**
```
=== CHARACTER 1 ===
Debug-Info: Index: 0, Complete: true, Fields: 3
Name: Complete
Description: Full
Appearance: 
Strengths: A
Weaknesses: 
Specialty: 

=== CHARACTER 2 ===
Debug-Info: Index: 1, Complete: false, Fields: 1
Name: Incomplete
Description: 
Appearance: 
Strengths: 
Weaknesses: 
Specialty: 
```

### 13. Conditional Formatting

```typescript
const plots = [
  { 
    Plot_Name: "Simple Story", 
    Plot_Description: "Short and sweet",
    Plot_KeyMoments: ["Start", "End"]
  },
  { 
    Plot_Name: "Complex Saga", 
    Plot_Description: "A very detailed description...",
    Plot_KeyMoments: ["Prologue", "Conflict", "Turn", "Climax", "Resolution", "Epilogue"]
  }
];

const conditionalFormat = plotPreset.createFormat()
  .withComputedField('Complexity', (plot) => {
    const moments = plot.Plot_KeyMoments?.length || 0;
    if (moments >= 5) return '⭐⭐⭐ Complex';
    if (moments >= 3) return '⭐⭐ Medium';
    return '⭐ Simple';
  })
  .withCustomFormatter('Plot_Description', (desc) => {
    const wordCount = desc.split(' ').length;
    if (wordCount < 10) return `📝 Short: ${desc}`;
    if (wordCount < 30) return `📄 Medium: ${desc}`;
    return `📚 Detailed: ${desc.substring(0, 100)}...`;
  })
  .build();

const conditionalOutput = plotPreset.formatForLLM(plots, null, conditionalFormat);
```

**Output:**
```
[1] Simple Story
Complexity: ⭐ Simple
Name: Simple Story
Description: 📝 Short: Short and sweet
KeyMoments: Start, End

[2] Complex Saga
Complexity: ⭐⭐⭐ Complex
Name: Complex Saga
Description: 📚 Detailed: A very detailed description...
KeyMoments: Prologue, Conflict, Turn, Climax, Resolution, Epilogue
```

These examples demonstrate the flexibility of the Preset System with concrete outputs, so you can see exactly how different configurations affect the result.
