import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState, Theme, ViewMode, SortBy, SortOrder, PanelState } from './types';
import { generateRealFiles, getRealHomeDirectory, getRealDocumentsDirectory } from './data/realFiles';
import { defaultKeyboardShortcuts } from './data/keyboardShortcuts';
import { getFolderNameFromPath } from './utils/fileUtils';

// Ultra-modern components
import UltraWindowChrome from './components/layout/UltraWindowChrome';
import UltraToolbar from './components/layout/UltraToolbar';
import UltraFilePanel from './components/panels/UltraFilePanel';
import UltraStatusBar from './components/layout/UltraStatusBar';
import UltraFunctionKeyBar from './components/layout/UltraFunctionKeyBar';
import UltraDialogManager from './components/dialogs/UltraDialogManager';
import KeyboardHandler from './components/common/KeyboardHandler';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import TestSuitePanel from './components/TestSuitePanel';
import LogViewerPanel from './components/LogViewerPanel';
import logService from './services/logService';

const createInitialPanelState = async (side: 'left' | 'right'): Promise<PanelState> => {
  console.log('🦑 createInitialPanelState for side:', side);

  let initialPath: string;

  try {
    if (side === 'left') {
      initialPath = await getRealHomeDirectory();
    } else {
      initialPath = await getRealDocumentsDirectory();
    }
    console.log('🦑 createInitialPanelState got path:', initialPath);
  } catch (error) {
    console.error('🦑 createInitialPanelState error getting directory:', error);
    // Fallback to default paths
    initialPath = side === 'left' ? '/Users/andrew' : '/Users/andrew/Documents';
  }

  let files;
  try {
    files = await generateRealFiles(initialPath);
    console.log('🦑 createInitialPanelState loaded', files.length, 'files');
  } catch (error) {
    console.error('🦑 createInitialPanelState error loading files:', error);
    files = [];
  }

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
};

