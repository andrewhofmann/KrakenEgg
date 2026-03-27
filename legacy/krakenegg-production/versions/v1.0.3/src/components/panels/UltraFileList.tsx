import { useRef, useEffect, useMemo, useCallback } from 'react';
import { PanelState, FileInfo, ViewMode, SortBy, SortOrder } from '../../types';
import { sortFiles, filterFiles, formatFileSize, formatDate, getFolderNameFromPath } from '../../utils/fileUtils';
import { getFileExtension, getFileTypeDisplay, getCompactFileType } from '../../utils/formatters';
import { navigateToRealPath } from '../../data/realFiles';
import { getParentPath } from '../../utils/fileUtils';
import { isNavigableArchive } from '../../utils/archiveUtils';
import { Clock, HardDrive, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import FinderIcon from '../common/FinderIcons';
import logService from '../../services/logService';

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
  const focusedFileRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectionAnchorRef = useRef<string | null>(null);

  const filteredFiles = filterFiles(panel.files, '', panel.showHidden);
  const sortedFiles = sortFiles(filteredFiles, panel.sortBy, panel.sortOrder);

  // DEBUG: Log file data to understand rendering state
  console.log(`🔍 UltraFileList render - side: ${side}, panel.files.length: ${panel.files.length}, filteredFiles.length: ${filteredFiles.length}, sortedFiles.length: ${sortedFiles.length}`);
  console.log(`🔍 UltraFileList render - isActive: ${isActive}, panel.currentPath: ${panel.currentPath}`);
  if (sortedFiles.length > 0) {
    console.log(`🔍 First few files:`, sortedFiles.slice(0, 3).map(f => f.name));
  }

  // Simple scroll configuration
  const BRIEF_ITEM_HEIGHT = 24;
  const DETAILED_ITEM_HEIGHT = 32;
  const itemHeight = panel.viewMode === ViewMode.Brief ? BRIEF_ITEM_HEIGHT : DETAILED_ITEM_HEIGHT;

  // Single, unified scroll to focused file function
  const scrollToFocusedFile = useCallback((focusedFileId?: string, callerSource?: string) => {
    const targetFocusedFile = focusedFileId || panel.focusedFile;

    if (isActive && targetFocusedFile && containerRef.current) {
      const index = fileIndexMap.get(targetFocusedFile) ?? -1;

      if (index !== -1) {
        const container = containerRef.current;
        const targetScrollTop = index * itemHeight;
        const containerHeight = container.clientHeight;
        const currentScrollTop = container.scrollTop;


        // Check if item is visible
        const itemTop = targetScrollTop;
        const itemBottom = itemTop + itemHeight;
        const visibleTop = currentScrollTop;
        const visibleBottom = visibleTop + containerHeight;


        // Only scroll if item is not fully visible
        if (itemTop < visibleTop || itemBottom > visibleBottom) {
          let newScrollTop;

          if (itemTop < visibleTop) {
            // Item is above visible area - scroll up to show it at top
            newScrollTop = itemTop;
          } else {
            // Item is below visible area - scroll down to show it at bottom
            newScrollTop = itemBottom - containerHeight;
          }

          // Ensure we don't scroll past boundaries
          const maxScroll = Math.max(0, sortedFiles.length * itemHeight - containerHeight);
          newScrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));

          container.scrollTop = newScrollTop;
        } else {
        }
      } else {
      }
    } else {
    }
  }, [isActive, panel.focusedFile, sortedFiles, itemHeight, fileIndexMap]);

  // Auto-scroll to focused file when it changes via useEffect
  useEffect(() => {
    scrollToFocusedFile(undefined, 'useEffect');
  }, [scrollToFocusedFile]);

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

  // Create efficient file ID to index mapping
  const fileIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedFiles.forEach((file, index) => {
      map.set(file.id, index);
    });
    return map;
  }, [sortedFiles]);

  // High-performance keyboard navigation with throttled updates
  const keyNavigationThrottle = useRef<number | null>(null);
  const pendingIndexUpdate = useRef<number | null>(null);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {

    if (!isActive || sortedFiles.length === 0) {
      return;
    }

    const currentIndex = panel.focusedFile ? (fileIndexMap.get(panel.focusedFile) ?? -1) : -1;
    let newIndex = currentIndex;
    let handled = false;


    // Handle navigation keys with immediate feedback but throttled updates
    switch (event.key) {
      case 'ArrowUp':
        if (currentIndex > 0) {
          event.preventDefault();
          newIndex = currentIndex - 1;
          handled = true;
        }
        break;
      case 'ArrowDown':
        if (currentIndex < sortedFiles.length - 1) {
          event.preventDefault();
          newIndex = currentIndex + 1;
          handled = true;
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        handled = true;
        break;
      case 'End':
        event.preventDefault();
        newIndex = sortedFiles.length - 1;
        handled = true;
        break;
      case 'PageUp':
        event.preventDefault();
        // Jump up by visible items count (approximately 20 items)
        newIndex = Math.max(0, currentIndex - 20);
        handled = true;
        break;
      case 'PageDown':
        event.preventDefault();
        // Jump down by visible items count (approximately 20 items)
        newIndex = Math.min(sortedFiles.length - 1, currentIndex + 20);
        handled = true;
        break;
      case 'Enter':
        if (panel.focusedFile) {
          event.preventDefault();
          const focusedFile = sortedFiles.find(f => f.id === panel.focusedFile);
          if (focusedFile) {
            handleFileDoubleClick(focusedFile);
          }
        }
        return;
      default:
        return;
    }

    if (!handled) return;

    const newFocusedFile = sortedFiles[newIndex];
    const shiftPressed = event.shiftKey;

    // Direct state update without any animation delays
    if (shiftPressed) {
      // Start selection anchor if not set
      if (!selectionAnchorRef.current) {
        selectionAnchorRef.current = panel.focusedFile;
      }

      // Calculate selection range using fast index lookup
      const anchorIndex = selectionAnchorRef.current ?
        (fileIndexMap.get(selectionAnchorRef.current) ?? currentIndex) : currentIndex;
      const startIndex = Math.min(anchorIndex, newIndex);
      const endIndex = Math.max(anchorIndex, newIndex);

      // Select range
      const rangeFiles = sortedFiles.slice(startIndex, endIndex + 1);
      onUpdatePanel(panel => ({
        ...panel,
        selectedFiles: new Set(rangeFiles.map(f => f.id)),
        focusedFile: newFocusedFile.id
      }));
    } else {
      // Clear selection anchor and select only focused file
      selectionAnchorRef.current = null;
      onUpdatePanel(panel => ({
        ...panel,
        selectedFiles: new Set([newFocusedFile.id]),
        focusedFile: newFocusedFile.id
      }));
    }

    // Immediate scroll without any delay
    if (newFocusedFile) {
      scrollToFocusedFile(newFocusedFile.id, 'keyboard');
    }
  }, [isActive, sortedFiles, panel.focusedFile, onUpdatePanel, handleFileDoubleClick, itemHeight, scrollToFocusedFile, fileIndexMap]);

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

      const anchorIndex = fileIndexMap.get(selectionAnchorRef.current!) ?? -1;
      const clickedIndex = fileIndexMap.get(file.id) ?? -1;
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
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden ultra-scroll p-1 min-w-0 min-h-0"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
      data-testid="file-list"
    >
      {sortedFiles.map((file, index) => {
        // Ultra macOS 26 Sequoia alternating row colors with enhanced sophistication
        const isEven = index % 2 === 0;
        const zebraClass = isEven
          ? 'bg-mac26-bg-primary-light dark:bg-mac26-bg-primary-dark'
          : 'bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark';

        return (
          <div
            key={file.id}
            ref={panel.focusedFile === file.id ? focusedFileRef : undefined}
            className={`file-row flex items-center gap-2 px-2 py-0.5 rounded-md min-w-0 ${zebraClass} ${
              panel.selectedFiles.has(file.id) ? 'selected !bg-mac26-selection-light dark:!bg-mac26-selection-dark ring-1 ring-mac26-blue-500/20' : ''
            } ${
              panel.focusedFile === file.id && isActive ? 'focused !bg-mac26-blue-50 dark:!bg-mac26-blue-900/30 ring-2 ring-mac26-blue-500/40 shadow-mac26-glow' : ''
            } hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark transition-all duration-200 ease-out transform hover:scale-[1.002]`}
            style={{
              height: itemHeight
            }}
            onClick={(e) => handleFileClick(file, e)}
            onDoubleClick={() => handleFileDoubleClick(file)}
          >
            <div className="w-5 flex-shrink-0">
              <FinderIcon file={file} size="sm" />
            </div>
            <div className="flex-1 min-w-0 truncate">
              <span className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark" title={file.name}>
                {file.name}
              </span>
            </div>
            {!file.isDirectory && (
              <div className="w-12 flex-shrink-0 text-right">
                <span className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark font-light tabular-nums">
                  {formatFileSize(file.size)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderDetailedView = () => (
    <div className="flex flex-col h-full">
      {/* Column headers */}
      <div className="flex items-center bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark border-b border-mac26-border-primary-light dark:border-mac26-border-primary-dark px-2 py-1 text-xs font-medium text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark flex-shrink-0">
        <div className="w-6 flex-shrink-0"></div>
        <div className="flex-1 min-w-0">Name</div>
        <div className="w-14 flex-shrink-0 text-right">Size</div>
        <div className="w-24 flex-shrink-0 text-right">Modified</div>
        <div className="w-10 flex-shrink-0 text-center">Type</div>
      </div>

      {/* File rows */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden ultra-scroll min-h-0"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
        data-testid="file-list"
      >
        {sortedFiles.map((file, index) => (
          <div
            key={file.id}
            ref={panel.focusedFile === file.id ? focusedFileRef : undefined}
            className={`file-row flex items-center px-2 py-1 border-b border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark cursor-pointer ${
              panel.selectedFiles.has(file.id)
                ? 'bg-mac26-selection-light dark:bg-mac26-selection-dark'
                : 'hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark'
            } ${
              panel.focusedFile === file.id && isActive ? 'ring-1 ring-mac26-blue-500' : ''
            }`}
            onClick={(e) => handleFileClick(file, e)}
            onDoubleClick={() => handleFileDoubleClick(file)}
          >
            <div className="w-6 flex-shrink-0 text-center">
              <FinderIcon file={file} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm truncate block" title={file.name}>
                {file.name}
              </span>
            </div>
            <div className="w-14 flex-shrink-0 text-right text-xs">
              {file.isDirectory ? '-' : formatFileSize(file.size)}
            </div>
            <div className="w-24 flex-shrink-0 text-right text-xs whitespace-nowrap">
              {formatDate(file.modified)}
            </div>
            <div className="w-10 flex-shrink-0 text-center text-xs">
              {getCompactFileType(file)}
            </div>
          </div>
        ))}
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
      <div className="flex-1 flex items-center justify-center bg-mac26-bg-primary-light dark:bg-mac26-bg-primary-dark">
        <div className="text-center space-y-6 p-8 rounded-2xl bg-mac26-bg-panel-light dark:bg-mac26-bg-panel-dark backdrop-blur-xl border border-mac26-border-primary-light dark:border-mac26-border-primary-dark shadow-mac26-lg">
          <div className="text-7xl opacity-60 animate-bounce-subtle">
            📁
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
              This folder is empty
            </h3>
            <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark leading-relaxed">
              No files or folders to display in this location
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Auto-focus when panel becomes active
  useEffect(() => {
    if (isActive && containerRef.current) {
      console.log('🎯 Panel became active, focusing file list');
      console.log(`📊 Panel state: isActive=${isActive}, fileCount=${sortedFiles.length}, focusedFile=${panel.focusedFile}`);

      // Force focus on the container
      containerRef.current.focus();

      if (sortedFiles.length > 0 && !panel.focusedFile) {
        console.log('📁 Setting initial focused file:', sortedFiles[0].name);
        onUpdatePanel(panel => ({
          ...panel,
          focusedFile: sortedFiles[0].id
        }));
      }
    }
  }, [isActive, sortedFiles.length, panel.focusedFile, onUpdatePanel]);

  // Cleanup throttle on unmount
  useEffect(() => {
    return () => {
      if (keyNavigationThrottle.current) {
        cancelAnimationFrame(keyNavigationThrottle.current);
      }
    };
  }, []);

  return (
    <div
      className="flex-1 min-h-0 h-full bg-mac26-bg-primary-light dark:bg-mac26-bg-primary-dark outline-none relative"
      tabIndex={isActive ? 0 : -1}
      onKeyDown={handleKeyDown}
      onClick={() => {
        console.log('🖱️ File list clicked, focusing');
        if (isActive && containerRef.current) {
          containerRef.current.focus();
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