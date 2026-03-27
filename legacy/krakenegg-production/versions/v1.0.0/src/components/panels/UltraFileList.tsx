import { useRef, useEffect } from 'react';
import { PanelState, FileInfo, ViewMode, SortBy, SortOrder } from '../../types';
import { sortFiles, filterFiles, formatFileSize, formatDate, getFolderNameFromPath } from '../../utils/fileUtils';
import { navigateToRealPath } from '../../data/realFiles';
import { getParentPath } from '../../utils/fileUtils';
import { isNavigableArchive } from '../../utils/archiveUtils';
import { Clock, HardDrive, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import FinderIcon from '../common/FinderIcons';
import logService from '../../services/logService';
import { useVirtualScroll } from '../../hooks/useVirtualScroll';

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

  // Virtual scroll configuration
  const ITEM_HEIGHT = 24; // Height of each file row in pixels
  const CONTAINER_HEIGHT = 400; // Approximate height of file list container

  const { scrollToIndex, containerRef } = useVirtualScroll({
    itemHeight: ITEM_HEIGHT,
    containerHeight: CONTAINER_HEIGHT,
    totalItems: sortedFiles.length
  });

  const filteredFiles = filterFiles(panel.files, '', panel.showHidden);
  const sortedFiles = sortFiles(filteredFiles, panel.sortBy, panel.sortOrder);

  // Enhanced auto-scroll to focused file using virtual scroll hook
  useEffect(() => {
    if (isActive && panel.focusedFile && sortedFiles.length > 0) {
      console.log('🎯 Auto-scroll triggered for focused file:', panel.focusedFile);

      const currentIndex = sortedFiles.findIndex(f => f.id === panel.focusedFile);
      if (currentIndex !== -1) {
        console.log('📍 Found focused file at index:', currentIndex);
        // Use smooth scrolling for single navigation steps
        scrollToIndex(currentIndex, 'smooth');
      } else {
        console.log('⚠️ Focused file not found in sorted files list');
      }
    }
  }, [panel.focusedFile, isActive, sortedFiles, scrollToIndex]);

  const handleFileDoubleClick = async (file: FileInfo) => {
    console.log('🦑 UltraFileList handleFileDoubleClick:', file.name, 'isDirectory:', file.isDirectory);
    logService.logUserAction(`Double-clicked ${file.isDirectory ? 'directory' : 'file'}: ${file.name}`, {
      fileName: file.name,
      isDirectory: file.isDirectory,
      currentPath: panel.currentPath,
      side
    });

    if (file.isDirectory) {
      if (file.name === '..') {
        const parentPath = getParentPath(panel.currentPath);
        console.log('🦑 Navigating to parent directory:', parentPath);
        logService.logNavigation(panel.currentPath, parentPath);
        try {
          const files = await navigateToRealPath(parentPath);
          console.log('🦑 Parent navigation successful, got', files.length, 'files');
          logService.logNavigation(panel.currentPath, parentPath, true);

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
        } catch (error) {
          console.error('🦑 Failed to navigate to parent directory:', error);
          logService.logNavigation(panel.currentPath, parentPath, false);
          logService.logError(error instanceof Error ? error : new Error(String(error)), {
            component: 'UltraFileList',
            function: 'handleFileDoubleClick',
            operation: 'navigate_parent'
          });
          // Ensure the user can see the error
          alert(`Failed to navigate to parent directory: ${error instanceof Error ? error.message : error}`);
        }
      } else {
        const newPath = panel.currentPath === '/' ? `/${file.name}` : `${panel.currentPath}/${file.name}`;
        console.log('🦑 Navigating to directory:', newPath);
        logService.logNavigation(panel.currentPath, newPath);
        try {
          console.log('🦑 Calling navigateToRealPath with:', newPath);
          const files = await navigateToRealPath(newPath);
          console.log('🦑 Directory navigation successful, got', files.length, 'files:', files.map(f => f.name));
          logService.logNavigation(panel.currentPath, newPath, true);

          onUpdatePanel(panel => {
            const updatedTabs = panel.tabs.map(tab =>
              tab.id === panel.activeTab
                ? { ...tab, name: getFolderNameFromPath(newPath), path: newPath }
                : tab
            );

            const newState = {
              ...panel,
              currentPath: newPath,
              files,
              selectedFiles: new Set(),
              focusedFile: files.length > 0 ? files[0].id : null,
              tabs: updatedTabs,
              history: [...panel.history.slice(0, panel.historyIndex + 1), newPath],
              historyIndex: panel.historyIndex + 1
            };

            console.log('🦑 Updating panel state with', files.length, 'files');
            return newState;
          });
        } catch (error) {
          console.error('🦑 Failed to navigate to directory:', newPath, 'Error:', error);
          logService.logNavigation(panel.currentPath, newPath, false);
          logService.logError(error instanceof Error ? error : new Error(String(error)), {
            component: 'UltraFileList',
            function: 'handleFileDoubleClick',
            operation: 'navigate_directory',
            path: newPath
          });
          // Ensure the user can see the error
          alert(`Failed to navigate to directory "${file.name}": ${error instanceof Error ? error.message : error}`);
        }
      }
    } else if (isNavigableArchive(file)) {
      // TODO: Implement real archive navigation
      // For now, skip archive navigation
      console.log('🦑 Archive navigation not yet implemented for:', file.name);
      logService.logUserAction(`Attempted to navigate archive: ${file.name} (not implemented)`, { fileName: file.name });
    } else {
      // For files, simulate opening with associated application
      // In a real Tauri app, this would use a Tauri command to open with system default app
      // For now, we'll create a mock notification or console log
      console.log(`Opening file "${file.name}" with associated application`);
      logService.logUserAction(`Attempted to open file: ${file.name}`, { fileName: file.name });

      // Show a temporary notification (you could replace this with actual file opening logic)
      if (window.confirm(`Open "${file.name}" with its associated application?`)) {
        // In a Tauri environment, this would be:
        // await invoke('open_file_with_default_app', { path: file.path });
        console.log(`File "${file.name}" would be opened with default application`);
        logService.logUserAction(`Confirmed opening file: ${file.name}`, { fileName: file.name });
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
    } else if (event.key === 'PageUp') {
      event.preventDefault();
      const pageSize = Math.floor(CONTAINER_HEIGHT / ITEM_HEIGHT);
      newIndex = Math.max(0, currentIndex - pageSize);
    } else if (event.key === 'PageDown') {
      event.preventDefault();
      const pageSize = Math.floor(CONTAINER_HEIGHT / ITEM_HEIGHT);
      newIndex = Math.min(sortedFiles.length - 1, currentIndex + pageSize);
    } else if (event.key === 'Home') {
      event.preventDefault();
      newIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      newIndex = sortedFiles.length - 1;
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

    // Immediately scroll to the new index for responsive navigation
    const isLargeJump = Math.abs(newIndex - currentIndex) > 5;
    console.log('🚀 Keyboard navigation scroll:', {
      from: currentIndex,
      to: newIndex,
      isLargeJump,
      behavior: isLargeJump ? 'auto' : 'smooth'
    });
    scrollToIndex(newIndex, isLargeJump ? 'auto' : 'smooth');

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
              <span className="flex-1 min-w-0 truncate text-sm font-normal text-gray-900 dark:text-gray-100" title={file.name}>
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
                  <span className="text-sm font-normal text-gray-900 dark:text-gray-100 truncate block" title={file.name}>
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
      ref={(node) => {
        listRef.current = node;
        if (containerRef) {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      }}
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