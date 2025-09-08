import { logger } from '../../shared/utils/logging.utils';

export enum JsonCleanerLogLevel {
  NONE = 0,
  MINIMAL = 1,
  STANDARD = 2,
  VERBOSE = 3,
  DEBUG = 4
}

interface JsonCleanerConfig {
  enabled: boolean;
  logLevel: JsonCleanerLogLevel;
  logOnlyFailures: boolean;
}

/**
 * Simplified JSON cleaner logger for the middleware
 * Provides logging capabilities for JSON cleaning operations
 */
export class JsonCleanerLogger {
  private static config: JsonCleanerConfig = {
    enabled: true,
    logLevel: JsonCleanerLogLevel.STANDARD,
    logOnlyFailures: false
  };

  private static sessionId: string | null = null;
  private static sessionStartTime: Date | null = null;

  /**
   * Configure the logger
   */
  public static configure(config: Partial<JsonCleanerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Start a new cleaning session
   */
  public static startSession(input: string, metadata?: any): string {
    const sessionId = `json_clean_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionId = sessionId;
    this.sessionStartTime = new Date();

    if (this.config.enabled && this.config.logLevel >= JsonCleanerLogLevel.MINIMAL) {
      logger.info('JSON cleaning session started', {
        context: 'JsonCleanerLogger',
        metadata: {
          sessionId,
          inputLength: input.length,
          ...metadata
        }
      });
    }

    return sessionId;
  }

  /**
   * End the current cleaning session
   */
  public static endSession(result: string, success: boolean, error?: string): void {
    if (!this.sessionId || !this.sessionStartTime) return;

    const duration = new Date().getTime() - this.sessionStartTime.getTime();

    if (this.config.enabled && (!this.config.logOnlyFailures || !success)) {
      logger.info('JSON cleaning session completed', {
        context: 'JsonCleanerLogger',
        metadata: {
          sessionId: this.sessionId,
          success,
          duration,
          resultLength: result.length,
          error
        }
      });
    }

    this.sessionId = null;
    this.sessionStartTime = null;
  }

  /**
   * Log a cleaning operation
   */
  public static logOperation(
    operation: string,
    input: string,
    output: string,
    success: boolean,
    error?: string,
    level: JsonCleanerLogLevel = JsonCleanerLogLevel.STANDARD,
    additionalMetadata?: any
  ): void {
    if (!this.config.enabled || this.config.logLevel < level) return;
    if (this.config.logOnlyFailures && success) return;

    logger.info(`JSON cleaning operation: ${operation}`, {
      context: 'JsonCleanerLogger',
      metadata: {
        sessionId: this.sessionId,
        operation,
        success,
        inputLength: input.length,
        outputLength: output.length,
        modified: input !== output,
        error,
        ...additionalMetadata
      }
    });
  }

  /**
   * Log validation result
   */
  public static logValidation(input: string, isValid: boolean, error?: string): void {
    if (!this.config.enabled) return;

    logger.info('JSON validation performed', {
      context: 'JsonCleanerLogger',
      metadata: {
        sessionId: this.sessionId,
        isValid,
        inputLength: input.length,
        error
      }
    });
  }

  /**
   * Log strategy application
   */
  public static logStrategy(strategyName: string, input: string, output: string, success: boolean, error?: string): void {
    if (!this.config.enabled || this.config.logLevel < JsonCleanerLogLevel.STANDARD) return;
    if (this.config.logOnlyFailures && success) return;

    logger.info(`JSON cleaning strategy applied: ${strategyName}`, {
      context: 'JsonCleanerLogger',
      metadata: {
        sessionId: this.sessionId,
        strategy: strategyName,
        success,
        inputLength: input.length,
        outputLength: output.length,
        modified: input !== output,
        error
      }
    });
  }

  /**
   * Log parser application
   */
  public static logParser(parserName: string, input: string, output: string): void {
    if (!this.config.enabled || this.config.logLevel < JsonCleanerLogLevel.VERBOSE) return;

    logger.info(`JSON parser applied: ${parserName}`, {
      context: 'JsonCleanerLogger',
      metadata: {
        sessionId: this.sessionId,
        parser: parserName,
        inputLength: input.length,
        outputLength: output.length,
        modified: input !== output
      }
    });
  }

  /**
   * Save inspection result to file (placeholder implementation)
   */
  public static async saveInspection(json: string, filename?: string): Promise<string> {
    const fname = filename || `json-inspection-${Date.now()}.txt`;
    console.log(`Would save JSON inspection to file: ${fname}`);
    return fname;
  }

  /**
   * Generate failure report (placeholder implementation)
   */
  public static generateFailureReport(): void {
    console.log('Would generate JSON cleaning failure report');
  }
}