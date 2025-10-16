import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../shared/utils/logging.utils';
import { appConfig } from '../../shared/config/app.config';
import { OllamaDebugger, OllamaDebugInfo } from './utils/debug-ollama.utils';
import { DataFlowLoggerService } from '../data-flow-logger/data-flow-logger.service';

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
  // Advanced parameters
  repeat_penalty?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repeat_last_n?: number;
  // Debug context
  debugContext?: string;
  // Session ID for conversation continuity
  sessionId?: string;
  // Chapter and page context for book generation
  chapterNumber?: number;
  pageNumber?: number;
  pageName?: string;
}

/**
 * Complete Ollama service with advanced features:
 * - Comprehensive debugging and logging
 * - Retry logic with authentication fallbacks
 * - Session management
 * - Parameter handling
 * - Error recovery strategies
 */
export class OllamaService {
  private dataFlowLogger: DataFlowLoggerService;
  
  constructor() {
    this.dataFlowLogger = DataFlowLoggerService.getInstance();
  }

  /**
   * Call the Ollama API with a custom system message
   * @param userPrompt - The user's prompt for the model
   * @param systemMessage - The system message defining AI behavior
   * @param options - Options for the API call (including token and sessionId)
   * @returns The API response or null on error
   */
  public async callOllamaApiWithSystemMessage(
    userPrompt: string,
    systemMessage: string,
    options: OllamaRequestOptions = {}
  ): Promise<OllamaResponse | null> {
    const { 
      authToken, 
      model = "mistral:latest", 
      temperature = 0.7,
      baseUrl = "http://localhost:11434",
      repeat_penalty,
      top_p,
      top_k,
      frequency_penalty,
      presence_penalty,
      repeat_last_n,
      debugContext,
      sessionId = uuidv4(),
      chapterNumber,
      pageNumber,
      pageName
    } = options;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };    
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Create base data without session_id
    const baseData = {
      model: model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt }
      ],
      temperature: temperature,
      stream: false,
      options: {
        ...(repeat_penalty !== undefined && { repeat_penalty }),
        ...(top_p !== undefined && { top_p }),
        ...(top_k !== undefined && { top_k }),
        ...(frequency_penalty !== undefined && { frequency_penalty }),
        ...(presence_penalty !== undefined && { presence_penalty }),
        ...(repeat_last_n !== undefined && { repeat_last_n })
      }
    };

    // Add session_id if it should be used
    const data = {
      ...baseData,
      session_id: sessionId
    };

    // Get client request body from global scope
    let clientRequestBody: any = undefined;
    try {
      clientRequestBody = (global as any).currentRequestBody;
    } catch (error) {
      // Ignore as it's optional
    }

    // Prepare debug info
    const debugInfo: OllamaDebugInfo = {
      timestamp: new Date(),
      model: model,
      baseUrl: baseUrl,
      systemMessage: systemMessage,
      userMessage: userPrompt,
      requestData: data,
      useCase: debugContext,
      clientRequestBody: clientRequestBody,
      sessionId: sessionId,
      chapterNumber: chapterNumber,
      pageNumber: pageNumber,
      pageName: pageName
    };

    // Log request
    await OllamaDebugger.logRequest(debugInfo);
    
    // Log to data flow logger
    const contextForLogger = {
      currentChapterNr: chapterNumber,
      currentPage: pageNumber,
      debugContext
    };
    
    const requestId = this.dataFlowLogger.startRequest(debugContext || 'ollama-direct', contextForLogger);
    
    this.dataFlowLogger.logLLMRequest(
      {
        stage: debugContext || 'ollama-direct',
        prompt: userPrompt,
        systemMessage: systemMessage,
        modelName: model,
        temperature: temperature,
        contextInfo: {
          sessionId,
          chapterNumber,
          pageNumber,
          pageName,
          parameters: {
            repeat_penalty,
            top_p,
            top_k,
            frequency_penalty,
            presence_penalty,
            repeat_last_n
          }
        }
      },
      contextForLogger,
      requestId
    );

    const requestStartTime = Date.now();
    
    try {
      logger.info('Sending request to Ollama API', {
        context: 'OllamaService',
        metadata: {
          url: `${baseUrl}/api/chat`,
          model: model,
          hasAuthToken: !!authToken,
          promptLength: userPrompt.length
        }
      });
      
      const response = await axios.post(`${baseUrl}/api/chat`, data, { 
        headers,
        timeout: 90000 // 90 second timeout
      });
      const requestDuration = Date.now() - requestStartTime;
      
      if (response && response.status === 200) {
        const aiResponse = response.data;
        
        // Add session ID to response
        aiResponse.sessionId = sessionId;
        
        // Add response info
        debugInfo.responseTimestamp = new Date();
        debugInfo.response = aiResponse.message.content;
        debugInfo.rawResponseData = aiResponse;
        
        // Try to extract thinking content
        const thinkMatch = aiResponse.message.content.match(/<think>([\s\S]*?)<\/think>/);
        if (thinkMatch && thinkMatch[1]) {
          debugInfo.thinking = thinkMatch[1].trim();
        }
        
        // Log response (including markdown saving)
        await OllamaDebugger.logResponse(debugInfo);
        
        // Log to data flow logger
        this.dataFlowLogger.logLLMResponse(
          debugContext || 'ollama-direct',
          {
            rawResponse: aiResponse.message.content,
            processingTime: requestDuration
          },
          contextForLogger,
          requestId
        );
        
        return aiResponse;
      } else {
        const error = new Error(`Status ${response?.status || 'unknown'}`);
        logger.error('Error calling Ollama API', {
          context: this.constructor.name,
          error: error.message,
          metadata: response?.data || {}
        });
        
        // Log error to data flow logger
        this.dataFlowLogger.logLLMResponse(
          debugContext || 'ollama-direct',
          {
            rawResponse: '',
            processingTime: Date.now() - requestStartTime,
            error
          },
          contextForLogger,
          requestId
        );
        
        return null;
      }
    } catch (error: unknown) {
      // Type-safe error handling
      let errorMessage = 'Unknown error';
      let errorDetails: Record<string, any> = {};
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Check for Axios error and safely extract properties
      if (
        error && 
        typeof error === 'object' && 
        'isAxiosError' in error && 
        error.isAxiosError === true
      ) {
        const axiosError = error as any;
        
        if (axiosError.response) {
          errorDetails = {
            statusCode: axiosError.response.status,
            statusText: axiosError.response.statusText,
            data: axiosError.response.data
          };
          
          // Check for session ID related errors
          if (axiosError.response.status === 400 && 
              typeof axiosError.response.data === 'object' &&
              axiosError.response.data?.error?.includes('session_id')) {
            logger.warn('Session ID not supported in this Ollama version', {
              context: this.constructor.name,
              error: axiosError.response.data?.error,
              metadata: { sessionId }
            });
            
            // Retry without session_id
            try {
              const retryResponse = await axios.post(`${baseUrl}/api/chat`, baseData, { headers });
              if (retryResponse && retryResponse.status === 200) {
                const aiResponse = retryResponse.data;
                // Add session ID for internal tracking anyway
                aiResponse.sessionId = sessionId;
                
                debugInfo.responseTimestamp = new Date();
                debugInfo.response = aiResponse.message.content;
                debugInfo.rawResponseData = aiResponse;
                
                const thinkMatch = aiResponse.message.content.match(/<think>([\s\S]*?)<\/think>/);
                if (thinkMatch && thinkMatch[1]) {
                  debugInfo.thinking = thinkMatch[1].trim();
                }
                
                await OllamaDebugger.logResponse(debugInfo);
                
                // Log successful retry to data flow logger
                this.dataFlowLogger.logLLMResponse(
                  debugContext || 'ollama-direct',
                  {
                    rawResponse: aiResponse.message.content,
                    processingTime: Date.now() - requestStartTime
                  },
                  contextForLogger,
                  requestId
                );
                
                return aiResponse;
              }
            } catch (retryError) {
              // Error in retry, continue with original error
              logger.error('Retry also failed', {
                context: this.constructor.name,
                error: retryError instanceof Error ? retryError.message : 'Unknown retry error'
              });
            }
          }
          
          // Check for auth errors specifically
          if (axiosError.response.status === 401 || axiosError.response.status === 403) {
            logger.error('Authentication error with Ollama API', {
              context: this.constructor.name,
              error: 'Invalid or missing authentication token',
              metadata: {
                baseUrl,
                hasToken: !!authToken,
                statusCode: axiosError.response.status
              }
            });

            // Retry strategy ladder:
            // 1) Authorization: <raw token>
            if (authToken) {
              try {
                const headersRawAuth: Record<string, string> = {
                  'Content-Type': 'application/json',
                  'Authorization': authToken
                };
                const retryRaw = await axios.post(`${baseUrl}/api/chat`, baseData, { 
                  headers: headersRawAuth, 
                  timeout: 90000 
                });
                if (retryRaw && retryRaw.status === 200) {
                  return this.handleSuccessfulResponse(retryRaw.data, debugInfo, sessionId, requestStartTime, debugContext, contextForLogger, requestId);
                }
              } catch (retryRawErr) {
                logger.warn('Retry with raw Authorization header failed', {
                  context: this.constructor.name,
                  error: retryRawErr instanceof Error ? retryRawErr.message : 'Unknown'
                });
              }
            }

            // 2) X-API-Key header
            if (authToken) {
              try {
                const headersApiKey: Record<string, string> = {
                  'Content-Type': 'application/json',
                  'X-API-Key': authToken
                };
                const retryApiKey = await axios.post(`${baseUrl}/api/chat`, baseData, { 
                  headers: headersApiKey, 
                  timeout: 90000 
                });
                if (retryApiKey && retryApiKey.status === 200) {
                  return this.handleSuccessfulResponse(retryApiKey.data, debugInfo, sessionId, requestStartTime, debugContext, contextForLogger, requestId);
                }
              } catch (retryKeyErr) {
                logger.warn('Retry with X-API-Key header failed', {
                  context: this.constructor.name,
                  error: retryKeyErr instanceof Error ? retryKeyErr.message : 'Unknown'
                });
              }
            }

            // 3) No auth (for dev instances)
            try {
              const headersNoAuth: Record<string, string> = { 'Content-Type': 'application/json' };
              const retryAuthless = await axios.post(`${baseUrl}/api/chat`, baseData, { 
                headers: headersNoAuth, 
                timeout: 90000 
              });
              if (retryAuthless && retryAuthless.status === 200) {
                return this.handleSuccessfulResponse(retryAuthless.data, debugInfo, sessionId, requestStartTime, debugContext, contextForLogger, requestId);
              }
            } catch (retryAuthlessError) {
              logger.error('Authless retry failed', {
                context: this.constructor.name,
                error: retryAuthlessError instanceof Error ? retryAuthlessError.message : 'Unknown authless retry error'
              });
            }
          }
        }
      }
      
      logger.error('Error in API request', {
        context: this.constructor.name,
        error: errorMessage,
        metadata: {
          ...errorDetails,
          requestModel: model,
          baseUrl: baseUrl,
          sessionId: sessionId
        }
      });
      
      // Log error to data flow logger
      this.dataFlowLogger.logLLMResponse(
        debugContext || 'ollama-direct',
        {
          rawResponse: '',
          processingTime: Date.now() - requestStartTime,
          error: error instanceof Error ? error : new Error(errorMessage)
        },
        contextForLogger,
        requestId
      );
      
      // Add error info
      debugInfo.responseTimestamp = new Date();
      debugInfo.error = {
        message: errorMessage,
        details: errorDetails
      };
      
      // Log error
      await OllamaDebugger.logError(debugInfo);
      
      // Check for memory errors in response
      const errorResponseData = errorDetails.data;
      if (
        errorResponseData && 
        typeof errorResponseData === 'object' &&
        'error' in errorResponseData && 
        typeof errorResponseData.error === 'string'
      ) {
        const errorText = errorResponseData.error;
        if (
          errorText.includes('model requires more system memory') ||
          errorText.includes('model request too large for system')
        ) {
          throw new Error(`Insufficient memory to load model ${model}. Try closing other applications or using a smaller model.`);
        }
      }
      
      return null;
    }
  }

  /**
   * Helper method to handle successful responses consistently
   */
  private async handleSuccessfulResponse(
    aiResponse: any, 
    debugInfo: OllamaDebugInfo, 
    sessionId: string, 
    requestStartTime: number,
    debugContext: string | undefined,
    contextForLogger: any,
    requestId: string
  ): Promise<OllamaResponse> {
    aiResponse.sessionId = sessionId;
    debugInfo.responseTimestamp = new Date();
    debugInfo.response = aiResponse.message.content;
    debugInfo.rawResponseData = aiResponse;
    
    const thinkMatch = aiResponse.message.content.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch && thinkMatch[1]) {
      debugInfo.thinking = thinkMatch[1].trim();
    }
    
    await OllamaDebugger.logResponse(debugInfo);
    
    this.dataFlowLogger.logLLMResponse(
      debugContext || 'ollama-direct',
      {
        rawResponse: aiResponse.message.content,
        processingTime: Date.now() - requestStartTime
      },
      contextForLogger,
      requestId
    );
    
    return aiResponse;
  }

  /**
   * Call the Ollama API with default system message
   * @param prompt - The prompt for the model
   * @param options - Options for the API call (including token and sessionId)
   * @returns The API response or null on error
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