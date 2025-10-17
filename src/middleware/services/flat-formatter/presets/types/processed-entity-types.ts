/**
 * Processed entity types - simplified, flattened versions for LLM consumption
 * 
 * Processed entities are the output of a preset's `preprocessEntity()` method.
 * They represent normalized, LLM-ready data structures.
 * 
 * **All processed entities must:**
 * - Extend ProcessedEntity
 * - Include index signature `[key: string]: string | number | boolean`
 * - Use consistent field names (e.g., capitalized)
 * - Provide default/fallback values
 * 
 * **Example:**
 * ```typescript
 * export interface ProcessedMyEntity extends ProcessedEntity {
 *   [key: string]: string | number | boolean;
 *   
 *   'Display Name': string;
 *   'Field One': string;
 *   'Field Two': string;
 *   // ... normalized fields (all as strings)
 * }
 * ```
 * 
 * **For complete examples, see:**
 * - `src/examples/flat-formatter-demo/product-preset.example.ts`
 */
import { ProcessedEntity } from '../base-preset';

// Re-export for convenience
export { ProcessedEntity };
