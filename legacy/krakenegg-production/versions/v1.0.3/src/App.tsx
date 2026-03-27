import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppState, Theme, ViewMode, SortBy, SortOrder, PanelState } from './types';
import { navigateToRealPath } from './data/realFiles';
import { defaultKeyboardShortcuts } from './data/keyboardShortcuts';
import { getFolderNameFromPath } from './utils/fileUtils';

// Ultra-modern components
import UltraToolbar from './components/layout/UltraToolbar';
import UltraFilePanel from './components/panels/UltraFilePanel';
import UltraStatusBar from './components/layout/UltraStatusBar';
import UltraFunctionKeyBar from './components/layout/UltraFunctionKeyBar';
import UltraDialogManager from './components/dialogs/UltraDialogManager';
import KeyboardHandler from './components/common/KeyboardHandler';
// import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'; // Temporarily disabled

const createInitialPanelState = async (side: 'left' | 'right'): Promise<PanelState> => {
  const initialPath = side === 'left' ? '/Users/andrew' : '/Users/andrew/Documents';

  try {
    const files = await navigateToRealPath(initialPath);

    return {
      id: side,
      currentPath: initialPath,
      files,
      selectedFiles: new Set(),
      focusedFile: files.length > 0 ? files[0].id : null,
      selectionAnchor: null,
      viewMode: ViewMode.Detailed,
      sortBy: SortBy.Name,
      sortOrder: SortOrder.Ascending,
      showHidden: false,
      tabs: [
        {
          id: `${side}-tab-1`,
          name: getFolderNameFromPath(initialPath),
          path: initialPath,
          isActive: true
        }
      ],
      activeTab: `${side}-tab-1`,
      history: [initialPath],
      historyIndex: 0
    };
  } catch (error) {
    console.error(`Failed to initialize ${side} panel:`, error);
    return {
      id: side,
      currentPath: initialPath,
      files: [],
      selectedFiles: new Set(),
      focusedFile: null,
      selectionAnchor: null,
      viewMode: ViewMode.Detailed,
      sortBy: SortBy.Name,
      sortOrder: SortOrder.Ascending,
      showHidden: false,
      tabs: [
        {
          id: `${side}-tab-1`,
          name: getFolderNameFromPath(initialPath),
          path: initialPath,
          isActive: true
        }
      ],
      activeTab: `${side}-tab-1`,
      history: [initialPath],
      historyIndex: 0
    };
  }
};

