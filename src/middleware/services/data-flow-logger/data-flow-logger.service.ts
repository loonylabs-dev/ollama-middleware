import * as fs from 'fs';
import * as path from 'path';

// Inline helper for context type detection
class ContextTypeHelper {
  static detectContextType(context: any): string {
    if (!context) return 'unknown';
    if (context.currentChapterNr || context.chapterNumber) return 'structured';
    if (context.debugContext) return context.debugContext;
    return 'generic';
  }
}

export interface LLMRequest {
  stage: string;
  prompt: string;
  systemMessage: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  contextInfo?: any;
}

export interface LLMResponse {
  rawResponse: string;
  cleanedResponse?: string;
  processingTime: number;
  tokensUsed?: number;
  error?: any;
}

export interface DataFlowEntry {
  timestamp: string;
  requestId: string;
  stage: string;
  operation: 'request' | 'response' | 'error' | 'context-prep' | 'json-cleaning';
  contextId: string;
  contextType: string;
  data: any;
}

/**
 * Enhanced service for logging data flow in AI processing pipelines
 * Features: 
 * - Ring buffer (max 1000 entries per file)
 * - Full prompt/response storage
 * - Request flow tracking
 * - Stage flow summaries
 */
export class DataFlowLoggerService {
  private static instance: DataFlowLoggerService;
  private readonly logDir = path.join(process.cwd(), 'logs', 'ollama', 'requests-data-flow');
  private currentRequestId: string | null = null;
  private readonly MAX_ENTRIES_PER_FILE = 1000;

  private constructor() {
    this.ensureLogDirectoryExists();
  }

  static getInstance(): DataFlowLoggerService {
    if (!DataFlowLoggerService.instance) {
      DataFlowLoggerService.instance = new DataFlowLoggerService();
    }
    return DataFlowLoggerService.instance;
  }

