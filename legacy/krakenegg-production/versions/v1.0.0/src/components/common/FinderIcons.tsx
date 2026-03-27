import React from 'react';
import { FileInfo } from '../../types';
import { getFolderColor } from '../../utils/fileUtils';

interface FinderIconProps {
  file: FileInfo;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FinderIcon: React.FC<FinderIconProps> = ({ file, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  if (file.isDirectory) {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
        <FolderIcon folderName={file.name} size={size} />
      </div>
    );
  }

  // File icons based on extension
  const extension = file.extension?.toLowerCase();

  switch (extension) {
    case 'txt':
      return <TextIcon size={size} className={className} />;
    case 'pdf':
      return <PDFIcon size={size} className={className} />;
    case 'doc':
    case 'docx':
      return <WordIcon size={size} className={className} />;
    case 'xls':
    case 'xlsx':
      return <ExcelIcon size={size} className={className} />;
    case 'ppt':
    case 'pptx':
      return <PowerPointIcon size={size} className={className} />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
      return <ImageIcon size={size} className={className} />;
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'mkv':
      return <VideoIcon size={size} className={className} />;
    case 'mp3':
    case 'aac':
    case 'wav':
    case 'flac':
      return <AudioIcon size={size} className={className} />;
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return <ArchiveIcon size={size} className={className} />;
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'py':
    case 'java':
    case 'cpp':
    case 'c':
    case 'h':
      return <CodeIcon size={size} className={className} />;
    case 'html':
    case 'css':
      return <WebIcon size={size} className={className} />;
    case 'app':
      return <AppIcon size={size} className={className} />;
    case 'dmg':
      return <DiskImageIcon size={size} className={className} />;
    default:
      return <GenericIcon size={size} className={className} />;
  }
};

// Individual icon components matching macOS Finder exactly
const FolderIcon: React.FC<{ folderName: string; size: 'sm' | 'md' | 'lg' }> = ({ folderName, size }) => {
  const color = getFolderColor(folderName);
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg className={sizeClasses[size]} viewBox="0 0 24 24" fill="none">
      {/* Folder back */}
      <path
        d="M4 6C4 4.89543 4.89543 4 6 4H9.58579C10.1164 4 10.6257 4.21071 11 4.58579L12.4142 6H18C19.1046 6 20 6.89543 20 8V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z"
        fill={color}
        opacity="0.8"
      />
      {/* Folder front */}
      <path
        d="M4 8C4 6.89543 4.89543 6 6 6H18C19.1046 6 20 6.89543 20 8V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V8Z"
        fill={color}
      />
      {/* Folder fold */}
      <path
        d="M4 8C4 6.89543 4.89543 6 6 6H12L10.5858 4.58579C10.2107 4.21071 9.70136 4 9.17082 4H6C4.89543 4 4 4.89543 4 6V8Z"
        fill={color}
        opacity="0.6"
      />
    </svg>
  );
};

