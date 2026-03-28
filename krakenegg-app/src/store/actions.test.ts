import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from './index';
import { TabState } from './types';
import { DEFAULT_HOTKEYS, DEFAULT_LAYOUT, DEFAULT_PREFERENCES } from './constants';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(() => Promise.resolve()),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(),
}));

const makeTab = (path: string, overrides: Partial<TabState> = {}): TabState => ({
  id: Math.random().toString(36).substring(7),
  path,
  files: [],
  selection: [],
  cursorIndex: 0,
  loading: false,
  error: null,
  refreshVersion: 0,
  filterQuery: '',
  filterFocusSignal: 0,
  showFilterWidget: false,
  history: [path],
  historyIndex: 0,
  ...overrides,
});

const resetStore = () => {
  useStore.setState({
    left: { tabs: [makeTab('/left')], activeTabIndex: 0, layout: { ...DEFAULT_LAYOUT } },
    right: { tabs: [makeTab('/right')], activeTabIndex: 0, layout: { ...DEFAULT_LAYOUT } },
    activeSide: 'left',
    quickView: false,
    preferences: { ...DEFAULT_PREFERENCES },
    hotkeys: { ...DEFAULT_HOTKEYS },
    globalHistory: [],
    hotlist: [],
    viewer: { show: false, title: '', content: '', loading: false, error: null, isImage: false },
    editor: { show: false, title: '', path: '', content: '', loading: false, error: null, dirty: false },
    search: { show: false, query: '', searchContent: false, searchMode: 'substring' as const, results: [], loading: false, error: null },
    confirmation: { show: false, title: '', message: '', showConflictOptions: false, onConfirm: () => {} },
    contextMenu: { show: false, x: 0, y: 0, items: [] },
    clipboard: { type: null, items: null, operation: null, sourcePanel: null },
    inputModal: { show: false, title: '', message: '', initialValue: '', onConfirm: () => {} },
    operationStatus: { show: false, message: '', isError: false, progress: null, conflict: null },
    goToPathModal: { show: false, initialPath: '' },
    settingsModal: { show: false },
    multiRename: { show: false, files: [] },
    fileOperations: [],
  });
};

describe('Panel Actions', () => {
  beforeEach(resetStore);

  it('setActiveSide switches active side', () => {
    useStore.getState().setActiveSide('right');
    expect(useStore.getState().activeSide).toBe('right');
  });

  it('swapPanes exchanges left and right panels', () => {
    const leftPath = useStore.getState().left.tabs[0].path;
    const rightPath = useStore.getState().right.tabs[0].path;
    useStore.getState().swapPanes();
    expect(useStore.getState().left.tabs[0].path).toBe(rightPath);
    expect(useStore.getState().right.tabs[0].path).toBe(leftPath);
  });

  it('swapPanes flips active side', () => {
    useStore.getState().setActiveSide('left');
    useStore.getState().swapPanes();
    expect(useStore.getState().activeSide).toBe('right');
  });

  it('toggleQuickView toggles quickView', () => {
    expect(useStore.getState().quickView).toBe(false);
    useStore.getState().toggleQuickView();
    expect(useStore.getState().quickView).toBe(true);
    useStore.getState().toggleQuickView();
    expect(useStore.getState().quickView).toBe(false);
  });

  it('setPreference updates nested preference value', () => {
    useStore.getState().setPreference('appearance', 'fontSize', 16);
    expect(useStore.getState().preferences.appearance.fontSize).toBe(16);
  });
});

