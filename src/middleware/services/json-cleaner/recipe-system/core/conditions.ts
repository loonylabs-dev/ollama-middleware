import { 
  Condition, ConditionType 
} from '../types/recipe.types';
import { CleaningContext } from '../types/operation.types';

export abstract class BaseCondition implements Condition {
  constructor(
    public readonly type: ConditionType,
    public readonly description: string
  ) {}

  abstract evaluate(context: CleaningContext): boolean;
}

export class HasDetectionCondition extends BaseCondition {
  constructor(private readonly detectionType: string) {
    super('has_detection', `Has detection of type '${detectionType}'`);
  }

  evaluate(context: CleaningContext): boolean {
    return context.hasDetection(this.detectionType);
  }
}

export class JsonValidCondition extends BaseCondition {
  constructor() {
    super('json_valid', 'JSON is valid');
  }

  evaluate(context: CleaningContext): boolean {
    try {
      JSON.parse(context.currentJson);
      return true;
    } catch {
      return false;
    }
  }
}

export class JsonInvalidCondition extends BaseCondition {
  constructor() {
    super('json_invalid', 'JSON is invalid');
  }

  evaluate(context: CleaningContext): boolean {
    try {
      JSON.parse(context.currentJson);
      return false;
    } catch {
      return true;
    }
  }
}

export class ConfidenceAboveCondition extends BaseCondition {
  constructor(private readonly threshold: number) {
    super('confidence_above', `Overall confidence above ${threshold}`);
  }

  evaluate(context: CleaningContext): boolean {
    const recentChanges = context.changes.slice(-10);
    if (recentChanges.length === 0) return false;
    const totalConfidence = recentChanges.length > 0 ? 0.8 : 0.5; // Placeholder
    return totalConfidence >= this.threshold;
  }
}

export class ConfidenceBelowCondition extends BaseCondition {
  constructor(private readonly threshold: number) {
    super('confidence_below', `Overall confidence below ${threshold}`);
  }

  evaluate(context: CleaningContext): boolean {
    const condition = new ConfidenceAboveCondition(this.threshold);
    return !condition.evaluate(context);
  }
}

export class ChangesAboveCondition extends BaseCondition {
  constructor(private readonly threshold: number) {
    super('changes_above', `Number of changes above ${threshold}`);
  }

  evaluate(context: CleaningContext): boolean {
    return context.changes.length > this.threshold;
  }
}

export class ChangesBelowCondition extends BaseCondition {
  constructor(private readonly threshold: number) {
    super('changes_below', `Number of changes below ${threshold}`);
  }

  evaluate(context: CleaningContext): boolean {
    return context.changes.length <= this.threshold;
  }
}

export class TimeElapsedCondition extends BaseCondition {
  constructor(private readonly thresholdMs: number) {
    super('time_elapsed', `Time elapsed above ${thresholdMs}ms`);
  }

  evaluate(context: CleaningContext): boolean {
    const elapsed = Date.now() - context.metadata.startTime;
    return elapsed > this.thresholdMs;
  }
}

export class CustomCondition extends BaseCondition {
  constructor(
    description: string,
    private readonly evaluator: (context: CleaningContext) => boolean
  ) {
    super('custom', description);
  }

  evaluate(context: CleaningContext): boolean {
    return this.evaluator(context);
  }
}

export class AndCondition extends BaseCondition {
  constructor(private readonly conditions: Condition[]) {
    super('custom', `All of: ${conditions.map(c => c.description).join(', ')}`);
  }

  evaluate(context: CleaningContext): boolean {
    return this.conditions.every(condition => condition.evaluate(context));
  }
}

export class OrCondition extends BaseCondition {
  constructor(private readonly conditions: Condition[]) {
    super('custom', `Any of: ${conditions.map(c => c.description).join(', ')}`);
  }

  evaluate(context: CleaningContext): boolean {
    return this.conditions.some(condition => condition.evaluate(context));
  }
}

export class NotCondition extends BaseCondition {
  constructor(private readonly condition: Condition) {
    super('custom', `Not: ${condition.description}`);
  }

  evaluate(context: CleaningContext): boolean {
    return !this.condition.evaluate(context);
  }
}

export const Conditions = {
  hasDetection: (type: string) => new HasDetectionCondition(type),
  isValid: () => new JsonValidCondition(),
  isInvalid: () => new JsonInvalidCondition(),
  confidenceAbove: (threshold: number) => new ConfidenceAboveCondition(threshold),
  confidenceBelow: (threshold: number) => new ConfidenceBelowCondition(threshold),
  changesAbove: (threshold: number) => new ChangesAboveCondition(threshold),
  changesBelow: (threshold: number) => new ChangesBelowCondition(threshold),
  timeElapsed: (ms: number) => new TimeElapsedCondition(ms),
  custom: (description: string, evaluator: (context: CleaningContext) => boolean) => new CustomCondition(description, evaluator),
  and: (...conditions: Condition[]) => new AndCondition(conditions),
  or: (...conditions: Condition[]) => new OrCondition(conditions),
  not: (condition: Condition) => new NotCondition(condition),
  hasControlChars: () => new CustomCondition('Has control characters', (context) => /[\x00-\x1F\x7F]/.test(context.currentJson)),
  hasMissingCommas: () => new CustomCondition('Has missing commas', (context) => {
    const json = context.currentJson;
    return /"\s*"[^:\s]/.test(json) || /}\s*{/.test(json) || /]\s*\[/.test(json);
  }),
  hasStructuralIssues: () => new CustomCondition('Has structural issues', (context) => {
    const json = context.currentJson;
    const openBraces = (json.match(/\{/g) || []).length;
    const closeBraces = (json.match(/\}/g) || []).length;
    const openBrackets = (json.match(/\[/g) || []).length;
    const closeBrackets = (json.match(/\]/g) || []).length;
    return openBraces !== closeBraces || openBrackets !== closeBrackets;
  }),
  hasMarkdownCode: () => new CustomCondition('Has markdown code blocks', (context) => /```[\s\S]*?```/.test(context.currentJson)),
  hasThinkTags: () => new CustomCondition('Has think tags', (context) => /<think>[\s\S]*?<\/think>/i.test(context.currentJson)),
  isSmallJson: (maxSize: number = 1000) => new CustomCondition(`JSON is smaller than ${maxSize} characters`, (context) => context.currentJson.length <= maxSize),
  isLargeJson: (minSize: number = 10000) => new CustomCondition(`JSON is larger than ${minSize} characters`, (context) => context.currentJson.length >= minSize)
};