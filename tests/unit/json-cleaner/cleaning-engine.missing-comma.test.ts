import { CleaningEngine } from '../../../src/middleware/services/json-cleaner/recipe-system/core/cleaning-engine';
import { RecipeTemplates } from '../../../src/middleware/services/json-cleaner/recipe-system/recipes/templates';

describe('Missing comma fixer', () => {
  it('should insert missing comma between object properties', async () => {
    const engine = CleaningEngine.getInstance();
    const recipe = RecipeTemplates.adaptive();
    const input = '{"a":1 "b":2}';

    const res = await engine.clean(input, recipe, { source: 'unit-test', mode: 'adaptive' });

    expect(res.success).toBe(true);
    expect(res.cleanedJson).toBe('{"a":1, "b":2}');
    expect(res.quality.isValidJson).toBe(true);
  });
});
