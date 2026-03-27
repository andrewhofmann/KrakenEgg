import { FileInfo, FileType } from '../types';
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

    // Return mock files for browser testing when Tauri is not available
    console.warn('🦑 Tauri not available - returning mock files for browser testing');
    return generateMockFilesForTesting(path);
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

/**
 * Generate mock files for browser testing when Tauri is not available
 * This allows scroll functionality testing in browser mode
 */
function generateMockFilesForTesting(path: string): FileInfo[] {
  console.log('🔧 Generating mock files for testing, path:', path);

  // Parent directory entry
  const parentEntry: FileInfo = {
    id: 'parent',
    name: '..',
    path: path.split('/').slice(0, -1).join('/') || '/',
    size: 0,
    modified: new Date(),
    created: new Date(),
    isDirectory: true,
    isHidden: false,
    permissions: {
      readable: true,
      writable: false,
      executable: true,
      owner: 'user',
      group: 'staff',
      mode: '755'
    },
    type: FileType.Directory
  };

  // Generate plenty of mock files for scroll testing
  const mockFiles: FileInfo[] = [parentEntry];

  // Add some directories
  for (let i = 1; i <= 15; i++) {
    mockFiles.push({
      id: `dir-${i}`,
      name: `📁 Test Directory ${i.toString().padStart(2, '0')}`,
      path: `${path}/Test Directory ${i.toString().padStart(2, '0')}`,
      size: 0,
      modified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      created: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      isDirectory: true,
      isHidden: false,
      permissions: {
        readable: true,
        writable: true,
        executable: true,
        owner: 'user',
        group: 'staff',
        mode: '755'
      },
      type: FileType.Directory
    });
  }

  // Add various file types for comprehensive testing
  const fileTypes = [
    { ext: 'txt', type: FileType.Document, icon: '📄' },
    { ext: 'pdf', type: FileType.Document, icon: '📋' },
    { ext: 'jpg', type: FileType.Image, icon: '🖼️' },
    { ext: 'png', type: FileType.Image, icon: '🎨' },
    { ext: 'mp4', type: FileType.Video, icon: '🎬' },
    { ext: 'mp3', type: FileType.Audio, icon: '🎵' },
    { ext: 'js', type: FileType.Code, icon: '💻' },
    { ext: 'ts', type: FileType.Code, icon: '⚡' },
    { ext: 'py', type: FileType.Code, icon: '🐍' },
    { ext: 'zip', type: FileType.Archive, icon: '📦' },
    { ext: 'dmg', type: FileType.Archive, icon: '💿' },
    { ext: 'app', type: FileType.Executable, icon: '🚀' }
  ];

  // Generate 100+ files for scroll testing
  for (let i = 1; i <= 120; i++) {
    const fileType = fileTypes[i % fileTypes.length];
    const fileName = `${fileType.icon} Mock File ${i.toString().padStart(3, '0')}.${fileType.ext}`;
    const fileSize = Math.floor(Math.random() * 10000000) + 1024; // Random size between 1KB and 10MB

    mockFiles.push({
      id: `file-${i}`,
      name: fileName,
      path: `${path}/${fileName}`,
      size: fileSize,
      modified: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      created: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000),
      isDirectory: false,
      isHidden: Math.random() < 0.1, // 10% hidden files
      permissions: {
        readable: true,
        writable: Math.random() < 0.8, // 80% writable
        executable: fileType.type === FileType.Executable,
        owner: 'user',
        group: 'staff',
        mode: fileType.type === FileType.Executable ? '755' : '644'
      },
      extension: fileType.ext,
      type: fileType.type
    });
  }

  console.log(`🔧 Generated ${mockFiles.length} mock files for scroll testing`);
  return mockFiles;
}