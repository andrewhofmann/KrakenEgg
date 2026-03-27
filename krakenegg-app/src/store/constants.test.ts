import { describe, it, expect } from 'vitest';
import { createTab, getExtension, getProcessedFiles } from './constants';
import { FileInfo, PaneLayout } from './types';

const makeFile = (name: string, overrides: Partial<FileInfo> = {}): FileInfo => ({
  name,
  is_dir: false,
  size: 100,
  modified_at: 1700000000,
  ...overrides,
});

const makeDir = (name: string): FileInfo => makeFile(name, { is_dir: true, size: 0 });

const defaultLayout: PaneLayout = {
  sortColumn: 'name',
  sortDirection: 'asc',
  columns: ['name', 'ext', 'size', 'date'],
  columnWidths: { name: 0, ext: 45, size: 80, date: 140 },
};

describe('createTab', () => {
  it('returns a valid TabState with correct defaults', () => {
    const tab = createTab('/home');
    expect(tab.path).toBe('/home');
    expect(tab.files).toEqual([]);
    expect(tab.selection).toEqual([]);
    expect(tab.cursorIndex).toBe(0);
    expect(tab.loading).toBe(false);
    expect(tab.error).toBeNull();
    expect(tab.filterQuery).toBe('');
    expect(tab.showFilterWidget).toBe(false);
  });

  it('assigns unique IDs', () => {
    const tab1 = createTab('/a');
    const tab2 = createTab('/b');
    expect(tab1.id).not.toBe(tab2.id);
  });

  it('initializes history with the given path', () => {
    const tab = createTab('/start');
    expect(tab.history).toEqual(['/start']);
    expect(tab.historyIndex).toBe(0);
  });
});

describe('getExtension (store version)', () => {
  it('lowercases extensions', () => {
    expect(getExtension('FILE.TXT')).toBe('txt');
    expect(getExtension('image.PNG')).toBe('png');
  });

  it('returns empty string for dotfiles', () => {
    expect(getExtension('.hidden')).toBe('');
  });

  it('returns empty string for no extension', () => {
    expect(getExtension('README')).toBe('');
  });
});

describe('getProcessedFiles', () => {
  const files: FileInfo[] = [
    makeFile('beta.txt', { size: 200 }),
    makeDir('docs'),
    makeFile('.hidden', { size: 50 }),
    makeDir('.git'),
    makeFile('alpha.js', { size: 300, modified_at: 1700000100 }),
    makeDir('src'),
  ];

  it('filters hidden files when showHiddenFiles is false', () => {
    const result = getProcessedFiles(files, defaultLayout, '', false);
    const names = result.map(f => f.name);
    expect(names).not.toContain('.hidden');
    expect(names).not.toContain('.git');
  });

  it('shows hidden files when showHiddenFiles is true', () => {
    const result = getProcessedFiles(files, defaultLayout, '', true);
    const names = result.map(f => f.name);
    expect(names).toContain('.hidden');
    expect(names).toContain('.git');
  });

  it('filters by filterQuery (case-insensitive)', () => {
    const result = getProcessedFiles(files, defaultLayout, 'ALPHA', true);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('alpha.js');
  });

  it('sorts folders before files', () => {
    const result = getProcessedFiles(files, defaultLayout, '', true);
    const firstNonDir = result.findIndex(f => !f.is_dir);
    const lastDir = result.length - 1 - [...result].reverse().findIndex(f => f.is_dir);
    if (firstNonDir !== -1 && lastDir !== -1) {
      expect(firstNonDir).toBeGreaterThan(lastDir);
    }
  });

  it('sorts by name ascending', () => {
    const result = getProcessedFiles(files, defaultLayout, '', false);
    const fileNames = result.filter(f => !f.is_dir).map(f => f.name);
    expect(fileNames).toEqual(['alpha.js', 'beta.txt']);
  });

  it('sorts by name descending', () => {
    const layout: PaneLayout = { ...defaultLayout, sortDirection: 'desc' };
    const result = getProcessedFiles(files, layout, '', false);
    const fileNames = result.filter(f => !f.is_dir).map(f => f.name);
    expect(fileNames).toEqual(['beta.txt', 'alpha.js']);
  });

  it('sorts by size', () => {
    const layout: PaneLayout = { ...defaultLayout, sortColumn: 'size' };
    const result = getProcessedFiles(files, layout, '', false);
    const fileNames = result.filter(f => !f.is_dir).map(f => f.name);
    expect(fileNames).toEqual(['beta.txt', 'alpha.js']);
  });

  it('sorts by date', () => {
    const layout: PaneLayout = { ...defaultLayout, sortColumn: 'date' };
    const result = getProcessedFiles(files, layout, '', false);
    const fileNames = result.filter(f => !f.is_dir).map(f => f.name);
    expect(fileNames).toEqual(['beta.txt', 'alpha.js']);
  });

  it('sorts by extension', () => {
    const layout: PaneLayout = { ...defaultLayout, sortColumn: 'ext' };
    const result = getProcessedFiles(files, layout, '', false);
    const fileNames = result.filter(f => !f.is_dir).map(f => f.name);
    expect(fileNames).toEqual(['alpha.js', 'beta.txt']);
  });

  it('handles empty file list', () => {
    const result = getProcessedFiles([], defaultLayout, '', true);
    expect(result).toEqual([]);
  });
});
