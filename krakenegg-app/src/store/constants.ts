import { Preferences, HotkeyState, PaneLayout, TabState, FileInfo } from "./types";

export const DEFAULT_PREFERENCES: Preferences = {
    general: { showHiddenFiles: false, confirmDelete: true, saveHistoryOnExit: true },
    appearance: { fontSize: 13, rowHeight: 22, showGridLines: true, compactMode: false, theme: 'dark' },
    behavior: { mouseSelection: 'standard' }
};

export const DEFAULT_HOTKEYS: HotkeyState = {
  'toggle_side': 'Tab', 'go_up_dir': 'Backspace', 'go_back': 'Alt+ArrowLeft', 'go_forward': 'Alt+ArrowRight',
  'open_search': 'Alt+F7', 'swap_panes': 'CmdOrCtrl+u', 'new_file': 'Shift+F4', 'new_folder': 'F7',
  'copy': 'CmdOrCtrl+c', 'cut': 'CmdOrCtrl+x', 'paste': 'CmdOrCtrl+v', 'delete': 'CmdOrCtrl+Backspace',
  'rename': 'Shift+F6', 'view_file': 'F3', 'edit_file': 'F4',
  'copy_to_opposite': 'F5', 'move_to_opposite': 'F6',
  'compress_selection': 'Alt+F5', 'extract_selection': 'Alt+F9',
  'select_all': 'CmdOrCtrl+a', 'invert_selection': 'CmdOrCtrl+Shift+a', 'select_by_pattern': 'CmdOrCtrl+Shift+p', 'deselect_all': 'CmdOrCtrl+d',
  'goto_path_modal': 'CmdOrCtrl+Shift+g', 'open_settings': 'CmdOrCtrl+,',
  'refresh_panel': 'F2', 'toggle_quick_view': 'Ctrl+q', 'multi_rename': 'CmdOrCtrl+m',
};

export const DEFAULT_LAYOUT: PaneLayout = {
    sortColumn: 'name', sortDirection: 'asc', columns: ['name', 'ext', 'size', 'date'], columnWidths: { name: 0, ext: 45, size: 80, date: 140 },
};

export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif', '.heic', '.heif', '.avif'];

export const createTab = (path: string): TabState => ({
  id: Math.random().toString(36).substring(7),
  path, files: [], selection: [], cursorIndex: 0, loading: false, error: null, refreshVersion: 0, filterQuery: '', filterFocusSignal: 0, showFilterWidget: false, history: [path], historyIndex: 0, previousFolderName: null,
});

export const getExtension = (filename: string) => {
    const parts = filename.split('.');
    return parts.length > 1 && !filename.startsWith('.') ? parts[parts.length - 1].toLowerCase() : "";
};

export const getProcessedFiles = (files: FileInfo[], layout: PaneLayout, filterQuery: string, showHiddenFiles: boolean) => {
  let processed = files;
  
  if (!showHiddenFiles) {
      processed = processed.filter(f => !f.name.startsWith('.'));
  }

  if (filterQuery) {
    processed = processed.filter(f => f.name.toLowerCase().includes(filterQuery.toLowerCase()));
  }
  const folders = processed.filter(f => f.is_dir);
  const regularFiles = processed.filter(f => !f.is_dir);

  const sortFn = (a: FileInfo, b: FileInfo) => {
      let valA: string | number, valB: string | number;
      switch (layout.sortColumn) {
          case 'name': valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
          case 'ext': valA = getExtension(a.name); valB = getExtension(b.name); break;
          case 'size': valA = a.size; valB = b.size; break;
          case 'date': valA = a.modified_at || 0; valB = b.modified_at || 0; break;
          default: valA = a.name.toLowerCase(); valB = b.name.toLowerCase();
      }
      if (valA < valB) return layout.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return layout.sortDirection === 'asc' ? 1 : -1;
      return 0;
  };
  const dirMul = layout.sortDirection === 'asc' ? 1 : -1;
  folders.sort((a, b) => dirMul * a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  regularFiles.sort(sortFn);
  return [...folders, ...regularFiles];
};
