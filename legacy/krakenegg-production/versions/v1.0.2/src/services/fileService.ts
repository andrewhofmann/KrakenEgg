import { invoke } from '@tauri-apps/api/core';
import { FileInfo } from '../types';
import {
  TauriDirectoryListing,
  TauriFileInfo,
  TauriSystemInfo,
  TauriArchiveFormat,
  tauriFileInfoToFileInfo
} from '../types/tauri';
import logService, { LogLevel, LogCategory } from './logService';

class FileService {
  /**
   * List contents of a directory
   */
  async listDirectory(path: string): Promise<FileInfo[]> {
    const start = performance.now();

    logService.logFileOperation('list_directory', path, true, { path });

    try {
      const result = await invoke<TauriDirectoryListing>('list_directory', { path });
      const duration = performance.now() - start;

      logService.logFileOperation('list_directory', path, true, {
        fileCount: result.file_count,
        directoryCount: result.directory_count,
        totalFiles: result.files.length
      });

      logService.logPerformance('list_directory', Math.round(duration), {
        component: 'FileService',
        function: 'listDirectory',
        path,
        operation: 'list_directory'
      });

      return result.files.map(tauriFileInfoToFileInfo);
    } catch (error) {
      const duration = performance.now() - start;

      logService.logFileOperation('list_directory', path, false, { error: String(error) });
      logService.logError(error instanceof Error ? error : new Error(String(error)), {
        component: 'FileService',
        function: 'listDirectory',
        path,
        operation: 'list_directory'
      });

      throw new Error(`Failed to list directory ${path}: ${error}`);
    }
  }

  /**
   * Navigate to a path and return its contents
   */
  async navigateToPath(path: string): Promise<FileInfo[]> {
    console.log('🦑 FileService.navigateToPath:', path);

    try {
      const result = await invoke<TauriDirectoryListing>('navigate_to_path', { path });
      console.log('🦑 FileService.navigateToPath result:', result);

      return result.files.map(tauriFileInfoToFileInfo);
    } catch (error) {
      console.error('🦑 FileService.navigateToPath error:', error);
      throw new Error(`Failed to navigate to ${path}: ${error}`);
    }
  }

  /**
   * Get detailed information about a specific file or directory
   */
  async getFileInfo(path: string): Promise<FileInfo> {
    console.log('🦑 FileService.getFileInfo:', path);

    try {
      const result = await invoke<TauriFileInfo>('get_file_info', { path });
      console.log('🦑 FileService.getFileInfo result:', result);

      return tauriFileInfoToFileInfo(result);
    } catch (error) {
      console.error('🦑 FileService.getFileInfo error:', error);
      throw new Error(`Failed to get file info for ${path}: ${error}`);
    }
  }

  /**
   * Create a new directory
   */
  async createDirectory(path: string): Promise<void> {
    console.log('🦑 FileService.createDirectory:', path);

    try {
      await invoke('create_directory', { path });
      console.log('🦑 FileService.createDirectory success');
    } catch (error) {
      console.error('🦑 FileService.createDirectory error:', error);
      throw new Error(`Failed to create directory ${path}: ${error}`);
    }
  }

  /**
   * Rename a file or directory
   */
  async renameFile(oldPath: string, newPath: string): Promise<void> {
    console.log('🦑 FileService.renameFile:', oldPath, '->', newPath);

    try {
      await invoke('rename_file', { oldPath, newPath });
      console.log('🦑 FileService.renameFile success');
    } catch (error) {
      console.error('🦑 FileService.renameFile error:', error);
      throw new Error(`Failed to rename ${oldPath} to ${newPath}: ${error}`);
    }
  }

  /**
   * Delete a file or directory
   */
  async deleteFile(path: string): Promise<void> {
    console.log('🦑 FileService.deleteFile:', path);

    try {
      await invoke('delete_file', { path });
      console.log('🦑 FileService.deleteFile success');
    } catch (error) {
      console.error('🦑 FileService.deleteFile error:', error);
      throw new Error(`Failed to delete ${path}: ${error}`);
    }
  }

