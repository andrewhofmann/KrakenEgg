export interface FileInfo {
  name: string;
  is_dir: boolean;
  size: number;
  modified_at?: number;
  created_at?: number;
  permissions?: number;
  extension?: string;
  is_symlink?: boolean;
}

export type SortColumn = 'name' | 'ext' | 'size' | 'date';
export type SortDirection = 'asc' | 'desc';

export interface PaneLayout {
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  columns: SortColumn[];
  columnWidths: Record<SortColumn, number>;
}

export interface TabState {
  id: string;
  path: string;
  files: FileInfo[];
  selection: number[]; 
  cursorIndex: number; 
  loading: boolean;
  error: string | null;
  refreshVersion: number;
  filterQuery: string; 
  filterFocusSignal: number;
  showFilterWidget: boolean;
  history: string[];
  historyIndex: number;
}

export interface ViewerState { show: boolean; title: string; content: string; loading: boolean; error: string | null; isImage: boolean; }
export interface EditorState { show: boolean; title: string; path: string; content: string; loading: boolean; error: string | null; dirty: boolean; }
export interface SearchState { show: boolean; query: string; searchContent: boolean; results: FileInfo[]; loading: boolean; error: string | null; }
export interface ConfirmationState { show: boolean; title: string; message: string; showConflictOptions: boolean; onConfirm: (option?: string) => void; }
export interface MultiRenameState { show: boolean; files: string[]; }
export interface ContextMenuItem { label: string; action: () => void; disabled?: boolean; }
export interface ContextMenuState { show: boolean; x: number; y: number; items: ContextMenuItem[]; }
export interface ClipboardState { type: 'files' | 'text' | null; items: string[] | string | null; operation: 'copy' | 'cut' | null; sourcePanel: 'left' | 'right' | null; }
export interface InputModalState { show: boolean; title: string; message: string; initialValue: string; onConfirm: (value: string) => void; }
export interface ProgressInfo { id: string; current: number; total: number; path: string; bytes_done: number; bytes_total: number; }
export interface ConflictInfo { id: string; source: string; dest: string; is_dir: boolean; }
export interface OperationStatusState { show: boolean; message: string; isError: boolean; progress: ProgressInfo | null; conflict: ConflictInfo | null; }
export interface GoToPathModalState { show: boolean; initialPath: string; }
export interface SettingsModalState { show: boolean; }

export interface Preferences {
    general: {
        showHiddenFiles: boolean;
        confirmDelete: boolean;
        saveHistoryOnExit: boolean;
    };
    appearance: {
        fontSize: number;
        rowHeight: number;
        showGridLines: boolean;
        compactMode: boolean;
    };
    behavior: {
        mouseSelection: 'standard' | 'commander';
    };
}

export type HotkeyAction =
  'toggle_side' | 'go_up_dir' | 'go_back' | 'go_forward' | 'open_search' |
  'new_file' | 'new_folder' | 'copy' | 'cut' | 'paste' | 'delete' | 'rename' |
  'view_file' | 'edit_file' | 'compress_selection' | 'extract_selection' |
  'select_all' | 'invert_selection' | 'select_by_pattern' | 'deselect_all' |
  'goto_path_modal' | 'open_settings' | 'copy_to_opposite' | 'move_to_opposite' | 'refresh_panel' | 'swap_panes' |
  'toggle_quick_view' | 'multi_rename'; 

export interface HotkeyState { [key: string]: string; }

export interface FileOperation {
    id: string;
    type: string; 
    status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
    current: number;
    total: number;
    currentPath?: string;
    error?: string;
}

export interface PanelState {
  tabs: TabState[];
  activeTabIndex: number;
  layout: PaneLayout;
}

export interface AppState {
  left: PanelState;
  right: PanelState;
  activeSide: 'left' | 'right';
  quickView: boolean;
  preferences: Preferences;

  setActiveSide: (side: 'left' | 'right') => void;
  swapPanes: () => void;
  toggleQuickView: () => void;
  setPreference: <K extends keyof Preferences, S extends keyof Preferences[K]>(category: K, key: S, value: Preferences[K][S]) => void;
  
  // Tab Management
  addTab: (side: 'left' | 'right', path: string) => void;
  closeTab: (side: 'left' | 'right', index?: number) => void;
  setActiveTab: (side: 'left' | 'right', index: number) => void;
  moveTab: (fromSide: 'left' | 'right', fromIndex: number, toSide: 'left' | 'right', toIndex?: number) => void;
  setTabs: (side: 'left' | 'right', tabs: TabState[]) => void;

