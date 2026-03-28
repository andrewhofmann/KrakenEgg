/**
 * TEST SUITE: Utility Function Edge Cases
 * Tests formatSize, formatDate, getExtension, validateFileName, file icons
 */
import { describe, it, expect } from 'vitest';
import { formatSize, formatDate, getExtension } from './format';
import { getFileIcon, getFileIconColor } from './fileIcons';
import { validateFileName, Z_INDEX, CONFLICT_RESOLUTION } from './constants';

// --- FORMAT SIZE ---

describe('formatSize', () => {
  it('formatSize(0) returns "--"', () => {
    expect(formatSize(0)).toBe('--');
  });

  it('formatSize(1) returns "1.0 B"', () => {
    expect(formatSize(1)).toBe('1.0 B');
  });

  it('formatSize(1023) returns "1023.0 B"', () => {
    expect(formatSize(1023)).toBe('1023.0 B');
  });

  it('formatSize(1024) returns "1.0 KB"', () => {
    expect(formatSize(1024)).toBe('1.0 KB');
  });

  it('formatSize(1536) returns "1.5 KB"', () => {
    expect(formatSize(1536)).toBe('1.5 KB');
  });

  it('formatSize(1048576) returns "1.0 MB"', () => {
    expect(formatSize(1048576)).toBe('1.0 MB');
  });

  it('formatSize(1073741824) returns "1.0 GB"', () => {
    expect(formatSize(1073741824)).toBe('1.0 GB');
  });

  it('formatSize(very large number) returns TB', () => {
    const tb = 1024 * 1024 * 1024 * 1024;
    expect(formatSize(tb)).toBe('1.0 TB');
  });

  it('formatSize(negative) does not crash', () => {
    // Negative values produce NaN in log — should not throw
    expect(() => formatSize(-1)).not.toThrow();
  });

  it('formatSize(500) returns "500.0 B"', () => {
    expect(formatSize(500)).toBe('500.0 B');
  });

  it('formatSize(2.5 MB) returns correct string', () => {
    expect(formatSize(2621440)).toBe('2.5 MB');
  });
});

// --- FORMAT DATE ---

describe('formatDate', () => {
  it('formatDate(undefined) returns "--"', () => {
    expect(formatDate(undefined)).toBe('--');
  });

  it('formatDate(0) returns a date string', () => {
    const result = formatDate(0);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('--');
  });

  it('formatDate(current timestamp) contains "Today"', () => {
    const now = Math.floor(Date.now() / 1000);
    const result = formatDate(now);
    expect(result).toContain('Today');
  });

  it('formatDate(yesterday) contains "Yesterday"', () => {
    const yesterday = Math.floor(Date.now() / 1000) - 86400;
    const result = formatDate(yesterday);
    expect(result).toContain('Yesterday');
  });

  it('formatDate(old date) does not contain Today or Yesterday', () => {
    // A date from 2020-01-01
    const oldTimestamp = 1577836800;
    const result = formatDate(oldTimestamp);
    expect(result).not.toContain('Today');
    expect(result).not.toContain('Yesterday');
  });

  it('formatDate returns string with time component', () => {
    const now = Math.floor(Date.now() / 1000);
    const result = formatDate(now);
    // Should contain a colon from time format (e.g., "3:45")
    expect(result).toMatch(/\d+:\d+/);
  });
});

// --- GET EXTENSION ---

describe('getExtension', () => {
  it('getExtension("file.txt") returns "txt"', () => {
    expect(getExtension('file.txt')).toBe('txt');
  });

  it('getExtension("file.tar.gz") returns "gz"', () => {
    expect(getExtension('file.tar.gz')).toBe('gz');
  });

  it('getExtension(".hidden") returns ""', () => {
    expect(getExtension('.hidden')).toBe('');
  });

  it('getExtension("noext") returns ""', () => {
    expect(getExtension('noext')).toBe('');
  });

  it('getExtension("") returns ""', () => {
    expect(getExtension('')).toBe('');
  });

  it('getExtension("a.b.c.d") returns "d"', () => {
    expect(getExtension('a.b.c.d')).toBe('d');
  });

  it('getExtension(".gitignore") returns "" (dotfile)', () => {
    expect(getExtension('.gitignore')).toBe('');
  });

  it('getExtension("file.PNG") returns "PNG"', () => {
    // format.ts getExtension doesn't lowercase
    expect(getExtension('file.PNG')).toBe('PNG');
  });
});

// --- VALIDATE FILE NAME ---

