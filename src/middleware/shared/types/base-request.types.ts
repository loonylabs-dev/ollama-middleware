import { Request } from 'express';
import { ClientInfo } from './client-info';

/**
 * Extended Express Request interface with user and client info
 */
export interface RequestWithUser extends Request {
  user?: any;
  clientInfo: ClientInfo;
}

/**
 * Base interface for all AI use case requests
 */
export interface BaseAIRequest {
  prompt: string;
  authToken?: string;
}

/**
 * Base interface for all AI use case results
 */
export interface BaseAIResult {
  generatedContent: string;
  model: string;
  usedPrompt: string;
  thinking?: string;
}