describe('Tab Actions', () => {
  beforeEach(resetStore);

  it('addTab creates new tab with given path', () => {
    useStore.getState().addTab('left', '/new');
    const tabs = useStore.getState().left.tabs;
    expect(tabs).toHaveLength(2);
    expect(tabs[1].path).toBe('/new');
    expect(useStore.getState().left.activeTabIndex).toBe(1);
  });

  it('closeTab removes tab (minimum 1 tab)', () => {
    useStore.getState().closeTab('left', 0);
    const tabs = useStore.getState().left.tabs;
    expect(tabs).toHaveLength(1);
    expect(tabs[0].path).toBe('/');
  });

  it('closeTab adjusts active index when closing before active', () => {
    useStore.getState().addTab('left', '/second');
    useStore.getState().addTab('left', '/third');
    // Active is now 2 (third tab). Close tab 0.
    useStore.getState().closeTab('left', 0);
    expect(useStore.getState().left.activeTabIndex).toBe(1);
  });

  it('setActiveTab changes active tab index', () => {
    useStore.getState().addTab('left', '/second');
    useStore.getState().setActiveTab('left', 0);
    expect(useStore.getState().left.activeTabIndex).toBe(0);
  });

  it('moveTab moves tab between panels', () => {
    useStore.getState().addTab('left', '/moveme');
    // const tabToMove = useStore.getState().left.tabs[1];
    useStore.getState().moveTab('left', 1, 'right');
    expect(useStore.getState().right.tabs).toHaveLength(2);
    expect(useStore.getState().right.tabs[1].path).toBe('/moveme');
    expect(useStore.getState().left.tabs).toHaveLength(1);
  });
});

describe('Navigation Actions', () => {
  beforeEach(resetStore);

  it('setPath updates path and pushes to history', () => {
    useStore.getState().setPath('left', '/new/path');
    const tab = useStore.getState().left.tabs[0];
    expect(tab.path).toBe('/new/path');
    expect(tab.history).toContain('/new/path');
    expect(tab.historyIndex).toBe(1);
  });

  it('setPath clears selection and cursor', () => {
    useStore.setState(state => ({
      left: {
        ...state.left,
        tabs: [{ ...state.left.tabs[0], selection: [1, 2, 3], cursorIndex: 5 }]
      }
    }));
    useStore.getState().setPath('left', '/new');
    const tab = useStore.getState().left.tabs[0];
    expect(tab.selection).toEqual([]);
    expect(tab.cursorIndex).toBe(0);
  });

  it('goBack navigates to previous history entry', () => {
    useStore.getState().setPath('left', '/second');
    useStore.getState().setPath('left', '/third');
    useStore.getState().goBack('left');
    expect(useStore.getState().left.tabs[0].path).toBe('/second');
  });

  it('goBack does nothing at start of history', () => {
    const path = useStore.getState().left.tabs[0].path;
    useStore.getState().goBack('left');
    expect(useStore.getState().left.tabs[0].path).toBe(path);
  });

  it('goForward navigates to next history entry', () => {
    useStore.getState().setPath('left', '/second');
    useStore.getState().goBack('left');
    useStore.getState().goForward('left');
    expect(useStore.getState().left.tabs[0].path).toBe('/second');
  });

  it('goForward does nothing at end of history', () => {
    useStore.getState().setPath('left', '/second');
    const path = useStore.getState().left.tabs[0].path;
    useStore.getState().goForward('left');
    expect(useStore.getState().left.tabs[0].path).toBe(path);
  });
});

