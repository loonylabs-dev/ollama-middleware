import { BasePreset, ProcessedEntity } from '../../middleware/services/flat-formatter';

/**
 * Product entity - Example demonstrating COMPLEX FlatFormatter capabilities
 * 
 * This example shows:
 * - **Nested objects** (pricing, metadata)
 * - **Arrays** (features, tags, reviews)
 * - **Optional fields** with fallbacks
 * - **Complex transformations** (joining, aggregating, calculating)
 * - **String composition** (combining multiple fields)
 * 
 * Use this as a template for entities with complex structures.
 */
export interface Product {
  id?: string;
  name: string;
  description: string;
  category: string;
  
  // Nested object - pricing information
  pricing: {
    basePrice: number;
    currency: string;
    discountPercent?: number;
    taxRate?: number;
  };
  
  // Arrays - lists of values
  features?: string[];
  tags?: string[];
  
  // Nested object with arrays - metadata
  metadata?: {
    manufacturer: string;
    origin: string;
    certifications?: string[];
  };
  
  // Array of objects - reviews
  reviews?: Array<{
    rating: number;
    comment: string;
    author?: string;
  }>;
  
  // Optional fields
  inStock?: boolean;
  quantity?: number;
}

/**
 * ProcessedProduct - Normalized, LLM-ready structure
 * 
 * Shows how preprocessing transforms complex data:
 * - Arrays joined to strings
 * - Nested objects flattened
 * - Calculated fields added
 * - Everything normalized to strings
 */
export interface ProcessedProduct extends ProcessedEntity {
  [key: string]: string | number | boolean;
  
  Name: string;
  Description: string;
  Category: string;
  
  // Pricing (flattened and formatted)
  'Price': string;
  'Discount': string;
  'Final Price': string;
  
  // Arrays (joined)
  'Features': string;
  'Tags': string;
  
  // Metadata (flattened)
  'Manufacturer': string;
  'Origin': string;
  'Certifications': string;
  
  // Reviews (aggregated)
  'Average Rating': string;
  'Review Count': string;
  'Sample Reviews': string;
  
  // Stock info
  'Availability': string;
}

/**
 * ProductPreset - Demonstrates advanced preprocessing
 * 
 * Key techniques:
 * 1. Array handling (join, map, filter)
 * 2. Nested object access with optional chaining
 * 3. Calculations (discounts, averages)
 * 4. String composition
 * 5. Fallback values
 */
export class ProductPreset extends BasePreset<Product, ProcessedProduct> {
  constructor() {
    super('Product');
  }

  protected preprocessEntity(product: Product): ProcessedProduct {
    // Calculate pricing
    const basePrice = product.pricing.basePrice;
    const currency = product.pricing.currency;
    const discount = product.pricing.discountPercent || 0;
    const finalPrice = basePrice * (1 - discount / 100);
    
    // Process reviews
    const reviews = product.reviews || [];
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 'No ratings';
    
    const sampleReviews = reviews.length > 0
      ? reviews
          .slice(0, 2)  // First 2 reviews
          .map(r => `"${r.comment}" (${r.rating}/5)${r.author ? ` - ${r.author}` : ''}`)
          .join('; ')
      : 'No reviews yet';
    
    // Determine availability
    const inStock = product.inStock ?? false;
    const quantity = product.quantity ?? 0;
    const availability = inStock
      ? `In Stock (${quantity} units available)`
      : 'Out of Stock';
    
    return {
      'Name': product.name,
      'Description': product.description,
      'Category': product.category,
      
      // Pricing
      'Price': `${basePrice.toFixed(2)} ${currency}`,
      'Discount': discount > 0 ? `${discount}% OFF` : 'No discount',
      'Final Price': `${finalPrice.toFixed(2)} ${currency}`,
      
      // Arrays - join with commas
      'Features': product.features?.join(', ') || 'No features listed',
      'Tags': product.tags?.join(', ') || 'No tags',
      
      // Metadata - flatten nested object
      'Manufacturer': product.metadata?.manufacturer || 'Unknown',
      'Origin': product.metadata?.origin || 'Unknown',
      'Certifications': product.metadata?.certifications?.join(', ') || 'None',
      
      // Reviews - aggregate data
      'Average Rating': avgRating + ' / 5',
      'Review Count': `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`,
      'Sample Reviews': sampleReviews,
      
      // Availability
      'Availability': availability
    };
  }
}

/**
 * Singleton instance for global use
 * 
 * Usage:
 * ```typescript
 * import { productPreset } from 'ollama-middleware';
 * 
 * const product = {
 *   name: 'Wireless Mouse',
 *   pricing: { basePrice: 29.99, currency: 'USD', discountPercent: 15 },
 *   features: ['Bluetooth', 'Ergonomic', '3-year warranty'],
 *   // ... more fields
 * };
 * 
 * const formatted = productPreset.formatForLLM(product, "## PRODUCT:");
 * ```
 */
export const productPreset = new ProductPreset();
