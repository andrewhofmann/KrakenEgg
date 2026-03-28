import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './index';
import { DEFAULT_LAYOUT, DEFAULT_PREFERENCES } from './constants';
import { FileInfo, TabState } from './types';

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

const makeFile = (name: string, is_dir = false): FileInfo => ({
  name, is_dir, size: 100, modified_at: 1000,
});

const resetStore = () => {
  const leftTab = makeTab('/home/user', {
    files: [
      makeFile('file1.txt'),
      makeFile('file2.txt'),
      makeFile('folder1', true),
      makeFile('..', true),
    ],
    cursorIndex: 0,
  });
  const rightTab = makeTab('/tmp', {
    files: [makeFile('other.txt')],
    cursorIndex: 0,
  });

  useStore.setState({
    left: { tabs: [leftTab], activeTabIndex: 0, layout: DEFAULT_LAYOUT },
    right: { tabs: [rightTab], activeTabIndex: 0, layout: DEFAULT_LAYOUT },
    activeSide: 'left',
    quickView: false,
    preferences: DEFAULT_PREFERENCES,
    clipboard: { type: null, items: null, operation: null, sourcePanel: null },
    operationStatus: { show: false, message: '', isError: false, progress: null, conflict: null },
    fileOperations: [],
    goToPathModal: { show: false, initialPath: '' },
    settingsModal: { show: false },
    multiRename: { show: false, files: [] },
    confirmation: { show: false, title: '', message: '', showConflictOptions: false, onConfirm: () => {} },
  });
};