  // Navigation
  setPath: (side: 'left' | 'right', path: string) => void;
  goBack: (side: 'left' | 'right') => void;
  goForward: (side: 'left' | 'right') => void;

  // Data
  setFiles: (side: 'left' | 'right', files: FileInfo[]) => void;
  setLoading: (side: 'left' | 'right', loading: boolean) => void;
  setError: (side: 'left' | 'right', error: string | null) => void;
  setSelection: (side: 'left' | 'right', selection: number[]) => void;
  refreshPanel: (side: 'left' | 'right') => void;
  refreshPaths: (paths: string[]) => void;
  
  // Sorting & Layout
  setSort: (side: 'left' | 'right', column: SortColumn) => void;
  setColumnOrder: (side: 'left' | 'right', order: SortColumn[]) => void;
  setColumnWidth: (side: 'left' | 'right', column: SortColumn, width: number) => void;

  // Cursor
  moveCursor: (side: 'left' | 'right', delta: number) => void;
  setCursor: (side: 'left' | 'right', index: number) => void;
  toggleSelection: (side: 'left' | 'right') => void;

  viewer: ViewerState; setViewerContent: (title: string, content: string, isImage: boolean) => void; showViewer: (title: string, path: string) => Promise<void>; hideViewer: () => void;
  editor: EditorState; showEditor: (title: string, path: string) => Promise<void>; hideEditor: () => void; setEditorContent: (content: string) => void; saveEditorContent: () => Promise<void>;
  search: SearchState; showSearch: () => void; hideSearch: () => void; setSearchQuery: (query: string) => void; setSearchContent: (enabled: boolean) => void; executeSearch: () => Promise<void>;
  archive: {
      compressSelection: (side: 'left' | 'right') => void;
      extractSelection: (side: 'left' | 'right') => Promise<void>;
  };
  confirmation: ConfirmationState; requestConfirmation: (title: string, message: string, onConfirm: (option?: string) => void, showConflictOptions?: boolean) => void; closeConfirmation: () => void;
  contextMenu: ContextMenuState; showContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void; hideContextMenu: () => void;
  clipboard: ClipboardState; setClipboard: (type: ClipboardState['type'], items: ClipboardState['items'], operation: ClipboardState['operation'], sourcePanel: ClipboardState['sourcePanel']) => void; clearClipboard: () => void; copySelectedFiles: (side: 'left' | 'right') => void; cutSelectedFiles: (side: 'left' | 'right') => void; pasteFiles: (side: 'left' | 'right') => Promise<void>; deleteSelectedFiles: (side: 'left' | 'right') => void;
  inputModal: InputModalState; requestInput: (title: string, message: string, initialValue: string, onConfirm: (value: string) => void) => void; closeInputModal: () => void;
  operationStatus: OperationStatusState; showOperationStatus: (message: string) => void; hideOperationStatus: () => void; setOperationError: (message: string) => void; updateProgress: (progress: ProgressInfo) => void; setConflict: (conflict: ConflictInfo | null) => void; resolveConflict: (id: string, resolution: string) => void; cancelOperation: () => void;
  fileOperations: FileOperation[]; addFileOperation: (op: FileOperation) => void; updateFileOperation: (id: string, updates: Partial<FileOperation>) => void; removeFileOperation: (id: string) => void; cancelFileOperation: (id: string) => void;
  goToPathModal: GoToPathModalState; showGoToPathModal: (initialPath: string) => void; hideGoToPathModal: () => void;
  hotkeys: HotkeyState; setHotkey: (actionId: HotkeyAction, keyCombination: string) => void; resetHotkeys: () => void;
  settingsModal: SettingsModalState; showSettingsModal: () => void; hideSettingsModal: () => void;
  multiRename: MultiRenameState;
  openMultiRename: (side: 'left' | 'right') => void;
  closeMultiRename: () => void;

  // History & Hotlist
  globalHistory: string[];
  hotlist: string[];
  addToHistory: (path: string) => void;
  addToHotlist: (path: string) => void;
  removeFromHotlist: (path: string) => void;

  // Persistence
  saveState: () => Promise<void>; loadState: () => Promise<void>;
  
  // File Creation
  createNewFile: (side: 'left' | 'right', fileName: string) => Promise<void>;
  
  // Dual Pane Ops
  copyToOppositePanel: (side: 'left' | 'right') => void;
  moveToOppositePanel: (side: 'left' | 'right') => void;
  
  // Filtering
  setFilterQuery: (side: 'left' | 'right', query: string) => void;
  triggerFilterFocus: (side: 'left' | 'right') => void;
}
