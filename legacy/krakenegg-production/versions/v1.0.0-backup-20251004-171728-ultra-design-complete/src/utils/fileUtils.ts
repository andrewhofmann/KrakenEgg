import { FileInfo, FileType } from '../types';
import { isArchivePath, getArchiveParentPath, isNavigableArchive, parseArchivePath } from './archiveUtils';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};

// Finder-style folder colors based on folder type
export const getFolderColor = (folderName: string): string => {
  const name = folderName.toLowerCase();

  // System folders
  if (['applications', 'apps'].includes(name)) return '#4A90E2'; // Blue
  if (['documents', 'docs'].includes(name)) return '#F5A623'; // Orange
  if (['downloads', 'download'].includes(name)) return '#50E3C2'; // Teal
  if (['desktop'].includes(name)) return '#B8E986'; // Light Green
  if (['pictures', 'photos', 'images'].includes(name)) return '#BD10E0'; // Purple
  if (['music', 'audio'].includes(name)) return '#D0021B'; // Red
  if (['movies', 'videos'].includes(name)) return '#7ED321'; // Green
  if (['library', 'system'].includes(name)) return '#9013FE'; // Violet
  if (['dropbox', 'google drive', 'onedrive'].includes(name)) return '#417505'; // Dark Green

  // Default folder color (Finder blue)
  return '#5BA7F7';
};

export const getFileIcon = (file: FileInfo): string => {
  if (file.isDirectory) {
    return '📁';
  }

  switch (file.type) {
    case FileType.Image:
      return '🖼️';
    case FileType.Video:
      return '🎬';
    case FileType.Audio:
      return '🎵';
    case FileType.Document:
      if (file.extension === 'pdf') return '📄';
      if (['doc', 'docx'].includes(file.extension || '')) return '📝';
      if (['xls', 'xlsx'].includes(file.extension || '')) return '📊';
      if (['ppt', 'pptx'].includes(file.extension || '')) return '📈';
      return '📋';
    case FileType.Archive:
      return '📦';
    case FileType.Code:
      if (file.extension === 'js') return '🟨';
      if (file.extension === 'ts') return '🔷';
      if (file.extension === 'py') return '🐍';
      if (file.extension === 'java') return '☕';
      if (file.extension === 'cpp' || file.extension === 'c') return '⚙️';
      if (file.extension === 'html') return '🌐';
      if (file.extension === 'css') return '🎨';
      return '💻';
    case FileType.Executable:
      return '⚡';
    case FileType.Link:
      return '🔗';
    default:
      return '📄';
  }
};

export const getFileTypeFromExtension = (filename: string): FileType => {
  const extension = filename.split('.').pop()?.toLowerCase();

  if (!extension) return FileType.File;

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'svg', 'webp'];
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];
  const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'md'];
  const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'html', 'css', 'scss', 'sass', 'less', 'json', 'xml', 'yaml', 'yml', 'sql', 'sh', 'bat', 'ps1'];
  const archiveExtensions = ['zip', '7z', 'rar', 'tar', 'gz', 'bz2', 'xz', 'dmg', 'iso'];
  const executableExtensions = ['exe', 'app', 'deb', 'rpm', 'pkg', 'msi', 'dmg'];

  if (imageExtensions.includes(extension)) return FileType.Image;
  if (videoExtensions.includes(extension)) return FileType.Video;
  if (audioExtensions.includes(extension)) return FileType.Audio;
  if (documentExtensions.includes(extension)) return FileType.Document;
  if (codeExtensions.includes(extension)) return FileType.Code;
  if (archiveExtensions.includes(extension)) return FileType.Archive;
  if (executableExtensions.includes(extension)) return FileType.Executable;

  return FileType.File;
};

