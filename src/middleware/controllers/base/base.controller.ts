import { Response } from 'express';
import { RequestWithUser } from '../../shared/types/base-request.types';
import { logger } from '../../shared/utils/logging.utils';
import { sendErrorResponse, sendSuccessResponse } from '../../shared/utils/http.utils';

/**
 * Base controller class providing common functionality for all controllers
 * Includes error handling and standardized response formatting
 */
export abstract class BaseController {
  /**
   * Generic request handler with error handling and logging
   * @param req - Express request with user and client info
   * @param res - Express response
   * @param handler - Function to execute the actual logic
   */
  protected async handleRequest(
    req: RequestWithUser,
    res: Response,
    handler: () => Promise<any>
  ): Promise<void> {
    try {
      const result = await handler();
      sendSuccessResponse(res, result, req.clientInfo);
    } catch (error) {
      logger.error('Controller error', {
        context: this.constructor.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          path: req.path,
          method: req.method,
          query: req.query,
          params: req.params
        }
      });
      
      sendErrorResponse(
        res,
        500,
        error instanceof Error ? error.message : 'Unknown error',
        req.clientInfo
      );
    }
  }
}