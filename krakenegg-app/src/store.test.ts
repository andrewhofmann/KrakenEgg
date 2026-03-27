import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore, TabState } from './store';

// Mock the Tauri invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn((command, args) => {
    if (command === 'read_file_content') {
      if (args?.path === '/path/to/error.txt') {
        return Promise.reject('File read error');
      }
      if (args?.path === '/path/to/empty.txt') {
        return Promise.resolve(''); // Empty content
      }
      if (args?.path === '/path/to/non_utf8.bin') {
        return Promise.reject('File contains non-UTF8 characters'); // Simulated error
      }
      return Promise.resolve(`Content of ${args?.path || 'unknown file'}`);
    }
    if (command === 'write_file_content') {
      if (args?.path === '/path/to/write_error.txt') {
        return Promise.reject('File write error');
      }
      return Promise.resolve();
    }
    if (command === 'search_files') {
      if (args?.query === 'fail') {
        return Promise.reject('Search failed');
      }
      return Promise.resolve([
        { name: 'result1.txt', is_dir: false, size: 100 },
        { name: 'result2.txt', is_dir: false, size: 200 }
      ]);
    }
    return Promise.resolve('mocked response');
  }),
}));

// Import the mocked invoke function
import { invoke } from '@tauri-apps/api/core';

const createMockTab = (path: string): TabState => ({
  id: 'test-id',
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
});