describe('Clipboard Operations', () => {
  beforeEach(resetStore);

  it('copySelectedFiles sets clipboard type to files', () => {
    useStore.getState().copySelectedFiles('left');
    expect(useStore.getState().clipboard.type).toBe('files');
  });

  it('copySelectedFiles sets operation to copy', () => {
    useStore.getState().copySelectedFiles('left');
    expect(useStore.getState().clipboard.operation).toBe('copy');
  });

  it('copySelectedFiles sets sourcePanel correctly', () => {
    useStore.getState().copySelectedFiles('left');
    expect(useStore.getState().clipboard.sourcePanel).toBe('left');
  });

  it('copySelectedFiles with cursor file (no selection)', () => {
    useStore.getState().copySelectedFiles('left');
    const items = useStore.getState().clipboard.items as string[];
    expect(items).toHaveLength(1);
    // cursorIndex 0, files sorted: folders first (folder1), then file1.txt, file2.txt
    // .. is filtered by showHiddenFiles=false? No, ".." starts with "." and showHiddenFiles is false
    // Actually ".." starts with "." so it gets filtered. So files = [folder1, file1.txt, file2.txt]
    // cursorIndex 0 = folder1
    expect(items[0]).toBe('/home/user/folder1');
  });

  it('copySelectedFiles builds correct full paths with selection', () => {
    // Set selection to indices 1 and 2
    const leftPanel = useStore.getState().left;
    const tabs = [...leftPanel.tabs];
    tabs[0] = { ...tabs[0], selection: [1, 2] };
    useStore.setState({ left: { ...leftPanel, tabs } });

    useStore.getState().copySelectedFiles('left');
    const items = useStore.getState().clipboard.items as string[];
    expect(items).toHaveLength(2);
    // processed files (hidden filtered): folder1, file1.txt, file2.txt
    // selection [1, 2] = file1.txt, file2.txt
    expect(items[0]).toBe('/home/user/file1.txt');
    expect(items[1]).toBe('/home/user/file2.txt');
  });

  it('cutSelectedFiles sets operation to cut', () => {
    useStore.getState().cutSelectedFiles('left');
    expect(useStore.getState().clipboard.operation).toBe('cut');
  });

  it('cutSelectedFiles builds correct paths', () => {
    useStore.getState().cutSelectedFiles('left');
    const items = useStore.getState().clipboard.items as string[];
    expect(items).toHaveLength(1);
    expect(items[0]).toBe('/home/user/folder1');
  });

  it('clearClipboard resets all fields to null', () => {
    useStore.getState().copySelectedFiles('left');
    expect(useStore.getState().clipboard.type).toBe('files');
    useStore.getState().clearClipboard();
    const clip = useStore.getState().clipboard;
    expect(clip.type).toBeNull();
    expect(clip.items).toBeNull();
    expect(clip.operation).toBeNull();
    expect(clip.sourcePanel).toBeNull();
  });

  it('setClipboard stores all fields', () => {
    useStore.getState().setClipboard('text', 'hello', 'copy', 'right');
    const clip = useStore.getState().clipboard;
    expect(clip.type).toBe('text');
    expect(clip.items).toBe('hello');
    expect(clip.operation).toBe('copy');
    expect(clip.sourcePanel).toBe('right');
  });

  it('clipboard persists across other state changes', () => {
    useStore.getState().setClipboard('files', ['/a/b'], 'copy', 'left');
    useStore.getState().setActiveSide('right');
    const clip = useStore.getState().clipboard;
    expect(clip.type).toBe('files');
    expect(clip.items).toEqual(['/a/b']);
  });

  it('deleteSelectedFiles with confirmDelete=true shows confirmation', () => {
    useStore.getState().deleteSelectedFiles('left');
    const conf = useStore.getState().confirmation;
    expect(conf.show).toBe(true);
    expect(conf.title).toBe('Delete Files');
  });

  it('deleteSelectedFiles with cursor on ".." is no-op', () => {
    // ".." is hidden (starts with "."), so we need showHiddenFiles = true and set cursor to ".."
    useStore.setState((s) => ({
      preferences: {
        ...s.preferences,
        general: { ...s.preferences.general, showHiddenFiles: true },
      },
    }));
    // With showHiddenFiles=true, files are: ".." (dir), folder1 (dir), file1.txt, file2.txt
    // ".." comes first as a dir sorted alphabetically
    // Set cursor to 0 which should be ".."
    const leftPanel = useStore.getState().left;
    const tabs = [...leftPanel.tabs];
    tabs[0] = { ...tabs[0], cursorIndex: 0 };
    useStore.setState({ left: { ...leftPanel, tabs } });

    useStore.getState().deleteSelectedFiles('left');
    // Should be no-op since cursor is on ".."
    const conf = useStore.getState().confirmation;
    expect(conf.show).toBe(false);
  });

  it('deleteSelectedFiles with empty selection uses cursor file', () => {
    // cursorIndex 0 with hidden files off = folder1
    useStore.getState().deleteSelectedFiles('left');
    const conf = useStore.getState().confirmation;
    expect(conf.show).toBe(true);
    expect(conf.message).toContain('1 items');
  });

  it('deleteSelectedFiles filters out ".." from selection', () => {
    // Enable showHiddenFiles so ".." is visible
    useStore.setState((s) => ({
      preferences: {
        ...s.preferences,
        general: { ...s.preferences.general, showHiddenFiles: true },
      },
    }));
    // With showHiddenFiles=true, processed files: "..", folder1, file1.txt, file2.txt
    // Select indices 0 (..) and 2 (file1.txt)
    const leftPanel = useStore.getState().left;
    const tabs = [...leftPanel.tabs];
    tabs[0] = { ...tabs[0], selection: [0, 2] };
    useStore.setState({ left: { ...leftPanel, tabs } });

    useStore.getState().deleteSelectedFiles('left');
    const conf = useStore.getState().confirmation;
    expect(conf.show).toBe(true);
    // Only 1 item because ".." is filtered out
    expect(conf.message).toContain('1 items');
  });
});

describe('MultiRename Operations', () => {
  beforeEach(resetStore);

  it('openMultiRename with selection populates files', () => {
    const leftPanel = useStore.getState().left;
    const tabs = [...leftPanel.tabs];
    tabs[0] = { ...tabs[0], selection: [1, 2] };
    useStore.setState({ left: { ...leftPanel, tabs } });

    useStore.getState().openMultiRename('left');
    const mr = useStore.getState().multiRename;
    expect(mr.show).toBe(true);
    expect(mr.files).toHaveLength(2);
  });

  it('openMultiRename with cursor file (no selection)', () => {
    useStore.getState().openMultiRename('left');
    const mr = useStore.getState().multiRename;
    expect(mr.show).toBe(true);
    expect(mr.files).toHaveLength(1);
  });

  it('openMultiRename with ".." cursor is no-op', () => {
    // Enable hidden files and set cursor to ".."
    useStore.setState((s) => ({
      preferences: {
        ...s.preferences,
        general: { ...s.preferences.general, showHiddenFiles: true },
      },
    }));
    const leftPanel = useStore.getState().left;
    const tabs = [...leftPanel.tabs];
    tabs[0] = { ...tabs[0], cursorIndex: 0 }; // ".." when hidden shown
    useStore.setState({ left: { ...leftPanel, tabs } });

    useStore.getState().openMultiRename('left');
    const mr = useStore.getState().multiRename;
    expect(mr.show).toBe(false);
  });

  it('closeMultiRename clears files', () => {
    useStore.getState().openMultiRename('left');
    expect(useStore.getState().multiRename.show).toBe(true);
    useStore.getState().closeMultiRename();
    expect(useStore.getState().multiRename.show).toBe(false);
    expect(useStore.getState().multiRename.files).toEqual([]);
  });
});

