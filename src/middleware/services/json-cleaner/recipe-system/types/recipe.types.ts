import { CleaningOperation, OperationResult, CleaningContext } from './operation.types';

export interface CleaningRecipe {
  /** Recipe identifier */
  id: string;
  
  /** Recipe name */
  name: string;
  
  /** Recipe description */
  description: string;
  
  /** Recipe steps to execute */
  steps: RecipeStep[];
  
  /** Fallback operation if all steps fail */
  fallback?: CleaningOperation;
  
  /** Recipe configuration */
  config: RecipeConfig;
  
  /** Execute this recipe */
  execute(json: string, context: CleaningContext): Promise<RecipeResult>;
  
  /** Clone this recipe */
  clone(): CleaningRecipe;
}

export interface RecipeStep {
  /** Step type */
  type: StepType;
  
  /** Step identifier */
  id: string;
  
  /** Execute this step */
  execute(context: CleaningContext): Promise<StepResult>;
  
  /** Whether this step can be skipped */
  optional?: boolean;
  
  /** Conditions for executing this step */
  conditions?: Condition[];
}

export interface RecipeConfig {
  /** Maximum total execution time in ms */
  maxExecutionTime?: number;
  
  /** Maximum number of operations to perform */
  maxOperations?: number;
  
  /** Whether to continue on errors */
  continueOnError?: boolean;
  
  /** Whether to optimize operation order */
  optimizeOrder?: boolean;
  
  /** Target confidence level */
  targetConfidence?: number;
  
  /** Custom configuration */
  custom?: Record<string, any>;
}

export interface RecipeResult {
  /** Whether the recipe was successful */
  success: boolean;
  
  /** Final cleaned JSON */
  cleanedJson?: string;
  
  /** All operation results */
  operationResults: OperationResult[];
  
  /** Overall confidence in the result */
  confidence: number;
  
  /** Total changes made */
  totalChanges: number;
  
  /** Execution metrics */
  metrics: RecipeMetrics;
  
  /** Error information if failed */
  error?: RecipeError;
  
  /** Execution summary */
  summary: ExecutionSummary;
}

export interface RecipeMetrics {
  /** Total execution time */
  totalTime: number;
  
  /** Number of steps executed */
  stepsExecuted: number;
  
  /** Number of operations performed */
  operationsPerformed: number;
  
  /** Number of rollbacks */
  rollbacks: number;
  
  /** Memory usage */
  memoryUsage?: number;
  
  /** Performance breakdown by step */
  stepMetrics: Map<string, StepMetrics>;
}

export interface StepMetrics {
  /** Step execution time */
  executionTime: number;
  
  /** Number of operations in this step */
  operationCount: number;
  
  /** Success rate */
  successRate: number;
  
  /** Average confidence */
  averageConfidence: number;
}

export interface RecipeError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Step where error occurred */
  step?: string;
  
  /** Operation where error occurred */
  operation?: string;
  
  /** Whether recovery was attempted */
  recoveryAttempted: boolean;
  
  /** Original error */
  originalError?: Error;
}

export interface ExecutionSummary {
  /** Operations that were successful */
  successfulOperations: string[];
  
  /** Operations that failed */
  failedOperations: string[];
  
  /** Operations that were skipped */
  skippedOperations: string[];
  
  /** Key changes made */
  keyChanges: string[];
  
  /** Recommendations for future runs */
  recommendations: string[];
}

export type StepType = 
  | 'always'       // Always execute operation
  | 'conditional'  // Execute if condition met
  | 'parallel'     // Execute operations in parallel
  | 'sequence'     // Execute operations in sequence
  | 'choice'       // Try operations, pick best result
  | 'validation'   // Validate current state
  | 'checkpoint'   // Create rollback point
  | 'rollback'     // Rollback to checkpoint
  | 'loop'         // Loop until condition met
  | 'branch';      // Conditional branching

export interface StepResult {
  /** Whether the step was successful */
  success: boolean;
  
  /** Whether to continue to next step */
  shouldContinue: boolean;
  
  /** Results from operations in this step */
  operationResults: OperationResult[];
  
  /** Step execution time */
  executionTime: number;
  
  /** Error if step failed */
  error?: StepError;
}