describe('validateFileName', () => {
  it('validateFileName("") is invalid', () => {
    const result = validateFileName('');
    expect(result.valid).toBe(false);
  });

  it('validateFileName("   ") is invalid (whitespace only)', () => {
    const result = validateFileName('   ');
    expect(result.valid).toBe(false);
  });

  it('validateFileName(".") is invalid', () => {
    const result = validateFileName('.');
    expect(result.valid).toBe(false);
  });

  it('validateFileName("..") is invalid', () => {
    const result = validateFileName('..');
    expect(result.valid).toBe(false);
  });

  it('validateFileName("a") is valid', () => {
    const result = validateFileName('a');
    expect(result.valid).toBe(true);
  });

  it('validateFileName("file.txt") is valid', () => {
    const result = validateFileName('file.txt');
    expect(result.valid).toBe(true);
  });

  it('validateFileName("a".repeat(255)) is valid', () => {
    const result = validateFileName('a'.repeat(255));
    expect(result.valid).toBe(true);
  });

  it('validateFileName("a".repeat(256)) is invalid', () => {
    const result = validateFileName('a'.repeat(256));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('long');
  });

  it('validateFileName("file<name") is invalid', () => {
    const result = validateFileName('file<name');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalid');
  });

  it('validateFileName("file>name") is invalid', () => {
    const result = validateFileName('file>name');
    expect(result.valid).toBe(false);
  });

  it('validateFileName("file:name") is invalid', () => {
    const result = validateFileName('file:name');
    expect(result.valid).toBe(false);
  });

  it('validateFileName(\'file"name\') is invalid', () => {
    const result = validateFileName('file"name');
    expect(result.valid).toBe(false);
  });

  it('validateFileName("file|name") is invalid', () => {
    const result = validateFileName('file|name');
    expect(result.valid).toBe(false);
  });

  it('validateFileName("file?name") is invalid', () => {
    const result = validateFileName('file?name');
    expect(result.valid).toBe(false);
  });

  it('validateFileName("file*name") is invalid', () => {
    const result = validateFileName('file*name');
    expect(result.valid).toBe(false);
  });

  it('validateFileName("CON") is invalid (reserved)', () => {
    const result = validateFileName('CON');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('reserved');
  });

  it('validateFileName("con") is invalid (reserved, case insensitive)', () => {
    const result = validateFileName('con');
    expect(result.valid).toBe(false);
  });

  it('validateFileName("file ") is invalid (trailing space)', () => {
    const result = validateFileName('file ');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('space or period');
  });

  it('validateFileName("file.") is invalid (trailing dot)', () => {
    const result = validateFileName('file.');
    expect(result.valid).toBe(false);
  });

  it('validateFileName("NUL") is invalid (reserved)', () => {
    const result = validateFileName('NUL');
    expect(result.valid).toBe(false);
  });

  it('validateFileName("COM1") is invalid (reserved)', () => {
    const result = validateFileName('COM1');
    expect(result.valid).toBe(false);
  });

  it('validateFileName("PRN") is invalid (reserved)', () => {
    const result = validateFileName('PRN');
    expect(result.valid).toBe(false);
  });

  it('validateFileName("file-name_ok.txt") is valid', () => {
    const result = validateFileName('file-name_ok.txt');
    expect(result.valid).toBe(true);
  });

  it('validateFileName with null byte is invalid', () => {
    const result = validateFileName('file\x00name');
    expect(result.valid).toBe(false);
  });
});

// --- FILE ICONS ---

