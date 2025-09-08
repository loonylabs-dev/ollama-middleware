import { FlatFormatter, FormatConfigurator } from '../flat-formatter.service';

// Base interface for all entities
export interface BaseEntity {
  [key: string]: any;
}

// Preprocessed entity interface
export interface ProcessedEntity {
  [key: string]: string | number | boolean;
}

// Format config type (based on what FormatConfigurator.build() returns)
export type FormatConfig = {
  format: 'sections' | 'numbered' | 'table' | 'separator';
  itemPrefix?: string;
  itemSuffix?: string;
  indentLevel?: number;
  includeArrayIndices?: boolean;
  separator?: string;
  keyValueSeparator?: string;
  ignoreEmptyValues?: boolean;
  ignoredKeys?: string[];
  customFormatters?: Record<string, (value: any) => string>;
  entryTitleKey?: string;
  entryTitleAsPrefix?: boolean;
  entryTitleDefault?: string;
};

/**
 * Abstract base class for all presets
 * Provides robust null-safe entity processing with automatic fallback mechanisms
 */
export abstract class BasePreset<TOriginal extends BaseEntity, TProcessed extends ProcessedEntity = ProcessedEntity> {
  protected defaultFormat: FormatConfig;
  protected entityTypeName: string;

  constructor(entityTypeName: string, defaultFormat?: FormatConfig) {
    this.entityTypeName = entityTypeName;
    this.defaultFormat = defaultFormat || this.createDefaultFormat();
  }

  // Must be overridden by each implementation
  protected abstract preprocessEntity(entity: TOriginal): TProcessed;

  // Create standard format (can be overridden)
  protected createDefaultFormat(): FormatConfig {
    return new FormatConfigurator()
      .withFormat('numbered')
      .withItemPrefix(`[${this.entityTypeName}`)
      .withItemSuffix(']')
      .withEntryTitleKey('Name')
      .ignoreEmptyValues(true)
      .withKeyValueSeparator(': ')
      .build();
  }

  // === CENTRAL NULL-SAFETY - TRANSPARENT FOR CONCRETE PRESETS ===

  /**
   * Safe wrapper around concrete preprocessEntity implementation
   * Catches all errors and handles null/undefined entities
   */
  private safePreprocessEntityWrapper(entity: TOriginal | null | undefined): TProcessed | null {
    // Null/undefined check
    if (entity == null) {
      return null;
    }

    // Type check
    if (typeof entity !== 'object') {
      console.warn(`[${this.constructor.name}] Entity is not an object:`, typeof entity);
      return null;
    }

    try {
      // Call concrete implementation
      return this.preprocessEntity(entity);
    } catch (error) {
      // Catch all errors (e.g. "Cannot read properties of undefined")
      console.warn(`[${this.constructor.name}] Error in preprocessEntity:`, error);
      console.warn(`[${this.constructor.name}] Problematic entity:`, entity);
      
      // Try to create a minimal fallback entity
      try {
        return this.createFallbackEntity(entity);
      } catch (fallbackError) {
        console.warn(`[${this.constructor.name}] Fallback creation also failed:`, fallbackError);
        return null;
      }
    }
  }

  /**
   * Creates a minimal fallback entity on errors
   * Uses generic approaches without specific property names
   */
  private createFallbackEntity(entity: any): TProcessed {
    const fallback: any = {};

    // Try to find common name patterns
    const possibleNameFields = ['Name', 'name', 'title', 'Title', 'Titel'];
    const possibleDescFields = ['Beschreibung', 'description', 'desc', 'Description'];

    // Safe search for name
    let foundName = `Unknown ${this.entityTypeName}`;
    for (const field of possibleNameFields) {
      if (entity && typeof entity === 'object' && entity[field] != null) {
        foundName = String(entity[field]);
        break;
      }
      // Also try nested access
      const nested = this.safeNestedAccess(entity, field);
      if (nested != null) {
        foundName = String(nested);
        break;
      }
    }

    // Safe search for description
    let foundDesc = 'No details available';
    for (const field of possibleDescFields) {
      if (entity && typeof entity === 'object' && entity[field] != null) {
        foundDesc = String(entity[field]);
        break;
      }
      const nested = this.safeNestedAccess(entity, field);
      if (nested != null) {
        foundDesc = String(nested);
        break;
      }
    }

    // Create minimal fallback entity
    fallback['Name'] = foundName;
    fallback['Status'] = 'Data partially corrupted';
    fallback['Available Info'] = foundDesc;

    return fallback as TProcessed;
  }

  /**
   * Safe navigation through nested objects
   */
  private safeNestedAccess(obj: any, path: string): any {
    if (!obj || typeof obj !== 'object') return null;
    
    try {
      const keys = path.split('.');
      let current = obj;
      
      for (const key of keys) {
        if (current == null || typeof current !== 'object') {
          return null;
        }
        current = current[key];
      }
      
      return current;
    } catch {
      return null;
    }
  }

