import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { 
    FileInfo, PaneLayout, TabState, ViewerState, EditorState, SearchState, 
    ConfirmationState, MultiRenameState, ContextMenuItem, ContextMenuState, 
    ClipboardState, InputModalState, ProgressInfo, ConflictInfo, 
    OperationStatusState, GoToPathModalState, SettingsModalState, 
    Preferences, HotkeyAction, HotkeyState, PanelState, FileOperation, AppState, SortColumn, SortDirection 
} from './types';
import { 
    DEFAULT_PREFERENCES, DEFAULT_HOTKEYS, DEFAULT_LAYOUT, IMAGE_EXTENSIONS, 
    createTab, getExtension, getProcessedFiles 
} from './constants';

// Re-export everything for compatibility with existing imports
export * from './types';
export * from './constants';

const updateActiveTab = (state: AppState, side: 'left' | 'right', updater: (tab: TabState) => Partial<TabState>) => {
  const panel = state[side];
  const tabs = [...panel.tabs];
  const activeTab = tabs[panel.activeTabIndex];
  if (!activeTab) return {}; 
  tabs[panel.activeTabIndex] = { ...activeTab, ...updater(activeTab) };
  return { [side]: { ...panel, tabs } };
};

export const useStore = create<AppState>((set, get) => {
  const initialPanelState = {
    left: { tabs: [createTab("/")], activeTabIndex: 0, layout: DEFAULT_LAYOUT },
    right: { tabs: [createTab("/")], activeTabIndex: 0, layout: DEFAULT_LAYOUT },
    activeSide: 'left' as 'left' | 'right',
    quickView: false,
    preferences: DEFAULT_PREFERENCES,
  };

  const initialViewerState: ViewerState = { show: false, title: '', content: '', loading: false, error: null, isImage: false };
  const initialEditorState: EditorState = { show: false, title: '', path: '', content: '', loading: false, error: null, dirty: false };
  const initialSearchState: SearchState = { show: false, query: '', searchContent: false, results: [], loading: false, error: null };
  const initialConfirmationState: ConfirmationState = { show: false, title: '', message: '', showConflictOptions: false, onConfirm: () => {}, };
  const initialContextMenuState: ContextMenuState = { show: false, x: 0, y: 0, items: [], };
  const initialClipboardState: ClipboardState = { type: null, items: null, operation: null, sourcePanel: null, };
  const initialInputModalState: InputModalState = { show: false, title: '', message: '', initialValue: '', onConfirm: () => {}, };
  const initialOperationStatusState: OperationStatusState = { show: false, message: '', isError: false, progress: null, conflict: null };
  const initialGoToPathModalState: GoToPathModalState = { show: false, initialPath: '' };
  const initialHotkeyState: HotkeyState = DEFAULT_HOTKEYS;
  const initialSettingsModalState: SettingsModalState = { show: false };
  const initialMultiRenameState: MultiRenameState = { show: false, files: [] };
  const initialGlobalHistory: string[] = [];
  const initialHotlist: string[] = [];

  const panelActions = {
    setActiveSide: (side: 'left' | 'right') => { set({ activeSide: side }); get().saveState(); },
    swapPanes: () => {
        set((state) => {
            const leftState = state.left;
            const rightState = state.right;
            return { left: rightState, right: leftState, activeSide: state.activeSide === 'left' ? 'right' : 'left' };
        }); get().saveState();
    },
    toggleQuickView: () => set((state) => ({ quickView: !state.quickView })),
    setPreference: <K extends keyof Preferences, S extends keyof Preferences[K]>(category: K, key: S, value: Preferences[K][S]) => {
        set(state => ({
            preferences: {
                ...state.preferences,
                [category]: {
                    ...state.preferences[category],
                    [key]: value
                }
            }
        }));
        get().saveState();
    }
  };

  const tabActions = {
    addTab: (side: 'left' | 'right', path: string) => { set((state) => ({ [side]: { ...state[side], tabs: [...state[side].tabs, createTab(path)], activeTabIndex: state[side].tabs.length, } })); get().saveState(); },
    closeTab: (side: 'left' | 'right', index?: number) => {
        set((state) => {
          const panel = state[side];
          const targetIndex = index ?? panel.activeTabIndex;
          const newTabs = panel.tabs.filter((_, i) => i !== targetIndex);
          if (newTabs.length === 0) newTabs.push(createTab("/"));
          let newActiveIndex = panel.activeTabIndex;
          if (targetIndex < panel.activeTabIndex) newActiveIndex--;
          else if (targetIndex === panel.activeTabIndex) newActiveIndex = Math.min(newActiveIndex, newTabs.length - 1);
          newActiveIndex = Math.max(0, Math.min(newActiveIndex, newTabs.length - 1));
          return { [side]: { ...panel, tabs: newTabs, activeTabIndex: newActiveIndex } };
        }); get().saveState();
    },
    setActiveTab: (side: 'left' | 'right', index: number) => { set((state) => ({ [side]: { ...state[side], activeTabIndex: index } })); get().saveState(); },
    moveTab: (fromSide: 'left' | 'right', fromIndex: number, toSide: 'left' | 'right', toIndex?: number) => {
        set((state) => {
            const fromTabs = [...state[fromSide].tabs];
            if (fromIndex < 0 || fromIndex >= fromTabs.length) return {};
            const [tabToMove] = fromTabs.splice(fromIndex, 1);
            let sourceReset = false;
            if (fromTabs.length === 0) { fromTabs.push(createTab("/")); sourceReset = true; }
            let newFromActive = state[fromSide].activeTabIndex;
            if (sourceReset) newFromActive = 0;
            else { if (fromIndex < newFromActive) newFromActive--; else if (fromIndex === newFromActive) newFromActive = Math.min(newFromActive, fromTabs.length - 1); }
            if (fromSide === toSide) {
                let insertIndex = toIndex !== undefined ? toIndex : fromTabs.length; 
                if (fromIndex < insertIndex) insertIndex -= 1;
                fromTabs.splice(insertIndex, 0, tabToMove);
                const originalActiveId = state[fromSide].tabs[state[fromSide].activeTabIndex].id;
                newFromActive = fromTabs.findIndex(t => t.id === originalActiveId);
                return { [fromSide]: { ...state[fromSide], tabs: fromTabs, activeTabIndex: newFromActive } };
            } 
            const toTabs = [...state[toSide].tabs];
            const insertIndex = toIndex !== undefined ? toIndex : toTabs.length;
            toTabs.splice(insertIndex, 0, tabToMove);
            return { [fromSide]: { ...state[fromSide], tabs: fromTabs, activeTabIndex: newFromActive }, [toSide]: { ...state[toSide], tabs: toTabs, activeTabIndex: state[toSide].activeTabIndex } };
        }); get().saveState();
    },
    setTabs: (side: 'left' | 'right', tabs: TabState[]) => { set((state) => ({ [side]: { ...state[side], tabs } })); get().saveState(); },
  };

  const navigationActions = {
    setPath: (side: 'left' | 'right', path: string) => {
        set((state) => updateActiveTab(state, side, (tab) => {
          const history = tab.history.slice(0, tab.historyIndex + 1);
          if (history[history.length - 1] === path) return {};
          return { path, selection: [], cursorIndex: 0, history: [...history, path], historyIndex: history.length, filterQuery: '', filterFocusSignal: 0 };
        })); 
        get().addToHistory(path);
        get().saveState();
    },
    goBack: (side: 'left' | 'right') => {
        set((state) => updateActiveTab(state, side, (tab) => {
          if (tab.historyIndex > 0) {
            const newIndex = tab.historyIndex - 1;
            const path = tab.history[newIndex];
            get().addToHistory(path);
            return { path, historyIndex: newIndex, selection: [], cursorIndex: 0, filterQuery: '', filterFocusSignal: 0 };
          }
          return {};
        })); get().saveState();
    },
    goForward: (side: 'left' | 'right') => {
        set((state) => updateActiveTab(state, side, (tab) => {
          if (tab.historyIndex < tab.history.length - 1) {
            const newIndex = tab.historyIndex + 1;
            const path = tab.history[newIndex];
            get().addToHistory(path);
            return { path, historyIndex: newIndex, selection: [], cursorIndex: 0, filterQuery: '', filterFocusSignal: 0 };
          }
          return {};
        })); get().saveState();
    },
  };

  const historyActions = {
      addToHistory: (path: string) => set((state) => {
          if (!state.preferences.general.saveHistoryOnExit) return {};
          const newHistory = [path, ...state.globalHistory.filter(p => p !== path)].slice(0, 30);
          return { globalHistory: newHistory };
      }),
      addToHotlist: (path: string) => set((state) => ({ hotlist: [...state.hotlist.filter(p => p !== path), path] })),
      removeFromHotlist: (path: string) => set((state) => ({ hotlist: state.hotlist.filter(p => p !== path) })),
  };

  const dataActions = {
    setFiles: (side: 'left' | 'right', files: FileInfo[]) => set((state) => updateActiveTab(state, side, () => ({ files, loading: false, error: null }))),
    setLoading: (side: 'left' | 'right', loading: boolean) => set((state) => updateActiveTab(state, side, () => ({ loading }))),
    setError: (side: 'left' | 'right', error: string | null) => set((state) => updateActiveTab(state, side, () => ({ error, loading: false }))),
    setSelection: (side: 'left' | 'right', selection: number[]) => set((state) => updateActiveTab(state, side, () => ({ selection }))),
    refreshPanel: (side: 'left' | 'right') => set((state) => updateActiveTab(state, side, (tab) => ({ refreshVersion: tab.refreshVersion + 1 }))),
    refreshPaths: (paths: string[]) => {
        set((state) => {
            const uniquePaths = new Set(paths);
            const updateTabs = (tabs: TabState[]) => tabs.map(tab => { if (uniquePaths.has(tab.path)) return { ...tab, refreshVersion: tab.refreshVersion + 1 }; return tab; });
            return { left: { ...state.left, tabs: updateTabs(state.left.tabs) }, right: { ...state.right, tabs: updateTabs(state.right.tabs) } };
        });
    },
    setSort: (side: 'left' | 'right', column: SortColumn) => set((state) => {
        const layout = state[side].layout;
        let direction: SortDirection = 'asc';
        if (layout.sortColumn === column) direction = layout.sortDirection === 'asc' ? 'desc' : 'asc';
        else if (column === 'size' || column === 'date') direction = 'desc';
        return { [side]: { ...state[side], layout: { ...layout, sortColumn: column, sortDirection: direction } } };
    }),
    setColumnOrder: (side: 'left' | 'right', order: SortColumn[]) => set((state) => ({ [side]: { ...state[side], layout: { ...state[side].layout, columns: order } } })),
    setColumnWidth: (side: 'left' | 'right', column: SortColumn, width: number) => set((state) => ({ [side]: { ...state[side], layout: { ...state[side].layout, columnWidths: { ...state[side].layout.columnWidths, [column]: width } } } })),
  };

  const cursorActions = {
    setCursor: (side: 'left' | 'right', index: number) => set((state) => updateActiveTab(state, side, () => ({ cursorIndex: index }))),
    moveCursor: (side: 'left' | 'right', delta: number) => set((state) => updateActiveTab(state, side, (tab) => {
      const showHidden = state.preferences.general.showHiddenFiles;
      const files = getProcessedFiles(tab.files, state[side].layout, tab.filterQuery, showHidden);
      const minIndex = tab.path === "/" ? 0 : -1;
      const newIndex = Math.max(minIndex, Math.min(files.length - 1, tab.cursorIndex + delta));
      return { cursorIndex: newIndex };
    })),
    toggleSelection: (side: 'left' | 'right') => set((state) => updateActiveTab(state, side, (tab) => {
      const currentIndex = tab.cursorIndex;
      const isSelected = tab.selection.includes(currentIndex);
      let newSelection = isSelected ? tab.selection.filter(i => i !== currentIndex) : [...tab.selection, currentIndex];
      return { selection: newSelection };
    })),
  };

  const viewerActions = {
    setViewerContent: (title: string, content: string, isImage: boolean) => set((state) => ({ viewer: { ...state.viewer, show: true, title, content, loading: false, error: null, isImage } })),
    showViewer: async (title: string, path: string) => {
      set((state) => ({ viewer: { ...state.viewer, show: true, title, loading: true, error: null, isImage: false } }));
      const extension = path.substring(path.lastIndexOf('.')).toLowerCase();
      const isImageFile = IMAGE_EXTENSIONS.includes(extension);
      if (isImageFile) set((state) => ({ viewer: { ...state.viewer, content: path, loading: false, isImage: true } }));
      else {
        try {
          const content = await invoke<string>('read_file_content', { path });
          set((state) => ({ viewer: { ...state.viewer, content, loading: false, isImage: false } }));
        } catch (err) {
          set((state) => ({ viewer: { ...state.viewer, error: String(err), loading: false, isImage: false } }));
        }
      }
    },
    hideViewer: () => set((state) => ({ viewer: { ...state.viewer, show: false, content: '', isImage: false } })),
  };

  const editorActions = {
    showEditor: async (title: string, path: string) => {
      set((state) => ({ editor: { ...state.editor, show: true, title, path, loading: true, error: null, dirty: false } }));
      try {
        const content = await invoke<string>('read_file_content', { path });
        set((state) => ({ editor: { ...state.editor, content, loading: false } }));
      } catch (err) {
        set((state) => ({ editor: { ...state.editor, error: String(err), loading: false } }));
      }
    },
    hideEditor: () => set((state) => ({ editor: { ...state.editor, show: false, content: '', path: '' } })),
    setEditorContent: (content: string) => set((state) => ({ editor: { ...state.editor, content, dirty: true } })),
    saveEditorContent: async () => {
      const editorState = get().editor;
      if (!editorState.path || editorState.loading || editorState.error || !editorState.dirty) return;
      set((state) => ({ editor: { ...state.editor, loading: true, error: null } }));
      try {
        await invoke('write_file_content', { path: editorState.path, content: editorState.content });
        set((state) => ({ editor: { ...state.editor, loading: false, dirty: false } }));
        get().refreshPanel(get().activeSide);
      } catch (err) {
        set((state) => ({ editor: { ...state.editor, error: String(err), loading: false } }));
      }
    },
  };

  const searchActions = {
    showSearch: () => set((state) => ({ search: { ...state.search, show: true, error: null, results: [] } })),
    hideSearch: () => set((state) => ({ search: { ...state.search, show: false, query: '' } })),
    setSearchQuery: (query: string) => set((state) => ({ search: { ...state.search, query } })),
    setSearchContent: (enabled: boolean) => set((state) => ({ search: { ...state.search, searchContent: enabled } })),
    executeSearch: async () => {
      const currentAppState = get();
      const activePanel = currentAppState[currentAppState.activeSide];
      const activeTab = activePanel.tabs[activePanel.activeTabIndex];
      const { query, searchContent } = currentAppState.search;
      if (!query || !activeTab) return;
      set((state) => ({ search: { ...state.search, loading: true, error: null } }));
      try {
        const results = await invoke<FileInfo[]>('search_files', { query, path: activeTab.path, search_content: searchContent });
        set((state) => ({ search: { ...state.search, results, loading: false } }));
      } catch (err) {
        set((state) => ({ search: { ...state.search, error: String(err), loading: false } }));
      }
    },
  };

  const archiveActions = {
    compressSelection: (side: 'left' | 'right') => {
      const currentAppState = get();
      const activeTab = currentAppState[side].tabs[currentAppState[side].activeTabIndex];
      const destSide = side === 'left' ? 'right' : 'left';
      const destTab = currentAppState[destSide].tabs[currentAppState[destSide].activeTabIndex];
      const showHidden = currentAppState.preferences.general.showHiddenFiles;
      const files = getProcessedFiles(activeTab.files, currentAppState[side].layout, activeTab.filterQuery, showHidden);
      const sources = activeTab.selection.length > 0 
        ? activeTab.selection.map(i => `${activeTab.path === "/" ? "" : activeTab.path}/${files[i].name}`)
        : [`${activeTab.path === "/" ? "" : activeTab.path}/${files[activeTab.cursorIndex].name}`];
      if (sources.length === 0) return;
      
      let defaultName = "archive.zip";
      let singleFile: FileInfo | undefined;
      if (activeTab.selection.length === 1) singleFile = files[activeTab.selection[0]];
      else if (activeTab.selection.length === 0 && files[activeTab.cursorIndex]) singleFile = files[activeTab.cursorIndex];
      if (singleFile && singleFile.name !== "..") {
          const name = singleFile.name;
          if (!singleFile.is_dir && name.includes('.')) defaultName = name.substring(0, name.lastIndexOf('.')) + ".zip";
          else defaultName = name + ".zip";
      }
      const defaultPath = `${destTab.path === "/" ? "" : destTab.path}/${defaultName}`;

      currentAppState.requestInput(
          "Compress Selection",
          `Compress ${sources.length} items to:`,
          defaultPath,
          async (finalDestPath) => {
              if (!finalDestPath) return;
              set((state) => updateActiveTab(state, side, () => ({ loading: true })));
              const { updateProgress, showOperationStatus, hideOperationStatus, setOperationError } = useStore.getState();
              const opId = Math.random().toString(36).substring(7);
              const unlisten = await listen<ProgressInfo>('progress', (event) => { if (event.payload.id === opId) updateProgress(event.payload); });
              try {
                showOperationStatus(`Compressing to '${finalDestPath}'...`);
                await invoke('compress_files_with_progress', { id: opId, sources, destPath: finalDestPath });
                get().refreshPaths([destTab.path]);
                hideOperationStatus();
              } catch (err) { setOperationError(`Compression failed: ${err}`); } 
              finally { unlisten(); set((state) => updateActiveTab(state, side, () => ({ loading: false }))); useStore.setState(s => ({ operationStatus: { ...s.operationStatus, progress: null } })); }
          }
      );
    },
    extractSelection: async (side: 'left' | 'right') => {
      const currentAppState = get();
      const activeTab = currentAppState[side].tabs[currentAppState[side].activeTabIndex];
      const showHidden = currentAppState.preferences.general.showHiddenFiles;
      const files = getProcessedFiles(activeTab.files, currentAppState[side].layout, activeTab.filterQuery, showHidden);
      const file = files[activeTab.cursorIndex];
      if (!file || file.name === "..") return;
      const archivePath = `${activeTab.path === "/" ? "" : activeTab.path}/${file.name}`;
      let folderName = file.name;
      if (folderName.endsWith(".tar.gz")) folderName = folderName.slice(0, -7);
      else if (folderName.endsWith(".tgz")) folderName = folderName.slice(0, -4);
      else if (folderName.endsWith(".zip")) folderName = folderName.slice(0, -4);
      else if (folderName.endsWith(".tar")) folderName = folderName.slice(0, -4);
      else return; 
      const destDir = `${activeTab.path === "/" ? "" : activeTab.path}/${folderName}`;
      set((state) => updateActiveTab(state, side, () => ({ loading: true })));
      try {
        currentAppState.showOperationStatus(`Extracting '${file.name}' to '${folderName}'...`);
        await invoke('create_directory', { path: destDir });
        await invoke('extract_archive', { archivePath, destDir });
        get().refreshPaths([activeTab.path]);
        currentAppState.showOperationStatus(`Extracted '${file.name}' successfully.`);
      } catch (err) { currentAppState.setOperationError(`Extraction failed: ${err}`); set((state) => updateActiveTab(state, side, () => ({ loading: false }))); }
    },
  };

  const persistenceActions = {
    saveState: async () => {
        try {
            const currentAppState = get();
            const config = {
                left: {
                    tabs: currentAppState.left.tabs.map(t => ({ id: t.id, path: t.path, history: t.history, history_index: t.historyIndex })),
                    active_tab_index: currentAppState.left.activeTabIndex
                },
                right: {
                    tabs: currentAppState.right.tabs.map(t => ({ id: t.id, path: t.path, history: t.history, history_index: t.historyIndex })),
                    active_tab_index: currentAppState.right.activeTabIndex
                },
                active_side: currentAppState.activeSide,
                hotkeys: currentAppState.hotkeys,
                preferences: currentAppState.preferences,
                global_history: currentAppState.globalHistory,
                hotlist: currentAppState.hotlist,
            };
            await invoke('save_app_state', { state: config });
        } catch {
            // State save failures are non-critical — don't interrupt the user
        }
    },
    loadState: async () => {
        try {
            interface SavedTabConfig { id: string; path: string; history: string[]; history_index: number; }
            interface SavedPanelConfig { tabs: SavedTabConfig[]; active_tab_index: number; }
            interface SavedState {
                left: SavedPanelConfig; right: SavedPanelConfig; active_side: string;
                hotkeys?: HotkeyState; preferences?: Preferences;
                global_history?: string[]; hotlist?: string[];
            }
            const loaded = await invoke<SavedState | null>('load_app_state');
            if (loaded && loaded.left?.tabs && loaded.right?.tabs) {
                set((state) => ({
                    left: {
                        ...state.left,
                        tabs: loaded.left.tabs.map((t: SavedTabConfig) => ({
                            ...createTab(t.path),
                            id: t.id,
                            history: t.history || [t.path],
                            historyIndex: t.history_index || 0
                        })),
                        activeTabIndex: loaded.left.active_tab_index || 0
                    },
                    right: {
                        ...state.right,
                        tabs: loaded.right.tabs.map((t: SavedTabConfig) => ({
                            ...createTab(t.path),
                            id: t.id,
                            history: t.history || [t.path],
                            historyIndex: t.history_index || 0
                        })),
                        activeTabIndex: loaded.right.active_tab_index || 0
                    },
                    activeSide: (loaded.active_side === 'left' || loaded.active_side === 'right') ? loaded.active_side : 'left',
                    hotkeys: loaded.hotkeys || state.hotkeys,
                    preferences: loaded.preferences || state.preferences,
                    globalHistory: loaded.global_history || [],
                    hotlist: loaded.hotlist || []
                }));
            }
        } catch {
            // Config corrupted or missing — silently use defaults
        }
    }
  };

  const contextMenuActions = {
    showContextMenu: (x: number, y: number, items: ContextMenuItem[]) => set(() => ({ contextMenu: { show: true, x, y, items } })),
    hideContextMenu: () => set((state) => ({ contextMenu: { ...state.contextMenu, show: false } })),
  };

  const clipboardActions = {
    setClipboard: (type: ClipboardState['type'], items: ClipboardState['items'], operation: ClipboardState['operation'], sourcePanel: ClipboardState['sourcePanel']) => set(() => ({ clipboard: { type, items, operation, sourcePanel } })),
    clearClipboard: () => set(() => ({ clipboard: { type: null, items: null, operation: null, sourcePanel: null } })),
    copySelectedFiles: (side: 'left' | 'right') => {
      const currentAppState = get();
      const activeTab = currentAppState[side].tabs[currentAppState[side].activeTabIndex];
      const showHidden = currentAppState.preferences.general.showHiddenFiles;
      const files = getProcessedFiles(activeTab.files, currentAppState[side].layout, activeTab.filterQuery, showHidden);
      const sources = activeTab.selection.length > 0 
        ? activeTab.selection.map(i => `${activeTab.path === "/" ? "" : activeTab.path}/${files[i].name}`)
        : [`${activeTab.path === "/" ? "" : activeTab.path}/${files[activeTab.cursorIndex].name}`];
      if (sources.length > 0) {
        currentAppState.setClipboard('files', sources, 'copy', side);
        currentAppState.showOperationStatus(`Copied ${sources.length} items to clipboard.`);
      } else {
        currentAppState.setOperationError("No items selected to copy.");
      }
    },
    cutSelectedFiles: (side: 'left' | 'right') => {
      const currentAppState = get();
      const activeTab = currentAppState[side].tabs[currentAppState[side].activeTabIndex];
      const showHidden = currentAppState.preferences.general.showHiddenFiles;
      const files = getProcessedFiles(activeTab.files, currentAppState[side].layout, activeTab.filterQuery, showHidden);
      const sources = activeTab.selection.length > 0 
        ? activeTab.selection.map(i => `${activeTab.path === "/" ? "" : activeTab.path}/${files[i].name}`)
        : [`${activeTab.path === "/" ? "" : activeTab.path}/${files[activeTab.cursorIndex].name}`];
      if (sources.length > 0) {
        currentAppState.setClipboard('files', sources, 'cut', side);
        currentAppState.showOperationStatus(`Cut ${sources.length} items to clipboard.`);
      } else {
        currentAppState.setOperationError("No items selected to cut.");
      }
    },
    pasteFiles: async (destSide: 'left' | 'right') => {
      const currentAppState = get();
      const clipboard = currentAppState.clipboard;
      const destTab = currentAppState[destSide].tabs[currentAppState[destSide].activeTabIndex];
      if (!clipboard.type || clipboard.type !== 'files' || !clipboard.items || !destTab.path) {
        currentAppState.setOperationError("No files to paste or clipboard is empty.");
        return;
      }
      const sources = clipboard.items as string[];
      const dest = destTab.path;
      const isCopy = clipboard.operation === 'copy';
      const sourcePanel = clipboard.sourcePanel;
      if (sources.length === 0) return;

      currentAppState.requestConfirmation(
        isCopy ? "Copy Files" : "Move Files",
        `${isCopy ? "Copy" : "Move"} ${sources.length} items to ${dest}?`,
        async (_option) => {
          try {
            currentAppState.showOperationStatus(`${isCopy ? "Copying" : "Moving"} ${sources.length} items...`);
            if (isCopy) await invoke('copy_items', { sources, dest });
            else await invoke('move_items', { sources, dest });
            
            const destPath = destTab.path;
            const sourcePath = sourcePanel ? currentAppState[sourcePanel].tabs[currentAppState[sourcePanel].activeTabIndex].path : null;
            const pathsToRefresh = [destPath];
            if (sourcePath && !isCopy) pathsToRefresh.push(sourcePath);
            get().refreshPaths(pathsToRefresh);
            currentAppState.hideOperationStatus();
          } catch (err) {
            currentAppState.setOperationError(`${isCopy ? "Copy" : "Move"} failed: ${err}`);
          } finally {
            currentAppState.clearClipboard();
          }
        }, true);
    },
    deleteSelectedFiles: (side: 'left' | 'right') => {
        const state = get();
        const activeTab = state[side].tabs[state[side].activeTabIndex];
        const showHidden = state.preferences.general.showHiddenFiles;
        const files = getProcessedFiles(activeTab.files, state[side].layout, activeTab.filterQuery, showHidden);
        const sources = activeTab.selection.length > 0 
            ? activeTab.selection.map(i => `${activeTab.path === "/" ? "" : activeTab.path}/${files[i].name}`)
            : [`${activeTab.path === "/" ? "" : activeTab.path}/${files[activeTab.cursorIndex].name}`];
        if (sources.length === 0) return;
        
        const confirm = state.preferences.general.confirmDelete;
        const doDelete = async () => {
             try {
               useStore.getState().showOperationStatus(`Deleting...`);
               await invoke('delete_items', { paths: sources });
               get().refreshPaths([activeTab.path]);
               useStore.getState().hideOperationStatus();
             } catch (err) { useStore.getState().setOperationError(`Delete failed: ${err}`); }
        };

        if (confirm) {
            state.requestConfirmation("Delete Files", `Delete ${sources.length} items?`, async (_option) => {
                await doDelete();
            }, true);
        } else {
            doDelete();
        }
    },
  };

  const multiRenameActions = {
      openMultiRename: (side: 'left' | 'right') => {
          const state = get();
          const activeTab = state[side].tabs[state[side].activeTabIndex];
          const showHidden = state.preferences.general.showHiddenFiles;
          const files = getProcessedFiles(activeTab.files, state[side].layout, activeTab.filterQuery, showHidden);
          let targetFiles: string[] = [];
          if (activeTab.selection.length > 0) {
              targetFiles = activeTab.selection.map(i => `${activeTab.path === "/" ? "" : activeTab.path}/${files[i].name}`);
          } else {
              const file = files[activeTab.cursorIndex];
              if (file && file.name !== "..") {
                  targetFiles = [`${activeTab.path === "/" ? "" : activeTab.path}/${file.name}`];
              }
          }
          if (targetFiles.length > 0) {
              set({ multiRename: { show: true, files: targetFiles } });
          }
      },
      closeMultiRename: () => set({ multiRename: { show: false, files: [] } }),
  };

  const fileCreationActions = {
    createNewFile: async (side: 'left' | 'right', fileName: string) => {
      const currentAppState = get();
      const activeTab = currentAppState[side].tabs[currentAppState[side].activeTabIndex];
      if (!activeTab || !fileName) return;
      const filePath = `${activeTab.path === "/" ? "" : activeTab.path}/${fileName}`;
      try {
        await invoke('create_empty_file', { path: filePath });
        get().refreshPaths([activeTab.path]);
        currentAppState.showOperationStatus(`File '${fileName}' created successfully.`);
      } catch (err) { currentAppState.setOperationError(`Failed to create file: ${err}`); }
    },
  };

  const confirmationActions = {
    requestConfirmation: (title: string, message: string, onConfirm: (option?: string) => void, showConflictOptions: boolean = false) => set(() => ({ confirmation: { show: true, title, message, showConflictOptions, onConfirm } })),
    closeConfirmation: () => set((state) => ({ confirmation: { ...state.confirmation, show: false } })),
  };

  const inputModalActions = {
    requestInput: (title: string, message: string, initialValue: string, onConfirm: (value: string) => void) => set(() => ({ inputModal: { show: true, title, message, initialValue, onConfirm } })),
    closeInputModal: () => set((state) => ({ inputModal: { ...state.inputModal, show: false } })),
  };

  const fileFilteringActions = {
    setFilterQuery: (side: 'left' | 'right', query: string) => set((state) => updateActiveTab(state, side, () => ({ filterQuery: query, selection: [], cursorIndex: 0 }))),
    triggerFilterFocus: (side: 'left' | 'right') => set((state) => updateActiveTab(state, side, (tab) => ({ filterFocusSignal: tab.filterFocusSignal + 1, showFilterWidget: true }))),
  };

  const dualPaneActions = {
    copyToOppositePanel: (sourceSide: 'left' | 'right') => {
        const state = get();
        const sourceTab = state[sourceSide].tabs[state[sourceSide].activeTabIndex];
        const destSide = sourceSide === 'left' ? 'right' : 'left';
        const destTab = state[destSide].tabs[state[destSide].activeTabIndex];
        const showHidden = state.preferences.general.showHiddenFiles;
        const files = getProcessedFiles(sourceTab.files, state[sourceSide].layout, sourceTab.filterQuery, showHidden);
        const sources = sourceTab.selection.length > 0
            ? sourceTab.selection.map(i => `${sourceTab.path === "/" ? "" : sourceTab.path}/${files[i].name}`)
            : [`${sourceTab.path === "/" ? "" : sourceTab.path}/${files[sourceTab.cursorIndex].name}`];
        if (sources.length === 0) return;
        state.requestConfirmation("Copy", `Copy ${sources.length} items?`, async (_option) => {
            try { 
                await invoke('copy_items_with_progress', { 
                    id: Math.random().toString(36), 
                    sources, 
                    destPath: destTab.path 
                }); 
                get().refreshPaths([sourceTab.path, destTab.path]); 
            } catch (e) { state.setOperationError(`${e}`); }
        }, true);
    },
    moveToOppositePanel: (sourceSide: 'left' | 'right') => {
        const state = get();
        const sourceTab = state[sourceSide].tabs[state[sourceSide].activeTabIndex];
        const destSide = sourceSide === 'left' ? 'right' : 'left';
        const destTab = state[destSide].tabs[state[destSide].activeTabIndex];
        const showHidden = state.preferences.general.showHiddenFiles;
        const files = getProcessedFiles(sourceTab.files, state[sourceSide].layout, sourceTab.filterQuery, showHidden);
        const sources = sourceTab.selection.length > 0
            ? sourceTab.selection.map(i => `${sourceTab.path === "/" ? "" : sourceTab.path}/${files[i].name}`)
            : [`${sourceTab.path === "/" ? "" : sourceTab.path}/${files[sourceTab.cursorIndex].name}`];
        if (sources.length === 0) return;
        state.requestConfirmation("Move", `Move ${sources.length} items?`, async (_option) => {
            try { 
                await invoke('move_items_with_progress', { 
                    id: Math.random().toString(36), 
                    sources, 
                    destPath: destTab.path 
                }); 
                get().refreshPaths([sourceTab.path, destTab.path]); 
            } catch (e) { state.setOperationError(`${e}`); }
        }, true);
    }
  };

  const operationStatusActions = {
    showOperationStatus: (message: string) => set(() => ({ operationStatus: { show: true, message, isError: false, progress: null, conflict: null } })),
    hideOperationStatus: () => set(() => ({ operationStatus: { show: false, message: '', isError: false, progress: null, conflict: null } })),
    setOperationError: (message: string) => set(() => ({ operationStatus: { show: true, message, isError: true, progress: null, conflict: null } })),
    updateProgress: (progress: ProgressInfo) => set((state) => {
        return {
            operationStatus: { ...state.operationStatus, show: true, progress },
            fileOperations: state.fileOperations.map(op => 
                op.id === progress.id 
                ? { ...op, current: progress.current, total: progress.total > 0 ? progress.total : op.total, currentPath: progress.path } 
                : op
            )
        };
    }),
    setConflict: (conflict: ConflictInfo | null) => set((state) => ({ operationStatus: { ...state.operationStatus, conflict } })),
    resolveConflict: (id: string, resolution: string) => { invoke('resolve_conflict', { id, resolution }); set((state) => ({ operationStatus: { ...state.operationStatus, conflict: null } })); },
    cancelOperation: () => { const p = get().operationStatus.progress; if(p) invoke('cancel_operation', { id: p.id }); },
    
    addFileOperation: (op: FileOperation) => set((state) => ({ fileOperations: [...state.fileOperations, op] })),
    updateFileOperation: (id: string, updates: Partial<FileOperation>) => set((state) => ({ fileOperations: state.fileOperations.map(op => op.id === id ? { ...op, ...updates } : op) })),
    removeFileOperation: (id: string) => set((state) => ({ fileOperations: state.fileOperations.filter(op => op.id !== id) })),
    cancelFileOperation: (id: string) => { invoke('cancel_operation', { id }); set((state) => ({ fileOperations: state.fileOperations.map(op => op.id === id ? { ...op, status: 'error', error: 'Cancelled' } : op) })); }
  };

  const goToPathModalActions = {
    showGoToPathModal: (initialPath: string) => set(() => ({ goToPathModal: { show: true, initialPath } })),
    hideGoToPathModal: () => set((state) => ({ goToPathModal: { ...state.goToPathModal, show: false } })),
  };

  const hotkeyActions = {
    setHotkey: (actionId: HotkeyAction, keyCombination: string) => set((state) => ({ hotkeys: { ...state.hotkeys, [actionId]: keyCombination } })),
    resetHotkeys: () => set(() => ({ hotkeys: DEFAULT_HOTKEYS })),
  };

  const settingsModalActions = {
    showSettingsModal: () => set(() => ({ settingsModal: { show: true } })),
    hideSettingsModal: () => set((state) => ({ settingsModal: { ...state.settingsModal, show: false } })),
  };

  return {
    ...initialPanelState,
    viewer: initialViewerState,
    editor: initialEditorState,
    search: initialSearchState,
    archive: archiveActions,
    confirmation: initialConfirmationState,
    contextMenu: initialContextMenuState,
    clipboard: initialClipboardState,
    inputModal: initialInputModalState,
    operationStatus: initialOperationStatusState,
    goToPathModal: initialGoToPathModalState,
    hotkeys: initialHotkeyState,
    settingsModal: initialSettingsModalState,
    multiRename: initialMultiRenameState,
    fileOperations: [],
    globalHistory: initialGlobalHistory,
    hotlist: initialHotlist,
    
    quickView: false,
    
    ...panelActions,
    ...tabActions,
    ...navigationActions,
    ...dataActions,
    ...cursorActions,
    ...viewerActions,
    ...editorActions,
    ...searchActions,
    ...multiRenameActions,
    ...historyActions,
    ...persistenceActions,
    ...contextMenuActions,
    ...clipboardActions,
    ...fileCreationActions,
    ...confirmationActions,
    ...inputModalActions,
    ...fileFilteringActions,
    ...dualPaneActions,
    ...operationStatusActions,
    ...goToPathModalActions,
    ...hotkeyActions,
    ...settingsModalActions,
  };
});
