import { useCallback } from 'react';
import { AppState, PanelState } from '../types';
import { generateMockFiles } from '../data/mockFiles';
import { getParentPath, sortFiles, filterFiles } from '../utils/fileUtils';
import { isNavigableArchive, buildArchivePath } from '../utils/archiveUtils';

export const useKeyboardNavigation = (
  appState: AppState,
  setAppState: React.Dispatch<React.SetStateAction<AppState>>
) => {
  const getActivePanel = (): PanelState => {
    return appState.activePanel === 'left' ? appState.leftPanel : appState.rightPanel;
  };

  const getInactivePanel = (): PanelState => {
    return appState.activePanel === 'left' ? appState.rightPanel : appState.leftPanel;
  };

  const updateActivePanel = (updater: (panel: PanelState) => PanelState) => {
    const panelKey = appState.activePanel === 'left' ? 'leftPanel' : 'rightPanel';
    setAppState(prev => ({
      ...prev,
      [panelKey]: updater(prev[panelKey])
    }));
  };

  const navigateToPath = (panelId: 'left' | 'right', path: string) => {
    const files = generateMockFiles(path);
    const panelKey = panelId === 'left' ? 'leftPanel' : 'rightPanel';

    setAppState(prev => ({
      ...prev,
      [panelKey]: {
        ...prev[panelKey],
        currentPath: path,
        files,
        selectedFiles: new Set(),
        focusedFile: files.length > 0 ? files[0].id : null,
        selectionAnchor: null,
        history: [...prev[panelKey].history.slice(0, prev[panelKey].historyIndex + 1), path],
        historyIndex: prev[panelKey].historyIndex + 1
      }
    }));
  };

  const handleKeyboardAction = useCallback((action: string) => {
    const activePanel = getActivePanel();
    const filteredFiles = filterFiles(activePanel.files, '', activePanel.showHidden);
    const sortedFiles = sortFiles(filteredFiles, activePanel.sortBy, activePanel.sortOrder);
    const focusedFile = sortedFiles.find(f => f.id === activePanel.focusedFile);

    console.log('Keyboard action:', action, 'Focused file:', focusedFile?.name);

    switch (action) {
      // Panel navigation
      case 'switchPanel':
        setAppState(prev => ({
          ...prev,
          activePanel: prev.activePanel === 'left' ? 'right' : 'left',
          // Clear selections from both panels when switching
          leftPanel: {
            ...prev.leftPanel,
            selectedFiles: new Set(),
            selectionAnchor: null
          },
          rightPanel: {
            ...prev.rightPanel,
            selectedFiles: new Set(),
            selectionAnchor: null
          }
        }));
        break;

      case 'exchangeDirectories':
        // Swap the contents of the left and right panels (Ctrl+U)
        setAppState(prev => {
          // Update panel IDs to reflect their new positions
          const leftPanelWithNewId = { ...prev.rightPanel, id: 'left' };
          const rightPanelWithNewId = { ...prev.leftPanel, id: 'right' };

          // Update tab IDs to match new panel positions and clear selections
          const updateTabIds = (panel: PanelState, newSide: 'left' | 'right') => ({
            ...panel,
            selectedFiles: new Set(), // Clear selections when swapping panels
            selectionAnchor: null,    // Reset selection anchor
            tabs: panel.tabs.map(tab => ({
              ...tab,
              id: tab.id.replace(panel.id, newSide)
            })),
            activeTab: panel.activeTab.replace(panel.id, newSide)
          });

          return {
            ...prev,
            leftPanel: updateTabIds(leftPanelWithNewId, 'left'),
            rightPanel: updateTabIds(rightPanelWithNewId, 'right')
          };
        });
        break;

      // File navigation
      case 'navigateUp':
        if (sortedFiles.length > 0) {
          const currentIndex = sortedFiles.findIndex(f => f.id === activePanel.focusedFile);
          const newIndex = Math.max(0, currentIndex - 1);
          updateActivePanel(panel => ({
            ...panel,
            focusedFile: sortedFiles[newIndex]?.id || null,
            selectedFiles: new Set(), // Clear selection on normal navigation
            selectionAnchor: null // Reset anchor on normal navigation
          }));
        }
        break;

      case 'navigateDown':
        if (sortedFiles.length > 0) {
          const currentIndex = sortedFiles.findIndex(f => f.id === activePanel.focusedFile);
          const newIndex = Math.min(sortedFiles.length - 1, currentIndex + 1);
          updateActivePanel(panel => ({
            ...panel,
            focusedFile: sortedFiles[newIndex]?.id || null,
            selectedFiles: new Set(), // Clear selection on normal navigation
            selectionAnchor: null // Reset anchor on normal navigation
          }));
        }
        break;

      case 'enterDirectory':
        if (focusedFile?.isDirectory) {
          if (focusedFile.name === '..') {
            navigateToPath(appState.activePanel, getParentPath(activePanel.currentPath));
          } else {
            const newPath = activePanel.currentPath === '/'
              ? `/${focusedFile.name}`
              : `${activePanel.currentPath}/${focusedFile.name}`;
            navigateToPath(appState.activePanel, newPath);
          }
        } else if (focusedFile && isNavigableArchive(focusedFile)) {
          // Navigate into archive file
          const archivePath = focusedFile.path === '/'
            ? `/${focusedFile.name}`
            : `${focusedFile.path}/${focusedFile.name}`;
          navigateToPath(appState.activePanel, archivePath);
        } else if (focusedFile) {
          // Handle regular files - simulate opening with associated application
          console.log(`Opening file "${focusedFile.name}" with associated application`);

          // Show a temporary notification (you could replace this with actual file opening logic)
          if (window.confirm(`Open "${focusedFile.name}" with its associated application?`)) {
            // In a Tauri environment, this would be:
            // await invoke('open_file_with_default_app', { path: focusedFile.path });
            console.log(`File "${focusedFile.name}" would be opened with default application`);
          }
        }
        break;

      case 'parentDirectory':
      case 'upOneLevel':
        navigateToPath(appState.activePanel, getParentPath(activePanel.currentPath));
        break;

      case 'back':
        if (activePanel.historyIndex > 0) {
          const newIndex = activePanel.historyIndex - 1;
          const path = activePanel.history[newIndex];
          const files = generateMockFiles(path);
          updateActivePanel(panel => ({
            ...panel,
            currentPath: path,
            files,
            selectedFiles: new Set(),
            focusedFile: files.length > 0 ? files[0].id : null,
            selectionAnchor: null,
            historyIndex: newIndex
          }));
        }
        break;

      case 'forward':
        if (activePanel.historyIndex < activePanel.history.length - 1) {
          const newIndex = activePanel.historyIndex + 1;
          const path = activePanel.history[newIndex];
          const files = generateMockFiles(path);
          updateActivePanel(panel => ({
            ...panel,
            currentPath: path,
            files,
            selectedFiles: new Set(),
            focusedFile: files.length > 0 ? files[0].id : null,
            selectionAnchor: null,
            historyIndex: newIndex
          }));
        }
        break;

      // File selection
      case 'toggleSelection':
        if (focusedFile) {
          updateActivePanel(panel => {
            const newSelected = new Set(panel.selectedFiles);
            if (newSelected.has(focusedFile.id)) {
              newSelected.delete(focusedFile.id);
            } else {
              newSelected.add(focusedFile.id);
            }
            return {
              ...panel,
              selectedFiles: newSelected,
              selectionAnchor: null // Reset anchor when toggling individual files
            };
          });
        }
        break;

      case 'selectAll':
        updateActivePanel(panel => ({
          ...panel,
          selectedFiles: new Set(panel.files.filter(f => f.name !== '..').map(f => f.id)),
          selectionAnchor: null
        }));
        break;

      case 'deselectAll':
        updateActivePanel(panel => ({
          ...panel,
          selectedFiles: new Set(),
          selectionAnchor: null
        }));
        break;

      case 'invertSelection':
        updateActivePanel(panel => {
          const allFiles = new Set(panel.files.filter(f => f.name !== '..').map(f => f.id));
          const newSelected = new Set<string>();
          allFiles.forEach(fileId => {
            if (!panel.selectedFiles.has(fileId)) {
              newSelected.add(fileId);
            }
          });
          return { ...panel, selectedFiles: newSelected, selectionAnchor: null };
        });
        break;

      case 'extendSelectionDown':
        if (sortedFiles.length > 0) {
          const currentIndex = sortedFiles.findIndex(f => f.id === activePanel.focusedFile);
          const newIndex = Math.min(sortedFiles.length - 1, currentIndex + 1);
          const targetFile = sortedFiles[newIndex];

          if (targetFile && targetFile.id !== activePanel.focusedFile) {
            updateActivePanel(panel => {
              // Set anchor to current focused file if not set
              const anchor = panel.selectionAnchor || panel.focusedFile;
              const anchorIndex = anchor ? sortedFiles.findIndex(f => f.id === anchor) : currentIndex;

              // Clear existing selection and select range from anchor to new position
              const newSelected = new Set<string>();
              const startIndex = Math.min(anchorIndex, newIndex);
              const endIndex = Math.max(anchorIndex, newIndex);

              // Select all files in the range
              for (let i = startIndex; i <= endIndex; i++) {
                if (sortedFiles[i] && sortedFiles[i].name !== '..') {
                  newSelected.add(sortedFiles[i].id);
                }
              }

              return {
                ...panel,
                focusedFile: targetFile.id,
                selectedFiles: newSelected,
                selectionAnchor: anchor
              };
            });
          }
        }
        break;

      case 'extendSelectionUp':
        if (sortedFiles.length > 0) {
          const currentIndex = sortedFiles.findIndex(f => f.id === activePanel.focusedFile);
          const newIndex = Math.max(0, currentIndex - 1);
          const targetFile = sortedFiles[newIndex];

          if (targetFile && targetFile.id !== activePanel.focusedFile) {
            updateActivePanel(panel => {
              // Set anchor to current focused file if not set
              const anchor = panel.selectionAnchor || panel.focusedFile;
              const anchorIndex = anchor ? sortedFiles.findIndex(f => f.id === anchor) : currentIndex;

              // Clear existing selection and select range from anchor to new position
              const newSelected = new Set<string>();
              const startIndex = Math.min(anchorIndex, newIndex);
              const endIndex = Math.max(anchorIndex, newIndex);

              // Select all files in the range
              for (let i = startIndex; i <= endIndex; i++) {
                if (sortedFiles[i] && sortedFiles[i].name !== '..') {
                  newSelected.add(sortedFiles[i].id);
                }
              }

              return {
                ...panel,
                focusedFile: targetFile.id,
                selectedFiles: newSelected,
                selectionAnchor: anchor
              };
            });
          }
        }
        break;

      // File operations
      case 'copy':
        setAppState(prev => ({ ...prev, activeDialog: 'copy' }));
        break;

      case 'move':
        setAppState(prev => ({ ...prev, activeDialog: 'move' }));
        break;

      case 'delete':
        setAppState(prev => ({ ...prev, activeDialog: 'delete' }));
        break;

      case 'renameFile':
        if (focusedFile) {
          setAppState(prev => ({ ...prev, activeDialog: 'rename' }));
        }
        break;

      case 'createDirectory':
        setAppState(prev => ({ ...prev, activeDialog: 'createDirectory' }));
        break;

      case 'createFile':
        setAppState(prev => ({ ...prev, activeDialog: 'createFile' }));
        break;

      case 'multiRename':
        setAppState(prev => ({ ...prev, activeDialog: 'multiRename' }));
        break;

      // View operations
      case 'view':
        if (focusedFile && !focusedFile.isDirectory) {
          setAppState(prev => ({ ...prev, activeDialog: 'view' }));
        }
        break;

      case 'edit':
        if (focusedFile && !focusedFile.isDirectory) {
          setAppState(prev => ({ ...prev, activeDialog: 'edit' }));
        }
        break;

      // View modes
      case 'briefView':
        updateActivePanel(panel => ({ ...panel, viewMode: 'brief' as any }));
        break;

      case 'fullView':
      case 'fullDetails':
        updateActivePanel(panel => ({ ...panel, viewMode: 'detailed' as any }));
        break;

      case 'thumbnailView':
        updateActivePanel(panel => ({ ...panel, viewMode: 'thumbnails' as any }));
        break;

      // Sorting
      case 'sortByName':
        updateActivePanel(panel => ({ ...panel, sortBy: 'name' as any }));
        break;

      case 'sortBySize':
        updateActivePanel(panel => ({ ...panel, sortBy: 'size' as any }));
        break;

      case 'sortByDate':
        updateActivePanel(panel => ({ ...panel, sortBy: 'modified' as any }));
        break;

      case 'sortByExtension':
        updateActivePanel(panel => ({ ...panel, sortBy: 'extension' as any }));
        break;

      // Display options
      case 'showHidden':
        updateActivePanel(panel => ({ ...panel, showHidden: !panel.showHidden }));
        break;

      case 'refresh':
        const files = generateMockFiles(activePanel.currentPath);
        updateActivePanel(panel => ({
          ...panel,
          files,
          selectedFiles: new Set(),
          focusedFile: files.length > 0 ? files[0].id : null,
          selectionAnchor: null
        }));
        break;

      // Archive operations
      case 'packFiles':
        setAppState(prev => ({ ...prev, activeDialog: 'archive' }));
        break;

      case 'unpackFiles':
        setAppState(prev => ({ ...prev, activeDialog: 'extract' }));
        break;

      // Search
      case 'findFiles':
        setAppState(prev => ({ ...prev, activeDialog: 'search' }));
        break;

      case 'quickFilter':
        // This would open a quick filter input
        console.log('Quick filter not implemented in mockup');
        break;

      // Tools
      case 'help':
        setAppState(prev => ({ ...prev, activeDialog: 'keyboardHelp' }));
        break;

      case 'keyboardHelp':
        setAppState(prev => ({ ...prev, activeDialog: 'keyboardHelp' }));
        break;

      case 'commandPalette':
        setAppState(prev => ({ ...prev, activeDialog: 'commandPalette' }));
        break;

      case 'options':
        setAppState(prev => ({ ...prev, activeDialog: 'settings' }));
        break;

      case 'about':
        setAppState(prev => ({ ...prev, activeDialog: 'about' }));
        break;

      // Cancel/escape
      case 'cancel':
        if (appState.activeDialog) {
          setAppState(prev => ({ ...prev, activeDialog: null }));
        } else {
          // Clear selection if no dialog is open
          updateActivePanel(panel => ({
            ...panel,
            selectedFiles: new Set(),
            selectionAnchor: null
          }));
        }
        break;

      case 'exit':
        console.log('Exit application (mockup)');
        break;

      default:
        console.log('Unhandled keyboard action:', action);
    }
  }, [appState, setAppState]);

  return {
    handleKeyboardAction,
    navigateToPath,
    getActivePanel,
    getInactivePanel,
    updateActivePanel
  };
};