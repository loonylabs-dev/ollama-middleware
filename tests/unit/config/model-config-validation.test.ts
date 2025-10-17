// tests/unit/config/model-config-validation.test.ts

describe('Model Config Validation', () => {
  
  beforeEach(() => {
    // Clear module cache to test with different env values
    jest.resetModules();
  });

  describe('getModelConfig()', () => {
    it('should throw error when MODEL1_NAME is not set', () => {
      // Temporarily remove MODEL1_NAME
      const originalValue = process.env.MODEL1_NAME;
      delete process.env.MODEL1_NAME;

      // Reimport after clearing env
      const { getModelConfig } = require('../../../src/middleware/shared/config/models.config');

      expect(() => getModelConfig('MODEL1')).toThrow(
        'Model name for MODEL1 is not configured'
      );
      
      expect(() => getModelConfig('MODEL1')).toThrow(
        'Please set MODEL1_NAME in your .env file'
      );

      // Restore
      if (originalValue) {
        process.env.MODEL1_NAME = originalValue;
      }
    });

    it('should return valid config when MODEL1_NAME is set', () => {
      // Set MODEL1_NAME
      process.env.MODEL1_NAME = 'test-model:latest';

      // Reimport
      const { getModelConfig } = require('../../../src/middleware/shared/config/models.config');

      const config = getModelConfig('MODEL1');
      
      expect(config).toBeDefined();
      expect(config.name).toBe('test-model:latest');
      expect(config.temperature).toBe(0.8);
      expect(typeof config.baseUrl).toBe('string');
    });

    it('should return validated config with guaranteed name type', () => {
      process.env.MODEL1_NAME = 'phi3:mini';

      const { getModelConfig } = require('../../../src/middleware/shared/config/models.config');

      const config = getModelConfig('MODEL1');
      
      // TypeScript should guarantee this is string, not string | undefined
      const modelName: string = config.name;
      expect(modelName).toBe('phi3:mini');
    });

    it('should use environment variables for baseUrl', () => {
      process.env.MODEL1_NAME = 'test-model';
      process.env.MODEL1_URL = 'https://custom-ollama.com';

      const { getModelConfig } = require('../../../src/middleware/shared/config/models.config');

      const config = getModelConfig('MODEL1');
      
      expect(config.baseUrl).toBe('https://custom-ollama.com');
    });

    it('should use default baseUrl when not set in env', () => {
      process.env.MODEL1_NAME = 'test-model';
      delete process.env.MODEL1_URL;

      const { getModelConfig } = require('../../../src/middleware/shared/config/models.config');

      const config = getModelConfig('MODEL1');
      
      expect(config.baseUrl).toBe('http://localhost:11434');
    });

    it('should include bearerToken when set', () => {
      process.env.MODEL1_NAME = 'test-model';
      process.env.MODEL1_TOKEN = 'test-token-123';

      const { getModelConfig } = require('../../../src/middleware/shared/config/models.config');

      const config = getModelConfig('MODEL1');
      
      expect(config.bearerToken).toBe('test-token-123');
    });
  });
});
