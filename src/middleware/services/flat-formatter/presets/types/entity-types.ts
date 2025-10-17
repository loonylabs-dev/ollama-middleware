/**
 * Generic base interface for all entities
 * 
 * This is the foundation for all entity types.
 * Extend this to create your own domain-specific entities.
 * 
 * **Example:**
 * ```typescript
 * export interface MyEntity extends GenericEntity {
 *   id?: string;
 *   name: string;
 *   description?: string;
 *   // ... your fields
 * }
 * ```
 * 
 * **For complete examples, see:**
 * - `src/examples/flat-formatter-demo/product-preset.example.ts`
 */
export interface GenericEntity {
  [key: string]: any;
}
