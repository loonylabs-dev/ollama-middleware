import { LLMProvider } from '../../middleware/services/llm';
import { SimpleChatUseCase } from './chat.usecase';

/**
 * Example: Chat use case using Anthropic Claude instead of Ollama
 *
 * This demonstrates how to override the default provider (Ollama)
 * to use a different LLM provider like Anthropic Claude.
 *
 * Usage:
 * ```typescript
 * const anthropicChat = new AnthropicChatUseCase();
 * const result = await anthropicChat.execute({
 *   prompt: "Hello, Claude!",
 *   authToken: process.env.ANTHROPIC_API_KEY
 * });
 * ```
 */
export class AnthropicChatUseCase extends SimpleChatUseCase {
  /**
   * Override to use Anthropic Claude provider
   * @returns LLMProvider.ANTHROPIC
   */
  protected getProvider(): LLMProvider {
    return LLMProvider.ANTHROPIC;
  }
}
