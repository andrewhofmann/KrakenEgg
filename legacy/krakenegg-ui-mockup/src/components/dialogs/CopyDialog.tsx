import React, { useState } from 'react';
import { AppState } from '../../types';
import { X, Copy, Move, FolderOpen } from 'lucide-react';

interface CopyDialogProps {
  appState: AppState;
  onClose: () => void;
  isMove?: boolean;
}

const CopyDialog: React.FC<CopyDialogProps> = ({
  appState,
  onClose,
  isMove = false
}) => {
  const activePanel = appState.activePanel === 'left' ? appState.leftPanel : appState.rightPanel;
  const inactivePanel = appState.activePanel === 'left' ? appState.rightPanel : appState.leftPanel;

  const selectedFiles = activePanel.files.filter(f => activePanel.selectedFiles.has(f.id));
  const [destination, setDestination] = useState(inactivePanel.currentPath);
  const [overwriteAction, setOverwriteAction] = useState<'ask' | 'overwrite' | 'skip'>('ask');
  const [preserveAttributes, setPreserveAttributes] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log(`${isMove ? 'Moving' : 'Copying'} files:`, {
      files: selectedFiles.map(f => f.name),
      destination,
      overwriteAction,
      preserveAttributes
    });

    // In a real app, this would trigger the actual operation
    onClose();
  };

  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog-content max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-macos-border-light dark:border-macos-border-dark">
          <div className="flex items-center gap-2">
            {isMove ? <Move size={20} /> : <Copy size={20} />}
            <h2 className="text-lg font-semibold">
              {isMove ? 'Move' : 'Copy'} Files
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-macos-bg-panel-light dark:hover:bg-macos-bg-panel-dark rounded"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* File list */}
          <div className="p-4 border-b border-macos-border-light dark:border-macos-border-dark">
            <div className="text-sm font-medium mb-2">
              {isMove ? 'Moving' : 'Copying'} {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}:
            </div>
            <div className="max-h-32 overflow-auto bg-macos-bg-panel-light dark:bg-macos-bg-panel-dark rounded p-2">
              {selectedFiles.map(file => (
                <div key={file.id} className="flex items-center gap-2 text-sm py-1">
                  <span>{file.isDirectory ? '📁' : '📄'}</span>
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
                    {file.isDirectory ? 'Folder' : formatSize(file.size)}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-xs text-macos-text-secondary-light dark:text-macos-text-secondary-dark mt-2">
              Total size: {formatSize(totalSize)}
            </div>
          </div>

          {/* Destination */}
          <div className="p-4 border-b border-macos-border-light dark:border-macos-border-dark">
            <label className="block text-sm font-medium mb-2">
              Destination:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="flex-1 px-3 py-2 border border-macos-border-light dark:border-macos-border-dark rounded focus-visible-ring bg-macos-bg-light dark:bg-macos-bg-dark"
                placeholder="Enter destination path..."
              />
              <button
                type="button"
                className="px-3 py-2 border border-macos-border-light dark:border-macos-border-dark rounded hover:bg-macos-bg-panel-light dark:hover:bg-macos-bg-panel-dark"
                title="Browse for destination"
              >
                <FolderOpen size={16} />
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="p-4 border-b border-macos-border-light dark:border-macos-border-dark space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                If file exists:
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="overwrite"
                    value="ask"
                    checked={overwriteAction === 'ask'}
                    onChange={(e) => setOverwriteAction(e.target.value as any)}
                    className="mr-2"
                  />
                  <span className="text-sm">Ask me what to do</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="overwrite"
                    value="overwrite"
                    checked={overwriteAction === 'overwrite'}
                    onChange={(e) => setOverwriteAction(e.target.value as any)}
                    className="mr-2"
                  />
                  <span className="text-sm">Overwrite existing files</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="overwrite"
                    value="skip"
                    checked={overwriteAction === 'skip'}
                    onChange={(e) => setOverwriteAction(e.target.value as any)}
                    className="mr-2"
                  />
                  <span className="text-sm">Skip existing files</span>
                </label>
              </div>
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preserveAttributes}
                onChange={(e) => setPreserveAttributes(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Preserve file attributes and timestamps</span>
            </label>
          </div>

          {/* Actions */}
          <div className="p-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-macos-border-light dark:border-macos-border-dark rounded hover:bg-macos-bg-panel-light dark:hover:bg-macos-bg-panel-dark"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-macos-blue text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={!destination.trim()}
            >
              {isMove ? 'Move' : 'Copy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CopyDialog;