function App() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverPanel, setDragOverPanel] = useState<'left' | 'right' | null>(null);
  const [dragSource, setDragSource] = useState<'left' | 'right' | null>(null);

  // Initialize app with real file data
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing KrakenEgg with real file system');

      try {
        const [leftPanel, rightPanel] = await Promise.all([
          createInitialPanelState('left'),
          createInitialPanelState('right')
        ]);

        console.log('✅ Panel states created successfully');

        setAppState({
          leftPanel,
          rightPanel,
          activePanel: 'left',
          theme: Theme.Light,
          showCommandLine: false,
          showStatusBar: true,
          activeDialog: null,
          operations: [],
          keyboardShortcuts: defaultKeyboardShortcuts
        });

        console.log('🎉 KrakenEgg initialization complete!');
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Initialization failed:', error);
        // Provide fallback state to prevent blank screen
        setAppState({
          leftPanel: {
            id: 'left',
            currentPath: '/Users/andrew',
            files: [],
            selectedFiles: new Set(),
            focusedFile: null,
            selectionAnchor: null,
            viewMode: ViewMode.Detailed,
            sortBy: SortBy.Name,
            sortOrder: SortOrder.Ascending,
            showHidden: false,
            tabs: [{
              id: 'left-tab-1',
              name: 'andrew',
              path: '/Users/andrew',
              isActive: true
            }],
            activeTab: 'left-tab-1',
            history: ['/Users/andrew'],
            historyIndex: 0
          },
          rightPanel: {
            id: 'right',
            currentPath: '/Users/andrew/Documents',
            files: [],
            selectedFiles: new Set(),
            focusedFile: null,
            selectionAnchor: null,
            viewMode: ViewMode.Detailed,
            sortBy: SortBy.Name,
            sortOrder: SortOrder.Ascending,
            showHidden: false,
            tabs: [{
              id: 'right-tab-1',
              name: 'Documents',
              path: '/Users/andrew/Documents',
              isActive: true
            }],
            activeTab: 'right-tab-1',
            history: ['/Users/andrew/Documents'],
            historyIndex: 0
          },
          activePanel: 'left',
          theme: Theme.Light,
          showCommandLine: false,
          showStatusBar: true,
          activeDialog: null,
          operations: [],
          keyboardShortcuts: defaultKeyboardShortcuts
        });
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Theme application
  useEffect(() => {
    if (!appState) return;
    const isDark = appState.theme === Theme.Dark;
    document.documentElement.classList.toggle('dark', isDark);
    document.body.classList.toggle('dark', isDark);
  }, [appState?.theme]);

  // Keyboard navigation - temporarily disabled to debug blank screen
  const keyboardHandlers = {
    handleKeyboardAction: (action: string) => {
      console.log('Keyboard action:', action);
    }
  };

  const updatePanelState = (panelId: 'left' | 'right', updater: (panel: PanelState) => PanelState) => {
    setAppState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [panelId === 'left' ? 'leftPanel' : 'rightPanel']: updater(prev[panelId === 'left' ? 'leftPanel' : 'rightPanel'])
      };
    });
  };

  const switchActivePanel = () => {
    setAppState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        activePanel: prev.activePanel === 'left' ? 'right' : 'left'
      };
    });
  };

  const swapPanels = () => {
    setAppState(prev => {
      if (!prev) return prev;

      const leftPanelWithNewId = { ...prev.rightPanel, id: 'left' };
      const rightPanelWithNewId = { ...prev.leftPanel, id: 'right' };

      const updateTabIds = (panel: PanelState, newSide: 'left' | 'right') => ({
        ...panel,
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
  };

  const showDialog = (dialogId: string) => {
    setAppState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        activeDialog: dialogId
      };
    });
  };

  const closeDialog = () => {
    setAppState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        activeDialog: null
      };
    });
  };

  const toggleTheme = () => {
    setAppState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        theme: prev.theme === Theme.Light ? Theme.Dark : Theme.Light
      };
    });
  };

  const handleFunctionKeyPress = (functionKey: string, modifiers: string[]) => {
    console.log(`Function key pressed: ${functionKey} with modifiers: ${modifiers.join('+')}`);

    // Map function key + modifiers to keyboard shortcut action
    let shortcutKey = functionKey;
    if (modifiers.includes('shift')) {
      shortcutKey = `Shift+${functionKey}`;
    } else if (modifiers.includes('ctrl')) {
      shortcutKey = `Ctrl+${functionKey}`;
    } else if (modifiers.includes('cmd')) {
      shortcutKey = `Cmd+${functionKey}`;
    } else if (modifiers.includes('option')) {
      shortcutKey = `Alt+${functionKey}`;
    }

    // Find the corresponding keyboard shortcut action
    const shortcut = appState.keyboardShortcuts[shortcutKey];
    if (shortcut) {
      keyboardHandlers.handleKeyboardAction(shortcut.action);
    }
  };

  // Drag handlers
  const handleDragStart = (panelSide: 'left' | 'right') => {
    setIsDragging(true);
    setDragSource(panelSide);
  };

  const handleDragEnd = () => {
    if (dragOverPanel && isDragging && dragSource && dragOverPanel !== dragSource) {
      swapPanels();
    }
    setIsDragging(false);
    setDragOverPanel(null);
    setDragSource(null);
  };

  const handleDragEnter = (panelSide: 'left' | 'right') => {
    if (isDragging) {
      setDragOverPanel(panelSide);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeavingDropZone =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;

    if (isLeavingDropZone) {
      setDragOverPanel(null);
    }
  };

  // Loading screen - Temporarily bypass for debugging
  if (false) { // Temporarily force skip loading screen
    return (
      <motion.div
        className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="text-center space-y-8">
          <motion.div
            className="text-8xl filter drop-shadow-2xl"
            initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOutBack" }}
          >
            🦑
          </motion.div>
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <h1 className="text-4xl font-thin bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              KrakenEgg
            </h1>
            <p className="text-slate-400 text-lg font-light">Ultra File Manager</p>
            <p className="text-slate-500 text-sm">Loading real file system...</p>
          </motion.div>
          <motion.div
            className="w-48 h-1.5 bg-slate-700 rounded-full overflow-hidden mx-auto shadow-inner"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full shadow-lg"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 1, duration: 1.2, ease: 'easeInOut' }}
            />
          </motion.div>
          <motion.div
            className="text-slate-500 text-xs font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            v1.0.3 • Initializing...
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Force use fallback state if appState is not available
  const currentAppState = appState || {
    leftPanel: {
      id: 'left',
      currentPath: '/Users/andrew',
      files: [],
      selectedFiles: new Set(),
      focusedFile: null,
      selectionAnchor: null,
      viewMode: ViewMode.Detailed,
      sortBy: SortBy.Name,
      sortOrder: SortOrder.Ascending,
      showHidden: false,
      tabs: [{
        id: 'left-tab-1',
        name: 'andrew',
        path: '/Users/andrew',
        isActive: true
      }],
      activeTab: 'left-tab-1',
      history: ['/Users/andrew'],
      historyIndex: 0
    },
    rightPanel: {
      id: 'right',
      currentPath: '/Users/andrew/Documents',
      files: [],
      selectedFiles: new Set(),
      focusedFile: null,
      selectionAnchor: null,
      viewMode: ViewMode.Detailed,
      sortBy: SortBy.Name,
      sortOrder: SortOrder.Ascending,
      showHidden: false,
      tabs: [{
        id: 'right-tab-1',
        name: 'Documents',
        path: '/Users/andrew/Documents',
        isActive: true
      }],
      activeTab: 'right-tab-1',
      history: ['/Users/andrew/Documents'],
      historyIndex: 0
    },
    activePanel: 'left' as const,
    theme: Theme.Light,
    showCommandLine: false,
    showStatusBar: true,
    activeDialog: null,
    operations: [],
    keyboardShortcuts: defaultKeyboardShortcuts
  };

  return (
    <motion.div
      className="h-screen flex flex-col bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 text-slate-800 overflow-hidden"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <KeyboardHandler
        shortcuts={currentAppState.keyboardShortcuts}
        onKeyboardAction={keyboardHandlers.handleKeyboardAction}
      />

      <UltraToolbar
        onShowDialog={showDialog}
        appState={currentAppState}
        onToggleTheme={toggleTheme}
        theme={currentAppState.theme}
      />

      {/* Main content area - account for status bar + F-key bar height (40px) */}
      <div className="flex-1 flex min-h-0 relative pb-10">
        <div className="w-full flex min-h-0">
          <div
            className={`w-1/2 min-w-0 ${dragOverPanel === 'left' && isDragging ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}`}
            style={{ width: 'calc(50% - 2px)' }}
            onDragEnter={() => handleDragEnter('left')}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleDragEnd();
            }}
          >
            <UltraFilePanel
              side="left"
              panel={currentAppState.leftPanel}
              isActive={currentAppState.activePanel === 'left'}
              onUpdatePanel={(updater) => updatePanelState('left', updater)}
              onSwitchPanel={switchActivePanel}
              onShowDialog={showDialog}
              onDragStart={() => handleDragStart('left')}
              onDragEnd={handleDragEnd}
              isDragging={isDragging}
              isDragTarget={dragOverPanel === 'left'}
            />
          </div>

          <div className="w-1 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200 flex-shrink-0 relative">
            <div className="absolute inset-y-0 left-0 w-px bg-slate-400 opacity-50"></div>
            <div className="absolute inset-y-0 right-0 w-px bg-white opacity-80"></div>
          </div>

          <div
            className={`w-1/2 min-w-0 ${dragOverPanel === 'right' && isDragging ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}`}
            style={{ width: 'calc(50% - 2px)' }}
            onDragEnter={() => handleDragEnter('right')}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleDragEnd();
            }}
          >
            <UltraFilePanel
              side="right"
              panel={currentAppState.rightPanel}
              isActive={currentAppState.activePanel === 'right'}
              onUpdatePanel={(updater) => updatePanelState('right', updater)}
              onSwitchPanel={switchActivePanel}
              onShowDialog={showDialog}
              onDragStart={() => handleDragStart('right')}
              onDragEnd={handleDragEnd}
              isDragging={isDragging}
              isDragTarget={dragOverPanel === 'right'}
            />
          </div>
        </div>
      </div>

      {currentAppState.showStatusBar && (
        <motion.div
          className="fixed bottom-6 left-0 right-0 z-40"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <UltraStatusBar
            leftPanel={currentAppState.leftPanel}
            rightPanel={currentAppState.rightPanel}
            activePanel={currentAppState.activePanel}
            operations={currentAppState.operations}
          />
        </motion.div>
      )}

      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <UltraFunctionKeyBar onFunctionKeyPress={handleFunctionKeyPress} />
      </motion.div>

      <UltraDialogManager
        activeDialog={currentAppState.activeDialog}
        onCloseDialog={closeDialog}
        dialogData={{
          files: currentAppState.activePanel === 'left' ?
            Array.from(currentAppState.leftPanel.selectedFiles).map(id =>
              currentAppState.leftPanel.files.find(f => f.id === id)!
            ).filter(Boolean) :
            Array.from(currentAppState.rightPanel.selectedFiles).map(id =>
              currentAppState.rightPanel.files.find(f => f.id === id)!
            ).filter(Boolean),
          currentFile: currentAppState.activePanel === 'left' ?
            currentAppState.leftPanel.files.find(f => f.id === currentAppState.leftPanel.focusedFile) :
            currentAppState.rightPanel.files.find(f => f.id === currentAppState.rightPanel.focusedFile)
        }}
      />
    </motion.div>
  );
}

export default App;