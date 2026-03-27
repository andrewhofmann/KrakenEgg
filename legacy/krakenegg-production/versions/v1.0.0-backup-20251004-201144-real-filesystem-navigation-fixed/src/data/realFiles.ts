import { FileInfo } from '../types';
import fileService from '../services/fileService';

/**
 * Real file operations using Tauri backend
 * This replaces the mock file generation for production
 */

export async function generateRealFiles(path: string): Promise<FileInfo[]> {
  console.log('🦑 generateRealFiles for path:', path);

  // Only use real files - no mock fallback
  try {
    console.log('🦑 Attempting to load real files directly...');
    const files = await fileService.listDirectory(path);
    console.log('🦑 SUCCESS: generateRealFiles found', files.length, 'real files');
    return files;
  } catch (error) {
    console.error('🦑 Real file loading failed:', error);

    // Check availability for debugging
    const isAvailable = fileService.isAvailable();
    console.log('🦑 FileService availability check:', isAvailable);

    // Return empty array instead of mock files
    console.warn('🦑 Returning empty array - no mock files will be shown');
    return [];
  }
}

export async function getRealHomeDirectory(): Promise<string> {
  console.log('🦑 getRealHomeDirectory');

  try {
    if (!fileService.isAvailable()) {
      return '/Users/andrew'; // Fallback
    }

    return await fileService.getHomeDirectory();
  } catch (error) {
    console.error('🦑 getRealHomeDirectory error:', error);
    return '/Users/andrew'; // Fallback
  }
}

export async function getRealDocumentsDirectory(): Promise<string> {
  console.log('🦑 getRealDocumentsDirectory');

  try {
    if (!fileService.isAvailable()) {
      return '/Users/andrew/Documents'; // Fallback
    }

    return await fileService.getDocumentsDirectory();
  } catch (error) {
    console.error('🦑 getRealDocumentsDirectory error:', error);
    return '/Users/andrew/Documents'; // Fallback
  }
}

export async function getRealDesktopDirectory(): Promise<string> {
  console.log('🦑 getRealDesktopDirectory');

  try {
    if (!fileService.isAvailable()) {
      return '/Users/andrew/Desktop'; // Fallback
    }

    return await fileService.getDesktopDirectory();
  } catch (error) {
    console.error('🦑 getRealDesktopDirectory error:', error);
    return '/Users/andrew/Desktop'; // Fallback
  }
}

export async function getRealApplicationsDirectory(): Promise<string> {
  console.log('🦑 getRealApplicationsDirectory');

  try {
    if (!fileService.isAvailable()) {
      return '/Applications'; // Fallback
    }

    return await fileService.getApplicationsDirectory();
  } catch (error) {
    console.error('🦑 getRealApplicationsDirectory error:', error);
    return '/Applications'; // Fallback
  }
}

export async function navigateToRealPath(path: string): Promise<FileInfo[]> {
  console.log('🦑 navigateToRealPath:', path);

  // Use generateRealFiles which calls the correct list_directory command
  return await generateRealFiles(path);
}

export async function createRealDirectory(path: string): Promise<void> {
  console.log('🦑 createRealDirectory:', path);

  try {
    if (!fileService.isAvailable()) {
      throw new Error('Tauri not available - cannot create directory');
    }

    await fileService.createDirectory(path);
    console.log('🦑 createRealDirectory success');
  } catch (error) {
    console.error('🦑 createRealDirectory error:', error);
    throw error;
  }
}

export async function deleteRealFile(path: string): Promise<void> {
  console.log('🦑 deleteRealFile:', path);

  try {
    if (!fileService.isAvailable()) {
      throw new Error('Tauri not available - cannot delete file');
    }

    await fileService.deleteFile(path);
    console.log('🦑 deleteRealFile success');
  } catch (error) {
    console.error('🦑 deleteRealFile error:', error);
    throw error;
  }
}

export async function copyRealFile(source: string, destination: string): Promise<void> {
  console.log('🦑 copyRealFile:', source, '->', destination);

  try {
    if (!fileService.isAvailable()) {
      throw new Error('Tauri not available - cannot copy file');
    }

    await fileService.copyFile(source, destination);
    console.log('🦑 copyRealFile success');
  } catch (error) {
    console.error('🦑 copyRealFile error:', error);
    throw error;
  }
}

export async function moveRealFile(source: string, destination: string): Promise<void> {
  console.log('🦑 moveRealFile:', source, '->', destination);

  try {
    if (!fileService.isAvailable()) {
      throw new Error('Tauri not available - cannot move file');
    }

    await fileService.moveFile(source, destination);
    console.log('🦑 moveRealFile success');
  } catch (error) {
    console.error('🦑 moveRealFile error:', error);
    throw error;
  }
}

export async function renameRealFile(oldPath: string, newPath: string): Promise<void> {
  console.log('🦑 renameRealFile:', oldPath, '->', newPath);

  try {
    if (!fileService.isAvailable()) {
      throw new Error('Tauri not available - cannot rename file');
    }

    await fileService.renameFile(oldPath, newPath);
    console.log('🦑 renameRealFile success');
  } catch (error) {
    console.error('🦑 renameRealFile error:', error);
    throw error;
  }
}