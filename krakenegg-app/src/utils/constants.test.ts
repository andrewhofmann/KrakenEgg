import { describe, it, expect } from 'vitest';
import { Z_INDEX, CONFLICT_RESOLUTION, validateFileName } from './constants';

describe('Z_INDEX', () => {
  it('has modal z-indexes higher than panel z-indexes', () => {
    expect(Z_INDEX.modal.backdrop).toBeGreaterThan(Z_INDEX.contextMenu);
    expect(Z_INDEX.modal.conflict).toBeGreaterThan(Z_INDEX.modal.operationStatus);
  });

  it('has context menu above panels', () => {
    expect(Z_INDEX.contextMenu).toBeGreaterThan(Z_INDEX.panel.historyDropdown);
  });
});

describe('CONFLICT_RESOLUTION', () => {
  it('has all expected values', () => {
    expect(CONFLICT_RESOLUTION.Overwrite).toBe('Overwrite');
    expect(CONFLICT_RESOLUTION.Skip).toBe('Skip');
    expect(CONFLICT_RESOLUTION.OverwriteAll).toBe('OverwriteAll');
    expect(CONFLICT_RESOLUTION.SkipAll).toBe('SkipAll');
    expect(CONFLICT_RESOLUTION.Cancel).toBe('Cancel');
  });
});

describe('validateFileName', () => {
  it('accepts valid file names', () => {
    expect(validateFileName('document.txt').valid).toBe(true);
    expect(validateFileName('my-file_2024.md').valid).toBe(true);
    expect(validateFileName('.gitignore').valid).toBe(true);
  });

  it('rejects empty names', () => {
    expect(validateFileName('').valid).toBe(false);
    expect(validateFileName('   ').valid).toBe(false);
  });

  it('rejects . and ..', () => {
    expect(validateFileName('.').valid).toBe(false);
    expect(validateFileName('..').valid).toBe(false);
  });

  it('rejects names with invalid characters', () => {
    expect(validateFileName('file<name').valid).toBe(false);
    expect(validateFileName('file:name').valid).toBe(false);
    expect(validateFileName('file|name').valid).toBe(false);
    expect(validateFileName('file?name').valid).toBe(false);
    expect(validateFileName('file*name').valid).toBe(false);
  });

  it('rejects names longer than 255 chars', () => {
    expect(validateFileName('a'.repeat(256)).valid).toBe(false);
    expect(validateFileName('a'.repeat(255)).valid).toBe(true);
  });

  it('rejects reserved names', () => {
    expect(validateFileName('CON').valid).toBe(false);
    expect(validateFileName('nul').valid).toBe(false);
    expect(validateFileName('COM1').valid).toBe(false);
  });

  it('rejects names ending with space or period', () => {
    expect(validateFileName('file ').valid).toBe(false);
    expect(validateFileName('file.').valid).toBe(false);
  });

  it('returns error messages', () => {
    const result = validateFileName('');
    expect(result.error).toBeTruthy();
  });
});
