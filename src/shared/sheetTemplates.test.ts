import { describe, it, expect } from 'vitest';
import { sanitizeFileName } from './sheetTemplates';

describe('sanitizeFileName', () => {
  it('should sanitize special characters', () => {
    expect(sanitizeFileName('Hello: World?', 'fallback')).toBe('Hello World');
    expect(sanitizeFileName('file/name', 'fallback')).toBe('filename');
    expect(sanitizeFileName('test*file', 'fallback')).toBe('testfile');
  });

  it('should handle empty strings with fallback', () => {
    expect(sanitizeFileName('', 'fallback')).toBe('fallback');
    expect(sanitizeFileName('???', 'default')).toBe('default');
  });

  it('should preserve valid file names', () => {
    expect(sanitizeFileName('ValidName.txt', 'fallback')).toBe('ValidName.txt');
    expect(sanitizeFileName('my-file_123.md', 'fallback')).toBe('my-file_123.md');
  });

  it('should handle whitespace', () => {
    expect(sanitizeFileName('  spaces  ', 'fallback')).toBe('spaces');
    // Multiple spaces get collapsed to single space by sanitizeFileName
    expect(sanitizeFileName('multiple   spaces', 'fallback')).toBe('multiple spaces');
  });
});
