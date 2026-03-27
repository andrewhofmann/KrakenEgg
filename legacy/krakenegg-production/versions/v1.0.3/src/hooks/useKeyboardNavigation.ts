import { useCallback } from 'react';
import { AppState, PanelState } from '../types';
import { generateRealFiles } from '../data/realFiles';
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

  const navigateToPath = async (panelId: 'left' | 'right', path: string) => {
    const files = await generateRealFiles(path);
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

    // Simple file sorting - no caching for now
    const getSortedFiles = () => {
      const filteredFiles = filterFiles(activePanel.files, '', activePanel.showHidden);
      return sortFiles(filteredFiles, activePanel.sortBy, activePanel.sortOrder);
    };

    console.log('Keyboard action:', action);

    switch (action) {
      // Panel navigation
      case 'switchPanel':
        setAppState(prev => ({
          ...prev,
          activePanel: prev.activePanel === 'left' ? 'right' : 'left',
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
        setAppState(prev => {
          const leftPanelWithNewId = { ...prev.rightPanel, id: 'left' };
          const rightPanelWithNewId = { ...prev.leftPanel, id: 'right' };

          const updateTabIds = (panel: PanelState, newSide: 'left' | 'right') => ({
            ...panel,
            selectedFiles: new Set(),
            selectionAnchor: null,
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
      case 'navigateDown': {
        const sortedFiles = getSortedFiles();
        if (sortedFiles.length === 0) break;

        const currentIndex = activePanel.focusedFile
          ? sortedFiles.findIndex(f => f.id === activePanel.focusedFile)
          : -1;

        let newIndex;
        if (action === 'navigateUp') {
          newIndex = Math.max(0, currentIndex - 1);
        } else {
          newIndex = Math.min(sortedFiles.length - 1, currentIndex + 1);
        }

        if (newIndex !== currentIndex && sortedFiles[newIndex]) {
          updateActivePanel(panel => ({
            ...panel,
            focusedFile: sortedFiles[newIndex]?.id || null,
            selectedFiles: new Set(),
            selectionAnchor: null
          }));
        }
        break;
      }

      case 'enterDirectory': {
        const sortedFiles = getSortedFiles();
        const focusedFile = activePanel.focusedFile
          ? sortedFiles.find(f => f.id === activePanel.focusedFile)
          : null;

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
          const archivePath = focusedFile.path === '/'
            ? `/${focusedFile.name}`
            : `${focusedFile.path}/${focusedFile.name}`;
          navigateToPath(appState.activePanel, archivePath);
        } else if (focusedFile) {
          console.log(`Opening file "${focusedFile.name}" with associated application`);
          if (window.confirm(`Open "${focusedFile.name}" with its associated application?`)) {
            console.log(`File "${focusedFile.name}" would be opened with default application`);
          }
        }
        break;
      }

      case 'parentDirectory':
      case 'upOneLevel':
        navigateToPath(appState.activePanel, getParentPath(activePanel.currentPath));
        break;

      case 'back':
        if (activePanel.historyIndex > 0) {
          const newIndex = activePanel.historyIndex - 1;
          const path = activePanel.history[newIndex];
          generateRealFiles(path).then(files => {
            updateActivePanel(panel => ({
              ...panel,
              currentPath: path,
              files,
              selectedFiles: new Set(),
              focusedFile: files.length > 0 ? files[0].id : null,
              selectionAnchor: null,
              historyIndex: newIndex
            }));
          }).catch(error => {
            console.error('Failed to navigate back:', error);
          });
        }
        break;

      case 'forward':
        if (activePanel.historyIndex < activePanel.history.length - 1) {
          const newIndex = activePanel.historyIndex + 1;
          const path = activePanel.history[newIndex];
          generateRealFiles(path).then(files => {
            updateActivePanel(panel => ({
              ...panel,
              currentPath: path,
              files,
              selectedFiles: new Set(),
              focusedFile: files.length > 0 ? files[0].id : null,
              selectionAnchor: null,
              historyIndex: newIndex
            }));
          }).catch(error => {
            console.error('Failed to navigate forward:', error);
          });
        }
        break;

      // File selection
      case 'toggleSelection': {
        const sortedFiles = getSortedFiles();
        const focusedFile = activePanel.focusedFile
          ? sortedFiles.find(f => f.id === activePanel.focusedFile)
          : null;

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
              selectionAnchor: null
            };
          });
        }
        break;
      }

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

      case 'renameFile': {
        const sortedFiles = getSortedFiles();
        const focusedFile = activePanel.focusedFile
          ? sortedFiles.find(f => f.id === activePanel.focusedFile)
          : null;

        if (focusedFile) {
          setAppState(prev => ({ ...prev, activeDialog: 'rename' }));
        }
        break;
      }

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
      case 'view': {
        const sortedFiles = getSortedFiles();
        const focusedFile = activePanel.focusedFile
          ? sortedFiles.find(f => f.id === activePanel.focusedFile)
          : null;

        if (focusedFile && !focusedFile.isDirectory) {
          setAppState(prev => ({ ...prev, activeDialog: 'view' }));
        }
        break;
      }

      case 'edit': {
        const sortedFiles = getSortedFiles();
        const focusedFile = activePanel.focusedFile
          ? sortedFiles.find(f => f.id === activePanel.focusedFile)
          : null;

        if (focusedFile && !focusedFile.isDirectory) {
          setAppState(prev => ({ ...prev, activeDialog: 'edit' }));
        }
        break;
      }

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
        generateRealFiles(activePanel.currentPath).then(files => {
          updateActivePanel(panel => ({
            ...panel,
            files,
            selectedFiles: new Set(),
            focusedFile: files.length > 0 ? files[0].id : null,
            selectionAnchor: null
          }));
        }).catch(error => {
          console.error('Failed to refresh:', error);
        });
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
  }, []); // Empty dependency array - the function is stable

  return {
    handleKeyboardAction,
    navigateToPath,
    getActivePanel,
    getInactivePanel,
    updateActivePanel
  };
};