import { BaseAIUseCase } from '../../middleware/usecases/base/base-ai.usecase';
import { BaseAIRequest, BaseAIResult } from '../../middleware/shared/types/base-request.types';
import { SIMPLE_CHAT_SYSTEM_MESSAGE, SIMPLE_CHAT_USER_TEMPLATE } from './chat.messages';

/**
 * Simple chat request interface
 */
export interface ChatRequest extends BaseAIRequest<string> {
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
export class SimpleChatUseCase extends BaseAIUseCase<string, ChatRequest, ChatResult> {
  protected readonly systemMessage = SIMPLE_CHAT_SYSTEM_MESSAGE;

  /**
   * Format the user message for the chat
   */
  protected formatUserMessage(prompt: any): string {
    return typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
  }

  /**
   * Get the user template from message file
   */
  protected getUserTemplate(): (formattedPrompt: string) => string {
    return SIMPLE_CHAT_USER_TEMPLATE;
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