const TextIcon: React.FC<{ size: 'sm' | 'md' | 'lg'; className?: string }> = ({ size, className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg className={`${sizeClasses[size]} ${className}`} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="2" fill="#E8E8E8" stroke="#CCCCCC" strokeWidth="1"/>
      <path d="M7 6h10M7 9h10M7 12h7" stroke="#666666" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
};

const PDFIcon: React.FC<{ size: 'sm' | 'md' | 'lg'; className?: string }> = ({ size, className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg className={`${sizeClasses[size]} ${className}`} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="2" fill="#FF3B30"/>
      <text x="12" y="13" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">PDF</text>
    </svg>
  );
};

const WordIcon: React.FC<{ size: 'sm' | 'md' | 'lg'; className?: string }> = ({ size, className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg className={`${sizeClasses[size]} ${className}`} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="2" fill="#2B579A"/>
      <text x="12" y="13" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">DOC</text>
    </svg>
  );
};

const ExcelIcon: React.FC<{ size: 'sm' | 'md' | 'lg'; className?: string }> = ({ size, className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg className={`${sizeClasses[size]} ${className}`} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="2" fill="#217346"/>
      <text x="12" y="13" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">XLS</text>
    </svg>
  );
};

const PowerPointIcon: React.FC<{ size: 'sm' | 'md' | 'lg'; className?: string }> = ({ size, className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg className={`${sizeClasses[size]} ${className}`} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="2" fill="#D24726"/>
      <text x="12" y="13" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">PPT</text>
    </svg>
  );
};

const ImageIcon: React.FC<{ size: 'sm' | 'md' | 'lg'; className?: string }> = ({ size, className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg className={`${sizeClasses[size]} ${className}`} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="2" fill="#007AFF" stroke="#0051D6"/>
      <circle cx="8" cy="8" r="1.5" fill="white"/>
      <path d="M20 15L16 11L10 17L8 15L4 19V18C4 17.4477 4.44772 17 5 17H19C19.5523 17 20 17.4477 20 18V15Z" fill="white"/>
    </svg>
  );
};

const VideoIcon: React.FC<{ size: 'sm' | 'md' | 'lg'; className?: string }> = ({ size, className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg className={`${sizeClasses[size]} ${className}`} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="12" rx="2" fill="#1D1D1F"/>
      <path d="M10 9L15 12L10 15V9Z" fill="white"/>
    </svg>
  );
};

const AudioIcon: React.FC<{ size: 'sm' | 'md' | 'lg'; className?: string }> = ({ size, className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg className={`${sizeClasses[size]} ${className}`} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="2" fill="#FF9500"/>
      <path d="M9 7V17L15 15V5L9 7Z" fill="white"/>
      <circle cx="9" cy="16" r="2" fill="white"/>
    </svg>
  );
};

const ArchiveIcon: React.FC<{ size: 'sm' | 'md' | 'lg'; className?: string }> = ({ size, className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg className={`${sizeClasses[size]} ${className}`} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="2" fill="#8E8E93"/>
      <rect x="7" y="7" width="10" height="2" fill="white"/>
      <rect x="7" y="11" width="8" height="1" fill="white"/>
      <rect x="7" y="14" width="6" height="1" fill="white"/>
    </svg>
  );
};

const CodeIcon: React.FC<{ size: 'sm' | 'md' | 'lg'; className?: string }> = ({ size, className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg className={`${sizeClasses[size]} ${className}`} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="2" fill="#1D1D1F"/>
      <path d="M8 8L6 12L8 16M16 8L18 12L16 16M11 6L13 18" stroke="#30D158" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
};

const WebIcon: React.FC<{ size: 'sm' | 'md' | 'lg'; className?: string }> = ({ size, className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg className={`${sizeClasses[size]} ${className}`} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="2" fill="#FF9500"/>
      <text x="12" y="13" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">HTML</text>
    </svg>
  );
};

const AppIcon: React.FC<{ size: 'sm' | 'md' | 'lg'; className?: string }> = ({ size, className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg className={`${sizeClasses[size]} ${className}`} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="4" fill="#007AFF"/>
      <rect x="7" y="7" width="10" height="2" rx="1" fill="white"/>
      <rect x="7" y="11" width="8" height="2" rx="1" fill="white"/>
      <rect x="7" y="15" width="6" height="2" rx="1" fill="white"/>
    </svg>
  );
};

const DiskImageIcon: React.FC<{ size: 'sm' | 'md' | 'lg'; className?: string }> = ({ size, className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg className={`${sizeClasses[size]} ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#8E8E93"/>
      <circle cx="12" cy="12" r="2" fill="white"/>
      <text x="12" y="20" textAnchor="middle" fill="white" fontSize="4" fontWeight="bold">DMG</text>
    </svg>
  );
};

const GenericIcon: React.FC<{ size: 'sm' | 'md' | 'lg'; className?: string }> = ({ size, className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg className={`${sizeClasses[size]} ${className}`} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#E8E8E8"/>
      <path d="M14 2V8H20L14 2Z" fill="#CCCCCC"/>
    </svg>
  );
};

export default FinderIcon;