  /**
   * Copy a file or directory
   */
  async copyFile(source: string, destination: string): Promise<void> {
    console.log('🦑 FileService.copyFile:', source, '->', destination);

    try {
      await invoke('copy_file', { source, destination });
      console.log('🦑 FileService.copyFile success');
    } catch (error) {
      console.error('🦑 FileService.copyFile error:', error);
      throw new Error(`Failed to copy ${source} to ${destination}: ${error}`);
    }
  }

  /**
   * Move a file or directory
   */
  async moveFile(source: string, destination: string): Promise<void> {
    console.log('🦑 FileService.moveFile:', source, '->', destination);

    try {
      await invoke('move_file', { source, destination });
      console.log('🦑 FileService.moveFile success');
    } catch (error) {
      console.error('🦑 FileService.moveFile error:', error);
      throw new Error(`Failed to move ${source} to ${destination}: ${error}`);
    }
  }

  /**
   * Create an archive from multiple source paths
   */
  async createArchive(sourcePaths: string[], archivePath: string, format: TauriArchiveFormat): Promise<void> {
    console.log('🦑 FileService.createArchive:', sourcePaths, '->', archivePath, format);

    try {
      await invoke('create_archive', { sourcePaths, archivePath, format });
      console.log('🦑 FileService.createArchive success');
    } catch (error) {
      console.error('🦑 FileService.createArchive error:', error);
      throw new Error(`Failed to create archive ${archivePath}: ${error}`);
    }
  }