  // === REVISED PREPROCESSING FUNCTIONS ===

  /**
   * Preprocessing for arrays and single entities with transparent null-safety
   * Existing presets don't notice the changes
   */
  protected preprocessEntities(entities: TOriginal | TOriginal[] | null | undefined): TProcessed[] {
    if (!entities) {
      return [];
    }

    const entitiesArray = Array.isArray(entities) ? entities : [entities];
    
    return entitiesArray
      .map(entity => this.safePreprocessEntityWrapper(entity))
      .filter((processed): processed is TProcessed => processed !== null);
  }

  // Format adaptation for single objects
  protected createSingleObjectFormat(baseFormat: FormatConfig): FormatConfig {
    // Automatic intelligent adaptation for single objects
    switch (baseFormat.format) {
      case 'numbered':
        // For numbered: Convert to sections (no automatic [1] numbering)
        return {
          ...baseFormat,
          format: 'sections'
        };
        
      case 'separator':
      case 'table':
      case 'sections':
        // For all others: Keep the format
        return baseFormat;
        
      default:
        return baseFormat;
    }
  }

  // Optionally overridable special format for single objects
  protected getSingleObjectFormat(): FormatConfig | null {
    // Can be overridden in subclasses for special single-object formats
    // Returning null means: Use createSingleObjectFormat()
    return null;
  }

  // === REVISED MAIN FORMATTING FUNCTION ===

  /**
   * Robust formatForLLM with central null-safety
   * Existing presets continue to work without changes
   */
  public formatForLLM(
    entities?: TOriginal | TOriginal[] | null, 
    header?: string, 
    format?: FormatConfig
  ): string {
    // Null/undefined check
    if (!entities) {
      const fallbackMessage = `No ${this.entityTypeName.toLowerCase()}s available`;
      return header ? `${header}\n${fallbackMessage}` : fallbackMessage;
    }

    const formatToUse = format || this.defaultFormat;

    try {
      // INTELLIGENT HANDLING: Distinguish between array and single object
      if (Array.isArray(entities)) {
        // Array processing (normal list display with numbering)
        const processed = this.preprocessEntities(entities);
        
        if (processed.length === 0) {
          const fallbackMessage = `No valid ${this.entityTypeName.toLowerCase()}s available`;
          return header ? `${header}\n${fallbackMessage}` : fallbackMessage;
        }
        
        const formatted = FlatFormatter.flatten(processed, formatToUse);
        return header ? `${header}\n${formatted}` : formatted;
        
      } else {
        // Single object processing (WITHOUT automatic array conversion)
        const processed = this.safePreprocessEntityWrapper(entities);
        
        if (!processed) {
          const fallbackMessage = `${this.entityTypeName} not available or corrupted`;
          return header ? `${header}\n${fallbackMessage}` : fallbackMessage;
        }
        
        // Check for special single-object configuration from subclass
        const singleFormat = this.getSingleObjectFormat() || this.createSingleObjectFormat(formatToUse);
        const formatted = FlatFormatter.flatten(processed, singleFormat);
        
        return header ? `${header}\n${formatted}` : formatted;
      }
    } catch (error) {
      console.error(`[${this.constructor.name}] Error in formatForLLM:`, error);
      console.error(`[${this.constructor.name}] Entities:`, entities);
      
      const errorMessage = `Error formatting ${this.entityTypeName.toLowerCase()}s`;
      return header ? `${header}\n${errorMessage}` : errorMessage;
    }
  }

  // Getter for standard format (for advanced customizations)
  public getDefaultFormat(): FormatConfig {
    return this.defaultFormat;
  }

  // Format builder for special cases
  public createFormat(): FormatConfigurator {
    return new FormatConfigurator();
  }

  // Helper method for explicit single object formatting
  public formatSingleEntity(
    entity: TOriginal | null | undefined,
    header?: string,
    format?: FormatConfig
  ): string {
    // Explicit method for single objects (if desired)
    return this.formatForLLM(entity, header, format);
  }

  // Helper method for explicit array formatting
  public formatMultipleEntities(
    entities: TOriginal[] | null | undefined,
    header?: string,
    format?: FormatConfig
  ): string {
    // Explicit method for arrays (if desired)
    return this.formatForLLM(entities, header, format);
  }

  // === DEBUG FUNCTIONS ===

  /**
   * Debug helper function for entity structure
   */
  protected debugEntity(entity: any, entityName: string = 'Entity'): void {
    console.log(`[${this.constructor.name}] ${entityName} structure:`, {
      isNull: entity === null,
      isUndefined: entity === undefined,
      type: typeof entity,
      keys: entity && typeof entity === 'object' ? Object.keys(entity) : 'N/A',
      sample: entity && typeof entity === 'object' ? 
        Object.fromEntries(Object.entries(entity).slice(0, 3)) : entity
    });
  }
}