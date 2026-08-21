import { describe, it, expect } from 'vitest';
import {
  validateString,
  validatePath,
  validateObject,
  validateArray,
  validateNumber,
  validateBoolean,
  validateFileName,
  ValidationError,
} from './validation';

describe('validation utilities', () => {
  describe('validateString', () => {
    it('should accept valid non-empty strings', () => {
      expect(validateString('hello', 'test')).toBe('hello');
      expect(validateString('  test  ', 'test')).toBe('  test  ');
    });

    it('should reject empty strings', () => {
      expect(() => validateString('', 'test')).toThrow(ValidationError);
      expect(() => validateString('   ', 'test')).toThrow('test must be a non-empty string');
    });

    it('should reject non-strings', () => {
      expect(() => validateString(123, 'test')).toThrow(ValidationError);
      expect(() => validateString(null, 'test')).toThrow(ValidationError);
      expect(() => validateString(undefined, 'test')).toThrow(ValidationError);
    });
  });

  describe('validatePath', () => {
    it('should accept valid relative paths', () => {
      expect(validatePath('folder/file.txt', 'path')).toBe('folder/file.txt');
      expect(validatePath('notes.md', 'path')).toBe('notes.md');
    });

    it('should reject path traversal attempts in middle', () => {
      expect(() => validatePath('folder/../../../file.txt', 'path')).toThrow(ValidationError);
      expect(() => validatePath('test/../../file.txt', 'path')).toThrow(ValidationError);
    });

    it('should allow ./ and ../ prefixes', () => {
      expect(validatePath('./file.txt', 'path')).toBe('./file.txt');
      expect(validatePath('../folder/file.txt', 'path')).toBe('../folder/file.txt');
      // Note: These are allowed by validatePath but will be caught by safeJoin
      expect(validatePath('../../etc/passwd', 'path')).toBe('../../etc/passwd');
    });
  });

  describe('validateObject', () => {
    it('should accept valid objects', () => {
      const obj = { foo: 'bar' };
      expect(validateObject(obj, 'test')).toBe(obj);
    });

    it('should reject non-objects', () => {
      expect(() => validateObject('string', 'test')).toThrow(ValidationError);
      expect(() => validateObject(123, 'test')).toThrow(ValidationError);
      expect(() => validateObject(null, 'test')).toThrow('test must be an object');
      expect(() => validateObject([], 'test')).toThrow(ValidationError);
    });
  });

  describe('validateArray', () => {
    it('should accept arrays', () => {
      const arr = [1, 2, 3];
      expect(validateArray(arr, 'test')).toBe(arr);
    });

    it('should reject non-arrays', () => {
      expect(() => validateArray('string', 'test')).toThrow(ValidationError);
      expect(() => validateArray({}, 'test')).toThrow('test must be an array');
    });
  });

  describe('validateNumber', () => {
    it('should accept valid numbers', () => {
      expect(validateNumber(42, 'test')).toBe(42);
      expect(validateNumber(0, 'test')).toBe(0);
      expect(validateNumber(-10.5, 'test')).toBe(-10.5);
    });

    it('should reject non-numbers', () => {
      expect(() => validateNumber('123', 'test')).toThrow(ValidationError);
      expect(() => validateNumber(NaN, 'test')).toThrow('test must be a valid number');
    });
  });

  describe('validateBoolean', () => {
    it('should accept booleans', () => {
      expect(validateBoolean(true, 'test')).toBe(true);
      expect(validateBoolean(false, 'test')).toBe(false);
    });

    it('should reject non-booleans', () => {
      expect(() => validateBoolean(1, 'test')).toThrow(ValidationError);
      expect(() => validateBoolean('true', 'test')).toThrow('test must be a boolean');
    });
  });

  describe('validateFileName', () => {
    it('should accept valid file names', () => {
      expect(validateFileName('document.txt')).toBe('document.txt');
      expect(validateFileName('my-file.md')).toBe('my-file.md');
    });

    it('should reject invalid file names', () => {
      expect(() => validateFileName('folder/file.txt')).toThrow(ValidationError);
      expect(() => validateFileName('..\\file.txt')).toThrow('Invalid file name');
      expect(() => validateFileName('../file.txt')).toThrow(ValidationError);
      expect(() => validateFileName('')).toThrow(ValidationError);
    });
  });
});
