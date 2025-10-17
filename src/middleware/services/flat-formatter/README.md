# FlatFormatter System

A powerful utility for converting complex objects into flat, readable text formats optimized for Large Language Model (LLM) consumption.

## Overview

**FlatFormatter** transforms structured data into LLM-friendly formats. Perfect for:
- Preparing context for AI prompts
- Formatting entities with consistent structure
- Converting JSON to readable text
- Building custom data pipelines

## Quick Start

```typescript
import { FlatFormatter } from 'ollama-middleware';

const data = {
  name: 'Alice',
  age: 30,
  occupation: 'Engineer',
  skills: 'TypeScript, React, Node.js'
};

// Basic formatting
const formatted = FlatFormatter.flatten(data);
console.log(formatted);
// Output:
// name: Alice
// age: 30
// occupation: Engineer  
// skills: TypeScript, React, Node.js
```

## Core Features

### Multiple Output Formats

```typescript
// Numbered list
FlatFormatter.flatten(data, { format: 'numbered' });
// 1. name: Alice
// 2. age: 30
// 3. occupation: Engineer

// Bulleted list
FlatFormatter.flatten(data, { format: 'bulleted' });
// • name: Alice
// • age: 30
// • occupation: Engineer

// Sections
FlatFormatter.flatten(data, { format: 'sections' });
// === name ===
// Alice
// === age ===
// 30

// Table format
FlatFormatter.flatten(data, { format: 'table' });
// | name        | Alice          |
// | age         | 30             |
// | occupation  | Engineer       |
```

### Array Formatting

```typescript
const users = [
  { name: 'Alice', role: 'Engineer' },
  { name: 'Bob', role: 'Designer' },
  { name: 'Charlie', role: 'Manager' }
];

FlatFormatter.flatten(users, { 
  format: 'numbered',
  entryTitleKey: 'name' 
});
// 1. Alice
//    role: Engineer
// 2. Bob
//    role: Designer
// 3. Charlie
//    role: Manager
```

### Array Slicing

```typescript
// Process only first 10 items
FlatFormatter.flatten(largeArray, {
  arraySliceStart: 0,
  arraySliceEnd: 10
});

// Process items 20-30
FlatFormatter.flatten(largeArray, {
  arraySliceStart: 20,
  arraySliceEnd: 30
});
```

### Computed Fields

Add dynamic fields during formatting:

```typescript
const person = { firstName: 'Alice', lastName: 'Smith', age: 30 };

FlatFormatter.flatten(person, {
  computedFields: {
    fullName: (p) => `${p.firstName} ${p.lastName}`,
    ageGroup: (p) => p.age < 30 ? 'Young' : 'Adult'
  }
});
// firstName: Alice
// lastName: Smith
// age: 30
// fullName: Alice Smith
// ageGroup: Adult
```

### Ignored Keys

```typescript
FlatFormatter.flatten(data, {
  ignoredKeys: ['id', 'internal', 'metadata']
});
// These keys won't appear in output
```

### Custom Separators and Formatting

```typescript
FlatFormatter.flatten(data, {
  keyValueSeparator: ' = ',
  indent: 4,
  lineBreak: '\n\n'
});
```

## Using Presets

Presets encapsulate preprocessing logic for domain entities.

### Using the Example Preset

```typescript
import { personPreset } from 'ollama-middleware';

const person = {
  name: 'Alice',
  age: 30,
  email: 'alice@example.com',
  occupation: 'Engineer'
};

const formatted = personPreset.formatForLLM(person, "## USER PROFILE:");
// ## USER PROFILE:
// Name: Alice
// Age: 30
// Email: alice@example.com
// Occupation: Engineer
```

### Creating Custom Presets

#### Simple Preset Example

```typescript
import { BasePreset } from 'ollama-middleware';

// For simple entities
class MyEntityPreset extends BasePreset<MyEntity, ProcessedMyEntity> {
  protected preprocessEntity(entity: MyEntity): ProcessedMyEntity {
    return {
      'Name': entity.name || 'Unknown',
      'Value': String(entity.value || 0)
    };
  }
}
```

#### Complex Preset Example

See **`src/examples/flat-formatter-demo/product-preset.example.ts`** for a complete example.

The **ProductPreset** demonstrates advanced preprocessing:

```typescript
// From src/examples/flat-formatter-demo/product-preset.example.ts
import { productPreset, Product } from './examples/flat-formatter-demo/product-preset.example';

const product: Product = {
  name: 'Wireless Mouse',
  description: 'Ergonomic wireless mouse with 3-year warranty',
  category: 'Electronics',
  
  // Nested object
  pricing: {
    basePrice: 29.99,
    currency: 'USD',
    discountPercent: 15
  },
  
  // Arrays
  features: ['Bluetooth 5.0', 'Ergonomic design', '3-year warranty'],
  tags: ['wireless', 'office', 'productivity'],
  
  // Nested object with arrays
  metadata: {
    manufacturer: 'TechCorp',
    origin: 'USA',
    certifications: ['CE', 'FCC', 'RoHS']
  },
  
  // Array of objects
  reviews: [
    { rating: 5, comment: 'Great mouse!', author: 'Alice' },
    { rating: 4, comment: 'Very comfortable', author: 'Bob' }
  ],
  
  inStock: true,
  quantity: 42
};

const formatted = productPreset.formatForLLM(product, "## PRODUCT:");
```