  private ensureLogDirectoryExists(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get context identifier for logging
   */
  private getContextIdentifier(context: any): string {
    const chapterNr = context?.currentChapterNr || context?.chapterNumber;
    const page = context?.currentPage || context?.pageNumber;
    
    if (chapterNr && page) {
      return `C${chapterNr}P${page}`;
    } else if (chapterNr) {
      return `C${chapterNr}`;
    } else if (page) {
      return `P${page}`;
    }
    
    return 'general';
  }

  /**
   * Start a new request and return request ID
   */
  startRequest(stage: string, context: any = {}): string {
    this.currentRequestId = this.generateRequestId();
    return this.currentRequestId;
  }

  /**
   * Log LLM request with full prompt/system message storage
   */
  logLLMRequest(request: LLMRequest, context: any = {}, requestId?: string): void {
    const id = requestId || this.currentRequestId || 'unknown';
    
    this.logEntry({
      requestId: id,
      stage: request.stage,
      operation: 'request',
      contextId: this.getContextIdentifier(context),
      contextType: ContextTypeHelper.detectContextType(context),
      data: {
        promptLength: request.prompt.length,
        systemMessageLength: request.systemMessage.length,
        promptPreview: request.prompt.substring(0, 500) + '...',
        systemMessagePreview: request.systemMessage.substring(0, 300) + '...',
        fullPrompt: request.prompt,
        fullSystemMessage: request.systemMessage,
        modelName: request.modelName,
        temperature: request.temperature,
        contextInfo: request.contextInfo
      }
    });
  }

  /**
   * Log LLM response with full response storage
   */
  logLLMResponse(stage: string, response: LLMResponse, context: any = {}, requestId?: string): void {
    const id = requestId || this.currentRequestId || 'unknown';
    
    this.logEntry({
      requestId: id,
      stage,
      operation: response.error ? 'error' : 'response',
      contextId: this.getContextIdentifier(context),
      contextType: ContextTypeHelper.detectContextType(context),
      data: {
        responseLength: response.rawResponse?.length || 0,
        cleanedResponseLength: response.cleanedResponse?.length || 0,
        processingTime: response.processingTime,
        tokensUsed: response.tokensUsed,
        responsePreview: response.rawResponse?.substring(0, 500) + '...',
        fullResponse: response.rawResponse,
        cleanedResponse: response.cleanedResponse,
        error: response.error ? {
          message: response.error.message,
          stack: response.error.stack,
          type: response.error.constructor?.name
        } : undefined
      }
    });
  }

  /**
   * Log context preparation
   */
  logContextPreparation(stage: string, context: any, contextPreparationDetails: any): void {
    const id = this.currentRequestId || 'unknown';
    
    this.logEntry({
      requestId: id,
      stage,
      operation: 'context-prep',
      contextId: this.getContextIdentifier(context),
      contextType: ContextTypeHelper.detectContextType(context),
      data: {
        contextSources: contextPreparationDetails.sources || [],
        contextSize: JSON.stringify(contextPreparationDetails).length,
        enrichmentSteps: contextPreparationDetails.enrichmentSteps || [],
        contextFeatures: this.extractContextFeatures(context)
      }
    });
  }

  /**
   * Log JSON cleaning operation
   */
  logJsonCleaning(stage: string, context: any, cleaningDetails: {
    input: string;
    output?: string;
    method: string;
    success: boolean;
    iterations?: number;
    error?: any;
  }): void {
    const id = this.currentRequestId || 'unknown';
    
    this.logEntry({
      requestId: id,
      stage,
      operation: 'json-cleaning',
      contextId: this.getContextIdentifier(context),
      contextType: ContextTypeHelper.detectContextType(context),
      data: {
        inputLength: cleaningDetails.input.length,
        outputLength: cleaningDetails.output?.length || 0,
        method: cleaningDetails.method,
        success: cleaningDetails.success,
        iterations: cleaningDetails.iterations,
        inputPreview: cleaningDetails.input.substring(0, 200) + '...',
        outputPreview: cleaningDetails.output?.substring(0, 200) + '...',
        error: cleaningDetails.error ? {
          message: cleaningDetails.error.message,
          type: cleaningDetails.error.constructor?.name
        } : undefined
      }
    });
  }

  /**
   * Log complete flow for a stage
   */
  logStageFlow(stage: string, context: any, flowSummary: {
    totalDuration: number;
    contextPrepDuration?: number;
    llmRequestDuration?: number;
    jsonCleaningDuration?: number;
    success: boolean;
    outputSize?: number;
    error?: any;
  }): void {
    const id = this.currentRequestId || 'unknown';
    
    this.logEntry({
      requestId: id,
      stage,
      operation: 'context-prep',
      contextId: this.getContextIdentifier(context),
      contextType: ContextTypeHelper.detectContextType(context),
      data: {
        flowType: 'stage-summary',
        ...flowSummary
      }
    });
  }

  /**
   * Extract context features for detailed logging
   */
  private extractContextFeatures(context: any): any {
    if (!context) return {};
    
    return {
      hasDebugContext: !!context.debugContext,
      hasContextInfo: !!context.contextInfo,
      contextKeys: context ? Object.keys(context).filter(k => !k.startsWith('_')).slice(0, 10) : []
    };
  }

  /**
   * Get log file path for a context
   */
  private getLogFilePath(context: any): string {
    const identifier = this.getContextIdentifier(context);
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const fileName = `${identifier}_${dateStr}_flow.json`;
    return path.join(this.logDir, fileName);
  }

  /**
   * Log entry with ring buffer (max 1000 entries per file)
   */
  private logEntry(entry: Omit<DataFlowEntry, 'timestamp'>): void {
    const fullEntry: DataFlowEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    const logFilePath = this.getLogFilePath({});

    try {
      let existingEntries: DataFlowEntry[] = [];
      if (fs.existsSync(logFilePath)) {
        const existingContent = fs.readFileSync(logFilePath, 'utf8');
        try {
          const parsed = JSON.parse(existingContent);
          existingEntries = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          console.error(`Failed to parse existing log file ${logFilePath}:`, e);
          existingEntries = [];
        }
      }

      existingEntries.push(fullEntry);

      // Ring buffer: Keep only last 1000 entries per file
      if (existingEntries.length > this.MAX_ENTRIES_PER_FILE) {
        existingEntries = existingEntries.slice(-this.MAX_ENTRIES_PER_FILE);
      }

      fs.writeFileSync(logFilePath, JSON.stringify(existingEntries, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to write data flow log:', error);
    }
  }

  /**
   * Get flow entries for a specific request
   */
  getRequestFlow(context: any, requestId: string): DataFlowEntry[] {
    const filePath = this.getLogFilePath(context);

    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const entries: DataFlowEntry[] = JSON.parse(content);
        return entries.filter(e => e.requestId === requestId);
      }
    } catch (error) {
      console.error(`Failed to read flow log ${filePath}:`, error);
    }

    return [];
  }

  /**
   * Get current request ID
   */
  getCurrentRequestId(): string | null {
    return this.currentRequestId;
  }

  /**
   * Clear current request ID
   */
  clearCurrentRequestId(): void {
    this.currentRequestId = null;
  }
}