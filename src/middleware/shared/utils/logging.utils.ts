import { Request } from 'express';
import { appConfig } from '../config/app.config';
import { LogLevel, LogLevelConfig } from '../config/logging.config';

interface LogEntry {
  log_text: string;
  log_level: number;
  log_category?: string;
  context?: string;
  requestId?: string;
  error?: string;
  url?: string;
  method?: string;
  duration?: number;
  operation?: string;
  created_at: string;
}

interface LogOptions {
  context?: string;
  category?: string;
  requestId?: string;
  error?: string;
  url?: string;
  method?: string;
  duration?: number;
  operation?: string;
  metadata?: Record<string, any>;
  printMetadata?: boolean;
}

class Logger {
  private formatMessage(
    level: LogLevelConfig,
    message: unknown,
    options?: LogOptions
  ): string {
    const timestamp = new Date().toISOString();
    const levelString = level.label.padEnd(8);
    const context = options?.context ? ` [${options.context}]` : '';
    const category = options?.category ? ` (${options.category})` : '';
    const requestId = options?.requestId ? ` #${options.requestId}` : '';
    const error = options?.error ? ` Error: ${options.error}` : '';
    const url = options?.url ? ` URL: ${options?.url}` : '';
    const method = options?.method ? ` Method: ${options?.method}` : '';
    const duration = options?.duration ? ` Duration: ${options?.duration}ms` : '';
    const operation = options?.operation ? ` Operation: ${options.operation}` : '';
    
    const printMetadata = options?.printMetadata || false;
    const formattedMessage = typeof message === 'object' 
      ? JSON.stringify(message, null, 2) 
      : String(message);
    
    let finalMessage = `${timestamp} ${levelString}${context}${category}${operation}${requestId}${url}${method}${duration}${error}: ${formattedMessage}`;
    
    if (printMetadata && options?.metadata) {
      const metadataStr = JSON.stringify(options.metadata, null, 2);
      finalMessage += `\\nMetadata: ${metadataStr}`;
    }

    return finalMessage;
  }

  public async log(
    level: LogLevelConfig,
    message: unknown,
    options?: LogOptions
  ): Promise<void> {
    const formattedMessage = this.formatMessage(level, message, options);

    // Console logging based on app config
    if (appConfig.logging.console.enabled) {
      const minLevel = this.getLevelByName(appConfig.logging.level);
      if (level.value >= minLevel.value) {
        const output = appConfig.logging.console.colorized 
          ? `${level.color}${formattedMessage}${LogLevel.NONE.color}`
          : formattedMessage;
        console.log(output);
      }
    }
  }

  // Helper method to get LogLevelConfig by name
  private getLevelByName(levelName: string): LogLevelConfig {
    const level = Object.entries(LogLevel).find(
      ([key]) => key.toLowerCase() === levelName.toLowerCase()
    );
    return level ? level[1] : LogLevel.INFO;
  }

  // Helper function to temporarily change the log-level
  public setConsoleLogLevel(level: LogLevelConfig): string {
    const previousLevel = appConfig.logging.level;
    appConfig.logging.level = level.label;
    return previousLevel;
  }

  // Convenience methods
  public debug(message: unknown, options?: LogOptions): Promise<void> {
    return this.log(LogLevel.DEBUG, message, options);
  }

  public info(message: unknown, options?: LogOptions): Promise<void> {
    return this.log(LogLevel.INFO, message, options);
  }

  public warn(message: unknown, options?: LogOptions): Promise<void> {
    return this.log(LogLevel.WARN, message, options);
  }

  public error(message: unknown, options?: LogOptions): Promise<void> {
    const errorMsg = options?.error || (message instanceof Error ? message.message : undefined);
    return this.log(LogLevel.ERROR, message, {
      ...options,
      error: errorMsg
    });
  }

  public critical(message: unknown, options?: LogOptions): Promise<void> {
    return this.log(LogLevel.CRITICAL, message, options);
  }

  public system(message: unknown, options?: LogOptions): Promise<void> {
    return this.log(LogLevel.SYSTEM, message, options);
  }

  // Application specific logging methods
  public logRequest(req: Request): Promise<void> {
    return this.info({
      headers: req.headers,
      url: req.url,
      query: req.query,
      timestamp: new Date().toISOString()
    }, { 
      category: 'HTTP',
      url: req.url,
      method: req.method
    });
  }
}

export const logger = new Logger();