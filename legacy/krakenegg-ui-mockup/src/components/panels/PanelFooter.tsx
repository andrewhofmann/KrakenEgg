import React from 'react';
import { PanelState } from '../../types';
import { getFileCount, getTotalSize, formatFileSize } from '../../utils/fileUtils';

interface PanelFooterProps {
  side: 'left' | 'right';
  panel: PanelState;
  onUpdatePanel: (updater: (panel: PanelState) => PanelState) => void;
}

const PanelFooter: React.FC<PanelFooterProps> = ({ side, panel, onUpdatePanel }) => {
  const { files, directories, total } = getFileCount(panel.files);
  const totalSize = getTotalSize(panel.files);
  const selectedCount = panel.selectedFiles.size;

  const selectedFiles = panel.files.filter(f => panel.selectedFiles.has(f.id));
  const selectedSize = getTotalSize(selectedFiles);

  return (
    <div className="panel-header border-t border-macos-border-light dark:border-macos-border-dark px-3 py-1 text-xs text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>
            {total} items
          </span>
          <span>
            {directories} folders
          </span>
          <span>
            {files} files
          </span>
          <span>
            {formatFileSize(totalSize)}
          </span>
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-macos-blue">
              {selectedCount} selected
            </span>
            <span className="text-macos-blue">
              {formatFileSize(selectedSize)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelFooter;