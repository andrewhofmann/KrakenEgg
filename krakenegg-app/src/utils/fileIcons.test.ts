import { describe, it, expect } from 'vitest';
import { getFileIcon, getFileIconColor } from './fileIcons';
import { Folder, Image, FileCode, FileArchive, FileAudio, FileVideo, File, Link, FileJson } from 'lucide-react';

describe('getFileIcon', () => {
  it('returns Folder for directories', () => {
    expect(getFileIcon({ is_dir: true, name: 'docs', extension: undefined })).toBe(Folder);
  });

  it('returns Link for symlinks', () => {
    expect(getFileIcon({ is_dir: false, name: 'link', is_symlink: true })).toBe(Link);
  });

  it('returns Image icon for image extensions', () => {
    expect(getFileIcon({ is_dir: false, name: 'photo.png', extension: 'png' })).toBe(Image);
    expect(getFileIcon({ is_dir: false, name: 'photo.jpg', extension: 'jpg' })).toBe(Image);
  });

  it('returns FileCode for code extensions', () => {
    expect(getFileIcon({ is_dir: false, name: 'app.ts', extension: 'ts' })).toBe(FileCode);
    expect(getFileIcon({ is_dir: false, name: 'main.rs', extension: 'rs' })).toBe(FileCode);
    expect(getFileIcon({ is_dir: false, name: 'script.py', extension: 'py' })).toBe(FileCode);
  });

  it('returns FileArchive for archive extensions', () => {
    expect(getFileIcon({ is_dir: false, name: 'data.zip', extension: 'zip' })).toBe(FileArchive);
    expect(getFileIcon({ is_dir: false, name: 'data.tar', extension: 'tar' })).toBe(FileArchive);
  });

  it('returns FileAudio for audio extensions', () => {
    expect(getFileIcon({ is_dir: false, name: 'song.mp3', extension: 'mp3' })).toBe(FileAudio);
  });

  it('returns FileVideo for video extensions', () => {
    expect(getFileIcon({ is_dir: false, name: 'movie.mp4', extension: 'mp4' })).toBe(FileVideo);
  });

  it('returns FileJson for JSON/YAML', () => {
    expect(getFileIcon({ is_dir: false, name: 'config.json', extension: 'json' })).toBe(FileJson);
    expect(getFileIcon({ is_dir: false, name: 'config.yaml', extension: 'yaml' })).toBe(FileJson);
  });

  it('returns generic File for unknown extensions', () => {
    expect(getFileIcon({ is_dir: false, name: 'mystery.xyz', extension: 'xyz' })).toBe(File);
  });

  it('returns generic File for no extension', () => {
    expect(getFileIcon({ is_dir: false, name: 'Makefile', extension: undefined })).toBe(File);
  });
});

describe('getFileIconColor', () => {
  it('returns selection-text for selected active items', () => {
    expect(getFileIconColor({ is_dir: false, name: 'f.txt', extension: 'txt' }, true, true)).toBe('text-[var(--ke-selection-text)]');
  });

  it('returns folder color for directories', () => {
    expect(getFileIconColor({ is_dir: true, name: 'dir' }, false, true)).toBe('text-[var(--ke-icon-folder)]');
  });

  it('returns image color for images', () => {
    expect(getFileIconColor({ is_dir: false, name: 'img.png', extension: 'png' }, false, true)).toBe('text-[var(--ke-icon-image)]');
  });

  it('returns code color for code files', () => {
    expect(getFileIconColor({ is_dir: false, name: 'app.ts', extension: 'ts' }, false, true)).toBe('text-[var(--ke-icon-code)]');
  });

  it('returns archive color for archives', () => {
    expect(getFileIconColor({ is_dir: false, name: 'a.zip', extension: 'zip' }, false, true)).toBe('text-[var(--ke-icon-archive)]');
  });

  it('returns default color for unknown types', () => {
    expect(getFileIconColor({ is_dir: false, name: 'f.xyz', extension: 'xyz' }, false, true)).toBe('text-[var(--ke-icon-default)]');
  });
});
