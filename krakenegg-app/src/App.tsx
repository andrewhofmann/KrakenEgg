import { useEffect } from "react";
import { useStore } from "./store";
import { invoke } from "@tauri-apps/api/core";
import { useKeyboard } from "./hooks/useKeyboard";
import { usePanelData } from "./hooks/usePanelData";
import { ViewerModal } from "./components/ViewerModal";
import { EditorModal } from "./components/EditorModal";
import { SearchModal } from "./components/SearchModal";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { InputModal } from "./components/InputModal"; // Import InputModal
import { OperationStatusModal } from "./components/OperationStatusModal"; // Import OperationStatusModal
import { GoToPathModal } from "./components/GoToPathModal"; // Import GoToPathModal
import { ConflictModal } from "./components/ConflictModal"; // Import ConflictModal
import { SettingsModal } from "./components/SettingsModal"; // Import SettingsModal
import { FilePanel } from "./components/FilePanel"; // Import the extracted FilePanel component
import { ContextMenu } from "./components/ContextMenu"; // Import ContextMenu
import { OperationsDrawer } from "./components/OperationsDrawer";
import { MultiRenameModal } from "./components/MultiRenameModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { getProcessedFiles } from "./store";
import { formatSize } from "./utils/format";

import { listen } from '@tauri-apps/api/event';

function App() {
  useKeyboard(); // Enable keyboard listener

  const activeSide = useStore(state => state.activeSide);
  const activePanelState = useStore(state => state[activeSide]);
  const { contextMenu, hideContextMenu, settingsModal } = useStore(state => state);
  const theme = useStore(state => state.preferences.appearance.theme);

  // Apply theme to document
  useEffect(() => {
    const resolvedTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [theme]);

  useEffect(() => {
    // Load saved state on startup, then set home directory defaults if needed
    const init = async () => {
      await useStore.getState().loadState();
      // If paths are still the default "/", set to home directory
      try {
        const home = await invoke<string>('get_home_directory');
        const state = useStore.getState();
        if (state.left.tabs[0]?.path === '/') {
          state.setPath('left', home);
        }
        if (state.right.tabs[0]?.path === '/') {
          state.setPath('right', home);
        }
      } catch { /* fallback to "/" is fine */ }
    };
    init();

    // Listen for Menu Events
    const unlistenPromise = listen<string>('menu_event', (event) => {
        const id = event.payload;
        const store = useStore.getState();
        const side = store.activeSide;
        const currentPath = store[side].tabs[store[side].activeTabIndex].path;

        switch (id) {
            case 'settings': store.showSettingsModal(); break;
            case 'new_tab': store.addTab(side, currentPath); break;
            case 'close_tab': store.closeTab(side); break;
            case 'multi_rename': store.openMultiRename(side); break;
            case 'refresh': store.refreshPanel('left'); store.refreshPanel('right'); break;
            case 'quick_view': store.toggleQuickView(); break;
            case 'swap_panes': store.swapPanes(); break;
            case 'go_back': store.goBack(side); break;
            case 'go_forward': store.goForward(side); break;
            case 'go_up': 
                const parent = currentPath.length > 1 ? (currentPath.substring(0, currentPath.lastIndexOf('/')) || '/') : '/';
                store.setPath(side, parent);
                break;
            case 'go_to_path': store.showGoToPathModal(currentPath); break;
            case 'new_file': 
                store.requestInput("New File", "Name:", "untitled.txt", (name) => { if (name) store.createNewFile(side, name); });
                break;
            case 'new_folder':
                store.requestInput("New Folder", "Name:", "New Folder", async (name) => { 
                    if (name) { 
                        const p = currentPath === "/" ? `/${name}` : `${currentPath}/${name}`;
                        await invoke('create_directory', { path: p }); 
                        store.refreshPanel(side); 
                    } 
                });
                break;
        }
    });

    return () => { unlistenPromise.then(unlisten => unlisten()); };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden font-sans select-none text-[13px]" style={{ backgroundColor: 'var(--ke-bg)', color: 'var(--ke-text)' }}>
      
      {/* Main Dual Pane Area */}
      <div className="flex-1 flex overflow-hidden backdrop-blur-2xl" style={{ backgroundColor: 'var(--ke-bg-panel)' }}>
        <ErrorBoundary fallbackTitle="Left panel crashed">
          <FilePanel side="left" usePanelDataHook={usePanelData} />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Right panel crashed">
          <FilePanel side="right" usePanelDataHook={usePanelData} />
        </ErrorBoundary>
      </div>

      {/* Bottom Status Bar */}
      <div className="h-8 backdrop-blur-md flex items-center px-4 text-xs justify-between shrink-0" style={{ backgroundColor: 'var(--ke-bg-secondary)', borderTop: '1px solid var(--ke-border-subtle)', color: 'var(--ke-text-secondary)' }}>
        <div className="flex space-x-4">
          <span><kbd className="font-semibold" style={{ color: 'var(--ke-text)' }}>F5</kbd> Copy</span>
          <span><kbd className="font-semibold" style={{ color: 'var(--ke-text)' }}>F6</kbd> Move</span>
          <span><kbd className="font-semibold" style={{ color: 'var(--ke-text)' }}>&#8984;&#9003;</kbd> Delete</span>
          <span><kbd className="font-semibold" style={{ color: 'var(--ke-text)' }}>F7</kbd> New Folder</span>
          <span><kbd className="font-semibold" style={{ color: 'var(--ke-text)' }}>Ctrl+Q</kbd> Quick View</span>
        </div>
        <div>
          {(() => {
             const activeTab = activePanelState.tabs[activePanelState.activeTabIndex];
             if (!activeTab) return "0 items selected";

             const preferences = useStore.getState().preferences;
             const processedFiles = getProcessedFiles(activeTab.files, activePanelState.layout, activeTab.filterQuery, preferences.general.showHiddenFiles);
             const selectedItems = activeTab.selection.map(i => processedFiles[i]).filter(Boolean);

             if (selectedItems.length === 0) return "0 items selected";

             const folderCount = selectedItems.filter(f => f.is_dir).length;
             const fileCount = selectedItems.length - folderCount;
             const totalSize = selectedItems.reduce((sum, f) => sum + (f.is_dir ? 0 : f.size), 0);

             const parts = [];
             if (folderCount > 0) parts.push(`${folderCount} folder${folderCount !== 1 ? 's' : ''}`);
             if (fileCount > 0) parts.push(`${fileCount} file${fileCount !== 1 ? 's' : ''}`);
             const sizeStr = totalSize > 0 ? ` (${formatSize(totalSize)})` : '';
             return `${parts.join(', ')} selected${sizeStr}`;
          })()}
        </div>
      </div>

      <OperationsDrawer />
      <ViewerModal />
      <EditorModal />
      <SearchModal />
      <ConfirmationModal />
      <InputModal />
      <OperationStatusModal />
      <GoToPathModal />
      <ConflictModal />
      <MultiRenameModal />
      {settingsModal.show && <SettingsModal />} {/* Render SettingsModal conditionally */}
      {contextMenu.show && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => {
            hideContextMenu();
            window.getSelection()?.removeAllRanges();
          }}
        />
      )}
    </div>
  );
}

export default App;