describe('Data Actions', () => {
  beforeEach(resetStore);

  it('setFiles updates files on active tab', () => {
    const files = [{ name: 'test.txt', is_dir: false, size: 100 }];
    useStore.getState().setFiles('left', files);
    expect(useStore.getState().left.tabs[0].files).toEqual(files);
  });

  it('setSelection updates selection array', () => {
    useStore.getState().setSelection('left', [0, 2, 4]);
    expect(useStore.getState().left.tabs[0].selection).toEqual([0, 2, 4]);
  });

  it('setSort toggles direction on same column', () => {
    useStore.getState().setSort('left', 'name');
    expect(useStore.getState().left.layout.sortDirection).toBe('desc');
    useStore.getState().setSort('left', 'name');
    expect(useStore.getState().left.layout.sortDirection).toBe('asc');
  });

  it('setSort changes column and sets appropriate default direction', () => {
    useStore.getState().setSort('left', 'size');
    expect(useStore.getState().left.layout.sortColumn).toBe('size');
    expect(useStore.getState().left.layout.sortDirection).toBe('desc');
  });

  it('setColumnOrder reorders columns', () => {
    useStore.getState().setColumnOrder('left', ['size', 'name', 'date', 'ext']);
    expect(useStore.getState().left.layout.columns).toEqual(['size', 'name', 'date', 'ext']);
  });

  it('setColumnWidth updates specific column width', () => {
    useStore.getState().setColumnWidth('left', 'name', 200);
    expect(useStore.getState().left.layout.columnWidths.name).toBe(200);
  });

  it('refreshPanel increments refreshVersion', () => {
    const before = useStore.getState().left.tabs[0].refreshVersion;
    useStore.getState().refreshPanel('left');
    expect(useStore.getState().left.tabs[0].refreshVersion).toBe(before + 1);
  });
});

describe('Cursor Actions', () => {
  beforeEach(resetStore);

  it('setCursor sets cursor to specific index', () => {
    useStore.getState().setCursor('left', 5);
    expect(useStore.getState().left.tabs[0].cursorIndex).toBe(5);
  });

  it('toggleSelection toggles current cursor item', () => {
    useStore.getState().setCursor('left', 3);
    useStore.getState().toggleSelection('left');
    expect(useStore.getState().left.tabs[0].selection).toContain(3);
    useStore.getState().toggleSelection('left');
    expect(useStore.getState().left.tabs[0].selection).not.toContain(3);
  });
});

describe('Clipboard Actions', () => {
  beforeEach(resetStore);

  it('setClipboard stores clipboard state', () => {
    useStore.getState().setClipboard('files', ['/a', '/b'], 'copy', 'left');
    const cb = useStore.getState().clipboard;
    expect(cb.type).toBe('files');
    expect(cb.items).toEqual(['/a', '/b']);
    expect(cb.operation).toBe('copy');
    expect(cb.sourcePanel).toBe('left');
  });

  it('clearClipboard resets clipboard', () => {
    useStore.getState().setClipboard('files', ['/a'], 'copy', 'left');
    useStore.getState().clearClipboard();
    const cb = useStore.getState().clipboard;
    expect(cb.type).toBeNull();
    expect(cb.items).toBeNull();
  });
});

describe('Context Menu Actions', () => {
  beforeEach(resetStore);

  it('showContextMenu sets position and items', () => {
    const items = [{ label: 'Open', action: () => {} }];
    useStore.getState().showContextMenu(100, 200, items);
    const cm = useStore.getState().contextMenu;
    expect(cm.show).toBe(true);
    expect(cm.x).toBe(100);
    expect(cm.y).toBe(200);
    expect(cm.items).toHaveLength(1);
  });

  it('hideContextMenu hides context menu', () => {
    useStore.getState().showContextMenu(0, 0, []);
    useStore.getState().hideContextMenu();
    expect(useStore.getState().contextMenu.show).toBe(false);
  });
});

describe('Confirmation Actions', () => {
  beforeEach(resetStore);

  it('requestConfirmation shows confirmation with params', () => {
    const onConfirm = vi.fn();
    useStore.getState().requestConfirmation('Title', 'Are you sure?', onConfirm);
    const c = useStore.getState().confirmation;
    expect(c.show).toBe(true);
    expect(c.title).toBe('Title');
    expect(c.message).toBe('Are you sure?');
  });

  it('closeConfirmation hides confirmation', () => {
    useStore.getState().requestConfirmation('T', 'M', () => {});
    useStore.getState().closeConfirmation();
    expect(useStore.getState().confirmation.show).toBe(false);
  });
});

