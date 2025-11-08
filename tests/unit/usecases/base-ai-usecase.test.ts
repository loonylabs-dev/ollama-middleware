import { BaseAIUseCase } from '../../../src/middleware/usecases/base/base-ai.usecase';
import { BaseAIRequest, BaseAIResult } from '../../../src/middleware/shared/types/base-request.types';
import { LLMProvider } from '../../../src/middleware/services/llm';
import { ModelConfigKey, ValidatedLLMModelConfig } from '../../../src/middleware/shared/config/models.config';

/**
 * Test-specific interfaces
 */
interface TestRequest extends BaseAIRequest<string> {
  message: string;
}

interface TestResult extends BaseAIResult {
  response: string;
}

/**
 * Test use case that uses default provider (Ollama)
 */
class DefaultProviderUseCase extends BaseAIUseCase<string, TestRequest, TestResult> {
  protected readonly systemMessage = "Test system message";

  protected getUserTemplate(): (formattedPrompt: string) => string {
    return (prompt) => prompt;
  }

  protected createResult(content: string, usedPrompt: string, thinking?: string): TestResult {
    return {
      generatedContent: content,
      model: this.modelConfig.name,
      usedPrompt,
      thinking,
      response: content
    };
  }
}

/**
 * Test use case that explicitly uses Anthropic provider
 */
class AnthropicProviderUseCase extends BaseAIUseCase<string, TestRequest, TestResult> {
  protected readonly systemMessage = "Test system message";

  protected getProvider(): LLMProvider {
    return LLMProvider.ANTHROPIC;
  }

  protected getUserTemplate(): (formattedPrompt: string) => string {
    return (prompt) => prompt;
  }

  protected createResult(content: string, usedPrompt: string, thinking?: string): TestResult {
    return {
      generatedContent: content,
      model: this.modelConfig.name,
      usedPrompt,
      thinking,
      response: content
    };
  }
}

/**
 * Test use case that explicitly uses OpenAI provider
 */
class OpenAIProviderUseCase extends BaseAIUseCase<string, TestRequest, TestResult> {
  protected readonly systemMessage = "Test system message";

  protected getProvider(): LLMProvider {
    return LLMProvider.OPENAI;
  }

  protected getUserTemplate(): (formattedPrompt: string) => string {
    return (prompt) => prompt;
  }

  protected createResult(content: string, usedPrompt: string, thinking?: string): TestResult {
    return {
      generatedContent: content,
      model: this.modelConfig.name,
      usedPrompt,
      thinking,
      response: content
    };
  }
}

describe('BaseAIUseCase - Provider Selection', () => {
  describe('getProvider() method', () => {
    it('should return OLLAMA as default provider', () => {
      const useCase = new DefaultProviderUseCase();
      const provider = (useCase as any).getProvider();

      expect(provider).toBe(LLMProvider.OLLAMA);
    });

    it('should allow override to ANTHROPIC provider', () => {
      const useCase = new AnthropicProviderUseCase();
      const provider = (useCase as any).getProvider();

      expect(provider).toBe(LLMProvider.ANTHROPIC);
    });

    it('should allow override to OPENAI provider', () => {
      const useCase = new OpenAIProviderUseCase();
      const provider = (useCase as any).getProvider();

      expect(provider).toBe(LLMProvider.OPENAI);
    });

    it('should support all LLM providers', () => {
      // Verify that all providers are accessible via enum
      expect(LLMProvider.OLLAMA).toBeDefined();
      expect(LLMProvider.ANTHROPIC).toBeDefined();
      expect(LLMProvider.OPENAI).toBeDefined();
      expect(LLMProvider.GOOGLE).toBeDefined();
    });
  });
});