function App() {
  const [appState, setAppState] = useState<AppState>({
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
      tabs: [
        {
          id: 'left-tab-1',
          name: 'Home',
          path: '/Users/andrew',
          isActive: true
        }
      ],
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
      tabs: [
        {
          id: 'right-tab-1',
          name: 'Documents',
          path: '/Users/andrew/Documents',
          isActive: true
        }
      ],
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

  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverPanel, setDragOverPanel] = useState<'left' | 'right' | null>(null);
  const [showTestSuite, setShowTestSuite] = useState(false);
  const [showLogViewer, setShowLogViewer] = useState(false);

  // Ultra-smooth app initialization with real file loading
  useEffect(() => {
    const initializeApp = async () => {
      logService.logUserAction('App initialization started', { timestamp: new Date().toISOString() });

      try {
        // Initialize both panels concurrently
        const [leftPanel, rightPanel] = await Promise.all([
          createInitialPanelState('left'),
          createInitialPanelState('right')
        ]);

        logService.logUserAction('App panels initialized successfully', {
          leftFiles: leftPanel.files.length,
          rightFiles: rightPanel.files.length,
          leftPath: leftPanel.currentPath,
          rightPath: rightPanel.currentPath
        });

        setAppState(prev => ({
          ...prev,
          leftPanel,
          rightPanel
        }));

        // Smooth loading delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsLoading(false);

        logService.logUserAction('App initialization complete', { loadTime: '500ms' });
      } catch (error) {
        logService.logError(error instanceof Error ? error : new Error(String(error)), {
          component: 'App',
          function: 'initializeApp',
          operation: 'app_initialization'
        });
        // Still show the app even if initialization failed
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Theme application
  useEffect(() => {
    const isDark = appState.theme === Theme.Dark;
    document.documentElement.classList.toggle('dark', isDark);
    document.body.classList.toggle('dark', isDark);
  }, [appState.theme]);

  // Keyboard navigation
  const keyboardHandlers = useKeyboardNavigation(appState, setAppState);

  const updatePanelState = (panelId: 'left' | 'right', updater: (panel: PanelState) => PanelState) => {
    setAppState(prev => ({
      ...prev,
      [panelId === 'left' ? 'leftPanel' : 'rightPanel']: updater(prev[panelId === 'left' ? 'leftPanel' : 'rightPanel'])
    }));
  };

  const switchActivePanel = () => {
    setAppState(prev => ({
      ...prev,
      activePanel: prev.activePanel === 'left' ? 'right' : 'left'
    }));
  };

  const swapPanels = () => {
    setAppState(prev => {
      // Update panel IDs to reflect their new positions
      const leftPanelWithNewId = { ...prev.rightPanel, id: 'left' };
      const rightPanelWithNewId = { ...prev.leftPanel, id: 'right' };

      // Update tab IDs to match new panel positions
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
    setAppState(prev => ({
      ...prev,
      activeDialog: dialogId
    }));
  };

  const closeDialog = () => {
    setAppState(prev => ({
      ...prev,
      activeDialog: null
    }));
  };

  const toggleTheme = () => {
    setAppState(prev => ({
      ...prev,
      theme: prev.theme === Theme.Light ? Theme.Dark : Theme.Light
    }));
  };

  const handleFunctionKeyPress = (functionKey: string, modifiers: string[]) => {
    logService.logUserAction(`Function key pressed: ${functionKey}`, {
      functionKey,
      modifiers,
      timestamp: new Date().toISOString()
    });

    // F9 with Cmd to open test suite (our testing key)
    if (functionKey === 'F9' && modifiers.includes('cmd')) {
      setShowTestSuite(true);
      logService.logUserAction('Test Suite Panel opened');
      return;
    }

    // F10 with Cmd to open log viewer
    if (functionKey === 'F10' && modifiers.includes('cmd')) {
      setShowLogViewer(true);
      logService.logUserAction('Log Viewer Panel opened');
      return;
    }

    // TODO: Implement actual function key actions based on the current context
    // This will integrate with the keyboard navigation system
  };

  // Drag handlers for panel swapping
  const [dragSource, setDragSource] = useState<'left' | 'right' | null>(null);

  const handleDragStart = (panelSide: 'left' | 'right') => {
    console.log('Drag started from:', panelSide);
    setIsDragging(true);
    setDragSource(panelSide);
  };

  const handleDragEnd = () => {
    console.log('Drag ended. isDragging:', isDragging, 'dragOverPanel:', dragOverPanel, 'dragSource:', dragSource);
    // Only swap if we're dragging from one panel to the other (not the same panel)
    if (dragOverPanel && isDragging && dragSource && dragOverPanel !== dragSource) {
      console.log('Swapping panels');
      swapPanels();
    }
    setIsDragging(false);
    setDragOverPanel(null);
    setDragSource(null);
  };

  const handleDragEnter = (panelSide: 'left' | 'right') => {
    console.log('Drag enter:', panelSide, 'isDragging:', isDragging);
    if (isDragging) {
      setDragOverPanel(panelSide);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag target if we're actually leaving the drop zone
    // Check if we're moving to a child element
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeavingDropZone =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;

    if (isLeavingDropZone) {
      console.log('Drag leave confirmed');
      setDragOverPanel(null);
    }
  };

  // Ultra-smooth loading screen
  if (isLoading) {
    return (
      <motion.div
        className="h-screen flex items-center justify-center bg-mac26-bg-primary-light dark:bg-mac26-bg-primary-dark"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="text-center space-y-6">
          <motion.div
            className="text-6xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            🦑
          </motion.div>
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h1 className="text-2xl font-light gradient-text">KrakenEgg</h1>
            <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
              macOS 26 Design
            </p>
          </motion.div>
          <motion.div
            className="w-32 h-1 bg-mac26-border-primary-light dark:bg-mac26-border-primary-dark rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-mac26-blue-500 to-mac26-purple-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
            />
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="h-screen flex flex-col bg-mac26-bg-primary-light dark:bg-mac26-bg-primary-dark text-mac26-text-primary-light dark:text-mac26-text-primary-dark overflow-hidden"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <KeyboardHandler
        shortcuts={appState.keyboardShortcuts}
        onKeyboardAction={keyboardHandlers.handleKeyboardAction}
      />

      {/* Ultra-modern window chrome */}
      <UltraWindowChrome
        onToggleTheme={toggleTheme}
        onShowDialog={showDialog}
        theme={appState.theme}
      />

      {/* Ultra-refined toolbar */}
      <UltraToolbar
        onShowDialog={showDialog}
        appState={appState}
      />

      {/* Main content area with ultra-smooth panels */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        <div className="flex-1 flex min-h-0">
          <div
            className={`flex-1 ${dragOverPanel === 'left' && isDragging ? 'ring-4 ring-mac26-blue-500 ring-opacity-50' : ''}`}
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
              panel={appState.leftPanel}
              isActive={appState.activePanel === 'left'}
              onUpdatePanel={(updater) => updatePanelState('left', updater)}
              onSwitchPanel={switchActivePanel}
              onShowDialog={showDialog}
              onDragStart={() => handleDragStart('left')}
              onDragEnd={handleDragEnd}
              isDragging={isDragging}
              isDragTarget={dragOverPanel === 'left'}
            />
          </div>

          {/* Ultra-modern panel splitter */}
          <motion.div
            className="panel-splitter"
            whileHover={{ scale: 1.2 }}
            transition={{ duration: 0.15 }}
          />

          <div
            className={`flex-1 ${dragOverPanel === 'right' && isDragging ? 'ring-4 ring-mac26-blue-500 ring-opacity-50' : ''}`}
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
              panel={appState.rightPanel}
              isActive={appState.activePanel === 'right'}
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

      {/* Ultra-clean status bar */}
      <AnimatePresence>
        {appState.showStatusBar && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <UltraStatusBar
              leftPanel={appState.leftPanel}
              rightPanel={appState.rightPanel}
              activePanel={appState.activePanel}
              operations={appState.operations}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Norton Commander style function key guide */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <UltraFunctionKeyBar onFunctionKeyPress={handleFunctionKeyPress} />
      </motion.div>

      {/* Ultra-modern dialog system */}
      <UltraDialogManager
        activeDialog={appState.activeDialog}
        onCloseDialog={closeDialog}
        dialogData={{
          files: appState.activePanel === 'left' ?
            Array.from(appState.leftPanel.selectedFiles).map(id =>
              appState.leftPanel.files.find(f => f.id === id)!
            ).filter(Boolean) :
            Array.from(appState.rightPanel.selectedFiles).map(id =>
              appState.rightPanel.files.find(f => f.id === id)!
            ).filter(Boolean),
          currentFile: appState.activePanel === 'left' ?
            appState.leftPanel.files.find(f => f.id === appState.leftPanel.focusedFile) :
            appState.rightPanel.files.find(f => f.id === appState.rightPanel.focusedFile)
        }}
      />

      {/* Test Suite Panel */}
      {showTestSuite && (
        <TestSuitePanel onClose={() => setShowTestSuite(false)} />
      )}

      {/* Log Viewer Panel */}
      {showLogViewer && (
        <LogViewerPanel
          isOpen={showLogViewer}
          onClose={() => {
            setShowLogViewer(false);
            logService.logUserAction('Log Viewer Panel closed');
          }}
        />
      )}
    </motion.div>
  );
}

export default App;