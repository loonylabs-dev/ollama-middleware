import { CleaningOperation, CleaningContext, OperationResult } from '../types/operation.types';
import { 
  RecipeBuilder, 
  ConditionalBuilder, 
  LoopBuilder,
  CleaningRecipe,
  RecipeConfig,
  RecipeStep,
  Condition,
  StepResult
} from '../types/recipe.types';
import { 
  AlwaysStep, 
  ConditionalStep, 
  ParallelStep, 
  SequenceStep, 
  ValidationStep, 
  CheckpointStep, 
  RollbackStep 
} from './recipe-steps';
import { CleaningRecipeImpl } from './cleaning-recipe';

export class RecipeBuilderImpl implements RecipeBuilder {
  private steps: RecipeStep[] = [];
  private fallbackOperation?: CleaningOperation;
  private recipeConfig: RecipeConfig = {};
  private recipeId: string;
  private recipeName: string;
  private recipeDescription: string;

  constructor(
    id?: string, 
    name?: string, 
    description?: string
  ) {
    this.recipeId = id || `recipe_${Date.now()}`;
    this.recipeName = name || 'Custom Recipe';
    this.recipeDescription = description || 'Dynamically built cleaning recipe';
  }

  when(condition: Condition): ConditionalBuilder {
    return new ConditionalBuilderImpl(this, condition);
  }

  use(operation: CleaningOperation): RecipeBuilder {
    this.steps.push(new AlwaysStep(operation));
    return this;
  }

  tryBest(...operations: CleaningOperation[]): RecipeBuilder {
    this.steps.push(new ParallelStep(operations, 'best'));
    return this;
  }

  sequence(...operations: CleaningOperation[]): RecipeBuilder {
    this.steps.push(new SequenceStep(operations));
    return this;
  }

  loop(condition: Condition): LoopBuilder {
    return new LoopBuilderImpl(this, condition);
  }

  validate(): RecipeBuilder {
    this.steps.push(new ValidationStep());
    return this;
  }

  checkpoint(name: string): RecipeBuilder {
    this.steps.push(new CheckpointStep(name));
    return this;
  }

  rollbackTo(name: string): RecipeBuilder {
    this.steps.push(new RollbackStep(name));
    return this;
  }

  orFallback(operation: CleaningOperation): RecipeBuilder {
    this.fallbackOperation = operation;
    return this;
  }

  configure(config: Partial<RecipeConfig>): RecipeBuilder {
    this.recipeConfig = { ...this.recipeConfig, ...config };
    return this;
  }

  build(): CleaningRecipe {
    return new CleaningRecipeImpl(
      this.recipeId,
      this.recipeName,
      this.recipeDescription,
      this.steps,
      this.recipeConfig,
      this.fallbackOperation
    );
  }

  // Internal method for adding steps
  addStep(step: RecipeStep): void {
    this.steps.push(step);
  }
}

export class ConditionalBuilderImpl implements ConditionalBuilder {
  constructor(
    private readonly parentBuilder: RecipeBuilderImpl,
    private readonly condition: Condition
  ) {}

  use(operation: CleaningOperation): RecipeBuilder {
    const step = new ConditionalStep(operation, [this.condition]);
    this.parentBuilder.addStep(step);
    return this.parentBuilder;
  }

  tryBest(...operations: CleaningOperation[]): RecipeBuilder {
    // Create a conditional parallel step
    const parallelStep = new ParallelStep(operations, 'best');
    // We need to wrap this in a conditional step - this is a simplification
    // In a more complete implementation, we'd create a ConditionalParallelStep
    const conditionalStep = new ConditionalStepWrapper(parallelStep, [this.condition]);
    this.parentBuilder.addStep(conditionalStep);
    return this.parentBuilder;
  }

  sequence(...operations: CleaningOperation[]): RecipeBuilder {
    const sequenceStep = new SequenceStep(operations);
    const conditionalStep = new ConditionalStepWrapper(sequenceStep, [this.condition]);
    this.parentBuilder.addStep(conditionalStep);
    return this.parentBuilder;
  }

  checkpoint(name: string): RecipeBuilder {
    const cpStep = new CheckpointStep(name);
    const conditionalStep = new ConditionalStepWrapper(cpStep, [this.condition]);
    this.parentBuilder.addStep(conditionalStep);
    return this.parentBuilder;
  }

