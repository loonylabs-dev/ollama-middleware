import { BaseAIUseCase } from '../../middleware/usecases/base/base-ai.usecase';
import { BaseAIRequest, BaseAIResult } from '../../middleware/shared/types/base-request.types';

/**
 * Simple chat request interface
 */
export interface ChatRequest extends BaseAIRequest {
  message: string;
}

/**
 * Simple chat result interface
 */
export interface ChatResult extends BaseAIResult {
  response: string;
}

/**
 * Simple chat use case for testing the middleware
 */
export class SimpleChatUseCase extends BaseAIUseCase<ChatRequest, ChatResult> {
  protected readonly systemMessage = `You are a helpful AI assistant. 
Provide clear, concise, and friendly responses to user messages.
Be conversational but informative.`;

  /**
   * Format the user message for the chat
   */
  protected formatUserMessage(prompt: any): string {
    return typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
  }

  /**
   * Create the chat result
   */
  protected createResult(content: string, usedPrompt: string, thinking?: string): ChatResult {
    return {
      generatedContent: content,
      model: this.modelConfig.name,
      usedPrompt: usedPrompt,
      thinking: thinking,
      response: content
    };
  }
}