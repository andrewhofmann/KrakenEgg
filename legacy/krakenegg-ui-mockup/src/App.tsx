import { useState, useEffect } from 'react';
import { AppState, Theme, ViewMode, SortBy, SortOrder, PanelState } from './types';
import { generateMockFiles } from './data/mockFiles';
import { defaultKeyboardShortcuts } from './data/keyboardShortcuts';
import MenuBar from './components/layout/MenuBar';
import Toolbar from './components/layout/Toolbar';
import FilePanel from './components/panels/FilePanel';
import StatusBar from './components/layout/StatusBar';
import CommandLine from './components/layout/CommandLine';
import DialogManager from './components/dialogs/DialogManager';
import KeyboardHandler from './components/common/KeyboardHandler';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';

const createInitialPanelState = (side: 'left' | 'right'): PanelState => {
  const initialPath = side === 'left' ? '/Users/andrew' : '/Users/andrew/Documents';
  const files = generateMockFiles(initialPath);

  return {
    id: side,
    currentPath: initialPath,
    files,
    selectedFiles: new Set(),
    focusedFile: files.length > 0 ? files[0].id : null,
    viewMode: ViewMode.Detailed,
    sortBy: SortBy.Name,
    sortOrder: SortOrder.Ascending,
    showHidden: false,
    tabs: [
      {
        id: `${side}-tab-1`,
        name: side === 'left' ? 'andrew' : 'Documents',
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
    leftPanel: createInitialPanelState('left'),
    rightPanel: createInitialPanelState('right'),
    activePanel: 'left',
    theme: Theme.Auto,
    showCommandLine: true,
    showStatusBar: true,
    activeDialog: null,
    operations: [],
    keyboardShortcuts: defaultKeyboardShortcuts
  });

  // Theme detection and application
  useEffect(() => {
    const applyTheme = () => {
      const isDark = appState.theme === Theme.Dark ||
        (appState.theme === Theme.Auto && window.matchMedia('(prefers-color-scheme: dark)').matches);

      document.documentElement.classList.toggle('dark', isDark);
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (appState.theme === Theme.Auto) {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
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
      theme: prev.theme === Theme.Light ? Theme.Dark :
             prev.theme === Theme.Dark ? Theme.Auto : Theme.Light
    }));
  };

  return (
    <div className="h-screen flex flex-col bg-macos-bg-light dark:bg-macos-bg-dark text-macos-text-primary-light dark:text-macos-text-primary-dark">
      <KeyboardHandler
        shortcuts={appState.keyboardShortcuts}
        onKeyboardAction={keyboardHandlers.handleKeyboardAction}
      />

      <MenuBar
        onToggleTheme={toggleTheme}
        onShowDialog={showDialog}
        theme={appState.theme}
      />

      <Toolbar
        onShowDialog={showDialog}
        onToggleCommandLine={() => setAppState(prev => ({ ...prev, showCommandLine: !prev.showCommandLine }))}
        onToggleStatusBar={() => setAppState(prev => ({ ...prev, showStatusBar: !prev.showStatusBar }))}
        showCommandLine={appState.showCommandLine}
        showStatusBar={appState.showStatusBar}
      />

      <div className="flex-1 flex min-h-0">
        <FilePanel
          side="left"
          panel={appState.leftPanel}
          isActive={appState.activePanel === 'left'}
          onUpdatePanel={(updater) => updatePanelState('left', updater)}
          onSwitchPanel={switchActivePanel}
          onShowDialog={showDialog}
        />

        <div className="panel-splitter" />

        <FilePanel
          side="right"
          panel={appState.rightPanel}
          isActive={appState.activePanel === 'right'}
          onUpdatePanel={(updater) => updatePanelState('right', updater)}
          onSwitchPanel={switchActivePanel}
          onShowDialog={showDialog}
        />
      </div>

      {appState.showCommandLine && (
        <CommandLine
          onExecuteCommand={(command) => console.log('Execute command:', command)}
        />
      )}

      {appState.showStatusBar && (
        <StatusBar
          leftPanel={appState.leftPanel}
          rightPanel={appState.rightPanel}
          activePanel={appState.activePanel}
          operations={appState.operations}
        />
      )}

      <DialogManager
        activeDialog={appState.activeDialog}
        appState={appState}
        onClose={closeDialog}
        onUpdateAppState={setAppState}
      />
    </div>
  );
}

export default App;