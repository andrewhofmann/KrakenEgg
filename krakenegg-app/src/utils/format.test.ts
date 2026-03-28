import { describe, it, expect } from 'vitest';
import { formatSize, formatDate, getExtension } from './format';

describe('formatSize', () => {
  it('returns "--" for 0', () => {
    expect(formatSize(0)).toBe('--');
  });

  it('formats bytes correctly', () => {
    expect(formatSize(500)).toBe('500 B');
  });

  it('formats KB correctly', () => {
    expect(formatSize(1024)).toBe('1.0 KB');
    expect(formatSize(1536)).toBe('1.5 KB');
  });

  it('formats MB correctly', () => {
    expect(formatSize(1048576)).toBe('1.0 MB');
  });

  it('formats GB correctly', () => {
    expect(formatSize(1073741824)).toBe('1.0 GB');
  });

  it('formats TB correctly', () => {
    expect(formatSize(1099511627776)).toBe('1.0 TB');
  });
});

describe('formatDate', () => {
  it('returns "--" for undefined', () => {
    expect(formatDate(undefined)).toBe('--');
  });

  it('shows "Today" for today\'s timestamp', () => {
    const now = Math.floor(Date.now() / 1000);
    const result = formatDate(now);
    expect(result).toMatch(/^Today,/);
  });

  it('shows "Yesterday" for yesterday\'s timestamp', () => {
    const yesterday = Math.floor(Date.now() / 1000) - 86400;
    const result = formatDate(yesterday);
    expect(result).toMatch(/^Yesterday,/);
  });

  it('shows formatted date for older timestamps', () => {
    // Jan 15 2025 at noon UTC
    const oldTimestamp = Math.floor(new Date('2025-01-15T12:00:00Z').getTime() / 1000);
    const result = formatDate(oldTimestamp);
    // Should not start with "Today" or "Yesterday"
    expect(result).not.toMatch(/^Today/);
    expect(result).not.toMatch(/^Yesterday/);
    // Should contain some date-like content
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('getExtension', () => {
  it('returns extension for normal files', () => {
    expect(getExtension('document.txt')).toBe('txt');
    expect(getExtension('image.png')).toBe('png');
  });

  it('returns empty string for dotfiles', () => {
    expect(getExtension('.gitignore')).toBe('');
    expect(getExtension('.env')).toBe('');
  });

  it('returns empty string for files without extension', () => {
    expect(getExtension('Makefile')).toBe('');
  });

  it('returns last extension for multi-dot files', () => {
    expect(getExtension('archive.tar.gz')).toBe('gz');
    expect(getExtension('my.config.json')).toBe('json');
  });
});
