import { CleaningEngine } from '../../../src/middleware/services/json-cleaner/recipe-system/core/cleaning-engine';
import { RecipeTemplates } from '../../../src/middleware/services/json-cleaner/recipe-system/recipes/templates';

describe('Adaptive recipe with markdown extraction', () => {
  it('should extract JSON from markdown code block', async () => {
    const engine = CleaningEngine.getInstance();
    const recipe = RecipeTemplates.adaptive();
    const inner = '{"ok":true,"n":3}';
    const input = '```json\n' + inner + '\n```';

    const res = await engine.clean(input, recipe, { source: 'unit-test', mode: 'adaptive' });

    expect(res.success).toBe(true);
    expect(res.cleanedJson).toBe(inner);
    expect(res.quality.isValidJson).toBe(true);
  });
});
