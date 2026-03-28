/**
 * TEST SUITE: Zustand Store Edge Cases
 * Tests boundary conditions, unusual inputs, and defensive behavior
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(() => Promise.resolve()),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(),
}));

import { useStore } from './index';
import { TabState } from './types';
import { DEFAULT_HOTKEYS, DEFAULT_LAYOUT, DEFAULT_PREFERENCES, createTab } from './constants';

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
    left: { tabs: [makeTab('/')], activeTabIndex: 0, layout: { ...DEFAULT_LAYOUT } },
    right: { tabs: [makeTab('/')], activeTabIndex: 0, layout: { ...DEFAULT_LAYOUT } },
    activeSide: 'left',
    quickView: false,
    preferences: { ...DEFAULT_PREFERENCES },
    hotkeys: { ...DEFAULT_HOTKEYS },
    globalHistory: [],
    hotlist: [],
    viewer: { show: false, title: '', content: '', loading: false, error: null, isImage: false },
    editor: { show: false, title: '', path: '', content: '', loading: false, error: null, dirty: false },
    search: { show: false, query: '', searchContent: false, searchMode: 'substring', results: [], loading: false, error: null },
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

// --- NAVIGATION EDGE CASES ---

describe('Navigation Edge Cases', () => {
  beforeEach(resetStore);

  it('setPath with empty string does not crash', () => {
    expect(() => useStore.getState().setPath('left', '')).not.toThrow();
  });

  it('setPath with "/" stays at root', () => {
    useStore.getState().setPath('left', '/');
    const tab = useStore.getState().left.tabs[0];
    expect(tab.path).toBe('/');
  });

  it('setPath to same path is no-op (no duplicate history)', () => {
    useStore.getState().setPath('left', '/test');
    const historyBefore = useStore.getState().left.tabs[0].history.length;
    useStore.getState().setPath('left', '/test');
    const historyAfter = useStore.getState().left.tabs[0].history.length;
    expect(historyAfter).toBe(historyBefore);
  });

  it('goBack at start of history is no-op', () => {
    const pathBefore = useStore.getState().left.tabs[0].path;
    useStore.getState().goBack('left');
    const pathAfter = useStore.getState().left.tabs[0].path;
    expect(pathAfter).toBe(pathBefore);
  });

  it('goForward at end of history is no-op', () => {
    const pathBefore = useStore.getState().left.tabs[0].path;
    useStore.getState().goForward('left');
    const pathAfter = useStore.getState().left.tabs[0].path;
    expect(pathAfter).toBe(pathBefore);
  });

  it('goBack then goForward returns to same path', () => {
    useStore.getState().setPath('left', '/first');
    useStore.getState().setPath('left', '/second');
    const pathAtSecond = useStore.getState().left.tabs[0].path;
    expect(pathAtSecond).toBe('/second');

    useStore.getState().goBack('left');
    expect(useStore.getState().left.tabs[0].path).toBe('/first');

    useStore.getState().goForward('left');
    expect(useStore.getState().left.tabs[0].path).toBe('/second');
  });

  it('setPath clears forward history (branch point)', () => {
    useStore.getState().setPath('left', '/a');
    useStore.getState().setPath('left', '/b');
    useStore.getState().setPath('left', '/c');

    // Go back twice
    useStore.getState().goBack('left');
    useStore.getState().goBack('left');
    expect(useStore.getState().left.tabs[0].path).toBe('/a');

    // Set new path — should clear forward history (/b, /c)
    useStore.getState().setPath('left', '/d');
    const tab = useStore.getState().left.tabs[0];
    expect(tab.path).toBe('/d');

    // goForward should be no-op now
    useStore.getState().goForward('left');
    expect(useStore.getState().left.tabs[0].path).toBe('/d');
  });
});

// --- TAB MANAGEMENT EDGE CASES ---

describe('Tab Management Edge Cases', () => {
  beforeEach(resetStore);

  it('addTab with empty path defaults correctly', () => {
    expect(() => useStore.getState().addTab('left', '')).not.toThrow();
    const tabs = useStore.getState().left.tabs;
    expect(tabs.length).toBe(2);
  });

  it('closeTab when 1 tab creates new "/" tab', () => {
    expect(useStore.getState().left.tabs.length).toBe(1);
    useStore.getState().closeTab('left', 0);
    const tabs = useStore.getState().left.tabs;
    expect(tabs.length).toBe(1);
    expect(tabs[0].path).toBe('/');
  });

  it('closeTab adjusts activeTabIndex correctly', () => {
    useStore.getState().addTab('left', '/tab1');
    useStore.getState().addTab('left', '/tab2');
    // activeTabIndex is now 2 (last added tab)
    expect(useStore.getState().left.activeTabIndex).toBe(2);

    // Close tab at index 0 — activeTabIndex should decrease by 1
    useStore.getState().closeTab('left', 0);
    expect(useStore.getState().left.activeTabIndex).toBe(1);
  });

  it('setActiveTab with out-of-bounds index does not crash', () => {
    expect(() => useStore.getState().setActiveTab('left', 999)).not.toThrow();
    expect(() => useStore.getState().setActiveTab('left', -1)).not.toThrow();
  });

  it('moveTab to same panel reorders', () => {
    useStore.getState().addTab('left', '/tab1');
    useStore.getState().addTab('left', '/tab2');
    // 3 tabs: [/], [/tab1], [/tab2]

    const pathAtIndex0 = useStore.getState().left.tabs[0].path;
    expect(() => useStore.getState().moveTab('left', 0, 'left', 2)).not.toThrow();
    // Tab that was at index 0 should now be elsewhere
    const tabs = useStore.getState().left.tabs;
    expect(tabs.length).toBe(3);
  });

  it('moveTab to other panel moves correctly', () => {
    useStore.getState().addTab('left', '/moveme');
    const leftCountBefore = useStore.getState().left.tabs.length;
    const rightCountBefore = useStore.getState().right.tabs.length;

    useStore.getState().moveTab('left', 1, 'right');
    const leftCountAfter = useStore.getState().left.tabs.length;
    const rightCountAfter = useStore.getState().right.tabs.length;

    expect(leftCountAfter).toBe(leftCountBefore - 1);
    expect(rightCountAfter).toBe(rightCountBefore + 1);
  });
});

// --- SORT EDGE CASES ---

describe('Sort Edge Cases', () => {
  beforeEach(resetStore);

  it('setSort toggles direction on same column', () => {
    // Default is name + asc
    expect(useStore.getState().left.layout.sortColumn).toBe('name');
    expect(useStore.getState().left.layout.sortDirection).toBe('asc');

    useStore.getState().setSort('left', 'name');
    expect(useStore.getState().left.layout.sortDirection).toBe('desc');

    useStore.getState().setSort('left', 'name');
    expect(useStore.getState().left.layout.sortDirection).toBe('asc');
  });

  it('setSort changes to desc for size column', () => {
    useStore.getState().setSort('left', 'size');
    expect(useStore.getState().left.layout.sortColumn).toBe('size');
    expect(useStore.getState().left.layout.sortDirection).toBe('desc');
  });

  it('setSort changes to desc for date column', () => {
    useStore.getState().setSort('left', 'date');
    expect(useStore.getState().left.layout.sortColumn).toBe('date');
    expect(useStore.getState().left.layout.sortDirection).toBe('desc');
  });
});

// --- COLUMN WIDTH EDGE CASES ---

describe('Column Width Edge Cases', () => {
  beforeEach(resetStore);

  it('setColumnWidth with 0 is valid (flex)', () => {
    useStore.getState().setColumnWidth('left', 'name', 0);
    expect(useStore.getState().left.layout.columnWidths.name).toBe(0);
  });

  it('setColumnWidth with negative is set as-is (store does not clamp)', () => {
    useStore.getState().setColumnWidth('left', 'name', -10);
    // Store sets value directly — clamping is UI responsibility
    expect(useStore.getState().left.layout.columnWidths.name).toBe(-10);
  });
});

// --- SELECTION EDGE CASES ---

describe('Selection Edge Cases', () => {
  beforeEach(resetStore);

  it('setSelection with empty array clears selection', () => {
    useStore.getState().setSelection('left', [1, 2, 3]);
    expect(useStore.getState().left.tabs[0].selection).toEqual([1, 2, 3]);

    useStore.getState().setSelection('left', []);
    expect(useStore.getState().left.tabs[0].selection).toEqual([]);
  });

  it('setSelection with duplicates handles correctly', () => {
    useStore.getState().setSelection('left', [1, 1, 2, 2]);
    const selection = useStore.getState().left.tabs[0].selection;
    expect(selection).toEqual([1, 1, 2, 2]); // Store stores as-is
  });

  it('setCursor with -1 (parent row) is valid', () => {
    useStore.getState().setCursor('left', -1);
    expect(useStore.getState().left.tabs[0].cursorIndex).toBe(-1);
  });

  it('setCursor with negative < -1 is set as-is', () => {
    useStore.getState().setCursor('left', -5);
    // Store sets directly — boundary enforcement is in moveCursor
    expect(useStore.getState().left.tabs[0].cursorIndex).toBe(-5);
  });

  it('setCursorAndSelection atomic — both set in one call', () => {
    useStore.getState().setCursorAndSelection('left', 5, [3, 4, 5]);
    const tab = useStore.getState().left.tabs[0];
    expect(tab.cursorIndex).toBe(5);
    expect(tab.selection).toEqual([3, 4, 5]);
  });

  it('toggleSelection adds then removes', () => {
    // Set cursor to 0 and toggle
    useStore.getState().setCursor('left', 0);
    useStore.getState().toggleSelection('left');
    expect(useStore.getState().left.tabs[0].selection).toContain(0);

    // Toggle again — should remove
    useStore.getState().toggleSelection('left');
    expect(useStore.getState().left.tabs[0].selection).not.toContain(0);
  });
});

// --- FILTER EDGE CASES ---

describe('Filter Edge Cases', () => {
  beforeEach(resetStore);

  it('setFilterQuery clears selection', () => {
    useStore.getState().setSelection('left', [1, 2, 3]);
    useStore.getState().setFilterQuery('left', 'test');
    expect(useStore.getState().left.tabs[0].selection).toEqual([]);
    expect(useStore.getState().left.tabs[0].filterQuery).toBe('test');
  });

  it('triggerFilterFocus increments signal', () => {
    const before = useStore.getState().left.tabs[0].filterFocusSignal;
    useStore.getState().triggerFilterFocus('left');
    const after = useStore.getState().left.tabs[0].filterFocusSignal;
    expect(after).toBe(before + 1);
  });
});

// --- SEARCH EDGE CASES ---

describe('Search Edge Cases', () => {
  beforeEach(resetStore);

  it('showSearch sets show=true', () => {
    useStore.getState().showSearch();
    expect(useStore.getState().search.show).toBe(true);
  });

  it('hideSearch resets query', () => {
    useStore.getState().showSearch();
    useStore.getState().setSearchQuery('test');
    useStore.getState().hideSearch();
    expect(useStore.getState().search.show).toBe(false);
    expect(useStore.getState().search.query).toBe('');
  });

  it('executeSearch with empty query is no-op', async () => {
    useStore.getState().showSearch();
    useStore.getState().setSearchQuery('');
    await useStore.getState().executeSearch();
    // Should not have started loading since query is empty
    expect(useStore.getState().search.loading).toBe(false);
  });
});

// --- PREFERENCE EDGE CASES ---

describe('Preference Edge Cases', () => {
  beforeEach(resetStore);

  it('setPreference updates nested value', () => {
    useStore.getState().setPreference('general', 'showHiddenFiles', true);
    expect(useStore.getState().preferences.general.showHiddenFiles).toBe(true);

    useStore.getState().setPreference('appearance', 'fontSize', 16);
    expect(useStore.getState().preferences.appearance.fontSize).toBe(16);
  });

  it('toggleQuickView toggles boolean', () => {
    expect(useStore.getState().quickView).toBe(false);
    useStore.getState().toggleQuickView();
    expect(useStore.getState().quickView).toBe(true);
    useStore.getState().toggleQuickView();
    expect(useStore.getState().quickView).toBe(false);
  });
});

// --- HISTORY EDGE CASES ---

describe('History Edge Cases', () => {
  beforeEach(resetStore);

  it('addToHistory deduplicates', () => {
    useStore.getState().addToHistory('/test');
    useStore.getState().addToHistory('/test');
    useStore.getState().addToHistory('/test');
    const history = useStore.getState().globalHistory;
    const testCount = history.filter(p => p === '/test').length;
    expect(testCount).toBe(1);
  });

  it('addToHistory respects max 30', () => {
    for (let i = 0; i < 50; i++) {
      useStore.getState().addToHistory(`/path${i}`);
    }
    expect(useStore.getState().globalHistory.length).toBeLessThanOrEqual(30);
  });

  it('addToHistory respects saveHistoryOnExit=false', () => {
    useStore.getState().setPreference('general', 'saveHistoryOnExit', false);
    useStore.getState().addToHistory('/should-not-add');
    expect(useStore.getState().globalHistory).toEqual([]);
  });
});

// --- HOTLIST EDGE CASES ---

describe('Hotlist Edge Cases', () => {
  beforeEach(resetStore);

  it('addToHotlist deduplicates', () => {
    useStore.getState().addToHotlist('/fav');
    useStore.getState().addToHotlist('/fav');
    const count = useStore.getState().hotlist.filter(p => p === '/fav').length;
    expect(count).toBe(1);
  });

  it('removeFromHotlist removes correctly', () => {
    useStore.getState().addToHotlist('/fav');
    expect(useStore.getState().hotlist).toContain('/fav');
    useStore.getState().removeFromHotlist('/fav');
    expect(useStore.getState().hotlist).not.toContain('/fav');
  });

  it('removeFromHotlist with nonexistent is no-op', () => {
    const before = [...useStore.getState().hotlist];
    useStore.getState().removeFromHotlist('/nonexistent');
    expect(useStore.getState().hotlist).toEqual(before);
  });
});

// --- HOTKEY EDGE CASES ---

describe('Hotkey Edge Cases', () => {
  beforeEach(resetStore);

  it('setHotkey updates specific hotkey', () => {
    useStore.getState().setHotkey('toggle_side', 'Ctrl+Tab');
    expect(useStore.getState().hotkeys['toggle_side']).toBe('Ctrl+Tab');
  });

  it('resetHotkeys restores all defaults', () => {
    useStore.getState().setHotkey('toggle_side', 'Ctrl+Tab');
    useStore.getState().setHotkey('go_up_dir', 'Alt+Up');
    useStore.getState().resetHotkeys();
    expect(useStore.getState().hotkeys).toEqual(DEFAULT_HOTKEYS);
  });
});

// --- FILE CREATION EDGE CASES ---

describe('File Creation Edge Cases', () => {
  beforeEach(resetStore);

  it('createNewFile with empty name is no-op', async () => {
    await useStore.getState().createNewFile('left', '');
    // Should not have shown any operation status for success
    expect(useStore.getState().operationStatus.show).toBe(false);
  });

  it('createNewFile with ".." name shows error', async () => {
    await useStore.getState().createNewFile('left', '..');
    expect(useStore.getState().operationStatus.isError).toBe(true);
  });

  it('createNewFile with special chars shows error', async () => {
    await useStore.getState().createNewFile('left', 'file<name');
    expect(useStore.getState().operationStatus.isError).toBe(true);
  });

  it('createNewFile with "." name shows error', async () => {
    await useStore.getState().createNewFile('left', '.');
    expect(useStore.getState().operationStatus.isError).toBe(true);
  });

  it('createNewFile with very long name shows error', async () => {
    const longName = 'a'.repeat(300);
    await useStore.getState().createNewFile('left', longName);
    expect(useStore.getState().operationStatus.isError).toBe(true);
  });

  it('createNewFile with pipe character shows error', async () => {
    await useStore.getState().createNewFile('left', 'file|name');
    // Pipe is not in the invalid chars regex [<>:"|?*] — check the actual char
    // The store checks for <, >, :, ", |, ?, * via /[<>:"|?*\x00-\x1f]/
    expect(useStore.getState().operationStatus.isError).toBe(true);
  });

  it('createNewFile with null bytes shows error', async () => {
    await useStore.getState().createNewFile('left', 'file\x00name');
    expect(useStore.getState().operationStatus.isError).toBe(true);
  });
});

// --- MISC STATE EDGE CASES ---

describe('Misc State Edge Cases', () => {
  beforeEach(resetStore);

  it('swapPanes exchanges left and right', () => {
    useStore.getState().setPath('left', '/left-path');
    useStore.getState().setPath('right', '/right-path');

    const leftPath = useStore.getState().left.tabs[0].path;
    const rightPath = useStore.getState().right.tabs[0].path;

    useStore.getState().swapPanes();

    expect(useStore.getState().left.tabs[0].path).toBe(rightPath);
    expect(useStore.getState().right.tabs[0].path).toBe(leftPath);
  });

  it('setActiveSide switches side', () => {
    useStore.getState().setActiveSide('right');
    expect(useStore.getState().activeSide).toBe('right');
    useStore.getState().setActiveSide('left');
    expect(useStore.getState().activeSide).toBe('left');
  });

  it('refreshPanel increments refreshVersion', () => {
    const before = useStore.getState().left.tabs[0].refreshVersion;
    useStore.getState().refreshPanel('left');
    const after = useStore.getState().left.tabs[0].refreshVersion;
    expect(after).toBe(before + 1);
  });

  it('setLoading sets loading on active tab', () => {
    useStore.getState().setLoading('left', true);
    expect(useStore.getState().left.tabs[0].loading).toBe(true);
    useStore.getState().setLoading('left', false);
    expect(useStore.getState().left.tabs[0].loading).toBe(false);
  });

  it('setError sets error and clears loading', () => {
    useStore.getState().setLoading('left', true);
    useStore.getState().setError('left', 'Something broke');
    const tab = useStore.getState().left.tabs[0];
    expect(tab.error).toBe('Something broke');
    expect(tab.loading).toBe(false);
  });
});