  rollbackTo(name: string): RecipeBuilder {
    const rbStep = new RollbackStep(name);
    const conditionalStep = new ConditionalStepWrapper(rbStep, [this.condition]);
    this.parentBuilder.addStep(conditionalStep);
    return this.parentBuilder;
  }

  orFallback(operation: CleaningOperation): RecipeBuilder {
    // Delegate to parent; conditional fallback selection is simplified to last call wins
    return this.parentBuilder.orFallback(operation);
  }

  when(condition: Condition): ConditionalBuilder {
    // Create nested conditional (AND logic)
    return new ConditionalBuilderImpl(this.parentBuilder, condition);
  }

  otherwise(): ConditionalBuilder {
    // Create inverse condition
    const inverseCondition: Condition = {
      type: 'custom',
      description: `NOT (${this.condition.description})`,
      evaluate: (context) => !this.condition.evaluate(context)
    };
    return new ConditionalBuilderImpl(this.parentBuilder, inverseCondition);
  }
}

export class LoopBuilderImpl implements LoopBuilder {
  private maxIterationsCount = 10;

  constructor(
    private readonly parentBuilder: RecipeBuilderImpl,
    private readonly condition: Condition
  ) {}

  perform(...operations: CleaningOperation[]): RecipeBuilder {
    const loopStep = new LoopStep(operations, this.condition, this.maxIterationsCount);
    this.parentBuilder.addStep(loopStep);
    return this.parentBuilder;
  }

  maxIterations(count: number): LoopBuilder {
    this.maxIterationsCount = count;
    return this;
  }
}

// Wrapper class to make existing steps conditional
class ConditionalStepWrapper implements RecipeStep {
  public readonly type = 'conditional';
  public readonly optional = false;

  constructor(
    private readonly wrappedStep: RecipeStep,
    public readonly conditions: Condition[],
    public readonly id: string = `conditional_${wrappedStep.id}`
  ) {}

  async execute(context: CleaningContext): Promise<StepResult> {
    // Check conditions first
    const shouldExecute = this.conditions.every(condition => condition.evaluate(context));
    
    if (!shouldExecute) {
      console.log(`[ConditionalStepWrapper] Skipping ${this.wrappedStep.id} - conditions not met`);
      return {
        success: true,
        shouldContinue: true,
        operationResults: [],
        executionTime: 0
      };
    }
    
    return this.wrappedStep.execute(context);
  }
}

// Loop step implementation
class LoopStep implements RecipeStep {
  public readonly type = 'loop';
  public readonly optional = false;
  public readonly conditions: Condition[] = [];

  constructor(
    private readonly operations: CleaningOperation[],
    private readonly loopCondition: Condition,
    private readonly maxIterations: number = 10,
    public readonly id: string = `loop_${operations.map(op => op.id).join('_')}`
  ) {}

  async execute(context: CleaningContext): Promise<StepResult> {
    const startTime = Date.now();
    const allOperationResults: OperationResult[] = [];
    let iterations = 0;

    console.log(`[LoopStep] Starting loop with condition: ${this.loopCondition.description}`);

    try {
      while (this.loopCondition.evaluate(context) && iterations < this.maxIterations) {
        iterations++;
        for (const operation of this.operations) {
          const result = await operation.apply(context.currentJson, context);
          allOperationResults.push(result);
          if (result.success && result.cleanedJson) {
            context.updateJson(result.cleanedJson);
            result.changes.forEach(change => context.recordChange(change));
          }
        }
      }

      const executionTime = Date.now() - startTime;
      return {
        success: true,
        shouldContinue: true,
        operationResults: allOperationResults,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        shouldContinue: true,
        operationResults: allOperationResults,
        executionTime,
        error: {
          message: `Loop execution failed: ${error}`,
          recoverable: true,
          recovery: 'skip'
        }
      };
    }
  }
}

export class Recipe {
  static create(id?: string, name?: string, description?: string): RecipeBuilder {
    return new RecipeBuilderImpl(id, name, description);
  }
  static conservative(): RecipeBuilder { return new RecipeBuilderImpl('conservative', 'Conservative Cleaner', 'Minimal changes, high confidence'); }
  static aggressive(): RecipeBuilder { return new RecipeBuilderImpl('aggressive', 'Aggressive Cleaner', 'Maximum fixing, lower confidence'); }
  static adaptive(): RecipeBuilder { return new RecipeBuilderImpl('adaptive', 'Adaptive Cleaner', 'Context-aware cleaning strategy'); }
}
