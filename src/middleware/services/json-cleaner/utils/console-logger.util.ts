/**
 * Lightweight Console logging control for the JSON Cleaner
 * Can be controlled via the .env variable JSON_CLEANER_CONSOLE_LOGS
 */
export class JsonCleanerConsole {
  private static consoleEnabled: boolean | null = null;

  /**
   * Checks if Console logging is enabled
   * Caches the result for better performance
   */
  private static isConsoleEnabled(): boolean {
    if (this.consoleEnabled === null) {
      // Read .env variable
      const envValue = process.env.JSON_CLEANER_CONSOLE_LOGS;
      
      // Default: enabled in Development, disabled in Production
      if (envValue === undefined) {
        this.consoleEnabled = process.env.NODE_ENV !== 'production';
      } else {
        // Explicit values: 'true', '1', 'yes', 'on' = enabled
        this.consoleEnabled = ['true', '1', 'yes', 'on'].includes(envValue.toLowerCase());
      }
    }
    
    return this.consoleEnabled;
  }

  /**
   * Sets the Console logging status (for tests or dynamic control)
   */
  public static setConsoleEnabled(enabled: boolean): void {
    this.consoleEnabled = enabled;
  }

  /**
   * Reset cache (useful for tests)
   */
  public static resetCache(): void {
    this.consoleEnabled = null;
  }

  /**
   * Console.log - only when enabled
   */
  public static log(...args: any[]): void {
    if (this.isConsoleEnabled()) {
      console.log(...args);
    }
  }

  /**
   * Console.warn - only when enabled
   */
  public static warn(...args: any[]): void {
    if (this.isConsoleEnabled()) {
      console.warn(...args);
    }
  }

  /**
   * Console.error - only when enabled
   */
  public static error(...args: any[]): void {
    if (this.isConsoleEnabled()) {
      console.error(...args);
    }
  }

  /**
   * Console.info - only when enabled
   */
  public static info(...args: any[]): void {
    if (this.isConsoleEnabled()) {
      console.info(...args);
    }
  }

  /**
   * Conditional logging method with prefix
   */
  public static logWithPrefix(prefix: string, forceLog : boolean = false , ...args: any[]): void {
    if (this.isConsoleEnabled() || forceLog) {
      console.log(`[${prefix}]`, ...args);
    }
  }

  /**
   * Debug info about the current status
   */
  public static getStatus(): {
    consoleEnabled: boolean;
    envValue: string | undefined;
    nodeEnv: string | undefined;
  } {
    return {
      consoleEnabled: this.isConsoleEnabled(),
      envValue: process.env.JSON_CLEANER_CONSOLE_LOGS,
      nodeEnv: process.env.NODE_ENV
    };
  }
}

// Convenience export for existing code
export const jsonConsole = JsonCleanerConsole;