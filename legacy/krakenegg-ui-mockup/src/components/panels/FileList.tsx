import React, { useRef, useEffect } from 'react';
import { PanelState, FileInfo, ViewMode } from '../../types';
import { sortFiles, filterFiles, formatFileSize, formatDate, getFileIcon } from '../../utils/fileUtils';
import { generateMockFiles } from '../../data/mockFiles';
import { getParentPath } from '../../utils/fileUtils';

interface FileListProps {
  side: 'left' | 'right';
  panel: PanelState;
  isActive: boolean;
  onUpdatePanel: (updater: (panel: PanelState) => PanelState) => void;
  onShowDialog: (dialogId: string) => void;
}

const FileList: React.FC<FileListProps> = ({
  side,
  panel,
  isActive,
  onUpdatePanel,
  onShowDialog
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const focusedFileRef = useRef<HTMLDivElement>(null);

  const filteredFiles = filterFiles(panel.files, '', panel.showHidden);
  const sortedFiles = sortFiles(filteredFiles, panel.sortBy, panel.sortOrder);

  // Scroll focused file into view
  useEffect(() => {
    if (isActive && focusedFileRef.current) {
      focusedFileRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [panel.focusedFile, isActive]);

  const handleFileClick = (file: FileInfo, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      onUpdatePanel(panel => {
        const newSelected = new Set(panel.selectedFiles);
        if (newSelected.has(file.id)) {
          newSelected.delete(file.id);
        } else {
          newSelected.add(file.id);
        }
        return {
          ...panel,
          selectedFiles: newSelected,
          focusedFile: file.id
        };
      });
    } else if (event.shiftKey && panel.focusedFile) {
      // Range selection
      const focusedIndex = sortedFiles.findIndex(f => f.id === panel.focusedFile);
      const clickedIndex = sortedFiles.findIndex(f => f.id === file.id);
      const startIndex = Math.min(focusedIndex, clickedIndex);
      const endIndex = Math.max(focusedIndex, clickedIndex);

      const rangeFiles = sortedFiles.slice(startIndex, endIndex + 1);
      onUpdatePanel(panel => ({
        ...panel,
        selectedFiles: new Set([...panel.selectedFiles, ...rangeFiles.map(f => f.id)]),
        focusedFile: file.id
      }));
    } else {
      // Single selection
      onUpdatePanel(panel => ({
        ...panel,
        selectedFiles: new Set([file.id]),
        focusedFile: file.id
      }));
    }
  };

  const handleFileDoubleClick = (file: FileInfo) => {
    if (file.isDirectory) {
      if (file.name === '..') {
        const parentPath = getParentPath(panel.currentPath);
        const files = generateMockFiles(parentPath);
        onUpdatePanel(panel => ({
          ...panel,
          currentPath: parentPath,
          files,
          selectedFiles: new Set(),
          focusedFile: files.length > 0 ? files[0].id : null,
          history: [...panel.history.slice(0, panel.historyIndex + 1), parentPath],
          historyIndex: panel.historyIndex + 1
        }));
      } else {
        const newPath = panel.currentPath === '/'
          ? `/${file.name}`
          : `${panel.currentPath}/${file.name}`;
        const files = generateMockFiles(newPath);
        onUpdatePanel(panel => ({
          ...panel,
          currentPath: newPath,
          files,
          selectedFiles: new Set(),
          focusedFile: files.length > 0 ? files[0].id : null,
          history: [...panel.history.slice(0, panel.historyIndex + 1), newPath],
          historyIndex: panel.historyIndex + 1
        }));
      }
    } else {
      // Open file viewer
      onShowDialog('view');
    }
  };

  const handleContextMenu = (file: FileInfo, event: React.MouseEvent) => {
    event.preventDefault();

    // Select the file if not already selected
    if (!panel.selectedFiles.has(file.id)) {
      onUpdatePanel(panel => ({
        ...panel,
        selectedFiles: new Set([file.id]),
        focusedFile: file.id
      }));
    }

    // Show context menu (would be implemented as a dialog or menu)
    console.log('Context menu for:', file.name);
  };

  const renderBriefView = () => (
    <div className="p-2 space-y-1">
      {sortedFiles.map(file => (
        <div
          key={file.id}
          ref={panel.focusedFile === file.id ? focusedFileRef : undefined}
          className={`file-row flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${
            panel.selectedFiles.has(file.id) ? 'selected' : ''
          } ${
            panel.focusedFile === file.id && isActive ? 'focused' : ''
          }`}
          onClick={(e) => handleFileClick(file, e)}
          onDoubleClick={() => handleFileDoubleClick(file)}
          onContextMenu={(e) => handleContextMenu(file, e)}
        >
          <span className="text-lg">{getFileIcon(file)}</span>
          <span className="flex-1 truncate text-sm">{file.name}</span>
        </div>
      ))}
    </div>
  );

  const renderDetailedView = () => (
    <div className="flex flex-col">
      {/* Column headers */}
      <div className="flex items-center bg-macos-bg-panel-light dark:bg-macos-bg-panel-dark border-b border-macos-border-light dark:border-macos-border-dark px-2 py-1 text-xs font-medium text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
        <div className="w-8"></div>
        <div className="flex-1 min-w-0">Name</div>
        <div className="w-20 text-right">Size</div>
        <div className="w-32 text-right">Modified</div>
        <div className="w-16 text-center">Type</div>
      </div>

      {/* File rows */}
      <div className="flex-1 overflow-auto">
        {sortedFiles.map(file => (
          <div
            key={file.id}
            ref={panel.focusedFile === file.id ? focusedFileRef : undefined}
            className={`file-row flex items-center px-2 py-1 border-b border-macos-border-light dark:border-macos-border-dark cursor-pointer ${
              panel.selectedFiles.has(file.id) ? 'selected' : ''
            } ${
              panel.focusedFile === file.id && isActive ? 'focused' : ''
            }`}
            onClick={(e) => handleFileClick(file, e)}
            onDoubleClick={() => handleFileDoubleClick(file)}
            onContextMenu={(e) => handleContextMenu(file, e)}
          >
            <div className="w-8 text-center">
              <span className="text-lg">{getFileIcon(file)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm truncate block">{file.name}</span>
            </div>
            <div className="w-20 text-right text-xs text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
              {file.isDirectory ? '-' : formatFileSize(file.size)}
            </div>
            <div className="w-32 text-right text-xs text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
              {formatDate(file.modified)}
            </div>
            <div className="w-16 text-center text-xs text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
              {file.isDirectory ? 'Folder' : (file.extension || '').toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderThumbnailView = () => (
    <div className="p-2 grid grid-cols-auto-fill-96 gap-2">
      {sortedFiles.map(file => (
        <div
          key={file.id}
          ref={panel.focusedFile === file.id ? focusedFileRef : undefined}
          className={`file-row flex flex-col items-center p-2 rounded cursor-pointer ${
            panel.selectedFiles.has(file.id) ? 'selected' : ''
          } ${
            panel.focusedFile === file.id && isActive ? 'focused' : ''
          }`}
          onClick={(e) => handleFileClick(file, e)}
          onDoubleClick={() => handleFileDoubleClick(file)}
          onContextMenu={(e) => handleContextMenu(file, e)}
        >
          <div className="w-16 h-16 flex items-center justify-center bg-macos-bg-panel-light dark:bg-macos-bg-panel-dark rounded mb-2">
            <span className="text-3xl">{getFileIcon(file)}</span>
          </div>
          <span className="text-xs text-center truncate w-full">{file.name}</span>
          <span className="text-xs text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
            {file.isDirectory ? 'Folder' : formatFileSize(file.size)}
          </span>
        </div>
      ))}
    </div>
  );

  const renderFileList = () => {
    switch (panel.viewMode) {
      case ViewMode.Brief:
        return renderBriefView();
      case ViewMode.Detailed:
        return renderDetailedView();
      case ViewMode.Thumbnails:
        return renderThumbnailView();
      default:
        return renderDetailedView();
    }
  };

  return (
    <div
      ref={listRef}
      className="flex-1 overflow-auto bg-macos-bg-light dark:bg-macos-bg-dark"
      tabIndex={-1}
    >
      {sortedFiles.length === 0 ? (
        <div className="flex items-center justify-center h-full text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
          <div className="text-center">
            <div className="text-4xl mb-2">📁</div>
            <div className="text-sm">This folder is empty</div>
          </div>
        </div>
      ) : (
        renderFileList()
      )}
    </div>
  );
};

export default FileList;