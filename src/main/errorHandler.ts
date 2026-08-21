/**
 * Error handling utilities for the main process
 */

import { dialog } from 'electron';
import { createLogger } from './logger';

const logger = createLogger('ErrorHandler');

export interface ErrorContext {
  operation: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Handles errors in IPC handlers with logging and user notification
 */
export async function handleIpcError(
  error: unknown,
  context: ErrorContext,
  showDialog = false
): Promise<{ success: false; error: string }> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(`IPC Error in ${context.operation}`, error as Error, {
    ...context.metadata,
  });

  if (showDialog) {
    await dialog.showErrorBox(
      'Operation Failed',
      `Failed to ${context.operation}:\n\n${errorMessage}`
    );
  }

  return {
    success: false,
    error: errorMessage,
  };
}

/**
 * Wraps an async operation with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  showDialog = false
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error(`Error in ${context.operation}`, error as Error, context.metadata);

    if (showDialog) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await dialog.showErrorBox(
        'Operation Failed',
        `Failed to ${context.operation}:\n\n${errorMessage}`
      );
    }

    throw error;
  }
}

/**
 * Safe file operation wrapper with user-friendly error messages
 */
export async function safeFileOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  filePath?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const fileContext = filePath ? ` (${filePath})` : '';
    
    logger.error(`File operation failed: ${operationName}${fileContext}`, error as Error);
    
    throw new Error(`Failed to ${operationName}${fileContext}: ${message}`);
  }
}
