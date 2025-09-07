/**
 * Logging level configuration interface
 */
export interface LogLevelConfig {
  value: number;
  label: string;
  color: string;
}

/**
 * Available log levels with priorities and colors
 */
export const LogLevel = {
  DEBUG: { value: 0, label: 'DEBUG', color: '\x1b[36m' },    // Cyan
  INFO: { value: 1, label: 'INFO', color: '\x1b[32m' },      // Green
  WARN: { value: 2, label: 'WARN', color: '\x1b[33m' },      // Yellow
  ERROR: { value: 3, label: 'ERROR', color: '\x1b[31m' },    // Red
  CRITICAL: { value: 4, label: 'CRITICAL', color: '\x1b[35m' }, // Magenta
  SYSTEM: { value: 5, label: 'SYSTEM', color: '\x1b[37m' },  // White
  NONE: { value: 6, label: 'NONE', color: '\x1b[0m' }        // Reset
} as const;