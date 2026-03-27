import { invoke } from '@tauri-apps/api/core';
import { FileInfo, DirectoryListing, SystemInfo } from '../types';

export class FileSystemService {
  // List directory contents
  static async listDirectory(path: string): Promise<DirectoryListing> {
    try {
      console.log(`[FileSystemService] Listing directory: ${path}`);
      const result = await invoke<DirectoryListing>('list_directory', { path });
      console.log(`[FileSystemService] Listed ${result.files.length} items in ${path}`);
      return result;
    } catch (error) {
      console.error(`[FileSystemService] Failed to list directory ${path}:`, error);
      throw error;
    }
  }

  // Navigate to a specific path
  static async navigateToPath(path: string): Promise<DirectoryListing> {
    try {
      console.log(`[FileSystemService] Navigating to: ${path}`);
      const result = await invoke<DirectoryListing>('navigate_to_path', { path });
      console.log(`[FileSystemService] Navigation successful - ${result.files.length} items`);
      return result;
    } catch (error) {
      console.error(`[FileSystemService] Failed to navigate to ${path}:`, error);
      throw error;
    }
  }

  // Get file information
  static async getFileInfo(path: string): Promise<FileInfo> {
    try {
      console.log(`[FileSystemService] Getting file info for: ${path}`);
      const result = await invoke<FileInfo>('get_file_info', { path });
      console.log(`[FileSystemService] File info retrieved for ${path}`);
      return result;
    } catch (error) {
      console.error(`[FileSystemService] Failed to get file info for ${path}:`, error);
      throw error;
    }
  }

  // Get system information
  static async getSystemInfo(): Promise<SystemInfo> {
    try {
      console.log(`[FileSystemService] Getting system info`);
      const result = await invoke<SystemInfo>('get_system_info');
      console.log(`[FileSystemService] System info retrieved`);
      return result;
    } catch (error) {
      console.error(`[FileSystemService] Failed to get system info:`, error);
      throw error;
    }
  }

  // Get home directory
  static async getHomeDirectory(): Promise<string> {
    try {
      console.log(`[FileSystemService] Getting home directory`);
      const result = await invoke<string>('get_home_directory');
      console.log(`[FileSystemService] Home directory: ${result}`);
      return result;
    } catch (error) {
      console.error(`[FileSystemService] Failed to get home directory:`, error);
      throw error;
    }
  }

  // Get desktop directory
  static async getDesktopDirectory(): Promise<string> {
    try {
      const result = await invoke<string>('get_desktop_directory');
      console.log(`[FileSystemService] Desktop directory: ${result}`);
      return result;
    } catch (error) {
      console.error(`[FileSystemService] Failed to get desktop directory:`, error);
      throw error;
    }
  }

  // Get documents directory
  static async getDocumentsDirectory(): Promise<string> {
    try {
      const result = await invoke<string>('get_documents_directory');
      console.log(`[FileSystemService] Documents directory: ${result}`);
      return result;
    } catch (error) {
      console.error(`[FileSystemService] Failed to get documents directory:`, error);
      throw error;
    }
  }

  // Get applications directory
  static async getApplicationsDirectory(): Promise<string> {
    try {
      const result = await invoke<string>('get_applications_directory');
      console.log(`[FileSystemService] Applications directory: ${result}`);
      return result;
    } catch (error) {
      console.error(`[FileSystemService] Failed to get applications directory:`, error);
      throw error;
    }
  }

  // File operations
  static async createDirectory(path: string): Promise<void> {
    try {
      console.log(`[FileSystemService] Creating directory: ${path}`);
      await invoke<void>('create_directory', { path });
      console.log(`[FileSystemService] Directory created: ${path}`);
    } catch (error) {
      console.error(`[FileSystemService] Failed to create directory ${path}:`, error);
      throw error;
    }
  }

  static async renameFile(oldPath: string, newPath: string): Promise<void> {
    try {
      console.log(`[FileSystemService] Renaming ${oldPath} to ${newPath}`);
      await invoke<void>('rename_file', { oldPath, newPath });
      console.log(`[FileSystemService] File renamed successfully`);
    } catch (error) {
      console.error(`[FileSystemService] Failed to rename file:`, error);
      throw error;
    }
  }

  static async deleteFile(path: string): Promise<void> {
    try {
      console.log(`[FileSystemService] Deleting: ${path}`);
      await invoke<void>('delete_file', { path });
      console.log(`[FileSystemService] File deleted: ${path}`);
    } catch (error) {
      console.error(`[FileSystemService] Failed to delete file ${path}:`, error);
      throw error;
    }
  }

  static async copyFile(source: string, destination: string): Promise<void> {
    try {
      console.log(`[FileSystemService] Copying ${source} to ${destination}`);
      await invoke<void>('copy_file', { source, destination });
      console.log(`[FileSystemService] File copied successfully`);
    } catch (error) {
      console.error(`[FileSystemService] Failed to copy file:`, error);
      throw error;
    }
  }

  static async moveFile(source: string, destination: string): Promise<void> {
    try {
      console.log(`[FileSystemService] Moving ${source} to ${destination}`);
      await invoke<void>('move_file', { source, destination });
      console.log(`[FileSystemService] File moved successfully`);
    } catch (error) {
      console.error(`[FileSystemService] Failed to move file:`, error);
      throw error;
    }
  }
}