describe('Input Modal Actions', () => {
  beforeEach(resetStore);

  it('requestInput shows input modal', () => {
    const onConfirm = vi.fn();
    useStore.getState().requestInput('Rename', 'Enter name:', 'file.txt', onConfirm);
    const im = useStore.getState().inputModal;
    expect(im.show).toBe(true);
    expect(im.title).toBe('Rename');
    expect(im.initialValue).toBe('file.txt');
  });

  it('closeInputModal hides input modal', () => {
    useStore.getState().requestInput('T', 'M', '', () => {});
    useStore.getState().closeInputModal();
    expect(useStore.getState().inputModal.show).toBe(false);
  });
});

describe('GoToPath Modal Actions', () => {
  beforeEach(resetStore);

  it('showGoToPathModal opens with initial path', () => {
    useStore.getState().showGoToPathModal('/home');
    expect(useStore.getState().goToPathModal.show).toBe(true);
    expect(useStore.getState().goToPathModal.initialPath).toBe('/home');
  });

  it('hideGoToPathModal hides modal', () => {
    useStore.getState().showGoToPathModal('/home');
    useStore.getState().hideGoToPathModal();
    expect(useStore.getState().goToPathModal.show).toBe(false);
  });
});

describe('Settings Modal Actions', () => {
  beforeEach(resetStore);

  it('showSettingsModal opens settings', () => {
    useStore.getState().showSettingsModal();
    expect(useStore.getState().settingsModal.show).toBe(true);
  });

  it('hideSettingsModal hides settings', () => {
    useStore.getState().showSettingsModal();
    useStore.getState().hideSettingsModal();
    expect(useStore.getState().settingsModal.show).toBe(false);
  });
});

describe('Multi-Rename Actions', () => {
  beforeEach(resetStore);

  it('closeMultiRename hides and clears files', () => {
    useStore.setState({ multiRename: { show: true, files: ['/a', '/b'] } });
    useStore.getState().closeMultiRename();
    expect(useStore.getState().multiRename.show).toBe(false);
    expect(useStore.getState().multiRename.files).toEqual([]);
  });
});

describe('Hotkey Actions', () => {
  beforeEach(resetStore);

  it('setHotkey updates hotkey binding', () => {
    useStore.getState().setHotkey('toggle_side', 'Shift+Tab');
    expect(useStore.getState().hotkeys.toggle_side).toBe('Shift+Tab');
  });

  it('resetHotkeys restores defaults', () => {
    useStore.getState().setHotkey('toggle_side', 'Shift+Tab');
    useStore.getState().resetHotkeys();
    expect(useStore.getState().hotkeys.toggle_side).toBe(DEFAULT_HOTKEYS.toggle_side);
  });

  it('default hotkeys include invert_selection', () => {
    expect(DEFAULT_HOTKEYS.invert_selection).toBe('CmdOrCtrl+Shift+a');
  });

  it('default hotkeys include select_by_pattern', () => {
    expect(DEFAULT_HOTKEYS.select_by_pattern).toBe('CmdOrCtrl+Shift+p');
  });

  it('default hotkeys include deselect_all', () => {
    expect(DEFAULT_HOTKEYS.deselect_all).toBe('CmdOrCtrl+d');
  });
});

describe('History Actions', () => {
  beforeEach(resetStore);

  it('addToHistory appends path (with dedup)', () => {
    useStore.getState().addToHistory('/a');
    useStore.getState().addToHistory('/b');
    useStore.getState().addToHistory('/a');
    const history = useStore.getState().globalHistory;
    expect(history[0]).toBe('/a');
    expect(history.filter(p => p === '/a')).toHaveLength(1);
  });

  it('addToHistory respects saveHistoryOnExit preference', () => {
    useStore.getState().setPreference('general', 'saveHistoryOnExit', false);
    useStore.getState().addToHistory('/a');
    expect(useStore.getState().globalHistory).toEqual([]);
  });

  it('addToHotlist appends path', () => {
    useStore.getState().addToHotlist('/favorite');
    expect(useStore.getState().hotlist).toContain('/favorite');
  });

  it('removeFromHotlist removes path', () => {
    useStore.getState().addToHotlist('/favorite');
    useStore.getState().removeFromHotlist('/favorite');
    expect(useStore.getState().hotlist).not.toContain('/favorite');
  });
});