**Output:**
```
## PRODUCT:
Name: Wireless Mouse
Description: Ergonomic wireless mouse with 3-year warranty
Category: Electronics
Price: 29.99 USD
Discount: 15% OFF
Final Price: 25.49 USD
Features: Bluetooth 5.0, Ergonomic design, 3-year warranty
Tags: wireless, office, productivity
Manufacturer: TechCorp
Origin: USA
Certifications: CE, FCC, RoHS
Average Rating: 4.5 / 5
Review Count: 2 reviews
Sample Reviews: "Great mouse!" (5/5) - Alice; "Very comfortable" (4/5) - Bob
Availability: In Stock (42 units available)
```

**Key preprocessing techniques shown:**
- Nested object access: `product.pricing.basePrice`
- Array joining: `product.features?.join(', ')`
- Array mapping: `reviews.map(r => ...)`
- Calculations: `basePrice * (1 - discount / 100)`
- String composition: `` `${price} ${currency}` ``
- Optional chaining: `product.metadata?.certifications`
- Fallback values: `product.features || 'None'`

### Advanced Preset Usage

```typescript
// Custom format configuration
const customFormat = productPreset
  .createFormat()
  .withFormat('sections')
  .withItemPrefix('=== PRODUCT')
  .withItemSuffix('===')
  .ignoreEmptyValues(true)
  .build();

const formatted = productPreset.formatForLLM(
  products, 
  "## PRODUCTS:", 
  customFormat
);
```

## Configuration Options

### FormatConfig

```typescript
interface FormatConfig {
  format?: 'sections' | 'numbered' | 'table' | 'separator' | 'bulleted';
  keyValueSeparator?: string;
  lineBreak?: string;
  indent?: number;
  entryTitleKey?: string;
  entryTitleAsPrefix?: boolean;
  itemPrefix?: string;
  itemSuffix?: string;
  ignoredKeys?: string[];
  ignoreEmptyValues?: boolean;
  arraySliceStart?: number;
  arraySliceEnd?: number;
  computedFields?: ComputedFieldOptions;
  indexField?: { name: string; startValue: number };
}
```

## Best Practices

### 1. Choose the Right Format

- **sections**: For distinct entities with clear boundaries
- **numbered**: For sequential lists or ranked items
- **bulleted**: For unordered lists
- **table**: For side-by-side comparison
- **separator**: For minimal, clean output

### 2. Use Presets for Consistent Entities

If you repeatedly format the same entity type, create a preset:

```typescript
// ✅ Good - reusable, consistent
const formatted = productPreset.formatForLLM(product);

// ❌ Avoid - repetitive, inconsistent
FlatFormatter.flatten(product, { /* same config every time */ });
```

### 3. Leverage Computed Fields

Add derived data without modifying source objects:

```typescript
FlatFormatter.flatten(order, {
  computedFields: {
    totalPrice: (o) => o.items.reduce((sum, i) => sum + i.price, 0),
    itemCount: (o) => o.items.length
  }
});
```

### 4. Handle Large Arrays

Use slicing for better performance:

```typescript
// Show first 20 results
FlatFormatter.flatten(results, {
  arraySliceStart: 0,
  arraySliceEnd: 20
});
```

### 5. Ignore Internal Fields

```typescript
FlatFormatter.flatten(entity, {
  ignoredKeys: ['id', '_internal', '__typename', 'createdAt', 'updatedAt']
});
```

## API Reference

### FlatFormatter.flatten()

```typescript
static flatten(
  data: any,
  config?: FormatConfig
): string
```

Main formatting method. Converts data to formatted string.

### BasePreset.formatForLLM()

```typescript
formatForLLM(
  entity: T | T[] | null | undefined,
  header?: string,
  config?: FormatConfig
): string
```

Format entities using preset preprocessing.

### FormatConfigurator

Fluent API for building format configurations:

```typescript
preset
  .createFormat()
  .withFormat('numbered')
  .withItemPrefix('ITEM')
  .ignoreEmptyValues(true)
  .withArraySlice(0, 10)
  .build();
```

## Examples

See [EXAMPLE.md](./EXAMPLE.md) for comprehensive usage examples.

## Related Documentation

- [Main Documentation](../../../docs/README.md)
- [Request Formatting Guide](../../../docs/REQUEST_FORMATTING.md)
- [Getting Started](../../../docs/GETTING_STARTED.md)