describe('getFileIcon', () => {
  it('directory returns Folder icon', () => {
    const icon = getFileIcon({ is_dir: true, name: 'mydir', extension: undefined });
    expect(icon.displayName).toBe('Folder');
  });

  it('symlink returns Link icon', () => {
    const icon = getFileIcon({ is_dir: false, is_symlink: true, name: 'link', extension: undefined });
    expect(icon.displayName).toBe('Link');
  });

  it('unknown extension returns File icon', () => {
    const icon = getFileIcon({ is_dir: false, name: 'file.xyz', extension: 'xyz' });
    expect(icon.displayName).toBe('File');
  });

  it('.ts returns FileCode icon', () => {
    const icon = getFileIcon({ is_dir: false, name: 'app.ts', extension: 'ts' });
    expect(icon.displayName).toBe('FileCode');
  });

  it('.png returns Image icon', () => {
    const icon = getFileIcon({ is_dir: false, name: 'photo.png', extension: 'png' });
    expect(icon.displayName).toBe('Image');
  });

  it('.zip returns FileArchive icon', () => {
    const icon = getFileIcon({ is_dir: false, name: 'archive.zip', extension: 'zip' });
    expect(icon.displayName).toBe('FileArchive');
  });

  it('.mp3 returns audio icon', () => {
    const icon = getFileIcon({ is_dir: false, name: 'song.mp3', extension: 'mp3' });
    // lucide-react may use FileAudio or FileHeadphone depending on version
    expect(['FileAudio', 'FileHeadphone']).toContain(icon.displayName);
  });

  it('.mp4 returns video icon', () => {
    const icon = getFileIcon({ is_dir: false, name: 'video.mp4', extension: 'mp4' });
    // lucide-react may use FileVideo or FilePlay depending on version
    expect(['FileVideo', 'FilePlay']).toContain(icon.displayName);
  });

  it('.json returns json icon', () => {
    const icon = getFileIcon({ is_dir: false, name: 'data.json', extension: 'json' });
    // lucide-react may use FileJson or FileBraces depending on version
    expect(['FileJson', 'FileBraces']).toContain(icon.displayName);
  });

  it('.txt returns FileText icon', () => {
    const icon = getFileIcon({ is_dir: false, name: 'readme.txt', extension: 'txt' });
    expect(icon.displayName).toBe('FileText');
  });

  it('.sh returns Terminal icon', () => {
    const icon = getFileIcon({ is_dir: false, name: 'run.sh', extension: 'sh' });
    expect(icon.displayName).toBe('Terminal');
  });

  it('.pem returns Lock icon', () => {
    const icon = getFileIcon({ is_dir: false, name: 'cert.pem', extension: 'pem' });
    expect(icon.displayName).toBe('Lock');
  });

  it('.xlsx returns FileSpreadsheet icon', () => {
    const icon = getFileIcon({ is_dir: false, name: 'data.xlsx', extension: 'xlsx' });
    expect(icon.displayName).toBe('FileSpreadsheet');
  });

  it('.db returns Database icon', () => {
    const icon = getFileIcon({ is_dir: false, name: 'app.db', extension: 'db' });
    expect(icon.displayName).toBe('Database');
  });
});

describe('getFileIconColor', () => {
  it('directory is blue', () => {
    const color = getFileIconColor({ is_dir: true, name: 'dir' }, false, false);
    expect(color).toContain('blue');
  });

  it('selected + active is white', () => {
    const color = getFileIconColor({ is_dir: false, name: 'file.txt', extension: 'txt' }, true, true);
    expect(color).toContain('white');
  });

  it('image extension is pink', () => {
    const color = getFileIconColor({ is_dir: false, name: 'photo.png', extension: 'png' }, false, false);
    expect(color).toContain('pink');
  });

  it('code extension is green', () => {
    const color = getFileIconColor({ is_dir: false, name: 'app.ts', extension: 'ts' }, false, false);
    expect(color).toContain('green');
  });

  it('archive extension is orange', () => {
    const color = getFileIconColor({ is_dir: false, name: 'a.zip', extension: 'zip' }, false, false);
    expect(color).toContain('orange');
  });

  it('unknown extension is gray', () => {
    const color = getFileIconColor({ is_dir: false, name: 'file.xyz', extension: 'xyz' }, false, false);
    expect(color).toContain('gray');
  });
});

// --- CONSTANTS ---

describe('Z_INDEX constants', () => {
  it('contextMenu > panel header', () => {
    expect(Z_INDEX.contextMenu).toBeGreaterThan(Z_INDEX.panel.header);
  });

  it('modal backdrop > contextMenu', () => {
    expect(Z_INDEX.modal.backdrop).toBeGreaterThan(Z_INDEX.contextMenu);
  });

  it('confirmation > modal backdrop', () => {
    expect(Z_INDEX.modal.confirmation).toBeGreaterThan(Z_INDEX.modal.backdrop);
  });
});

describe('CONFLICT_RESOLUTION constants', () => {
  it('has all expected keys', () => {
    expect(CONFLICT_RESOLUTION.Overwrite).toBe('Overwrite');
    expect(CONFLICT_RESOLUTION.Skip).toBe('Skip');
    expect(CONFLICT_RESOLUTION.OverwriteAll).toBe('OverwriteAll');
    expect(CONFLICT_RESOLUTION.SkipAll).toBe('SkipAll');
    expect(CONFLICT_RESOLUTION.Cancel).toBe('Cancel');
  });
});