describe('KrakenEgg Phase 8 & 9: Features', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useStore.setState({
      left: { 
        tabs: [createMockTab('/start')], 
        activeTabIndex: 0,
        layout: {
            sortColumn: 'name',
            sortDirection: 'asc',
            columns: ['name', 'ext', 'size', 'date'],
            columnWidths: { name: 0, ext: 45, size: 80, date: 140 },
        } 
      },
      activeSide: 'left',
      viewer: { show: false, title: '', content: '', loading: false, error: null, isImage: false },
      editor: { show: false, title: '', path: '', content: '', loading: false, error: null, dirty: false },
      search: { show: false, query: '', searchContent: false, results: [], loading: false, error: null },
      compressSelection: vi.fn(),
      extractSelection: vi.fn(),
      clipboard: { type: null, items: null, operation: null, sourcePanel: null },
      setClipboard: vi.fn(),
      clearClipboard: vi.fn(),
      copySelectedFiles: vi.fn(),
      cutSelectedFiles: vi.fn(),
      pasteFiles: vi.fn(),
      refreshPanel: vi.fn(),
      saveState: vi.fn(),
      loadState: vi.fn(),
      contextMenu: { show: false, x: 0, y: 0, items: [] },
      showContextMenu: vi.fn(),
      hideContextMenu: vi.fn(),
      inputModal: { show: false, title: '', message: '', initialValue: '', onConfirm: vi.fn() },
      requestInput: vi.fn(),
      closeInputModal: vi.fn(),
      createNewFile: vi.fn(),
      operationStatus: { show: false, message: '', isError: false, progress: null, conflict: null },
      showOperationStatus: vi.fn(),
      hideOperationStatus: vi.fn(),
      setOperationError: vi.fn(),
      setFilterQuery: vi.fn(),
    });
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('Search Functionality', () => {
    it('should show search modal', () => {
      const state = useStore.getState();
      state.showSearch();
      expect(useStore.getState().search.show).toBe(true);
    });

    it('should execute search successfully', async () => {
      const state = useStore.getState();
      state.showSearch();
      state.setSearchQuery('test');
      
      await state.executeSearch();
      
      expect(invoke).toHaveBeenCalledWith('search_files', { query: 'test', path: '/start', search_content: false });
      const searchState = useStore.getState().search;
      expect(searchState.loading).toBe(false);
      expect(searchState.results.length).toBe(2);
      expect(searchState.results[0].name).toBe('result1.txt');
    });

    it('should handle search error', async () => {
      const state = useStore.getState();
      state.showSearch();
      state.setSearchQuery('fail');
      
      await state.executeSearch();
      
      const searchState = useStore.getState().search;
      expect(searchState.loading).toBe(false);
      expect(searchState.error).toBe('Search failed');
    });

    it('should hide search', () => {
      const state = useStore.getState();
      state.showSearch();
      state.hideSearch();
      expect(useStore.getState().search.show).toBe(false);
      expect(useStore.getState().search.query).toBe('');
    });
  });

  describe('Viewer Functionality', () => {
    it('should show viewer with content on successful read', async () => {
      const state = useStore.getState();
      const filePath = '/path/to/view.txt';
      const fileName = 'view.txt';

      await state.showViewer(fileName, filePath);

      expect(invoke).toHaveBeenCalledWith('read_file_content', { path: filePath });
      const viewerState = useStore.getState().viewer;
      expect(viewerState.show).toBe(true);
      expect(viewerState.title).toBe(fileName);
      expect(viewerState.content).toBe(`Content of ${filePath}`);
      expect(viewerState.loading).toBe(false);
      expect(viewerState.error).toBeNull();
    });

    it('should show viewer with empty content for empty file', async () => {
      const state = useStore.getState();
      const filePath = '/path/to/empty.txt';
      const fileName = 'empty.txt';

      await state.showViewer(fileName, filePath);

      expect(invoke).toHaveBeenCalledWith('read_file_content', { path: filePath });
      const viewerState = useStore.getState().viewer;
      expect(viewerState.show).toBe(true);
      expect(viewerState.title).toBe(fileName);
      expect(viewerState.content).toBe('');
      expect(viewerState.loading).toBe(false);
      expect(viewerState.error).toBeNull();
    });

    it('should show viewer with error on failed read', async () => {
      const state = useStore.getState();
      const filePath = '/path/to/error.txt';
      const fileName = 'error.txt';

      await state.showViewer(fileName, filePath);

      expect(invoke).toHaveBeenCalledWith('read_file_content', { path: filePath });
      const viewerState = useStore.getState().viewer;
      expect(viewerState.show).toBe(true);
      expect(viewerState.title).toBe(fileName);
      expect(viewerState.content).toBe(''); 
      expect(viewerState.loading).toBe(false);
      expect(viewerState.error).toBe('File read error');
    });

    it('should show viewer with error for non-UTF8 content', async () => {
      const state = useStore.getState();
      const filePath = '/path/to/non_utf8.bin';
      const fileName = 'non_utf8.bin';

      await state.showViewer(fileName, filePath);

      expect(invoke).toHaveBeenCalledWith('read_file_content', { path: filePath });
      const viewerState = useStore.getState().viewer;
      expect(viewerState.show).toBe(true);
      expect(viewerState.title).toBe(fileName);
      expect(viewerState.content).toBe(''); 
      expect(viewerState.loading).toBe(false);
      expect(viewerState.error).toBe('File contains non-UTF8 characters');
    });

    it('should hide viewer', () => {
      const state = useStore.getState();
      state.showViewer('test', '/path'); 
      state.hideViewer();
      expect(useStore.getState().viewer.show).toBe(false);
    });
  });

  describe('Editor Functionality', () => {
    it('should show editor with content on successful read', async () => {
      const state = useStore.getState();
      const filePath = '/path/to/edit.txt';
      const fileName = 'edit.txt';

      await state.showEditor(fileName, filePath);

      expect(invoke).toHaveBeenCalledWith('read_file_content', { path: filePath });
      const editorState = useStore.getState().editor;
      expect(editorState.show).toBe(true);
      expect(editorState.title).toBe(fileName);
      expect(editorState.path).toBe(filePath);
      expect(editorState.content).toBe(`Content of ${filePath}`);
      expect(editorState.loading).toBe(false);
      expect(editorState.error).toBeNull();
      expect(editorState.dirty).toBe(false);
    });

    it('should show editor with empty content for empty file', async () => {
      const state = useStore.getState();
      const filePath = '/path/to/empty.txt';
      const fileName = 'empty.txt';

      await state.showEditor(fileName, filePath);

      expect(invoke).toHaveBeenCalledWith('read_file_content', { path: filePath });
      const editorState = useStore.getState().editor;
      expect(editorState.show).toBe(true);
      expect(editorState.title).toBe(fileName);
      expect(editorState.path).toBe(filePath);
      expect(editorState.content).toBe('');
      expect(editorState.loading).toBe(false);
      expect(editorState.error).toBeNull();
      expect(editorState.dirty).toBe(false);
    });

    it('should show editor with error on failed read', async () => {
      const state = useStore.getState();
      const filePath = '/path/to/error.txt';
      const fileName = 'error.txt';

      await state.showEditor(fileName, filePath);

      expect(invoke).toHaveBeenCalledWith('read_file_content', { path: filePath });
      const editorState = useStore.getState().editor;
      expect(editorState.show).toBe(true);
      expect(editorState.title).toBe(fileName);
      expect(editorState.path).toBe(filePath);
      expect(editorState.content).toBe('');
      expect(editorState.loading).toBe(false);
      expect(editorState.error).toBe('File read error');
    });

    it('should update editor content and set dirty flag', () => {
      const state = useStore.getState();
      state.setEditorContent('new content');
      const editorState = useStore.getState().editor;
      expect(editorState.content).toBe('new content');
      expect(editorState.dirty).toBe(true);
    });

    it('should save editor content and reset dirty flag', async () => {
      const state = useStore.getState();
      await state.showEditor('test', '/path/to/save.txt');
      state.setEditorContent('modified content');

      await state.saveEditorContent();

      expect(invoke).toHaveBeenCalledWith('write_file_content', { path: '/path/to/save.txt', content: 'modified content' });
      const editorState = useStore.getState().editor;
      expect(editorState.loading).toBe(false);
      expect(editorState.dirty).toBe(false);
      expect(editorState.error).toBeNull();
    });

    it('should not save editor content if not dirty', async () => {
      const state = useStore.getState();
      await state.showEditor('test', '/path/to/save.txt'); // Content is 'Content of /path/to/save.txt', dirty is false

      await state.saveEditorContent(); // Should not call invoke as dirty is false

      expect(invoke).not.toHaveBeenCalledWith('write_file_content', expect.any(Object));
      const editorState = useStore.getState().editor;
      expect(editorState.loading).toBe(false);
      expect(editorState.dirty).toBe(false);
      expect(editorState.error).toBeNull();
    });

    it('should handle editor save error', async () => {
      const state = useStore.getState();
      await state.showEditor('test', '/path/to/write_error.txt');
      state.setEditorContent('some content');

      await state.saveEditorContent();

      expect(invoke).toHaveBeenCalledWith('write_file_content', { path: '/path/to/write_error.txt', content: 'some content' });
      const editorState = useStore.getState().editor;
      expect(editorState.loading).toBe(false);
      expect(editorState.dirty).toBe(true); 
      expect(editorState.error).toBe('File write error');
    });

    it('should hide editor', () => {
      const state = useStore.getState();
      state.showEditor('test', '/path'); 
      state.hideEditor();
      expect(useStore.getState().editor.show).toBe(false);
    });
  });
});
