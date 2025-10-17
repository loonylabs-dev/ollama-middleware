// Core FlatFormatter service
export { FlatFormatter, FormatConfigurator, ComputedFieldOptions } from './flat-formatter.service';

// Presets system
export * from './presets';

// Re-export for convenience
export {
  // Base classes
  BasePreset,
  BaseEntity,
  ProcessedEntity,
  FormatConfig,
  
  // Generic base entity type
  GenericEntity
} from './presets';
