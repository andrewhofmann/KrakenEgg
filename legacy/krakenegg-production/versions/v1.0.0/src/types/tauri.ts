// TypeScript bindings for Rust types from src-tauri/src/types.rs

export interface TauriFileInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  is_directory: boolean;
  is_hidden: boolean;
  is_symlink: boolean;
  created: string; // ISO string
  modified: string; // ISO string
  accessed: string; // ISO string
  permissions: TauriFilePermissions;
  extension?: string;
  mime_type?: string;
}

export interface TauriFilePermissions {
  readable: boolean;
  writable: boolean;
  executable: boolean;
  mode: number;
}

export interface TauriDirectoryListing {
  path: string;
  files: TauriFileInfo[];
  total_size: number;
  file_count: number;
  directory_count: number;
}

export interface TauriFileOperation {
  id: string;
  operation_type: TauriOperationType;
  source: string;
  destination?: string;
  progress: number;
  status: TauriOperationStatus;
  error?: string;
  bytes_processed: number;
  total_bytes: number;
  files_processed: number;
  total_files: number;
  started_at: string; // ISO string
  estimated_completion?: string; // ISO string
}

export enum TauriOperationType {
  Copy = 'Copy',
  Move = 'Move',
  Delete = 'Delete',
  CreateDirectory = 'CreateDirectory',
  Rename = 'Rename',
  CreateArchive = 'CreateArchive',
  ExtractArchive = 'ExtractArchive',
}

export enum TauriOperationStatus {
  Pending = 'Pending',
  InProgress = 'InProgress',
  Paused = 'Paused',
  Completed = 'Completed',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
}

export interface TauriArchiveInfo {
  path: string;
  format: TauriArchiveFormat;
  entries: TauriArchiveEntry[];
  total_size: number;
  compressed_size: number;
  compression_ratio: number;
}

export enum TauriArchiveFormat {
  Zip = 'Zip',
  SevenZ = 'SevenZ',
  Tar = 'Tar',
  TarGz = 'TarGz',
  TarBz2 = 'TarBz2',
  Rar = 'Rar',
}

export interface TauriArchiveEntry {
  name: string;
  path: string;
  size: number;
  compressed_size: number;
  is_directory: boolean;
  modified: string; // ISO string
}

export interface TauriSystemInfo {
  platform: string;
  arch: string;
  version: string;
  home_directory: string;
  current_directory: string;
  temp_directory: string;
  total_memory: number;
  available_memory: number;
  cpu_count: number;
}

export interface TauriNetworkConnection {
  id: string;
  protocol: TauriNetworkProtocol;
  host: string;
  port: number;
  username?: string;
  current_path: string;
  status: TauriConnectionStatus;
}

export enum TauriNetworkProtocol {
  Ftp = 'Ftp',
  Sftp = 'Sftp',
  Ftps = 'Ftps',
}

export enum TauriConnectionStatus {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting',
  Connected = 'Connected',
}

// Conversion functions to transform Tauri types to frontend types
import { FileInfo, FilePermissions, FileType } from '../types';

export function tauriFileInfoToFileInfo(tauriFile: TauriFileInfo): FileInfo {
  return {
    id: tauriFile.id,
    name: tauriFile.name,
    path: tauriFile.path,
    size: tauriFile.size,
    modified: new Date(tauriFile.modified),
    created: new Date(tauriFile.created),
    accessed: new Date(tauriFile.accessed),
    isDirectory: tauriFile.is_directory,
    isHidden: tauriFile.is_hidden,
    permissions: {
      readable: tauriFile.permissions.readable,
      writable: tauriFile.permissions.writable,
      executable: tauriFile.permissions.executable,
      owner: '', // Not available from Rust side yet
      group: '', // Not available from Rust side yet
      mode: tauriFile.permissions.mode.toString(8), // Convert to octal string
    },
    extension: tauriFile.extension,
    type: determineFileType(tauriFile),
    icon: getFileIcon(tauriFile),
  };
}

function determineFileType(tauriFile: TauriFileInfo): FileType {
  if (tauriFile.is_directory) {
    return FileType.Directory;
  }

  if (tauriFile.is_symlink) {
    return FileType.Link;
  }

  if (!tauriFile.extension) {
    return FileType.File;
  }

  const ext = tauriFile.extension.toLowerCase();

  // Archive types
  if (['zip', '7z', 'rar', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
    return FileType.Archive;
  }

  // Image types
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
    return FileType.Image;
  }

  // Video types
  if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
    return FileType.Video;
  }

  // Audio types
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(ext)) {
    return FileType.Audio;
  }

  // Document types
  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
    return FileType.Document;
  }

  // Code types
  if (['js', 'ts', 'py', 'rs', 'java', 'cpp', 'c', 'h', 'html', 'css', 'json', 'xml'].includes(ext)) {
    return FileType.Code;
  }

  // Executable types
  if (['exe', 'app', 'dmg', 'deb', 'rpm'].includes(ext)) {
    return FileType.Executable;
  }

  return FileType.File;
}

function getFileIcon(tauriFile: TauriFileInfo): string {
  if (tauriFile.is_directory) {
    return '📁';
  }

  if (tauriFile.is_symlink) {
    return '🔗';
  }

  const type = determineFileType(tauriFile);

  switch (type) {
    case FileType.Archive:
      return '📦';
    case FileType.Image:
      return '🖼️';
    case FileType.Video:
      return '🎬';
    case FileType.Audio:
      return '🎵';
    case FileType.Document:
      return '📄';
    case FileType.Code:
      return '💻';
    case FileType.Executable:
      return '⚙️';
    default:
      return '📄';
  }
}