import * as fs from 'fs';
import * as path from 'path';
import { appConfig } from '../../../shared/config/app.config';
import { TextAnalyzer } from './text-analysis.utils';

export interface OllamaDebugInfo {
  timestamp: Date;
  model: string;
  baseUrl: string;
  systemMessage: string;
  userMessage: string;
  requestData: any;
  // Optional response fields
  response?: string;
  thinking?: string;
  responseTimestamp?: Date;
  rawResponseData?: any;
  error?: {
    message: string;
    details?: any;
  };
  // Use case context
  useCase?: string;
  // Client request body
  clientRequestBody?: any;
  // Session ID for related conversations
  sessionId: string;
  // Chapter and page context for book generation
  chapterNumber?: number;
  pageNumber?: number;
  pageName?: string;
}

/**
 * Comprehensive debugging utility for Ollama API interactions
 * Provides console logging, file logging, and text analysis
 */
export class OllamaDebugger {
  private static isMinimal = process.env.DEBUG_OLLAMA_MINIMAL === 'true';
  private static showResponseInConsole = process.env.DEBUG_OLLAMA_RESPONSE_CONSOLE !== 'false';

  private static isEnabled = process.env.DEBUG_OLLAMA_REQUESTS === 'true' || 
                            appConfig.server.environment === 'development';
  private static logsDir = path.join(process.cwd(), 'logs', 'ollama', 'requests');

  /**
   * Ensure logs directory exists
   */
  static ensureLogsDirectory(): void {
    if (!this.isEnabled) return;
    
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }

