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

  // Apply theme to document — listen for system theme changes when set to "system"
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = theme === 'system' ? (mql.matches ? 'dark' : 'light') : theme;
      document.documentElement.setAttribute('data-theme', resolved);
    };
    apply();
    if (theme === 'system') {
      mql.addEventListener('change', apply);
      return () => mql.removeEventListener('change', apply);
    }
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
                        try {
                            await invoke('create_directory', { path: p });
                            useStore.getState().refreshPanel(side);
                            useStore.getState().showOperationStatus(`Folder '${name}' created.`);
                        } catch (err) {
                            useStore.getState().setOperationError(`Create folder failed: ${err instanceof Error ? err.message : String(err)}`);
                        }
                    }
                });
                break;
            // Edit menu
            case 'copy_files': store.copySelectedFiles(side); break;
            case 'cut_files': store.cutSelectedFiles(side); break;
            case 'paste_files': store.pasteFiles(side); break;
            case 'delete_files': store.deleteSelectedFiles(side); break;
            case 'select_all': {
                const saPanel = store[side];
                const saTab = saPanel.tabs[saPanel.activeTabIndex];
                if (saTab) {
                    const visible = getProcessedFiles(saTab.files, saPanel.layout, saTab.filterQuery, store.preferences.general.showHiddenFiles);
                    store.setSelection(side, visible.map((_: unknown, i: number) => i));
                }
                break;
            }
            case 'deselect_all': store.setSelection(side, []); break;
            case 'invert_selection': {
                const ivPanel = store[side];
                const ivTab = ivPanel.tabs[ivPanel.activeTabIndex];
                if (ivTab) {
                    const visible = getProcessedFiles(ivTab.files, ivPanel.layout, ivTab.filterQuery, store.preferences.general.showHiddenFiles);
                    const all = new Set(visible.map((_: unknown, i: number) => i));
                    const inverted = [...all].filter(i => !ivTab.selection.includes(i));
                    store.setSelection(side, inverted);
                }
                break;
            }
            case 'rename': {
                const rnPanel = store[side];
                const rnTab = rnPanel.tabs[rnPanel.activeTabIndex];
                if (rnTab) {
                    const visible = getProcessedFiles(rnTab.files, rnPanel.layout, rnTab.filterQuery, store.preferences.general.showHiddenFiles);
                    const file = visible[rnTab.cursorIndex];
                    if (file && file.name !== '..') {
                        const _rnPath = currentPath;
                        const _rnName = file.name;
                        store.requestInput("Rename", `New name for "${_rnName}":`, _rnName, async (newName) => {
                            if (newName && newName !== _rnName) {
                                const oldPath = _rnPath === '/' ? `/${_rnName}` : `${_rnPath}/${_rnName}`;
                                const newPath = _rnPath === '/' ? `/${newName}` : `${_rnPath}/${newName}`;
                                try {
                                    await invoke('rename_item', { oldPath, newPath });
                                    useStore.getState().refreshPanel(side);
                                } catch (err) { useStore.getState().setOperationError(`Rename failed: ${err instanceof Error ? err.message : String(err)}`); }
                            }
                        });
                    }
                }
                break;
            }
            case 'compress': store.archive.compressSelection(side); break;
            case 'extract': store.archive.extractSelection(side); break;
            case 'copy_to_opposite': store.copyToOppositePanel(side); break;
            case 'move_to_opposite': store.moveToOppositePanel(side); break;
            // View menu
            case 'view_file': {
                const vfPanel = store[side];
                const vfTab = vfPanel.tabs[vfPanel.activeTabIndex];
                if (vfTab) {
                    const visible = getProcessedFiles(vfTab.files, vfPanel.layout, vfTab.filterQuery, store.preferences.general.showHiddenFiles);
                    const file = visible[vfTab.cursorIndex];
                    if (file && !file.is_dir) store.showViewer(file.name, currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`);
                }
                break;
            }
            case 'edit_file': {
                const efPanel = store[side];
                const efTab = efPanel.tabs[efPanel.activeTabIndex];
                const efVisible = efTab ? getProcessedFiles(efTab.files, efPanel.layout, efTab.filterQuery, store.preferences.general.showHiddenFiles) : [];
                const file = efVisible[efTab?.cursorIndex ?? -1];
                if (file && !file.is_dir) store.showEditor(file.name, currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`);
                break;
            }
            case 'toggle_hidden': store.setPreference('general', 'showHiddenFiles', !store.preferences.general.showHiddenFiles); break;
            case 'search': store.showSearch(); break;
        }
    });

    return () => { unlistenPromise.then(unlisten => unlisten()).catch(() => {}); };
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

      {/* Bottom Status Bar — keyboard shortcuts only */}
      <div className="h-7 backdrop-blur-md flex items-center px-4 text-xs shrink-0" style={{ backgroundColor: 'var(--ke-bg-secondary)', borderTop: '1px solid var(--ke-border-subtle)', color: 'var(--ke-text-secondary)' }}>
        <div className="flex space-x-4">
          <span><kbd className="font-semibold" style={{ color: 'var(--ke-text)' }}>F5</kbd> Copy</span>
          <span><kbd className="font-semibold" style={{ color: 'var(--ke-text)' }}>F6</kbd> Move</span>
          <span><kbd className="font-semibold" style={{ color: 'var(--ke-text)' }}>&#8984;&#9003;</kbd> Delete</span>
          <span><kbd className="font-semibold" style={{ color: 'var(--ke-text)' }}>F7</kbd> New Folder</span>
          <span><kbd className="font-semibold" style={{ color: 'var(--ke-text)' }}>Ctrl+Q</kbd> Quick View</span>
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

