import { CleaningOperation } from '../types/operation.types';
import { RecipeStep, StepResult, Condition } from '../types/recipe.types';
import { CleaningContext } from '../types/operation.types';

export class AlwaysStep implements RecipeStep {
  public readonly type = 'always';
  public readonly optional = false;
  public readonly conditions: Condition[] = [];

  constructor(
    private readonly operation: CleaningOperation,
    public readonly id: string = `always_${operation.id}`
  ) {}

  async execute(context: CleaningContext): Promise<StepResult> {
    const start = Date.now();
    try {
      const result = await this.operation.apply(context.currentJson, context);
      if (result.success && result.cleanedJson) {
        context.updateJson(result.cleanedJson);
        result.changes.forEach(c => context.recordChange(c));
      }
      return {
        success: true,
        shouldContinue: true,
        operationResults: [result],
        executionTime: Date.now() - start
      };
    } catch (error) {
      return {
        success: false,
        shouldContinue: true,
        operationResults: [],
        executionTime: Date.now() - start,
        error: {
          message: `AlwaysStep failed: ${error}`,
          recoverable: true,
          recovery: 'skip'
        }
      };
    }
  }
}

export class ConditionalStep implements RecipeStep {
  public readonly type = 'conditional';
  public readonly optional = true;

  constructor(
    private readonly operation: CleaningOperation,
    public readonly conditions: Condition[] = [],
    public readonly id: string = `conditional_${operation.id}`
  ) {}

  async execute(context: CleaningContext): Promise<StepResult> {
    const start = Date.now();
    const shouldExecute = this.conditions.every(c => c.evaluate(context));

    if (!shouldExecute) {
      return {
        success: true,
        shouldContinue: true,
        operationResults: [],
        executionTime: 0
      };
    }

    try {
      const result = await this.operation.apply(context.currentJson, context);
      if (result.success && result.cleanedJson) {
        context.updateJson(result.cleanedJson);
        result.changes.forEach(c => context.recordChange(c));
      }
      return {
        success: true,
        shouldContinue: true,
        operationResults: [result],
        executionTime: Date.now() - start
      };
    } catch (error) {
      return {
        success: false,
        shouldContinue: true,
        operationResults: [],
        executionTime: Date.now() - start,
        error: {
          message: `ConditionalStep failed: ${error}`,
          recoverable: true,
          recovery: 'skip'
        }
      };
    }
  }
}

export class ParallelStep implements RecipeStep {
  public readonly type = 'parallel';
  public readonly optional = true;

  constructor(
    private readonly operations: CleaningOperation[],
    private readonly strategy: 'best' | 'first_success' = 'best',
    public readonly id: string = `parallel_${operations.map(o => o.id).join('_')}`
  ) {}

  async execute(context: CleaningContext): Promise<StepResult> {
    const start = Date.now();

    // Run sequentially to keep things simple/deterministic in this environment
    const results = [] as import('../types/operation.types').OperationResult[];
    for (const op of this.operations) {
      try {
        const res = await op.apply(context.currentJson, context);
        results.push(res);
      } catch (e) {
        results.push({
          success: false,
          changes: [],
          confidence: 0,
          shouldContinue: true,
          error: { code: 'OP_ERROR', message: String(e), recoverable: true }
        });
      }
    }

    // Pick best
    const successful = results.filter(r => r.success && r.cleanedJson);
    let picked = successful[0];
    if (this.strategy === 'best' && successful.length > 0) {
      picked = successful.reduce((best, cur) => cur.confidence > best.confidence ? cur : best, successful[0]);
    }

    if (picked && picked.cleanedJson) {
      context.updateJson(picked.cleanedJson);
      picked.changes.forEach(c => context.recordChange(c));
    }

    return {
      success: successful.length > 0,
      shouldContinue: true,
      operationResults: results,
      executionTime: Date.now() - start
    };
  }
}

export class SequenceStep implements RecipeStep {
  public readonly type = 'sequence';
  public readonly optional = false;

  constructor(
    private readonly operations: CleaningOperation[],
    public readonly id: string = `sequence_${operations.map(o => o.id).join('_')}`
  ) {}

  async execute(context: CleaningContext): Promise<StepResult> {
    const start = Date.now();
    const opResults: import('../types/operation.types').OperationResult[] = [];
    let anySuccess = false;

    for (const op of this.operations) {
      const res = await op.apply(context.currentJson, context);
      opResults.push(res);
      if (res.success && res.cleanedJson) {
        context.updateJson(res.cleanedJson);
        res.changes.forEach(c => context.recordChange(c));
        anySuccess = true;
      }
    }

    return {
      success: anySuccess,
      shouldContinue: true,
      operationResults: opResults,
      executionTime: Date.now() - start
    };
  }
}

export class ValidationStep implements RecipeStep {
  public readonly type = 'validation';
  public readonly optional = false;
  public readonly conditions: Condition[] = [];
  public readonly id: string = 'validation';

  async execute(context: CleaningContext): Promise<StepResult> {
    const start = Date.now();
    const isValid = (() => { try { JSON.parse(context.currentJson); return true; } catch { return false; }})();
    return {
      success: isValid,
      shouldContinue: true,
      operationResults: [],
      executionTime: Date.now() - start
    };
  }
}

export class CheckpointStep implements RecipeStep {
  public readonly type = 'checkpoint';
  public readonly optional = false;

  constructor(
    private readonly name: string,
    public readonly id: string = `checkpoint_${name}`
  ) {}

  async execute(context: CleaningContext): Promise<StepResult> {
    context.createCheckpoint(this.name);
    return { success: true, shouldContinue: true, operationResults: [], executionTime: 0 };
  }
}

export class RollbackStep implements RecipeStep {
  public readonly type = 'rollback';
  public readonly optional = true;

  constructor(
    private readonly name: string,
    public readonly id: string = `rollback_${name}`
  ) {}

  async execute(context: CleaningContext): Promise<StepResult> {
    const ok = context.rollbackTo(this.name);
    return { success: ok, shouldContinue: true, operationResults: [], executionTime: 0 };
  }
}
