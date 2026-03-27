import { useState } from 'react';
import { FileInfo } from '../../types';
import { formatFileSize } from '../../utils/fileUtils';
import { Archive, FolderOpen } from 'lucide-react';
import CompactDialog from './CompactDialog';

interface UltraArchiveDialogProps {
  onClose: () => void;
  data?: {
    files: FileInfo[];
    mode: 'create' | 'extract';
  };
}

const UltraArchiveDialog = ({ onClose, data }: UltraArchiveDialogProps) => {
  const [archiveName, setArchiveName] = useState('Archive');
  const [archiveFormat, setArchiveFormat] = useState('zip');
  const [destination, setDestination] = useState('/Users/user/Documents');

  const files = data?.files || [];
  const mode = data?.mode || 'create';
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  const formats = [
    { id: 'zip', name: 'ZIP' },
    { id: '7z', name: '7Z' },
    { id: 'tar', name: 'TAR' },
    { id: 'rar', name: 'RAR' }
  ];

  const handleCreate = () => {
    console.log('Creating archive:', { archiveName, archiveFormat, destination, files });
    onClose();
  };

  if (mode === 'create') {
    return (
      <CompactDialog
        title="Create Archive"
        icon={<Archive size={14} className="text-white" />}
        iconColor="bg-mac26-purple-500"
        onClose={onClose}
        onConfirm={handleCreate}
        onCancel={onClose}
        confirmText="Create"
        cancelText="Cancel"
        size="md"
      >
        <div className="space-y-3">
          {/* File summary */}
          <div className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
            {files.length} file{files.length !== 1 ? 's' : ''} • {formatFileSize(totalSize)}
          </div>

          {/* Archive name */}
          <div>
            <label className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark block mb-1">
              Archive name:
            </label>
            <input
              type="text"
              value={archiveName}
              onChange={(e) => setArchiveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              className="w-full text-sm px-2 py-1.5 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border border-mac26-border-primary-light dark:border-mac26-border-primary-dark rounded focus:outline-none focus:border-mac26-blue-500"
            />
          </div>

          {/* Format selection */}
          <div>
            <label className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark block mb-1">
              Format:
            </label>
            <div className="flex gap-1">
              {formats.map(format => (
                <button
                  key={format.id}
                  className={`px-2 py-1 text-xs rounded transition-all duration-150 ${
                    archiveFormat === format.id
                      ? 'bg-mac26-purple-500 text-white'
                      : 'bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark'
                  }`}
                  onClick={() => setArchiveFormat(format.id)}
                >
                  {format.name}
                </button>
              ))}
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark block mb-1">
              Save to:
            </label>
            <div className="flex gap-1">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="flex-1 text-xs px-2 py-1 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border border-mac26-border-primary-light dark:border-mac26-border-primary-dark rounded focus:outline-none focus:border-mac26-blue-500"
                placeholder="Destination..."
              />
              <button
                className="px-2 py-1 text-xs bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark border border-mac26-border-primary-light dark:border-mac26-border-primary-dark rounded transition-colors duration-150"
                title="Browse"
              >
                <FolderOpen size={10} />
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="text-xs text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark">
            📦 {destination}/{archiveName}.{archiveFormat}
          </div>
        </div>
      </CompactDialog>
    );
  }

  // Extract mode (simplified)
  return (
    <CompactDialog
      title="Extract Archive"
      icon={<Archive size={14} className="text-white" />}
      iconColor="bg-mac26-orange-500"
      onClose={onClose}
      onConfirm={() => {
        console.log('Extracting to:', destination);
        onClose();
      }}
      onCancel={onClose}
      confirmText="Extract"
      cancelText="Cancel"
      size="sm"
    >
      <div className="space-y-3">
        {/* Destination */}
        <div>
          <label className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark block mb-1">
            Extract to:
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="flex-1 text-xs px-2 py-1 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border border-mac26-border-primary-light dark:border-mac26-border-primary-dark rounded focus:outline-none focus:border-mac26-blue-500"
              placeholder="Destination..."
            />
            <button
              className="px-2 py-1 text-xs bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark border border-mac26-border-primary-light dark:border-mac26-border-primary-dark rounded transition-colors duration-150"
              title="Browse"
            >
              <FolderOpen size={10} />
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="createFolder"
            className="w-3 h-3 text-mac26-blue-500 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border-mac26-border-primary-light dark:border-mac26-border-primary-dark rounded focus:ring-mac26-blue-500 focus:ring-1"
          />
          <label htmlFor="createFolder" className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
            Create folder for archive contents
          </label>
        </div>

        {/* Preview */}
        <div className="text-xs text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark">
          📂 Extract to: {destination}
        </div>
      </div>
    </CompactDialog>
  );
};

export default UltraArchiveDialog;