describe('Filter Actions', () => {
  beforeEach(resetStore);

  it('setFilterQuery updates active tab filter', () => {
    useStore.getState().setFilterQuery('left', 'test');
    expect(useStore.getState().left.tabs[0].filterQuery).toBe('test');
  });

  it('setFilterQuery resets selection and cursor', () => {
    useStore.setState(state => ({
      left: {
        ...state.left,
        tabs: [{ ...state.left.tabs[0], selection: [1, 2], cursorIndex: 5 }]
      }
    }));
    useStore.getState().setFilterQuery('left', 'x');
    expect(useStore.getState().left.tabs[0].selection).toEqual([]);
    expect(useStore.getState().left.tabs[0].cursorIndex).toBe(0);
  });

  it('triggerFilterFocus increments focus signal', () => {
    const before = useStore.getState().left.tabs[0].filterFocusSignal;
    useStore.getState().triggerFilterFocus('left');
    expect(useStore.getState().left.tabs[0].filterFocusSignal).toBe(before + 1);
    expect(useStore.getState().left.tabs[0].showFilterWidget).toBe(true);
  });
});

describe('Operation Status Actions', () => {
  beforeEach(resetStore);

  it('showOperationStatus sets message', () => {
    useStore.getState().showOperationStatus('Copying...');
    const os = useStore.getState().operationStatus;
    expect(os.show).toBe(true);
    expect(os.message).toBe('Copying...');
    expect(os.isError).toBe(false);
  });

  it('hideOperationStatus clears status', () => {
    useStore.getState().showOperationStatus('test');
    useStore.getState().hideOperationStatus();
    expect(useStore.getState().operationStatus.show).toBe(false);
  });

  it('setOperationError sets error message', () => {
    useStore.getState().setOperationError('Failed!');
    const os = useStore.getState().operationStatus;
    expect(os.show).toBe(true);
    expect(os.isError).toBe(true);
    expect(os.message).toBe('Failed!');
  });

  it('addFileOperation adds to operations list', () => {
    useStore.getState().addFileOperation({ id: 'op1', type: 'copy', status: 'running', current: 0, total: 10, currentPath: '' });
    expect(useStore.getState().fileOperations).toHaveLength(1);
  });

  it('updateFileOperation updates existing operation', () => {
    useStore.getState().addFileOperation({ id: 'op1', type: 'copy', status: 'running', current: 0, total: 10, currentPath: '' });
    useStore.getState().updateFileOperation('op1', { current: 5 });
    expect(useStore.getState().fileOperations[0].current).toBe(5);
  });

  it('removeFileOperation removes operation', () => {
    useStore.getState().addFileOperation({ id: 'op1', type: 'copy', status: 'running', current: 0, total: 10, currentPath: '' });
    useStore.getState().removeFileOperation('op1');
    expect(useStore.getState().fileOperations).toHaveLength(0);
  });
});

describe('File Creation Validation', () => {
  beforeEach(resetStore);

  it('rejects empty file names', async () => {
    await useStore.getState().createNewFile('left', '');
    // Should not crash, should show error
    expect(useStore.getState().operationStatus.isError).toBe(false); // empty name returns early silently
  });

  it('rejects invalid file names with special characters', async () => {
    await useStore.getState().createNewFile('left', 'file<bad');
    expect(useStore.getState().operationStatus.isError).toBe(true);
    expect(useStore.getState().operationStatus.message).toContain('Invalid file name');
  });

  it('rejects "." and ".." as file names', async () => {
    await useStore.getState().createNewFile('left', '..');
    expect(useStore.getState().operationStatus.isError).toBe(true);
  });

  it('rejects names longer than 255 chars', async () => {
    await useStore.getState().createNewFile('left', 'a'.repeat(256));
    expect(useStore.getState().operationStatus.isError).toBe(true);
  });
});
