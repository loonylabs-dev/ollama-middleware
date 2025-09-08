import * as fs from 'fs';
import * as path from 'path';

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
  chapterPage: string;
  contextType: string;
  data: any;
}

/**
 * Service for logging data flow in AI processing pipelines
 * Tracks requests, responses, and processing steps for debugging
 */
export class DataFlowLoggerService {
  private static instance: DataFlowLoggerService;
  private readonly logDir = path.join(process.cwd(), 'logs', 'ollama', 'requests-data-flow');
  private currentRequestId: string | null = null;

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
   * Start a new request and return request ID
   */
  startRequest(stage: string, context: any = {}): string {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentRequestId = requestId;
    
    this.logEntry({
      requestId,
      stage,
      operation: 'request',
      chapterPage: this.buildChapterPageId(context),
      contextType: 'start',
      data: { stage, startTime: new Date().toISOString(), context }
    });
    
    return requestId;
  }

  /**
   * Log LLM request
   */
  logLLMRequest(request: LLMRequest, context: any = {}, requestId?: string): void {
    const id = requestId || this.currentRequestId || 'unknown';
    
    this.logEntry({
      requestId: id,
      stage: request.stage,
      operation: 'request',
      chapterPage: this.buildChapterPageId(context),
      contextType: 'llm-request',
      data: {
        prompt: request.prompt.substring(0, 200) + '...',
        systemMessage: request.systemMessage.substring(0, 200) + '...',
        modelName: request.modelName,
        temperature: request.temperature,
        contextInfo: request.contextInfo
      }
    });
  }

  /**
   * Log LLM response
   */
  logLLMResponse(stage: string, response: LLMResponse, context: any = {}, requestId?: string): void {
    const id = requestId || this.currentRequestId || 'unknown';
    
    this.logEntry({
      requestId: id,
      stage,
      operation: 'response',
      chapterPage: this.buildChapterPageId(context),
      contextType: 'llm-response',
      data: {
        rawResponse: response.rawResponse.substring(0, 500) + '...',
        processingTime: response.processingTime,
        tokensUsed: response.tokensUsed,
        hasError: !!response.error
      }
    });
  }

  /**
   * Log context preparation
   */
  logContextPreparation(stage: string, contextData: any, context: any = {}): void {
    const id = this.currentRequestId || 'unknown';
    
    this.logEntry({
      requestId: id,
      stage,
      operation: 'context-prep',
      chapterPage: this.buildChapterPageId(context),
      contextType: 'context',
      data: contextData
    });
  }

  /**
   * Log JSON cleaning operation
   */
  logJsonCleaning(stage: string, cleaningData: any, context: any = {}): void {
    const id = this.currentRequestId || 'unknown';
    
    this.logEntry({
      requestId: id,
      stage,
      operation: 'json-cleaning',
      chapterPage: this.buildChapterPageId(context),
      contextType: 'json-clean',
      data: cleaningData
    });
  }

  private logEntry(entry: Omit<DataFlowEntry, 'timestamp'>): void {
    const fullEntry: DataFlowEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    const logFileName = `dataflow_${new Date().toISOString().split('T')[0]}.json`;
    const logFilePath = path.join(this.logDir, logFileName);

    try {
      let existingEntries: DataFlowEntry[] = [];
      if (fs.existsSync(logFilePath)) {
        const existingContent = fs.readFileSync(logFilePath, 'utf8');
        existingEntries = JSON.parse(existingContent);
      }

      existingEntries.push(fullEntry);
      fs.writeFileSync(logFilePath, JSON.stringify(existingEntries, null, 2));
    } catch (error) {
      console.error('Failed to write data flow log:', error);
    }
  }

  private buildChapterPageId(context: any): string {
    const chapter = context?.currentChapterNr || context?.chapterNumber;
    const page = context?.currentPage || context?.pageNumber;
    
    if (chapter && page) {
      return `C${chapter}P${page}`;
    } else if (chapter) {
      return `C${chapter}`;
    } else if (page) {
      return `P${page}`;
    }
    
    return 'unknown';
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