describe('Operation Status', () => {
  beforeEach(resetStore);

  it('showOperationStatus sets message', () => {
    useStore.getState().showOperationStatus('Copying files...');
    const os = useStore.getState().operationStatus;
    expect(os.show).toBe(true);
    expect(os.message).toBe('Copying files...');
    expect(os.isError).toBe(false);
  });

  it('hideOperationStatus clears all', () => {
    useStore.getState().showOperationStatus('test');
    useStore.getState().hideOperationStatus();
    const os = useStore.getState().operationStatus;
    expect(os.show).toBe(false);
    expect(os.message).toBe('');
    expect(os.isError).toBe(false);
    expect(os.progress).toBeNull();
    expect(os.conflict).toBeNull();
  });

  it('setOperationError sets isError=true', () => {
    useStore.getState().setOperationError('Something broke');
    const os = useStore.getState().operationStatus;
    expect(os.show).toBe(true);
    expect(os.isError).toBe(true);
    expect(os.message).toBe('Something broke');
  });

  it('updateProgress updates progress fields', () => {
    useStore.getState().updateProgress({
      id: 'op1', current: 5, total: 10, path: '/a/b', bytes_done: 500, bytes_total: 1000,
    });
    const os = useStore.getState().operationStatus;
    expect(os.show).toBe(true);
    expect(os.progress).not.toBeNull();
    expect(os.progress!.current).toBe(5);
    expect(os.progress!.total).toBe(10);
  });
});

describe('File Operations list', () => {
  beforeEach(resetStore);

  it('addFileOperation adds to list', () => {
    useStore.getState().addFileOperation({
      id: 'op1', type: 'copy', status: 'pending', current: 0, total: 5,
    });
    expect(useStore.getState().fileOperations).toHaveLength(1);
    expect(useStore.getState().fileOperations[0].id).toBe('op1');
  });

  it('updateFileOperation updates specific operation', () => {
    useStore.getState().addFileOperation({
      id: 'op1', type: 'copy', status: 'pending', current: 0, total: 5,
    });
    useStore.getState().updateFileOperation('op1', { status: 'running', current: 3 });
    const op = useStore.getState().fileOperations[0];
    expect(op.status).toBe('running');
    expect(op.current).toBe(3);
  });

  it('removeFileOperation removes by id', () => {
    useStore.getState().addFileOperation({
      id: 'op1', type: 'copy', status: 'completed', current: 5, total: 5,
    });
    useStore.getState().addFileOperation({
      id: 'op2', type: 'move', status: 'running', current: 1, total: 3,
    });
    useStore.getState().removeFileOperation('op1');
    expect(useStore.getState().fileOperations).toHaveLength(1);
    expect(useStore.getState().fileOperations[0].id).toBe('op2');
  });

  it('cancelFileOperation sets error status', () => {
    useStore.getState().addFileOperation({
      id: 'op1', type: 'copy', status: 'running', current: 2, total: 5,
    });
    useStore.getState().cancelFileOperation('op1');
    const op = useStore.getState().fileOperations[0];
    expect(op.status).toBe('error');
    expect(op.error).toBe('Cancelled');
  });
});

describe('GoToPath Modal', () => {
  beforeEach(resetStore);

  it('showGoToPathModal sets initialPath', () => {
    useStore.getState().showGoToPathModal('/usr/local');
    const modal = useStore.getState().goToPathModal;
    expect(modal.show).toBe(true);
    expect(modal.initialPath).toBe('/usr/local');
  });

  it('hideGoToPathModal hides modal', () => {
    useStore.getState().showGoToPathModal('/usr');
    useStore.getState().hideGoToPathModal();
    expect(useStore.getState().goToPathModal.show).toBe(false);
  });
});

describe('Settings Modal', () => {
  beforeEach(resetStore);

  it('showSettingsModal shows', () => {
    useStore.getState().showSettingsModal();
    expect(useStore.getState().settingsModal.show).toBe(true);
  });

  it('hideSettingsModal hides', () => {
    useStore.getState().showSettingsModal();
    useStore.getState().hideSettingsModal();
    expect(useStore.getState().settingsModal.show).toBe(false);
  });
});
