import { invoke } from '@tauri-apps/api/core';

// Types matching Rust backend
export interface FileInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  is_directory: boolean;
  is_hidden: boolean;
  is_symlink: boolean;
  created: string;
  modified: string;
  accessed: string;
  permissions: FilePermissions;
  extension?: string;
  mime_type?: string;
}

export interface FilePermissions {
  readable: boolean;
  writable: boolean;
  executable: boolean;
  mode: number;
}

export interface DirectoryListing {
  path: string;
  files: FileInfo[];
  total_size: number;
  file_count: number;
  directory_count: number;
}

export interface SystemInfo {
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

// Tauri command wrappers
export class TauriFileSystem {
  static async listDirectory(path: string): Promise<DirectoryListing> {
    return await invoke('list_directory', { path });
  }

  static async navigateToPath(path: string): Promise<DirectoryListing> {
    return await invoke('navigate_to_path', { path });
  }

  static async getFileInfo(path: string): Promise<FileInfo> {
    return await invoke('get_file_info', { path });
  }

  static async createDirectory(path: string): Promise<void> {
    return await invoke('create_directory', { path });
  }

  static async renameFile(oldPath: string, newPath: string): Promise<void> {
    return await invoke('rename_file', { oldPath, newPath });
  }

  static async deleteFile(path: string): Promise<void> {
    return await invoke('delete_file', { path });
  }

  static async copyFile(source: string, destination: string): Promise<void> {
    return await invoke('copy_file', { source, destination });
  }

  static async moveFile(source: string, destination: string): Promise<void> {
    return await invoke('move_file', { source, destination });
  }

  static async getSystemInfo(): Promise<SystemInfo> {
    return await invoke('get_system_info');
  }

  static async getHomeDirectory(): Promise<string> {
    return await invoke('get_home_directory');
  }

  static async getDesktopDirectory(): Promise<string> {
    return await invoke('get_desktop_directory');
  }

  static async getDocumentsDirectory(): Promise<string> {
    return await invoke('get_documents_directory');
  }

  static async getApplicationsDirectory(): Promise<string> {
    return await invoke('get_applications_directory');
  }
}

// Error handling
export function isTauriError(error: any): error is string {
  return typeof error === 'string';
}

export function handleTauriError(error: any): string {
  if (isTauriError(error)) {
    return error;
  }
  return 'Unknown error occurred';
}