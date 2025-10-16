import { CleaningEngine } from '../../../src/middleware/services/json-cleaner/recipe-system/core/cleaning-engine';
import { RecipeTemplates } from '../../../src/middleware/services/json-cleaner/recipe-system/recipes/templates';

describe('Structural repair fixer', () => {
  it('should add missing closing brace', async () => {
    const engine = CleaningEngine.getInstance();
    const recipe = RecipeTemplates.aggressive();
    const input = '{"a":1';

    const res = await engine.clean(input, recipe, { source: 'unit-test', mode: 'aggressive' });

    expect(res.success).toBe(true);
    expect(res.cleanedJson).toBe('{"a":1}');
    expect(res.quality.isValidJson).toBe(true);
  });
});
