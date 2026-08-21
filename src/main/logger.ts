/**
 * Simple structured logger for the main process
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
  error?: Error;
}

class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, data?: unknown, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      data,
      error,
    };

    const formatted = `[${entry.timestamp}] ${level.toUpperCase()} [${this.context}] ${message}`;

    switch (level) {
      case 'debug':
        if (process.env.DEBUG) {
          console.log(formatted, data);
        }
        break;
      case 'info':
        console.log(formatted, data);
        break;
      case 'warn':
        console.warn(formatted, data);
        break;
      case 'error':
        console.error(formatted, error || data);
        break;
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error | unknown, data?: unknown): void {
    const err = error instanceof Error ? error : undefined;
    this.log('error', message, data, err);
  }

  child(subContext: string): Logger {
    return new Logger(`${this.context}:${subContext}`);
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}
