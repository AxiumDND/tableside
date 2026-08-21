/**
 * Validation utilities for IPC payloads and user input
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates that a value is a non-empty string
 */
export function validateString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} must be a non-empty string`);
  }
  return value;
}

/**
 * Validates that a value is a valid file path string
 */
export function validatePath(value: unknown, fieldName: string): string {
  const path = validateString(value, fieldName);
  
  // Basic path traversal check (more detailed check done by safeJoin in main)
  if (path.includes('..') && !path.startsWith('./') && !path.startsWith('../')) {
    throw new ValidationError(`${fieldName} contains invalid path traversal`);
  }
  
  return path;
}

/**
 * Validates that a value is a valid object
 */
export function validateObject<T extends Record<string, unknown>>(
  value: unknown,
  fieldName: string
): T {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an object`);
  }
  return value as T;
}

/**
 * Validates that a value is an array
 */
export function validateArray<T>(value: unknown, fieldName: string): T[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`);
  }
  return value as T[];
}

/**
 * Validates that a value is a number
 */
export function validateNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }
  return value;
}

/**
 * Validates that a value is a boolean
 */
export function validateBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`${fieldName} must be a boolean`);
  }
  return value;
}

/**
 * Validates file name to prevent directory traversal
 */
export function validateFileName(fileName: string): string {
  if (!fileName || fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
    throw new ValidationError('Invalid file name');
  }
  return fileName;
}
