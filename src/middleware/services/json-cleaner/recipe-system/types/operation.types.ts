// Core operation interfaces for the recipe-based JSON cleaner
export interface CleaningOperation {
  /** Unique identifier for this operation */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Description of what this operation does */
  description: string;
  
  /** Check if this operation should be applied given the current context */
  shouldApply(context: CleaningContext): boolean;
  
  /** Apply the cleaning operation */
  apply(json: string, context: CleaningContext): Promise<OperationResult> | OperationResult;
  
  /** Estimate the impact/risk of applying this operation */
  estimateImpact(json: string, context: CleaningContext): OperationImpact;
  
  /** Check if this operation conflicts with another operation */
  conflictsWith(other: CleaningOperation): boolean;
  
  /** Priority level for operation ordering */
  priority?: OperationPriority;
  
  /** Configuration options for this operation */
  config?: OperationConfig;
}

export interface OperationResult {
  /** Whether the operation was successful */
  success: boolean;
  
  /** The cleaned JSON if successful */
  cleanedJson?: string;
  
  /** List of changes made */
  changes: ChangeDescription[];
  
  /** Confidence level in the result (0-1) */
  confidence: number;
  
  /** Whether processing should continue to next operations */
  shouldContinue: boolean;
  
  /** Suggested next operations to try */
  suggestedNext?: string[];
  
  /** Error information if failed */
  error?: OperationError;
  
  /** Performance metrics */
  metrics?: OperationMetrics;
}

export interface OperationImpact {
  /** Risk level of applying this operation */
  risk: 'low' | 'medium' | 'high';
  
  /** Estimated number of changes */
  estimatedChanges: number;
  
  /** Estimated processing time in ms */
  estimatedTime: number;
  
  /** Confidence in the impact estimation */
  confidence: number;
  
  /** Whether this operation might break valid JSON */
  mightBreakValid: boolean;
}

export interface ChangeDescription {
  /** Type of change made */
  type: ChangeType;
  
  /** Location in the JSON where change was made */
  location: number | ChangeLocation;
  
  /** Original value */
  from?: string;
  
  /** New value */
  to?: string;
  
  /** Number of occurrences changed */
  count?: number;
  
  /** Additional context about the change */
  context?: string;
}

export interface OperationError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Whether this is a recoverable error */
  recoverable: boolean;
  
  /** Suggested recovery actions */
  suggestedActions?: string[];
}

export interface OperationMetrics {
  /** Time taken to execute in ms */
  executionTime: number;
  
  /** Memory usage if significant */
  memoryUsage?: number;
  
  /** Number of regex operations performed */
  regexOperations?: number;
  
  /** Size change in bytes */
  sizeChange?: number;
}

export interface OperationConfig {
  /** Maximum number of changes to allow */
  maxChanges?: number;
  
  /** Whether to be conservative in changes */
  conservative?: boolean;
  
  /** Custom parameters for the operation */
  parameters?: Record<string, any>;
}

export type OperationPriority = 'critical' | 'high' | 'medium' | 'low';

export type ChangeType = 
  | 'escape'           // Escaped a character
  | 'unescape'         // Unescaped a character  
  | 'add_comma'        // Added missing comma
  | 'remove_comma'     // Removed extra comma
  | 'add_bracket'      // Added missing bracket
  | 'remove_bracket'   // Removed extra bracket
  | 'fix_quote'        // Fixed quote issues
  | 'remove_duplicate' // Removed duplicate key
  | 'structural_fix'   // Fixed structural issues
  | 'whitespace'       // Whitespace normalization
  | 'extract'          // Extracted valid parts
  | 'replace'          // General replacement
  | 'remove'           // Removed content
  | 'add';             // Added content

export interface ChangeLocation {
  /** Line number (1-based) */
  line?: number;
  
  /** Column number (1-based) */
  column?: number;
  
  /** Character offset from start */
  offset?: number;
  
  /** Context description */
  context?: string;
}

export interface Detection {
  /** Type of issue detected */
  type: string;
  
  /** Location where detected */
  location: number | ChangeLocation;
  
  /** Confidence in detection (0-1) */
  confidence: number;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface CleaningContext {
  /** Current JSON being processed */
  currentJson: string;
  
  /** Original JSON for comparison */
  originalJson: string;
  
  /** Detected issues */
  detections: Map<string, Detection[]>;
  
  /** Named checkpoints for rollback */
  checkpoints: Map<string, string>;
  
  /** History of changes made */
  changes: ChangeDescription[];
  
  /** Context metadata */
  metadata: ContextMetadata;
  
  /** Add a detection */
  addDetection(type: string, location: number | ChangeLocation, confidence?: number, metadata?: Record<string, any>): void;
  
  /** Check if specific detection exists */
  hasDetection(type: string): boolean;
  
  /** Get detections of a specific type */
  getDetections(type: string): Detection[];
  
  /** Create a checkpoint */
  createCheckpoint(name: string): void;
  
  /** Rollback to a checkpoint */
  rollbackTo(name: string): boolean;
  
  /** Update current JSON */
  updateJson(newJson: string): void;
  
  /** Add change record */
  recordChange(change: ChangeDescription): void;
  
  /** Get processing statistics */
  getStats(): ContextStats;
}

export interface ContextMetadata {
  /** Processing start time */
  startTime: number;
  
  /** Source of the JSON (e.g., 'llm_response', 'user_input') */
  source?: string;
  
  /** Expected JSON type if known */
  expectedType?: 'object' | 'array' | 'primitive';
  
  /** Processing mode */
  mode?: 'conservative' | 'aggressive' | 'adaptive';
  
  /** Custom metadata */
  custom?: Record<string, any>;
}

export interface ContextStats {
  /** Total changes made */
  totalChanges: number;
  
  /** Processing time so far */
  processingTime: number;
  
  /** Number of checkpoints created */
  checkpointCount: number;
  
  /** Number of rollbacks performed */
  rollbackCount: number;
  
  /** Number of detections found */
  detectionCount: number;
  
  /** Current JSON validity */
  isValid: boolean;
}
