/**
 * Simple structured logger for the main process with file logging support
 */

import { app } from 'electron';
import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
  error?: Error;
}

let logFilePath: string | null = null;
let fileLoggingEnabled = false;

/**
 * Initialize file logging (call after app is ready)
 */
export async function initializeFileLogging(): Promise<void> {
  try {
    const logsDir = join(app.getPath('userData'), 'logs');
    await mkdir(logsDir, { recursive: true });
    
    const date = new Date().toISOString().split('T')[0];
    logFilePath = join(logsDir, `table-dm-${date}.log`);
    fileLoggingEnabled = true;
    
    await appendFile(logFilePath, `\n=== Log started at ${new Date().toISOString()} ===\n`);
  } catch (error) {
    console.error('Failed to initialize file logging:', error);
  }
}

async function writeToFile(entry: LogEntry): Promise<void> {
  if (!fileLoggingEnabled || !logFilePath) return;
  
  try {
    const logLine = `[${entry.timestamp}] ${entry.level.toUpperCase()} [${entry.context}] ${entry.message}`;
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
    const errorStr = entry.error ? `\n  Error: ${entry.error.message}\n  Stack: ${entry.error.stack}` : '';
    
    await appendFile(logFilePath, `${logLine}${dataStr}${errorStr}\n`);
  } catch (error) {
    // Silently fail to avoid logging loops
  }
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
          // eslint-disable-next-line no-console
          console.log(formatted, data);
        }
        break;
      case 'info':
        // eslint-disable-next-line no-console
        console.log(formatted, data);
        break;
      case 'warn':
        console.warn(formatted, data);
        break;
      case 'error':
        console.error(formatted, error || data);
        break;
    }
    
    // Write to file asynchronously (fire and forget)
    void writeToFile(entry);
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

export function getLogFilePath(): string | null {
  return logFilePath;
}
