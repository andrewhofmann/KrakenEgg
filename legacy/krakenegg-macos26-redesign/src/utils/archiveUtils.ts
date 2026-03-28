import { FileInfo, FileType } from '../types';
import { getFileTypeFromExtension } from './fileUtils';

// Check if a path represents navigation into an archive
export const isArchivePath = (path: string): boolean => {
  const archiveExtensions = ['zip', '7z', 'rar', 'tar', 'gz', 'bz2', 'xz'];

  // Look for archive extensions in the path
  for (const ext of archiveExtensions) {
    if (path.includes(`.${ext}/`) || path.includes(`.${ext}\\`)) {
      return true;
    }
  }

  return false;
};

// Extract the archive file path and internal path from a full archive path
export const parseArchivePath = (path: string): { archivePath: string; internalPath: string } => {
  const archiveExtensions = ['zip', '7z', 'rar', 'tar', 'gz', 'bz2', 'xz'];

  for (const ext of archiveExtensions) {
    const archiveIndex = path.indexOf(`.${ext}/`);
    if (archiveIndex !== -1) {
      const archivePath = path.substring(0, archiveIndex + ext.length + 1);
      const internalPath = path.substring(archiveIndex + ext.length + 1);
      return { archivePath, internalPath };
    }
  }

  return { archivePath: path, internalPath: '' };
};

// Get the archive file name from a path
export const getArchiveFileName = (archivePath: string): string => {
  return archivePath.split('/').pop() || archivePath;
};

// Check if a file is an archive that can be navigated
export const isNavigableArchive = (file: FileInfo): boolean => {
  if (file.isDirectory) return false;

  const navigableExtensions = ['zip', '7z', 'rar', 'tar', 'gz', 'bz2', 'xz'];
  const extension = file.extension?.toLowerCase();

  return extension ? navigableExtensions.includes(extension) : false;
};

// Create mock permissions for archive files
const createArchivePermissions = () => ({
  readable: true,
  writable: false, // Archive contents are read-only
  executable: false,
  owner: 'archive',
  group: 'archive',
  mode: '644'
});

// Generate mock contents for an archive
export const generateArchiveContents = (archivePath: string, internalPath: string = ''): FileInfo[] => {
  const files: FileInfo[] = [];
  const archiveFileName = getArchiveFileName(archivePath);
  const baseArchivePath = `${archivePath}/${internalPath}`.replace(/\/+$/, '');

  // Add parent directory if we're inside the archive
  if (internalPath) {
    files.push({
      id: `${baseArchivePath}/..`,
      name: '..',
      path: baseArchivePath,
      size: 0,
      modified: new Date(),
      created: new Date(),
      isDirectory: true,
      isHidden: false,
      permissions: createArchivePermissions(),
      type: FileType.Directory,
    });
  }

  // Mock archive contents based on archive name or type
  if (archiveFileName === 'backup.zip') {
    const basePath = internalPath ? `${baseArchivePath}` : `${archivePath}`;

    if (!internalPath) {
      // Root of backup.zip
      files.push(
        {
          id: `${basePath}/Documents`,
          name: 'Documents',
          path: basePath,
          size: 0,
          modified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          isDirectory: true,
          isHidden: false,
          permissions: createArchivePermissions(),
          type: FileType.Directory,
        },
        {
          id: `${basePath}/Pictures`,
          name: 'Pictures',
          path: basePath,
          size: 0,
          modified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          isDirectory: true,
          isHidden: false,
          permissions: createArchivePermissions(),
          type: FileType.Directory,
        },
        {
          id: `${basePath}/config.json`,
          name: 'config.json',
          path: basePath,
          size: 2048,
          modified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          isDirectory: false,
          isHidden: false,
          permissions: createArchivePermissions(),
          extension: 'json',
          type: FileType.Code,
        },
        {
          id: `${basePath}/README.txt`,
          name: 'README.txt',
          path: basePath,
          size: 1024,
          modified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          isDirectory: false,
          isHidden: false,
          permissions: createArchivePermissions(),
          extension: 'txt',
          type: FileType.Document,
        }
      );
    } else if (internalPath === 'Documents') {
      // Inside Documents folder of backup.zip
      files.push(
        {
          id: `${basePath}/report.pdf`,
          name: 'report.pdf',
          path: basePath,
          size: 512000,
          modified: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          created: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          isDirectory: false,
          isHidden: false,
          permissions: createArchivePermissions(),
          extension: 'pdf',
          type: FileType.Document,
        },
        {
          id: `${basePath}/notes.md`,
          name: 'notes.md',
          path: basePath,
          size: 4096,
          modified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          isDirectory: false,
          isHidden: false,
          permissions: createArchivePermissions(),
          extension: 'md',
          type: FileType.Document,
        }
      );
    } else if (internalPath === 'Pictures') {
      // Inside Pictures folder of backup.zip
      files.push(
        {
          id: `${basePath}/photo1.jpg`,
          name: 'photo1.jpg',
          path: basePath,
          size: 2048000,
          modified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          isDirectory: false,
          isHidden: false,
          permissions: createArchivePermissions(),
          extension: 'jpg',
          type: FileType.Image,
        },
        {
          id: `${basePath}/photo2.png`,
          name: 'photo2.png',
          path: basePath,
          size: 1024000,
          modified: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          created: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          isDirectory: false,
          isHidden: false,
          permissions: createArchivePermissions(),
          extension: 'png',
          type: FileType.Image,
        }
      );
    }
  } else {
    // Generic archive contents
    const basePath = internalPath ? `${baseArchivePath}` : `${archivePath}`;

    if (!internalPath) {
      files.push(
        {
          id: `${basePath}/src`,
          name: 'src',
          path: basePath,
          size: 0,
          modified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          isDirectory: true,
          isHidden: false,
          permissions: createArchivePermissions(),
          type: FileType.Directory,
        },
        {
          id: `${basePath}/package.json`,
          name: 'package.json',
          path: basePath,
          size: 1024,
          modified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          isDirectory: false,
          isHidden: false,
          permissions: createArchivePermissions(),
          extension: 'json',
          type: FileType.Code,
        }
      );
    }
  }

  return files;
};

// Build the full archive path for navigation
export const buildArchivePath = (archivePath: string, internalPath: string): string => {
  if (!internalPath) return archivePath;
  return `${archivePath}/${internalPath}`;
};

// Get parent path within archive
export const getArchiveParentPath = (path: string): string => {
  const { archivePath, internalPath } = parseArchivePath(path);

  if (!internalPath) {
    // We're at the root of the archive, go back to the directory containing the archive
    return archivePath.substring(0, archivePath.lastIndexOf('/')) || '/';
  }

  // Go up one level within the archive
  const pathParts = internalPath.split('/').filter(part => part);
  if (pathParts.length <= 1) {
    return archivePath; // Go back to archive root
  }

  const parentInternalPath = pathParts.slice(0, -1).join('/');
  return buildArchivePath(archivePath, parentInternalPath);
};