export interface StepError {
  /** Error message */
  message: string;
  
  /** Whether this error is recoverable */
  recoverable: boolean;
  
  /** Suggested recovery action */
  recovery?: 'skip' | 'retry' | 'rollback' | 'abort';
}

// Condition types for conditional logic
export interface Condition {
  /** Condition type */
  type: ConditionType;
  
  /** Check if condition is met */
  evaluate(context: CleaningContext): boolean;
  
  /** Condition description */
  description: string;
}

export type ConditionType =
  | 'has_detection'      // Has specific detection
  | 'json_valid'         // JSON is valid
  | 'json_invalid'       // JSON is invalid
  | 'confidence_above'   // Confidence above threshold
  | 'confidence_below'   // Confidence below threshold
  | 'changes_above'      // Number of changes above threshold
  | 'changes_below'      // Number of changes below threshold
  | 'time_elapsed'       // Time elapsed above threshold
  | 'custom';            // Custom condition

// Helper interfaces for building recipes
export interface ConditionalBuilder {
  /** Apply operation if condition is true */
  use(operation: CleaningOperation): RecipeBuilder;
  
  /** Try multiple operations, pick best */
  tryBest(...operations: CleaningOperation[]): RecipeBuilder;
  
  /** Execute operations in sequence */
  sequence(...operations: CleaningOperation[]): RecipeBuilder;
  
  /** Create nested condition */
  when(condition: Condition): ConditionalBuilder;
  
  /** Else branch */
  otherwise(): ConditionalBuilder;

  /** Conditionally create checkpoint */
  checkpoint(name: string): RecipeBuilder;

  /** Conditionally rollback to checkpoint */
  rollbackTo(name: string): RecipeBuilder;

  /** Set fallback operation when condition holds (delegates to RecipeBuilder) */
  orFallback(operation: CleaningOperation): RecipeBuilder;
}

export interface RecipeBuilder {
  /** Add conditional logic */
  when(condition: Condition): ConditionalBuilder;
  
  /** Always apply operation */
  use(operation: CleaningOperation): RecipeBuilder;
  
  /** Try operations in parallel, pick best result */
  tryBest(...operations: CleaningOperation[]): RecipeBuilder;
  
  /** Apply operations in sequence */
  sequence(...operations: CleaningOperation[]): RecipeBuilder;
  
  /** Loop until condition is met */
  loop(condition: Condition): LoopBuilder;
  
  /** Validate current JSON */
  validate(): RecipeBuilder;
  
  /** Create checkpoint for rollback */
  checkpoint(name: string): RecipeBuilder;
  
  /** Rollback to checkpoint */
  rollbackTo(name: string): RecipeBuilder;
  
  /** Set fallback operation */
  orFallback(operation: CleaningOperation): RecipeBuilder;
  
  /** Configure recipe */
  configure(config: Partial<RecipeConfig>): RecipeBuilder;
  
  /** Build the final recipe */
  build(): CleaningRecipe;
}

export interface LoopBuilder {
  /** Operations to perform in loop */
  perform(...operations: CleaningOperation[]): RecipeBuilder;
  
  /** Maximum iterations */
  maxIterations(count: number): LoopBuilder;
}

// Factory types for dynamic recipe creation
export interface RecipeTemplate {
  /** Template identifier */
  id: string;
  
  /** Template name */
  name: string;
  
  /** Template description */
  description: string;
  
  /** Create recipe from this template */
  create(parameters: TemplateParameters): CleaningRecipe;
  
  /** Template configuration */
  config: TemplateConfig;
}

export interface TemplateParameters {
  /** Target error patterns */
  errorPatterns?: string[];
  
  /** Processing mode */
  mode?: 'conservative' | 'aggressive' | 'adaptive';
  
  /** Time constraints */
  maxTime?: number;
  
  /** Quality requirements */
  minConfidence?: number;
  
  /** Custom parameters */
  custom?: Record<string, any>;
}

export interface TemplateConfig {
  /** Required parameters */
  requiredParameters: string[];
  
  /** Optional parameters with defaults */
  optionalParameters: Record<string, any>;
  
  /** Parameter validation rules */
  validation?: Record<string, (value: any) => boolean>;
}