describe('BaseAIUseCase - Model Config Provider Pattern', () => {
  describe('getModelConfigProvider() method', () => {
    it('should use default getModelConfigProvider that calls library getModelConfig', () => {
      const useCase = new DefaultProviderUseCase();
      const config = (useCase as any).getModelConfigProvider('MODEL1');

      // Should return a valid config with a name
      expect(config).toBeDefined();
      expect(config.name).toBeDefined();
      expect(typeof config.name).toBe('string');
    });

    it('should allow overriding getModelConfigProvider for custom configs', () => {
      /**
       * Test use case that overrides getModelConfigProvider
       */
      class CustomConfigUseCase extends BaseAIUseCase<string, TestRequest, TestResult> {
        protected readonly systemMessage = "Test system message";

        protected getModelConfigProvider(key: ModelConfigKey): ValidatedLLMModelConfig {
          return {
            name: 'custom-model',
            baseUrl: 'http://custom.server.com',
            temperature: 0.5
          } as ValidatedLLMModelConfig;
        }

        protected getUserTemplate(): (formattedPrompt: string) => string {
          return (prompt) => prompt;
        }

        protected createResult(content: string, usedPrompt: string, thinking?: string): TestResult {
          return {
            generatedContent: content,
            model: this.modelConfig.name,
            usedPrompt,
            thinking,
            response: content
          };
        }
      }

      const useCase = new CustomConfigUseCase();
      const config = (useCase as any).getModelConfigProvider('MODEL1');

      expect(config.name).toBe('custom-model');
      expect(config.baseUrl).toBe('http://custom.server.com');
      expect(config.temperature).toBe(0.5);
    });

    it('should use getModelConfigProvider in modelConfig getter', () => {
      /**
       * Test use case that overrides getModelConfigProvider
       */
      class CustomModelConfigUseCase extends BaseAIUseCase<string, TestRequest, TestResult> {
        protected readonly systemMessage = "Test system message";

        protected getModelConfigProvider(key: ModelConfigKey): ValidatedLLMModelConfig {
          return {
            name: 'another-custom-model',
            baseUrl: 'http://another.server.com',
            temperature: 0.7
          } as ValidatedLLMModelConfig;
        }

        protected getUserTemplate(): (formattedPrompt: string) => string {
          return (prompt) => prompt;
        }

        protected createResult(content: string, usedPrompt: string, thinking?: string): TestResult {
          return {
            generatedContent: content,
            model: this.modelConfig.name,
            usedPrompt,
            thinking,
            response: content
          };
        }
      }

      const useCase = new CustomModelConfigUseCase();
      const config = (useCase as any).modelConfig;

      // modelConfig getter should call getModelConfigProvider
      expect(config.name).toBe('another-custom-model');
      expect(config.baseUrl).toBe('http://another.server.com');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility when overriding modelConfig getter directly', () => {
      /**
       * Legacy use case that overrides modelConfig getter (old pattern)
       */
      class LegacyUseCase extends BaseAIUseCase<string, TestRequest, TestResult> {
        protected readonly systemMessage = "Test system message";

        // Old pattern: override the getter directly
        protected get modelConfig(): ValidatedLLMModelConfig {
          return {
            name: 'legacy-model',
            baseUrl: 'http://legacy.server.com',
            temperature: 0.9
          } as ValidatedLLMModelConfig;
        }

        protected getUserTemplate(): (formattedPrompt: string) => string {
          return (prompt) => prompt;
        }

        protected createResult(content: string, usedPrompt: string, thinking?: string): TestResult {
          return {
            generatedContent: content,
            model: this.modelConfig.name,
            usedPrompt,
            thinking,
            response: content
          };
        }
      }

      const useCase = new LegacyUseCase();
      const config = (useCase as any).modelConfig;

      // Old pattern should still work
      expect(config.name).toBe('legacy-model');
      expect(config.baseUrl).toBe('http://legacy.server.com');
      expect(config.temperature).toBe(0.9);
    });

    it('should work with default implementation (no overrides)', () => {
      const useCase = new DefaultProviderUseCase();
      const config = (useCase as any).modelConfig;

      // Default should work without any overrides
      expect(config).toBeDefined();
      expect(config.name).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle custom config provider with validation', () => {
      /**
       * Test use case with validation in getModelConfigProvider
       */
      class ValidatingConfigUseCase extends BaseAIUseCase<string, TestRequest, TestResult> {
        protected readonly systemMessage = "Test system message";

        private customModels: Record<string, ValidatedLLMModelConfig> = {
          'CUSTOM1': {
            name: 'custom-model-1',
            baseUrl: 'http://custom1.com',
            temperature: 0.6
          } as ValidatedLLMModelConfig
        };

        protected getModelConfigProvider(key: ModelConfigKey): ValidatedLLMModelConfig {
          const config = this.customModels[key];
          if (!config) {
            throw new Error(`Custom model ${key} not found`);
          }
          return config;
        }

        protected getUserTemplate(): (formattedPrompt: string) => string {
          return (prompt) => prompt;
        }

        protected createResult(content: string, usedPrompt: string, thinking?: string): TestResult {
          return {
            generatedContent: content,
            model: this.modelConfig.name,
            usedPrompt,
            thinking,
            response: content
          };
        }
      }

      const useCase = new ValidatingConfigUseCase();

      // Valid key should work
      const config1 = (useCase as any).getModelConfigProvider('CUSTOM1');
      expect(config1.name).toBe('custom-model-1');

      // Invalid key should throw
      expect(() => {
        (useCase as any).getModelConfigProvider('INVALID_KEY');
      }).toThrow('Custom model INVALID_KEY not found');
    });
  });
});
