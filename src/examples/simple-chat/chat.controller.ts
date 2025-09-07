import { Response } from 'express';
import { BaseController } from '../../middleware/controllers/base/base.controller';
import { RequestWithUser } from '../../middleware/shared/types/base-request.types';
import { SimpleChatUseCase, ChatRequest } from './chat.usecase';

/**
 * Simple chat controller for testing the middleware
 */
export class ChatController extends BaseController {
  private chatUseCase = new SimpleChatUseCase();

  /**
   * Handle chat message endpoint
   * POST /api/chat
   */
  public async chat(req: RequestWithUser, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { message, authToken } = req.body;
      
      if (!message || typeof message !== 'string') {
        throw new Error('Message is required and must be a string');
      }

      const request: ChatRequest = {
        prompt: message,
        message,
        authToken
      };

      const result = await this.chatUseCase.execute(request);
      
      return {
        response: result.response,
        model: result.model,
        thinking: result.thinking
      };
    });
  }
}