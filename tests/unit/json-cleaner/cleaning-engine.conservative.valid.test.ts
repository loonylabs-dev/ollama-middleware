import { CleaningEngine } from '../../../src/middleware/services/json-cleaner/recipe-system/core/cleaning-engine';
import { RecipeTemplates } from '../../../src/middleware/services/json-cleaner/recipe-system/recipes/templates';

describe('Conservative recipe on valid JSON', () => {
  it('should keep valid JSON unchanged', async () => {
    const engine = CleaningEngine.getInstance();
    const recipe = RecipeTemplates.conservative();
    const input = '{"a":1,"b":"two"}';

    const res = await engine.clean(input, recipe, { source: 'unit-test', mode: 'conservative' });

    expect(res.success).toBe(true);
    expect(res.quality.isValidJson).toBe(true);
    expect(res.cleanedJson).toBe(input);
    expect(res.totalChanges).toBeGreaterThanOrEqual(0);
  });
});