  /**
   * Extract an archive to a destination
   */
  async extractArchive(archivePath: string, destination: string): Promise<void> {
    console.log('🦑 FileService.extractArchive:', archivePath, '->', destination);

    try {
      await invoke('extract_archive', { archivePath, destination });
      console.log('🦑 FileService.extractArchive success');
    } catch (error) {
      console.error('🦑 FileService.extractArchive error:', error);
      throw new Error(`Failed to extract archive ${archivePath}: ${error}`);
    }
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<TauriSystemInfo> {
    console.log('🦑 FileService.getSystemInfo');

    try {
      const result = await invoke<TauriSystemInfo>('get_system_info');
      console.log('🦑 FileService.getSystemInfo result:', result);
      return result;
    } catch (error) {
      console.error('🦑 FileService.getSystemInfo error:', error);
      throw new Error(`Failed to get system info: ${error}`);
    }
  }

  /**
   * Get home directory path
   */
  async getHomeDirectory(): Promise<string> {
    console.log('🦑 FileService.getHomeDirectory');

    try {
      const result = await invoke<string>('get_home_directory');
      console.log('🦑 FileService.getHomeDirectory result:', result);
      return result;
    } catch (error) {
      console.error('🦑 FileService.getHomeDirectory error:', error);
      throw new Error(`Failed to get home directory: ${error}`);
    }
  }

  /**
   * Get desktop directory path
   */
  async getDesktopDirectory(): Promise<string> {
    console.log('🦑 FileService.getDesktopDirectory');

    try {
      const result = await invoke<string>('get_desktop_directory');
      console.log('🦑 FileService.getDesktopDirectory result:', result);
      return result;
    } catch (error) {
      console.error('🦑 FileService.getDesktopDirectory error:', error);
      throw new Error(`Failed to get desktop directory: ${error}`);
    }
  }

  /**
   * Get documents directory path
   */
  async getDocumentsDirectory(): Promise<string> {
    console.log('🦑 FileService.getDocumentsDirectory');

    try {
      const result = await invoke<string>('get_documents_directory');
      console.log('🦑 FileService.getDocumentsDirectory result:', result);
      return result;
    } catch (error) {
      console.error('🦑 FileService.getDocumentsDirectory error:', error);
      throw new Error(`Failed to get documents directory: ${error}`);
    }
  }

  /**
   * Get applications directory path
   */
  async getApplicationsDirectory(): Promise<string> {
    console.log('🦑 FileService.getApplicationsDirectory');

    try {
      const result = await invoke<string>('get_applications_directory');
      console.log('🦑 FileService.getApplicationsDirectory result:', result);
      return result;
    } catch (error) {
      console.error('🦑 FileService.getApplicationsDirectory error:', error);
      throw new Error(`Failed to get applications directory: ${error}`);
    }
  }

  /**
   * Write content to a file
   */
  async writeFile(path: string, content: string): Promise<void> {
    console.log('🦑 FileService.writeFile:', path);

    try {
      await invoke('write_file', { path, content });
      console.log('🦑 FileService.writeFile success');
    } catch (error) {
      console.error('🦑 FileService.writeFile error:', error);
      throw new Error(`Failed to write file ${path}: ${error}`);
    }
  }

  /**
   * Read content from a file
   */
  async readFile(path: string): Promise<string> {
    console.log('🦑 FileService.readFile:', path);

    try {
      const result = await invoke<string>('read_file', { path });
      console.log('🦑 FileService.readFile success');
      return result;
    } catch (error) {
      console.error('🦑 FileService.readFile error:', error);
      throw new Error(`Failed to read file ${path}: ${error}`);
    }
  }

  /**
   * Delete a directory recursively
   */
  async deleteDirectory(path: string, recursive: boolean = false): Promise<void> {
    console.log('🦑 FileService.deleteDirectory:', path, 'recursive:', recursive);

    try {
      await invoke('delete_directory', { path, recursive });
      console.log('🦑 FileService.deleteDirectory success');
    } catch (error) {
      console.error('🦑 FileService.deleteDirectory error:', error);
      throw new Error(`Failed to delete directory ${path}: ${error}`);
    }
  }

  /**
   * Check if a path exists
   */
  async pathExists(path: string): Promise<boolean> {
    console.log('🦑 FileService.pathExists:', path);

    try {
      const result = await invoke<boolean>('path_exists', { path });
      console.log('🦑 FileService.pathExists result:', result);
      return result;
    } catch (error) {
      console.error('🦑 FileService.pathExists error:', error);
      return false;
    }
  }

  /**
   * Get file size
   */
  async getFileSize(path: string): Promise<number> {
    console.log('🦑 FileService.getFileSize:', path);

    try {
      const result = await invoke<number>('get_file_size', { path });
      console.log('🦑 FileService.getFileSize result:', result);
      return result;
    } catch (error) {
      console.error('🦑 FileService.getFileSize error:', error);
      throw new Error(`Failed to get file size for ${path}: ${error}`);
    }
  }

  /**
   * Set file permissions (Unix-style)
   */
  async setFilePermissions(path: string, permissions: number): Promise<void> {
    console.log('🦑 FileService.setFilePermissions:', path, permissions);

    try {
      await invoke('set_file_permissions', { path, permissions });
      console.log('🦑 FileService.setFilePermissions success');
    } catch (error) {
      console.error('🦑 FileService.setFilePermissions error:', error);
      throw new Error(`Failed to set permissions for ${path}: ${error}`);
    }
  }

  /**
   * Get temporary directory path
   */
  async getTempDirectory(): Promise<string> {
    console.log('🦑 FileService.getTempDirectory');

    try {
      const result = await invoke<string>('get_temp_directory');
      console.log('🦑 FileService.getTempDirectory result:', result);
      return result;
    } catch (error) {
      console.error('🦑 FileService.getTempDirectory error:', error);
      throw new Error(`Failed to get temp directory: ${error}`);
    }
  }

  /**
   * Check if Tauri is available
   */
  isAvailable(): boolean {
    try {
      console.log('🦑 FileService.isAvailable checking...', {
        windowExists: typeof window !== 'undefined',
        hasTauri: typeof window !== 'undefined' && '__TAURI__' in window,
        invokeFunction: typeof invoke === 'function',
        windowTauri: typeof window !== 'undefined' ? (window as any).__TAURI__ : 'no window'
      });

      const available = typeof window !== 'undefined' &&
                       '__TAURI__' in window &&
                       typeof invoke === 'function';

      console.log('🦑 FileService.isAvailable result:', available);
      return available;
    } catch (error) {
      console.log('🦑 FileService.isAvailable error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const fileService = new FileService();
export default fileService;