  /**
   * Format message for console output
   */
  static formatMessage(message: string): string {
    // Normalize line breaks for console
    return message
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '  ')
      .trim();
  }

  /**
   * Log request information to console
   */
  static logRequestToConsole(debugInfo: OllamaDebugInfo): void {
    if (!this.isEnabled) return;

    // Build chapter/page identifier for console display
    let chapterPageId = '';
    if (debugInfo.chapterNumber && debugInfo.pageNumber) {
      chapterPageId = ` [C${debugInfo.chapterNumber}P${debugInfo.pageNumber}]`;
    } else if (debugInfo.chapterNumber) {
      chapterPageId = ` [C${debugInfo.chapterNumber}]`;
    }

    console.log('\n' + '='.repeat(80));
    console.log(`🚀 OLLAMA REQUEST${chapterPageId}`);
    console.log('='.repeat(80));
    console.log(`⏰ Timestamp: ${debugInfo.timestamp.toISOString()}`);
    console.log(`🤖 Model: ${debugInfo.model}`);
    console.log(`🌐 Base URL: ${debugInfo.baseUrl}`);
    console.log(`📁 Use Case: ${debugInfo.useCase || 'Unknown'}`);
    
    // Show chapter/page context prominently
    if (debugInfo.chapterNumber || debugInfo.pageNumber || debugInfo.pageName) {
      console.log(`📖 Context: Chapter ${debugInfo.chapterNumber || '?'}, Page ${debugInfo.pageNumber || '?'}${debugInfo.pageName ? ` (${debugInfo.pageName})` : ''}`);
    }
    
    // Show detailed info only if not minimal
    if (!this.isMinimal) {
      // Client request body
      if (debugInfo.clientRequestBody) {
        console.log('\n📱 CLIENT REQUEST BODY:');
        console.log('-'.repeat(50));
        console.log(JSON.stringify(debugInfo.clientRequestBody, null, 2));
      }
      
      console.log('\n📋 SYSTEM MESSAGE:');
      console.log('-'.repeat(50));
      console.log(this.formatMessage(debugInfo.systemMessage));
      
      console.log('\n👤 USER MESSAGE:');
      console.log('-'.repeat(50));
      console.log(this.formatMessage(debugInfo.userMessage));
      
      console.log('\n🔧 COMPLETE REQUEST DATA:');
      console.log('-'.repeat(50));
      console.log(JSON.stringify(debugInfo.requestData, null, 2));
    }
    
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Log response information to console
   */
  static logResponseToConsole(debugInfo: OllamaDebugInfo): void {
    if (!this.isEnabled) return;

    // Build chapter/page identifier for console display
    let chapterPageId = '';
    if (debugInfo.chapterNumber && debugInfo.pageNumber) {
      chapterPageId = ` [C${debugInfo.chapterNumber}P${debugInfo.pageNumber}]`;
    } else if (debugInfo.chapterNumber) {
      chapterPageId = ` [C${debugInfo.chapterNumber}]`;
    }

    console.log('\n' + '='.repeat(80));
    console.log(`📥 OLLAMA RESPONSE${chapterPageId}`);
    console.log('='.repeat(80));
    console.log(`⏰ Response Timestamp: ${debugInfo.responseTimestamp?.toISOString() || 'N/A'}`);
    console.log(`🤖 Model: ${debugInfo.model}`);
    console.log(`📁 Use Case: ${debugInfo.useCase || 'Unknown'}`);

    // Show chapter/page context prominently
    if (debugInfo.chapterNumber || debugInfo.pageNumber || debugInfo.pageName) {
      console.log(`📖 Context: Chapter ${debugInfo.chapterNumber || '?'}, Page ${debugInfo.pageNumber || '?'}${debugInfo.pageName ? ` (${debugInfo.pageName})` : ''}`);
    }

    // Detailed logs only if not minimal
    if (!this.isMinimal) {
      if (debugInfo.response) {
        console.log('\n✅ RESPONSE:');
        console.log('-'.repeat(50));
        console.log(this.formatMessage(debugInfo.response));
      }
      
      if (debugInfo.thinking) {
        console.log('\n🧠 THINKING:');
        console.log('-'.repeat(50));
        console.log(this.formatMessage(debugInfo.thinking));
      }

      // Show key metrics from raw response data
      if (debugInfo.rawResponseData) {
        console.log('\n⏱️  RESPONSE METRICS:');
        console.log('-'.repeat(50));
        if (debugInfo.rawResponseData.eval_count !== undefined) {
          console.log(`Tokens generated: ${debugInfo.rawResponseData.eval_count}`);
        }
        if (debugInfo.rawResponseData.prompt_eval_count !== undefined) {
          console.log(`Prompt tokens: ${debugInfo.rawResponseData.prompt_eval_count}`);
        }
        if (debugInfo.rawResponseData.total_duration !== undefined) {
          const seconds = (debugInfo.rawResponseData.total_duration / 1e9).toFixed(2);
          console.log(`Total duration: ${seconds}s`);
        }
        if (debugInfo.rawResponseData.eval_duration !== undefined) {
          const evalSeconds = (debugInfo.rawResponseData.eval_duration / 1e9).toFixed(2);
          console.log(`Generation duration: ${evalSeconds}s`);
        }
      }
    }
    
    if (debugInfo.error) {
      console.log('\n❌ ERROR:');
      console.log('-'.repeat(50));
      console.log('Message:', debugInfo.error.message);
      if (debugInfo.error.details && !this.isMinimal) {
        console.log('Details:', JSON.stringify(debugInfo.error.details, null, 2));
      }
    }
    
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Save debug information to markdown file with text analysis
   */
  static async saveToMarkdown(debugInfo: OllamaDebugInfo): Promise<void> {
    if (!this.isEnabled) return;

    this.ensureLogsDirectory();

    const timestamp = debugInfo.timestamp.toISOString().replace(/[:.]/g, '-');
    
    // Extract and clean use case name
    let useCaseName = 'unknown';
    if (debugInfo.useCase) {
      useCaseName = debugInfo.useCase
        .replace(/UseCase$/i, '')
        .replace(/^Create/i, '')
        .toLowerCase();
    }
    
    // Add chapter/page identifier to filename
    let chapterPageSuffix = '';
    if (debugInfo.chapterNumber && debugInfo.pageNumber) {
      chapterPageSuffix = `_c${debugInfo.chapterNumber}p${debugInfo.pageNumber}`;
    } else if (debugInfo.chapterNumber) {
      chapterPageSuffix = `_c${debugInfo.chapterNumber}`;
    }
    
    const filename = `${timestamp}_${useCaseName}${chapterPageSuffix}.md`;
    const filePath = path.join(this.logsDir, filename);

    // Perform text analysis if response is available
    let wordFrequencySection = '';
    let stemFrequencySection = '';
    
    if (debugInfo.response) {
      const { wordFrequencySection: wordSection, stemFrequencySection: stemSection } = 
        TextAnalyzer.generateTextAnalysisMarkdown(debugInfo.response, 50);
      
      wordFrequencySection = wordSection;
      stemFrequencySection = stemSection;
    }

    const markdownContent = `# Ollama Request & Response Log

## Request Information
- **Request Timestamp**: ${debugInfo.timestamp.toISOString()}
- **Response Timestamp**: ${debugInfo.responseTimestamp?.toISOString() || 'N/A'}
- **Model**: ${debugInfo.model}
- **Base URL**: ${debugInfo.baseUrl}
- **Use Case**: ${debugInfo.useCase || 'Unknown'}
- **Session ID**: ${debugInfo.sessionId}
${debugInfo.chapterNumber || debugInfo.pageNumber || debugInfo.pageName ? `- **Chapter**: ${debugInfo.chapterNumber || 'N/A'}
- **Page**: ${debugInfo.pageNumber || 'N/A'}${debugInfo.pageName ? `
- **Page Name**: ${debugInfo.pageName}` : ''}` : ''}

${debugInfo.clientRequestBody ? `## Client Request Body
\`\`\`json
${JSON.stringify(debugInfo.clientRequestBody, null, 2)}
\`\`\`
` : ''}

## System Message
\`\`\`
${debugInfo.systemMessage}
\`\`\`

## User Message
\`\`\`
${debugInfo.userMessage}
\`\`\`

## Complete Request Data
\`\`\`json
${JSON.stringify(debugInfo.requestData, null, 2)}
\`\`\`

${debugInfo.response ? `## Response
\`\`\`
${debugInfo.response}
\`\`\`
` : ''}

${debugInfo.rawResponseData ? `## Complete Response Data
\`\`\`json
${JSON.stringify(debugInfo.rawResponseData, null, 2)}
\`\`\`
` : ''}

${wordFrequencySection}

${stemFrequencySection}

${debugInfo.thinking ? `## Thinking
\`\`\`
${debugInfo.thinking}
\`\`\`
` : ''}

${debugInfo.error ? `## Error
- **Message**: ${debugInfo.error.message}
${debugInfo.error.details ? `\`\`\`json
${JSON.stringify(debugInfo.error.details, null, 2)}
\`\`\`
` : ''}` : ''}

---
*Generated on ${new Date().toISOString()}*
`;

    try {
      await fs.promises.writeFile(filePath, markdownContent, 'utf8');
      console.log(`📝 Log saved to: ${filePath}`);
    } catch (error) {
      console.error('Failed to save log:', error);
    }
  }

  // API methods for easy usage
  static async logRequest(debugInfo: OllamaDebugInfo): Promise<void> {
    this.logRequestToConsole(debugInfo);
  }

  static async logResponse(debugInfo: OllamaDebugInfo): Promise<void> {
    if (this.showResponseInConsole) {
      this.logResponseToConsole(debugInfo);
    }
    await this.saveToMarkdown(debugInfo);
  }

  static async logError(debugInfo: OllamaDebugInfo): Promise<void> {
    // Always show errors in console, regardless of response console setting
    this.logResponseToConsole(debugInfo);
    await this.saveToMarkdown(debugInfo);
  }
}