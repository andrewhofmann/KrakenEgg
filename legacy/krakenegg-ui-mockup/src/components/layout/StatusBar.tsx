import React from 'react';
import { PanelState, FileOperation } from '../../types';
import { formatFileSize, getFileCount, getTotalSize } from '../../utils/fileUtils';

interface StatusBarProps {
  leftPanel: PanelState;
  rightPanel: PanelState;
  activePanel: 'left' | 'right';
  operations: FileOperation[];
}

const StatusBar: React.FC<StatusBarProps> = ({
  leftPanel,
  rightPanel,
  activePanel,
  operations
}) => {
  const currentPanel = activePanel === 'left' ? leftPanel : rightPanel;
  const { files, directories, total } = getFileCount(currentPanel.files);
  const selectedCount = currentPanel.selectedFiles.size;
  const totalSize = getTotalSize(currentPanel.files);
  const selectedFiles = currentPanel.files.filter(f => currentPanel.selectedFiles.has(f.id));
  const selectedSize = getTotalSize(selectedFiles);

  const runningOperations = operations.filter(op => op.status === 'running');

  return (
    <div className="status-bar px-4 py-1 flex items-center justify-between">
      <div className="flex items-center gap-6">
        {/* File count and size info */}
        <div className="flex items-center gap-4">
          <span>
            {total} items ({directories} folders, {files} files)
          </span>
          <span>
            Total: {formatFileSize(totalSize)}
          </span>
          {selectedCount > 0 && (
            <span className="text-macos-blue">
              {selectedCount} selected ({formatFileSize(selectedSize)})
            </span>
          )}
        </div>

        {/* Current panel indicator */}
        <div className="flex items-center gap-2">
          <span className="text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
            Active:
          </span>
          <span className="font-medium">
            {activePanel === 'left' ? 'Left' : 'Right'} Panel
          </span>
        </div>

        {/* Current path info */}
        <div className="flex items-center gap-2">
          <span className="text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
            Path:
          </span>
          <span className="font-mono text-sm">
            {currentPanel.currentPath}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Running operations */}
        {runningOperations.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-macos-green rounded-full animate-pulse" />
            <span>
              {runningOperations.length} operation{runningOperations.length !== 1 ? 's' : ''} running
            </span>
          </div>
        )}

        {/* View mode */}
        <div className="flex items-center gap-2">
          <span className="text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
            View:
          </span>
          <span className="capitalize">
            {currentPanel.viewMode}
          </span>
        </div>

        {/* Sort info */}
        <div className="flex items-center gap-2">
          <span className="text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
            Sort:
          </span>
          <span className="capitalize">
            {currentPanel.sortBy} {currentPanel.sortOrder === 'desc' ? '↓' : '↑'}
          </span>
        </div>

        {/* System info */}
        <div className="flex items-center gap-4 text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
          <span>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span>
            KrakenEgg v1.0.0
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;