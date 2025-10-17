# FlatFormatter Examples

Comprehensive examples demonstrating all FlatFormatter capabilities.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Output Formats](#output-formats)
- [Array Handling](#array-handling)
- [Computed Fields](#computed-fields)
- [Custom Presets](#custom-presets)
- [Real-World Examples](#real-world-examples)

---

## Basic Usage

### Simple Object Formatting

```typescript
import { FlatFormatter } from 'ollama-middleware';

const user = {
  name: 'Alice Johnson',
  email: 'alice@example.com',
  role: 'Senior Engineer',
  department: 'Engineering'
};

const formatted = FlatFormatter.flatten(user);
console.log(formatted);
```

**Output:**
```
name: Alice Johnson
email: alice@example.com
role: Senior Engineer
department: Engineering
```

---

## Output Formats

### Numbered Format

```typescript
const product = {
  name: 'Wireless Mouse',
  price: 29.99,
  category: 'Electronics',
  inStock: true
};

FlatFormatter.flatten(product, { format: 'numbered' });
```

**Output:**
```
1. name: Wireless Mouse
2. price: 29.99
3. category: Electronics
4. inStock: true
```

### Bulleted Format

```typescript
FlatFormatter.flatten(product, { format: 'bulleted' });
```

**Output:**
```
• name: Wireless Mouse
• price: 29.99
• category: Electronics
• inStock: true
```

### Sections Format

```typescript
FlatFormatter.flatten(product, { 
  format: 'sections',
  itemPrefix: '=== ',
  itemSuffix: ' ==='
});
```

**Output:**
```
=== name ===
Wireless Mouse

=== price ===
29.99

=== category ===
Electronics

=== inStock ===
true
```

### Table Format

```typescript
FlatFormatter.flatten(product, { format: 'table' });
```

**Output:**
```
| name      | Wireless Mouse  |
| price     | 29.99          |
| category  | Electronics    |
| inStock   | true           |
```

---

## Array Handling

### Simple Array Formatting

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
```

**Output:**
```
1. Alice
   role: Engineer

2. Bob
   role: Designer

3. Charlie
   role: Manager
```

### Array Slicing

```typescript
const largeList = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`
}));

// Show only first 5 items
FlatFormatter.flatten(largeList, {
  format: 'numbered',
  arraySliceStart: 0,
  arraySliceEnd: 5,
  entryTitleKey: 'name',
  ignoredKeys: ['id']
});
```

**Output:**
```
1. Item 1
2. Item 2
3. Item 3
4. Item 4
5. Item 5
```

---

## Computed Fields

### Adding Calculated Fields

```typescript
const person = {
  firstName: 'Alice',
  lastName: 'Johnson',
  birthYear: 1993,
  salary: 95000
};

FlatFormatter.flatten(person, {
  computedFields: {
    fullName: (p) => `${p.firstName} ${p.lastName}`,
    age: (p) => new Date().getFullYear() - p.birthYear,
    salaryFormatted: (p) => `$${p.salary.toLocaleString()}`
  },
  ignoredKeys: ['firstName', 'lastName', 'salary']
});
```

**Output:**
```
birthYear: 1993
fullName: Alice Johnson
age: 32
salaryFormatted: $95,000
```

### Complex Computed Fields

```typescript
const order = {
  orderNumber: 'ORD-12345',
  items: [
    { name: 'Widget A', price: 25.00, quantity: 2 },
    { name: 'Widget B', price: 15.00, quantity: 3 }
  ],
  shippingCost: 5.00
};

FlatFormatter.flatten(order, {
  computedFields: {
    itemCount: (o) => o.items.length,
    subtotal: (o) => o.items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
    total: (o) => {
      const subtotal = o.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      return (subtotal + o.shippingCost).toFixed(2);
    }
  },
  ignoredKeys: ['items']
});
```

**Output:**
```
orderNumber: ORD-12345
shippingCost: 5.00
itemCount: 3
subtotal: 95.00
total: 100.00
```

---

## Custom Presets

### Creating a Simple Preset

```typescript
import { BasePreset } from 'ollama-middleware';

interface SimpleProduct {
  name?: string;
  price?: number;
  inStock?: boolean;
}

interface ProcessedSimpleProduct {
  [key: string]: string | number | boolean;
  Name: string;
  Price: string;
  Availability: string;
}

class SimpleProductPreset extends BasePreset<SimpleProduct, ProcessedSimpleProduct> {
  constructor() {
    super('SimpleProduct');
  }

  protected preprocessEntity(product: SimpleProduct): ProcessedSimpleProduct {
    return {
      'Name': product.name || 'Unknown',
      'Price': product.price ? `$${product.price.toFixed(2)}` : 'N/A',
      'Availability': product.inStock ? 'In Stock ✓' : 'Out of Stock ✗'
    };
  }
}
```

### Using the Complex ProductPreset (Built-in)

The middleware includes **ProductPreset** demonstrating advanced techniques:

```typescript
import { productPreset, Product } from 'ollama-middleware';

const product: Product = {
  name: 'Wireless Gaming Mouse',
  description: 'High-precision wireless mouse designed for gaming',
  category: 'Gaming Accessories',
  
  // Nested object - pricing
  pricing: {
    basePrice: 79.99,
    currency: 'USD',
    discountPercent: 20,
    taxRate: 0.08
  },
  
  // Arrays
  features: [
    'RGB lighting',
    '16,000 DPI sensor',
    'Programmable buttons',
    'Wireless charging'
  ],
  tags: ['gaming', 'wireless', 'rgb', 'esports'],
  
  // Nested object with arrays
  metadata: {
    manufacturer: 'GameTech Pro',
    origin: 'Taiwan',
    certifications: ['CE', 'FCC', 'RoHS', 'USB-IF']
  },
  
  // Array of objects
  reviews: [
    { 
      rating: 5, 
      comment: 'Best gaming mouse I\'ve ever owned!', 
      author: 'ProGamer123' 
    },
    { 
      rating: 5, 
      comment: 'Incredible precision and comfort', 
      author: 'StreamerAce' 
    },
    { 
      rating: 4, 
      comment: 'Great mouse, battery life could be better' 
    }
  ],
  
  inStock: true,
  quantity: 127
};

const formatted = productPreset.formatForLLM(product, "## PRODUCT DETAILS:");
console.log(formatted);
```

**Output:**
```
## PRODUCT DETAILS:
Name: Wireless Gaming Mouse
Description: High-precision wireless mouse designed for gaming
Category: Gaming Accessories
Price: 79.99 USD
Discount: 20% OFF
Final Price: 63.99 USD
Features: RGB lighting, 16,000 DPI sensor, Programmable buttons, Wireless charging
Tags: gaming, wireless, rgb, esports
Manufacturer: GameTech Pro
Origin: Taiwan
Certifications: CE, FCC, RoHS, USB-IF
Average Rating: 4.7 / 5
Review Count: 3 reviews
Sample Reviews: "Best gaming mouse I've ever owned!" (5/5) - ProGamer123; "Incredible precision and comfort" (5/5) - StreamerAce
Availability: In Stock (127 units available)
```

**What the preprocessing does:**

1. **Flattens nested objects**: `pricing.basePrice` → `'Price'`
2. **Calculates values**: Discount applied to get final price
3. **Joins arrays**: `features` array → comma-separated string
4. **Aggregates data**: Reviews → average rating + sample comments
5. **Formats strings**: Combines quantity with availability text
6. **Handles optionals**: All fields have fallbacks

### Note About Example Presets

All preset examples are located in **`src/examples/flat-formatter-demo/`**.

The middleware core only provides:
- `BasePreset` - Abstract base class
- `GenericEntity` - Base entity interface
- `ProcessedEntity` - Base processed interface
- `FlatFormatter` - Core formatting utility

You create your own domain-specific presets by extending `BasePreset`.

---

## Real-World Examples

### Example 1: API Response Formatting

```typescript
const apiResponse = {
  status: 'success',
  data: {
    user: {
      id: 'user-123',
      username: 'alice_j',
      email: 'alice@example.com',
      createdAt: '2023-01-15T10:30:00Z'
    },
    permissions: ['read', 'write', 'admin']
  },
  metadata: {
    requestId: 'req-abc-123',
    timestamp: Date.now()
  }
};

// Format for LLM context
const context = FlatFormatter.flatten(apiResponse.data.user, {
  format: 'sections',
  ignoredKeys: ['id', 'createdAt'],
  computedFields: {
    accountAge: (u) => {
      const created = new Date(u.createdAt);
      const days = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
      return `${days} days`;
    }
  }
});
```

### Example 2: Database Query Results

```typescript
const queryResults = [
  { id: 1, name: 'Project Alpha', status: 'active', priority: 'high' },
  { id: 2, name: 'Project Beta', status: 'completed', priority: 'medium' },
  { id: 3, name: 'Project Gamma', status: 'active', priority: 'low' }
];

const formatted = FlatFormatter.flatten(queryResults, {
  format: 'numbered',
  entryTitleKey: 'name',
  ignoredKeys: ['id'],
  itemPrefix: '📋 PROJECT:',
  keyValueSeparator: ' → '
});
```

**Output:**
```
1. 📋 PROJECT: Project Alpha
   status → active
   priority → high

2. 📋 PROJECT: Project Beta
   status → completed
   priority → medium

3. 📋 PROJECT: Project Gamma
   status → active
   priority → low
```

### Example 3: Configuration Display

```typescript
const config = {
  server: {
    host: 'localhost',
    port: 3000,
    ssl: false
  },
  database: {
    host: 'db.example.com',
    port: 5432,
    name: 'myapp'
  },
  features: {
    authentication: true,
    analytics: true,
    caching: false
  }
};

// Flatten nested config
const serverConfig = FlatFormatter.flatten(config.server, {
  format: 'table',
  keyValueSeparator: ' : '
});

const dbConfig = FlatFormatter.flatten(config.database, {
  format: 'table',
  keyValueSeparator: ' : '
});
```

---

## Tips and Best Practices

### 1. Choose Format Based on Data Type

```typescript
// Single objects: sections or separator
FlatFormatter.flatten(singleEntity, { format: 'sections' });

// Lists: numbered or bulleted
FlatFormatter.flatten(listItems, { format: 'numbered' });

// Comparison: table
FlatFormatter.flatten(comparisonData, { format: 'table' });
```

### 2. Use Computed Fields for Derived Data

```typescript
// ✅ Good - compute on-the-fly
FlatFormatter.flatten(data, {
  computedFields: {
    summary: (d) => `${d.count} items totaling $${d.sum}`
  }
});

// ❌ Avoid - mutating source data
data.summary = `${data.count} items totaling $${data.sum}`;
FlatFormatter.flatten(data);
```

### 3. Ignore Irrelevant Fields

```typescript
FlatFormatter.flatten(entity, {
  ignoredKeys: [
    'id',           // Internal IDs
    '_internal',    // Private fields
    '__typename',   // GraphQL metadata
    'createdAt',    // Timestamps (unless relevant)
    'updatedAt'
  ]
});
```

### 4. Create Presets for Reusable Entities

```typescript
// If you format the same entity type frequently,
// create a preset once and reuse it:

const formatted1 = myPreset.formatForLLM(entity1);
const formatted2 = myPreset.formatForLLM(entity2);
const formatted3 = myPreset.formatForLLM(entity3);
```

---

## Related Documentation

- [FlatFormatter README](./README.md)
- [Request Formatting Guide](../../../docs/REQUEST_FORMATTING.md)
- [Getting Started](../../../docs/GETTING_STARTED.md)
