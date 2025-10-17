import { CleaningRecipe, RecipeResult, RecipeStep, RecipeConfig, StepResult, ExecutionSummary } from '../types/recipe.types';
import { CleaningContext, OperationResult } from '../types/operation.types';

export class CleaningRecipeImpl implements CleaningRecipe {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly steps: RecipeStep[],
    public readonly config: RecipeConfig = {},
    public readonly fallback?: import('../types/operation.types').CleaningOperation
  ) {}

  async execute(json: string, context: CleaningContext): Promise<RecipeResult> {
    const startTime = Date.now();
    const operationResults: OperationResult[] = [];
    const stepMetrics = new Map<string, import('../types/recipe.types').StepMetrics>();
    const failedOperations: string[] = [];
    const successfulOperations: string[] = [];
    const skippedOperations: string[] = [];
    const keyChanges: string[] = [];

    context.updateJson(json);

    let stepsExecuted = 0;
    let operationsPerformed = 0;
    let rollbacks = 0;
    let lastConfidence = 0.0;

    try {
      for (const step of this.steps) {
        // Respect max execution time
        if (this.config.maxExecutionTime && (Date.now() - startTime) > this.config.maxExecutionTime) {
          break;
        }

        const sStart = Date.now();
        const result: StepResult = await step.execute(context);
        const sEnd = Date.now();

        stepsExecuted++;
        operationsPerformed += result.operationResults.length;

        // Aggregate operation results
        for (const opResult of result.operationResults) {
          operationResults.push(opResult);
          lastConfidence = opResult.confidence;
          if (opResult.success) {
            successfulOperations.push(opResult as any as string); // Placeholder, operation id not available here
          } else {
            failedOperations.push(opResult as any as string);
          }
          if (opResult.changes && opResult.changes.length > 0) {
            keyChanges.push(...opResult.changes.map(c => `${c.type}${c.count ? ` x${c.count}` : ''}`));
          }
        }

        // Record step metrics
        stepMetrics.set(step.id, {
          executionTime: sEnd - sStart,
          operationCount: result.operationResults.length,
          successRate: result.operationResults.length === 0 ? 1 : result.operationResults.filter(r => r.success).length / result.operationResults.length,
          averageConfidence: result.operationResults.length === 0 ? 1 : result.operationResults.reduce((s, r) => s + r.confidence, 0) / result.operationResults.length
        });

        if (!result.success && !this.config.continueOnError) {
          // If step failed and we should not continue, abort
          break;
        }

        if (!result.shouldContinue) {
          break;
        }
      }

      // If still invalid and fallback exists, try fallback once
      let fallbackAttempted = false;
      if (this.fallback) {
        try {
          const fbStart = Date.now();
          const fbResult = await this.fallback.apply(context.currentJson, context);
          const fbEnd = Date.now();
          operationResults.push(fbResult);
          operationsPerformed += 1;
          stepMetrics.set('fallback', {
            executionTime: fbEnd - fbStart,
            operationCount: 1,
            successRate: fbResult.success ? 1 : 0,
            averageConfidence: fbResult.confidence
          });
          if (fbResult.success && fbResult.cleanedJson) {
            context.updateJson(fbResult.cleanedJson);
            fbResult.changes.forEach(c => context.recordChange(c));
            lastConfidence = fbResult.confidence;
          }
          fallbackAttempted = true;
        } catch {
          // ignore fallback errors
        }
      }

      const totalTime = Date.now() - startTime;
      const stats = context.getStats();
      const success = this.isCurrentlyValid(context.currentJson);
      const confidence = this.calculateRecipeConfidence(operationResults, lastConfidence, success);

      const summary: ExecutionSummary = {
        successfulOperations,
        failedOperations,
        skippedOperations,
        keyChanges: Array.from(new Set(keyChanges)).slice(0, 10),
        recommendations: success ? [] : [
          fallbackAttempted ? 'Consider a different recipe template' : 'Try fallback or aggressive template',
          'Check input source formatting'
        ]
      };

      return {
        success,
        cleanedJson: success ? context.currentJson : undefined,
        operationResults,
        confidence,
        totalChanges: stats.totalChanges,
        metrics: {
          totalTime,
          stepsExecuted,
          operationsPerformed,
          rollbacks,
          stepMetrics
        },
        summary,
        error: success ? undefined : {
          code: 'RECIPE_INCOMPLETE',
          message: 'Recipe did not yield valid JSON',
          recoveryAttempted: !!this.fallback,
        }
      };
    } catch (err) {
      const totalTime = Date.now() - startTime;
      return {
        success: false,
        operationResults,
        confidence: 0.0,
        totalChanges: context.changes.length,
        metrics: {
          totalTime,
          stepsExecuted,
          operationsPerformed,
          rollbacks,
          stepMetrics
        },
        summary: {
          successfulOperations,
          failedOperations,
          skippedOperations,
          keyChanges,
          recommendations: ['Unhandled error occurred during recipe execution']
        },
        error: {
          code: 'RECIPE_EXECUTION_ERROR',
          message: `${err}`,
          recoveryAttempted: false,
          originalError: err as Error
        }
      };
    }
  }

  clone(): CleaningRecipe {
    return new CleaningRecipeImpl(
      this.id,
      this.name,
      this.description,
      [...this.steps],
      { ...this.config },
      this.fallback
    );
  }

  private isCurrentlyValid(json: string): boolean {
    try { JSON.parse(json); return true; } catch { return false; }
  }

  private calculateRecipeConfidence(results: OperationResult[], lastConfidence: number, valid: boolean): number {
    if (valid && results.length === 0) return 1.0;
    if (results.length === 0) return valid ? 0.9 : 0.0;
    const avg = results.reduce((s, r) => s + r.confidence, 0) / results.length;
    return Math.max(avg, lastConfidence);
  }
}
