import { useRef, useEffect } from 'react';
import { PanelState, FileInfo, ViewMode, SortBy, SortOrder } from '../../types';
import { sortFiles, filterFiles, formatFileSize, formatDate, getFolderNameFromPath } from '../../utils/fileUtils';
import { generateMockFiles } from '../../data/mockFiles';
import { getParentPath } from '../../utils/fileUtils';
import { isNavigableArchive } from '../../utils/archiveUtils';
import { Clock, HardDrive, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import FinderIcon from '../common/FinderIcons';

interface UltraFileListProps {
  side: 'left' | 'right';
  panel: PanelState;
  isActive: boolean;
  onUpdatePanel: (updater: (panel: PanelState) => PanelState) => void;
  onShowDialog: (dialogId: string) => void;
}

const UltraFileList = ({
  side,
  panel,
  isActive,
  onUpdatePanel,
  onShowDialog
}: UltraFileListProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const focusedFileRef = useRef<HTMLDivElement>(null);
  const selectionAnchorRef = useRef<string | null>(null);

  const filteredFiles = filterFiles(panel.files, '', panel.showHidden);
  const sortedFiles = sortFiles(filteredFiles, panel.sortBy, panel.sortOrder);

  // Ultra-smooth scroll to focused file with enhanced keyboard navigation support
  useEffect(() => {
    if (isActive && focusedFileRef.current && listRef.current) {
      // Use requestAnimationFrame to ensure DOM updates are complete
      requestAnimationFrame(() => {
        if (focusedFileRef.current) {
          const element = focusedFileRef.current;
          const container = listRef.current;

          if (container) {
            const elementRect = element.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // Check if element is outside visible area
            const isAboveViewport = elementRect.top < containerRect.top;
            const isBelowViewport = elementRect.bottom > containerRect.bottom;

            if (isAboveViewport || isBelowViewport) {
              // Element is outside viewport, use center alignment for better UX
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
              });
            } else {
              // Element is partially visible, use nearest for minimal scroll
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
              });
            }
          }
        }
      });
    }
  }, [panel.focusedFile, isActive]);

  const handleFileDoubleClick = (file: FileInfo) => {
    if (file.isDirectory) {
      if (file.name === '..') {
        const parentPath = getParentPath(panel.currentPath);
        const files = generateMockFiles(parentPath);
        onUpdatePanel(panel => {
          const updatedTabs = panel.tabs.map(tab =>
            tab.id === panel.activeTab
              ? { ...tab, name: getFolderNameFromPath(parentPath), path: parentPath }
              : tab
          );

          return {
            ...panel,
            currentPath: parentPath,
            files,
            selectedFiles: new Set(),
            focusedFile: files.length > 0 ? files[0].id : null,
            tabs: updatedTabs,
            history: [...panel.history.slice(0, panel.historyIndex + 1), parentPath],
            historyIndex: panel.historyIndex + 1
          };
        });
      } else {
        const newPath = panel.currentPath === '/' ? `/${file.name}` : `${panel.currentPath}/${file.name}`;
        const files = generateMockFiles(newPath);
        onUpdatePanel(panel => {
          const updatedTabs = panel.tabs.map(tab =>
            tab.id === panel.activeTab
              ? { ...tab, name: getFolderNameFromPath(newPath), path: newPath }
              : tab
          );

          return {
            ...panel,
            currentPath: newPath,
            files,
            selectedFiles: new Set(),
            focusedFile: files.length > 0 ? files[0].id : null,
            tabs: updatedTabs,
            history: [...panel.history.slice(0, panel.historyIndex + 1), newPath],
            historyIndex: panel.historyIndex + 1
          };
        });
      }
    } else if (isNavigableArchive(file)) {
      // Navigate into archive file
      const archivePath = file.path === '/' ? `/${file.name}` : `${file.path}/${file.name}`;
      const files = generateMockFiles(archivePath);
      onUpdatePanel(panel => {
        const updatedTabs = panel.tabs.map(tab =>
          tab.id === panel.activeTab
            ? { ...tab, name: `📦 ${file.name}`, path: archivePath }
            : tab
        );

        return {
          ...panel,
          currentPath: archivePath,
          files,
          selectedFiles: new Set(),
          focusedFile: files.length > 0 ? files[0].id : null,
          tabs: updatedTabs,
          history: [...panel.history.slice(0, panel.historyIndex + 1), archivePath],
          historyIndex: panel.historyIndex + 1
        };
      });
    } else {
      // For files, simulate opening with associated application
      // In a real Tauri app, this would use a Tauri command to open with system default app
      // For now, we'll create a mock notification or console log
      console.log(`Opening file "${file.name}" with associated application`);

      // Show a temporary notification (you could replace this with actual file opening logic)
      if (window.confirm(`Open "${file.name}" with its associated application?`)) {
        // In a Tauri environment, this would be:
        // await invoke('open_file_with_default_app', { path: file.path });
        console.log(`File "${file.name}" would be opened with default application`);
      }
    }
  };

  // Keyboard navigation with shift selection
  const handleKeyDown = (event: React.KeyboardEvent) => {
    console.log('🔥 Key event:', event.key, 'shift:', event.shiftKey, 'target:', event.target, 'active:', isActive);

    if (!isActive || sortedFiles.length === 0) {
      console.log('❌ Not handling - isActive:', isActive, 'files:', sortedFiles.length);
      return;
    }

    const currentIndex = panel.focusedFile ? sortedFiles.findIndex(f => f.id === panel.focusedFile) : -1;
    let newIndex = currentIndex;

    if (event.key === 'ArrowUp' && currentIndex > 0) {
      event.preventDefault();
      newIndex = currentIndex - 1;
    } else if (event.key === 'ArrowDown' && currentIndex < sortedFiles.length - 1) {
      event.preventDefault();
      newIndex = currentIndex + 1;
    } else if (event.key === 'Enter' && panel.focusedFile) {
      event.preventDefault();
      // Handle Enter key - same as double-click behavior
      const focusedFile = sortedFiles.find(f => f.id === panel.focusedFile);
      if (focusedFile) {
        handleFileDoubleClick(focusedFile);
      }
      return;
    } else {
      return;
    }

    const newFocusedFile = sortedFiles[newIndex];

    if (event.shiftKey) {
      console.log('✅ SHIFT selection mode');
      // Start selection anchor if not set
      if (!selectionAnchorRef.current) {
        selectionAnchorRef.current = panel.focusedFile;
        console.log('🎯 Set anchor:', selectionAnchorRef.current);
      }

      // Calculate selection range
      const anchorIndex = selectionAnchorRef.current ?
        sortedFiles.findIndex(f => f.id === selectionAnchorRef.current) : currentIndex;
      const startIndex = Math.min(anchorIndex, newIndex);
      const endIndex = Math.max(anchorIndex, newIndex);

      console.log('📏 Range:', startIndex, 'to', endIndex, 'anchor at:', anchorIndex);

      // Select range
      const rangeFiles = sortedFiles.slice(startIndex, endIndex + 1);
      console.log('📁 Selecting files:', rangeFiles.map(f => f.name));
      onUpdatePanel(panel => ({
        ...panel,
        selectedFiles: new Set(rangeFiles.map(f => f.id)),
        focusedFile: newFocusedFile.id
      }));
    } else {
      console.log('🔄 Single selection mode - clearing anchor');
      // Clear selection anchor and select only focused file
      selectionAnchorRef.current = null;
      onUpdatePanel(panel => ({
        ...panel,
        selectedFiles: new Set([newFocusedFile.id]),
        focusedFile: newFocusedFile.id
      }));
    }
  };

  const handleFileClick = (file: FileInfo, event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey) {
      // Toggle selection and reset anchor
      selectionAnchorRef.current = null;
      onUpdatePanel(panel => {
        const newSelected = new Set(panel.selectedFiles);
        if (newSelected.has(file.id)) {
          newSelected.delete(file.id);
        } else {
          newSelected.add(file.id);
        }
        return { ...panel, selectedFiles: newSelected, focusedFile: file.id };
      });
    } else if (event.shiftKey && panel.focusedFile) {
      // Range selection - set anchor if not set
      if (!selectionAnchorRef.current) {
        selectionAnchorRef.current = panel.focusedFile;
      }

      const anchorIndex = sortedFiles.findIndex(f => f.id === selectionAnchorRef.current);
      const clickedIndex = sortedFiles.findIndex(f => f.id === file.id);
      const startIndex = Math.min(anchorIndex, clickedIndex);
      const endIndex = Math.max(anchorIndex, clickedIndex);

      const rangeFiles = sortedFiles.slice(startIndex, endIndex + 1);
      onUpdatePanel(panel => ({
        ...panel,
        selectedFiles: new Set(rangeFiles.map(f => f.id)),
        focusedFile: file.id
      }));
    } else {
      // Single selection - reset anchor
      selectionAnchorRef.current = null;
      onUpdatePanel(panel => {
        // If the file is already selected and it's the only selection, deselect it
        if (panel.selectedFiles.has(file.id) && panel.selectedFiles.size === 1) {
          return {
            ...panel,
            selectedFiles: new Set(),
            focusedFile: file.id
          };
        } else {
          // Otherwise, select only this file
          return {
            ...panel,
            selectedFiles: new Set([file.id]),
            focusedFile: file.id
          };
        }
      });
    }
  };

  const handleColumnSort = (sortBy: SortBy) => {
    onUpdatePanel(panel => ({
      ...panel,
      sortBy,
      sortOrder: panel.sortBy === sortBy && panel.sortOrder === SortOrder.Ascending
        ? SortOrder.Descending
        : SortOrder.Ascending
    }));
  };

  const renderBriefView = () => (
    <div className="p-1">
      {sortedFiles.map((file, index) => {
          // macOS 26 Sequoia alternating row colors
          const isEven = index % 2 === 0;
          const zebraClass = isEven
            ? 'bg-white dark:bg-[#1e1e1e]'
            : 'bg-[#f7f7f7] dark:bg-[#252525]';

          return (
            <div
              key={file.id}
              ref={panel.focusedFile === file.id ? focusedFileRef : undefined}
              className={`file-row flex items-center gap-2 px-2 py-0.5 rounded ${zebraClass} ${
                panel.selectedFiles.has(file.id) ? 'selected !bg-blue-100 dark:!bg-blue-900' : ''
              } ${
                panel.focusedFile === file.id && isActive ? 'focused !bg-blue-200 dark:!bg-blue-800' : ''
              } hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-100`}
              onClick={(e) => handleFileClick(file, e)}
              onDoubleClick={() => handleFileDoubleClick(file)}
            >
              <FinderIcon file={file} size="sm" />
              <span className="flex-1 truncate text-sm font-normal text-gray-900 dark:text-gray-100">
                {file.name}
              </span>
            </div>
          );
        })}
    </div>
  );

  const renderDetailedView = () => (
    <div className="flex flex-col h-full">
      {/* Finder-style column headers */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
        <div className="w-4 flex items-center justify-center mr-2">
          <FileText size={10} />
        </div>

        <button
          className="flex-1 min-w-0 flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-100 transition-colors cursor-pointer text-left"
          onClick={() => handleColumnSort(SortBy.Name)}
        >
          <span>Name</span>
          {panel.sortBy === SortBy.Name && (
            panel.sortOrder === SortOrder.Ascending ?
            <ChevronUp size={8} /> :
            <ChevronDown size={8} />
          )}
        </button>

        <button
          className="w-16 text-right flex items-center justify-end gap-1 hover:text-gray-800 dark:hover:text-gray-100 transition-colors cursor-pointer"
          onClick={() => handleColumnSort(SortBy.Size)}
        >
          <HardDrive size={8} />
          <span>Size</span>
          {panel.sortBy === SortBy.Size && (
            panel.sortOrder === SortOrder.Ascending ?
            <ChevronUp size={8} /> :
            <ChevronDown size={8} />
          )}
        </button>

        <button
          className="w-24 text-right flex items-center justify-end gap-1 hover:text-gray-800 dark:hover:text-gray-100 transition-colors cursor-pointer ml-4"
          onClick={() => handleColumnSort(SortBy.Modified)}
        >
          <Clock size={8} />
          <span>Modified</span>
          {panel.sortBy === SortBy.Modified && (
            panel.sortOrder === SortOrder.Ascending ?
            <ChevronUp size={8} /> :
            <ChevronDown size={8} />
          )}
        </button>

        <button
          className="w-12 text-center hover:text-gray-800 dark:hover:text-gray-100 transition-colors cursor-pointer flex items-center justify-center gap-1 ml-2"
          onClick={() => handleColumnSort(SortBy.Type)}
        >
          <span>Type</span>
          {panel.sortBy === SortBy.Type && (
            panel.sortOrder === SortOrder.Ascending ?
            <ChevronUp size={8} /> :
            <ChevronDown size={8} />
          )}
        </button>
      </div>

      {/* Ultra-smooth file rows */}
      <div className="flex-1 overflow-auto ultra-scroll">
        {sortedFiles.map((file, index) => {
            // macOS 26 Sequoia alternating row colors (zebra striping)
            const isEven = index % 2 === 0;
            const zebraClass = isEven
              ? 'bg-white dark:bg-[#1e1e1e]'
              : 'bg-[#f7f7f7] dark:bg-[#252525]';

            return (
              <div
                key={file.id}
                ref={panel.focusedFile === file.id ? focusedFileRef : undefined}
                className={`file-row flex items-center border-b border-transparent px-2 py-1 ${zebraClass} ${
                  panel.selectedFiles.has(file.id) ? 'selected !bg-blue-100 dark:!bg-blue-900' : ''
                } ${
                  panel.focusedFile === file.id && isActive ? 'focused !bg-blue-200 dark:!bg-blue-800' : ''
                } hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-100`}
                onClick={(e) => handleFileClick(file, e)}
                onDoubleClick={() => handleFileDoubleClick(file)}
              >
                <div className="w-4 flex items-center justify-center mr-2">
                  <FinderIcon file={file} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-normal text-gray-900 dark:text-gray-100 truncate block">
                    {file.name}
                  </span>
                </div>
                <div className="w-16 text-right text-xs text-gray-500 dark:text-gray-400 font-normal tabular-nums">
                  {file.isDirectory ? '—' : formatFileSize(file.size)}
                </div>
                <div className="w-24 text-right text-xs text-gray-500 dark:text-gray-400 font-normal tabular-nums ml-4">
                  {formatDate(file.modified)}
                </div>
                <div className="w-12 text-center ml-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">
                    {file.isDirectory ? '—' :
                      (() => {
                        const ext = (file.extension || '').toUpperCase();
                        return ext.length > 4 ? ext.substring(0, 4) : ext;
                      })()
                    }
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  const renderFileList = () => {
    switch (panel.viewMode) {
      case ViewMode.Brief:
        return renderBriefView();
      case ViewMode.Detailed:
        return renderDetailedView();
      default:
        return renderDetailedView();
    }
  };

  if (sortedFiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">
            📁
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
              This folder is empty
            </h3>
            <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
              No files or folders to display
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Auto-focus when panel becomes active
  useEffect(() => {
    if (isActive && listRef.current) {
      console.log('🎯 Panel became active, focusing file list');
      listRef.current.focus();
      if (sortedFiles.length > 0 && !panel.focusedFile) {
        console.log('📁 Setting initial focused file:', sortedFiles[0].name);
        onUpdatePanel(panel => ({
          ...panel,
          focusedFile: sortedFiles[0].id
        }));
      }
    }
  }, [isActive, sortedFiles.length, panel.focusedFile, onUpdatePanel]);

  return (
    <div
      ref={listRef}
      className="flex-1 overflow-auto ultra-scroll bg-mac26-bg-primary-light dark:bg-mac26-bg-primary-dark outline-none"
      tabIndex={isActive ? 0 : -1}
      onKeyDown={handleKeyDown}
      onClick={() => {
        console.log('🖱️ File list clicked, focusing');
        if (isActive && listRef.current) {
          listRef.current.focus();
        }
      }}
      onFocus={() => {
        console.log('🎯 File list received focus');
        if (isActive && sortedFiles.length > 0 && !panel.focusedFile) {
          // Set focus to first file if none is focused
          onUpdatePanel(panel => ({
            ...panel,
            focusedFile: sortedFiles[0].id
          }));
        }
      }}
    >
      {renderFileList()}
    </div>
  );
};

export default UltraFileList;