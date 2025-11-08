import { BaseAIUseCase } from '../../../src/middleware/usecases/base/base-ai.usecase';
import { BaseAIRequest, BaseAIResult } from '../../../src/middleware/shared/types/base-request.types';
import { LLMProvider } from '../../../src/middleware/services/llm';

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
