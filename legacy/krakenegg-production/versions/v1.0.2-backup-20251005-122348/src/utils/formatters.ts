// Utility functions for formatting file metadata

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format date in compact format for file listings
 */
export function formatFileDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    // Today - show time
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } else if (days < 7) {
    // This week - show day and time
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } else if (days < 365) {
    // This year - show month and day
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } else {
    // Older - show year
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) return '';
  return filename.slice(lastDot + 1).toUpperCase();
}

/**
 * Get file type display string
 */
export function getFileTypeDisplay(file: { isDirectory: boolean; extension?: string; name: string }): string {
  if (file.isDirectory) {
    return 'Folder';
  }

  if (file.name === '..') {
    return 'Parent';
  }

  if (!file.extension) {
    return 'File';
  }

  // Common file type mappings
  const typeMap: { [key: string]: string } = {
    // Documents
    'PDF': 'PDF Document',
    'DOC': 'Word Document',
    'DOCX': 'Word Document',
    'XLS': 'Excel Spreadsheet',
    'XLSX': 'Excel Spreadsheet',
    'PPT': 'PowerPoint',
    'PPTX': 'PowerPoint',
    'TXT': 'Text File',
    'RTF': 'Rich Text',

    // Images
    'JPG': 'JPEG Image',
    'JPEG': 'JPEG Image',
    'PNG': 'PNG Image',
    'GIF': 'GIF Image',
    'BMP': 'Bitmap Image',
    'SVG': 'SVG Image',
    'WEBP': 'WebP Image',

    // Video
    'MP4': 'MP4 Video',
    'AVI': 'AVI Video',
    'MOV': 'QuickTime Video',
    'MKV': 'Matroska Video',
    'WMV': 'Windows Media',
    'FLV': 'Flash Video',
    'WEBM': 'WebM Video',

    // Audio
    'MP3': 'MP3 Audio',
    'WAV': 'WAV Audio',
    'FLAC': 'FLAC Audio',
    'AAC': 'AAC Audio',
    'OGG': 'OGG Audio',
    'WMA': 'Windows Media Audio',

    // Archives
    'ZIP': 'ZIP Archive',
    '7Z': '7-Zip Archive',
    'RAR': 'RAR Archive',
    'TAR': 'TAR Archive',
    'GZ': 'GZip Archive',
    'BZ2': 'BZip2 Archive',

    // Code
    'JS': 'JavaScript',
    'TS': 'TypeScript',
    'PY': 'Python Script',
    'RS': 'Rust Source',
    'JAVA': 'Java Source',
    'CPP': 'C++ Source',
    'C': 'C Source',
    'H': 'Header File',
    'HTML': 'HTML Document',
    'CSS': 'CSS Stylesheet',
    'JSON': 'JSON Data',
    'XML': 'XML Document',

    // Executables
    'EXE': 'Application',
    'APP': 'Application',
    'DMG': 'Disk Image',
    'DEB': 'Debian Package',
    'RPM': 'RPM Package',
  };

  return typeMap[file.extension.toUpperCase()] || `${file.extension.toUpperCase()} File`;
}