export const sortFiles = (files: FileInfo[], sortBy: string, sortOrder: string): FileInfo[] => {
  const sorted = [...files].sort((a, b) => {
    // Always put directories first
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;

    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name, undefined, { numeric: true });
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'modified':
        comparison = a.modified.getTime() - b.modified.getTime();
        break;
      case 'extension':
        const extA = a.extension || '';
        const extB = b.extension || '';
        comparison = extA.localeCompare(extB);
        if (comparison === 0) {
          comparison = a.name.localeCompare(b.name, undefined, { numeric: true });
        }
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        if (comparison === 0) {
          comparison = a.name.localeCompare(b.name, undefined, { numeric: true });
        }
        break;
      default:
        comparison = a.name.localeCompare(b.name, undefined, { numeric: true });
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return sorted;
};

export const filterFiles = (files: FileInfo[], query: string, showHidden: boolean = false): FileInfo[] => {
  return files.filter(file => {
    // Filter hidden files if not showing them
    if (!showHidden && file.isHidden) return false;

    // If no query, show all (non-hidden) files
    if (!query) return true;

    // Search in filename and extension
    const searchQuery = query.toLowerCase();
    return (
      file.name.toLowerCase().includes(searchQuery) ||
      (file.extension && file.extension.toLowerCase().includes(searchQuery))
    );
  });
};

export const validatePath = (path: string): boolean => {
  // Basic path validation
  if (!path) return false;
  if (path.includes('..')) return false; // Prevent directory traversal
  return true;
};

export const joinPath = (...parts: string[]): string => {
  return parts
    .filter(part => part && part !== '.')
    .join('/')
    .replace(/\/+/g, '/') // Remove duplicate slashes
    .replace(/\/$/, '') || '/'; // Remove trailing slash except for root
};

export const getParentPath = (path: string): string => {
  if (path === '/' || path === '') return '/';

  // Handle archive paths
  if (isArchivePath(path)) {
    return getArchiveParentPath(path);
  }

  const parts = path.split('/').filter(part => part);
  if (parts.length <= 1) return '/';
  return '/' + parts.slice(0, -1).join('/');
};

export const getFileName = (path: string): string => {
  return path.split('/').pop() || path;
};

export const isArchive = (file: FileInfo): boolean => {
  return file.type === FileType.Archive;
};

export const isExecutable = (file: FileInfo): boolean => {
  return file.type === FileType.Executable || file.permissions.executable;
};

export const canPreview = (file: FileInfo): boolean => {
  return [
    FileType.Image,
    FileType.Document,
    FileType.Code
  ].includes(file.type);
};

export const getFileCount = (files: FileInfo[]): { files: number; directories: number; total: number } => {
  const directories = files.filter(f => f.isDirectory && f.name !== '..').length;
  const fileCount = files.filter(f => !f.isDirectory).length;

  return {
    files: fileCount,
    directories,
    total: fileCount + directories
  };
};

export const getTotalSize = (files: FileInfo[]): number => {
  return files
    .filter(f => !f.isDirectory)
    .reduce((total, file) => total + file.size, 0);
};

export const createBreadcrumb = (path: string): Array<{ name: string; path: string; isEllipsis?: boolean }> => {
  if (path === '/') {
    return [{ name: 'Root', path: '/' }];
  }

  // Handle archive paths
  if (isArchivePath(path)) {
    const { archivePath, internalPath } = parseArchivePath(path);
    const breadcrumb = [];

    // First, build breadcrumb for the path leading to the archive
    const archivePathParts = archivePath.split('/').filter(part => part);
    let currentPath = '';

    breadcrumb.push({ name: 'Root', path: '/' });

    for (let i = 0; i < archivePathParts.length; i++) {
      const part = archivePathParts[i];
      currentPath += '/' + part;

      // Check if this is the archive file itself
      if (i === archivePathParts.length - 1) {
        breadcrumb.push({
          name: `📦 ${part}`,
          path: currentPath
        });
      } else {
        breadcrumb.push({
          name: part,
          path: currentPath
        });
      }
    }

    // Then add internal archive path if it exists
    if (internalPath) {
      const internalParts = internalPath.split('/').filter(part => part);
      let internalCurrentPath = archivePath;

      for (const part of internalParts) {
        internalCurrentPath += '/' + part;
        breadcrumb.push({
          name: part,
          path: internalCurrentPath
        });
      }
    }

    return breadcrumb;
  }

  const parts = path.split('/').filter(part => part);
  const breadcrumb = [{ name: 'Root', path: '/' }];

  let currentPath = '';
  for (const part of parts) {
    currentPath += '/' + part;
    breadcrumb.push({
      name: part,
      path: currentPath
    });
  }

  return breadcrumb;
};

export const getFolderNameFromPath = (path: string): string => {
  if (path === '/') return 'Root';

  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return 'Root';

  const folderName = segments[segments.length - 1];

  // Handle common special cases with more user-friendly names
  const specialFolders: { [key: string]: string } = {
    'Users': 'Users',
    'Applications': 'Applications',
    'Desktop': 'Desktop',
    'Documents': 'Documents',
    'Downloads': 'Downloads',
    'Pictures': 'Pictures',
    'Music': 'Music',
    'Movies': 'Movies',
    'Library': 'Library',
    'System': 'System',
    'usr': 'Unix System Resources',
    'var': 'Variable Data',
    'tmp': 'Temporary',
    'opt': 'Optional Software',
    'etc': 'System Configuration'
  };

  return specialFolders[folderName] || folderName;
};