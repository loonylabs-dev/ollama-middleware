import { CleaningEngine } from '../../../src/middleware/services/json-cleaner/recipe-system/core/cleaning-engine';
import { RecipeTemplates } from '../../../src/middleware/services/json-cleaner/recipe-system/recipes/templates';

describe('Adaptive recipe with think tag extraction', () => {
  it('should extract JSON from think tags', async () => {
    const engine = CleaningEngine.getInstance();
    const recipe = RecipeTemplates.adaptive();
    const inner = '{"x":1}';
    const input = '<think>some chain of thought... ' + inner + ' ... end</think>';

    const res = await engine.clean(input, recipe, { source: 'unit-test', mode: 'adaptive' });

    expect(res.success).toBe(true);
    expect(res.cleanedJson).toBe(inner);
    expect(res.quality.isValidJson).toBe(true);
  });
});
