import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../shared/utils/logging.utils';

export interface OllamaResponse {
  message: {
    content: string;
  };
  sessionId?: string;
}

export interface OllamaRequestOptions {
  authToken?: string;
  model?: string;
  temperature?: number;
  baseUrl?: string;
  repeat_penalty?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repeat_last_n?: number;
  debugContext?: string;
  sessionId?: string;
  chapterNumber?: number;
  pageNumber?: number;
  pageName?: string;
}

/**
 * Basic Ollama service implementation
 * This is a placeholder - the full implementation will be extracted later
 */
export class OllamaService {
  /**
   * Call the Ollama API with a custom system message
   */
  public async callOllamaApiWithSystemMessage(
    userPrompt: string,
    systemMessage: string,
    options: OllamaRequestOptions = {}
  ): Promise<OllamaResponse | null> {
    const { 
      model = "mistral:latest", 
      baseUrl = "http://localhost:11434",
      sessionId = uuidv4(),
      debugContext
    } = options;
    
    logger.info('Ollama API call initiated', {
      context: 'OllamaService',
      metadata: {
        model,
        baseUrl,
        debugContext,
        sessionId,
        promptLength: userPrompt.length,
        systemMessageLength: systemMessage.length
      }
    });

    // This is a placeholder implementation
    // The full implementation with all features will be extracted later
    return {
      message: {
        content: `Mock response for prompt: ${userPrompt.substring(0, 50)}...`
      },
      sessionId
    };
  }

  /**
   * Call the Ollama API with default system message
   */
  public async callOllamaApi(
    prompt: string, 
    options: OllamaRequestOptions = {}
  ): Promise<OllamaResponse | null> {
    const defaultSystemMessage = "You are a helpful assistant, who provides clear and precise answers.";
    return this.callOllamaApiWithSystemMessage(prompt, defaultSystemMessage, options);
  }
}

export const ollamaService = new OllamaService();