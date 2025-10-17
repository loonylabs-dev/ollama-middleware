# FlatFormatter Demo Examples

This directory contains **example implementations** demonstrating how to use the FlatFormatter system.

## Purpose

These examples are **not part of the core middleware**. They serve as:
- **Templates** for creating your own domain-specific presets
- **Demonstrations** of advanced FlatFormatter techniques
- **Learning resources** for understanding preprocessing patterns

## Files

### `product-preset.example.ts`

Complete example demonstrating **advanced FlatFormatter capabilities**:

**Features demonstrated:**
- ✅ Nested objects (`pricing: { basePrice, currency }`)
- ✅ Arrays (`features[]`, `tags[]`)
- ✅ Nested objects with arrays (`metadata.certifications[]`)
- ✅ Array of objects (`reviews: [{ rating, comment }]`)
- ✅ Calculations (discount, averages)
- ✅ Array transformations (`.map()`, `.slice()`, `.join()`)
- ✅ Optional chaining (`product.metadata?.certifications`)
- ✅ Fallback values for missing data
- ✅ String composition and formatting

**Usage:**

```typescript
import { productPreset, Product } from './product-preset.example';

const product: Product = {
  name: 'Wireless Mouse',
  description: 'Ergonomic design',
  category: 'Electronics',
  pricing: {
    basePrice: 29.99,
    currency: 'USD',
    discountPercent: 15
  },
  features: ['Bluetooth', 'Rechargeable'],
  tags: ['wireless', 'productivity'],
  metadata: {
    manufacturer: 'TechCorp',
    origin: 'USA',
    certifications: ['CE', 'FCC']
  },
  reviews: [
    { rating: 5, comment: 'Great product!', author: 'Alice' }
  ],
  inStock: true,
  quantity: 50
};

const formatted = productPreset.formatForLLM(product, "## PRODUCT:");
console.log(formatted);
```

**Output:**
```
## PRODUCT:
Name: Wireless Mouse
Description: Ergonomic design
Category: Electronics
Price: 29.99 USD
Discount: 15% OFF
Final Price: 25.49 USD
Features: Bluetooth, Rechargeable
Tags: wireless, productivity
Manufacturer: TechCorp
Origin: USA
Certifications: CE, FCC
Average Rating: 5.0 / 5
Review Count: 1 review
Sample Reviews: "Great product!" (5/5) - Alice
Availability: In Stock (50 units available)
```

## Creating Your Own Presets

Use these examples as templates:

### 1. Define Your Entity Types

```typescript
// Your raw entity (input)
export interface MyEntity {
  id?: string;
  name: string;
  // ... your fields
}

// Your processed entity (LLM-ready)
export interface ProcessedMyEntity extends ProcessedEntity {
  [key: string]: string | number | boolean;  // Required
  
  'Display Name': string;
  // ... normalized fields (all strings)
}
```

### 2. Create Your Preset Class

```typescript
import { BasePreset } from '../../middleware/services/flat-formatter';

export class MyEntityPreset extends BasePreset<MyEntity, ProcessedMyEntity> {
  constructor() {
    super('MyEntity');
  }

  protected preprocessEntity(entity: MyEntity): ProcessedMyEntity {
    return {
      'Display Name': entity.name || 'Unknown',
      // ... transform your data
    };
  }
}

export const myEntityPreset = new MyEntityPreset();
```

### 3. Use It

```typescript
const formatted = myEntityPreset.formatForLLM(myEntity, "## MY ENTITY:");
```

## Key Patterns

### Array Handling

```typescript
// Join array to string
'Features': product.features?.join(', ') || 'None'

// Map array of objects
const sampleReviews = reviews
  .slice(0, 2)
  .map(r => `"${r.comment}" (${r.rating}/5)`)
  .join('; ');
```

### Nested Object Flattening

```typescript
// Access nested properties
const basePrice = product.pricing.basePrice;
const currency = product.pricing.currency;

// Format as single field
'Price': `${basePrice.toFixed(2)} ${currency}`
```

### Calculations

```typescript
// Calculate discount
const discount = product.pricing.discountPercent || 0;
const finalPrice = basePrice * (1 - discount / 100);

'Final Price': `${finalPrice.toFixed(2)} ${currency}`
```

### Aggregation

```typescript
// Average rating
const avgRating = reviews.length > 0
  ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
  : 'No ratings';

'Average Rating': avgRating + ' / 5'
```

## Related Documentation

- [FlatFormatter README](../../middleware/services/flat-formatter/README.md)
- [FlatFormatter Examples](../../middleware/services/flat-formatter/EXAMPLE.md)
- [Request Formatting Guide](../../../docs/REQUEST_FORMATTING.md)

## Note

These examples are **reference implementations only**. They are not exported by the middleware and are not intended to be used directly in production code. Copy and adapt them for your own domain-specific needs.
