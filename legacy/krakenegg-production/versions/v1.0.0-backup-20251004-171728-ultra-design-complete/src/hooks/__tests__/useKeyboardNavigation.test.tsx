import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from '../useKeyboardNavigation';
import { AppState, Theme, ViewMode, SortBy, SortOrder } from '../../types';

// Mock the file generation
vi.mock('../../data/mockFiles', () => ({
  generateMockFiles: vi.fn((path: string) => [
    { id: '1', name: 'file1.txt', size: 1024, modified: new Date(), isDirectory: false },
    { id: '2', name: 'folder1', size: 0, modified: new Date(), isDirectory: true },
  ])
}));

// Mock utils
vi.mock('../../utils/fileUtils', () => ({
  getParentPath: vi.fn((path: string) => path.split('/').slice(0, -1).join('/') || '/'),
  sortFiles: vi.fn((files) => files),
  filterFiles: vi.fn((files) => files),
}));

vi.mock('../../utils/archiveUtils', () => ({
  isNavigableArchive: vi.fn(() => false),
  buildArchivePath: vi.fn(() => ''),
}));

describe('useKeyboardNavigation', () => {
  let mockAppState: AppState;
  let mockSetAppState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetAppState = vi.fn();

    mockAppState = {
      leftPanel: {
        id: 'left',
        currentPath: '/Users/test',
        files: [
          { id: '1', name: 'file1.txt', size: 1024, modified: new Date(), isDirectory: false },
          { id: '2', name: 'folder1', size: 0, modified: new Date(), isDirectory: true },
        ],
        selectedFiles: new Set(),
        focusedFile: '1',
        selectionAnchor: null,
        viewMode: ViewMode.Detailed,
        sortBy: SortBy.Name,
        sortOrder: SortOrder.Ascending,
        showHidden: false,
        tabs: [{ id: 'left-tab-1', name: 'test', path: '/Users/test', isActive: true }],
        activeTab: 'left-tab-1',
        history: ['/Users/test'],
        historyIndex: 0,
      },
      rightPanel: {
        id: 'right',
        currentPath: '/Users/test/Documents',
        files: [],
        selectedFiles: new Set(),
        focusedFile: null,
        selectionAnchor: null,
        viewMode: ViewMode.Detailed,
        sortBy: SortBy.Name,
        sortOrder: SortOrder.Ascending,
        showHidden: false,
        tabs: [{ id: 'right-tab-1', name: 'Documents', path: '/Users/test/Documents', isActive: true }],
        activeTab: 'right-tab-1',
        history: ['/Users/test/Documents'],
        historyIndex: 0,
      },
      activePanel: 'left',
      theme: Theme.Light,
      showCommandLine: false,
      showStatusBar: true,
      activeDialog: null,
      operations: [],
      keyboardShortcuts: {},
    };
  });

  describe('Basic Navigation Actions', () => {
    it('switches panels when switchPanel action is called', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('switchPanel');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));

      // Test the updater function
      const updateFunction = mockSetAppState.mock.calls[0][0];
      const newState = updateFunction(mockAppState);
      expect(newState.activePanel).toBe('right');
    });

    it('exchanges directories when exchangeDirectories action is called', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('exchangeDirectories');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));

      const updateFunction = mockSetAppState.mock.calls[0][0];
      const newState = updateFunction(mockAppState);

      // Panels should be swapped
      expect(newState.leftPanel.currentPath).toBe('/Users/test/Documents');
      expect(newState.rightPanel.currentPath).toBe('/Users/test');
    });

    it('navigates up in file list', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('navigateUp');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));
    });

    it('navigates down in file list', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('navigateDown');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('File Operations', () => {
    it('opens dialogs for file operations', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      const operations = ['copy', 'move', 'delete', 'rename'];

      operations.forEach(operation => {
        act(() => {
          result.current.handleKeyboardAction(operation);
        });

        expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));

        const updateFunction = mockSetAppState.mock.calls[mockSetAppState.mock.calls.length - 1][0];
        const newState = updateFunction(mockAppState);
        expect(newState.activeDialog).toBe(operation);
      });
    });

    it('toggles file selection', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('toggleSelection');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));
    });

    it('selects all files', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('selectAll');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));
    });

    it('deselects all files', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('deselectAll');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('View Operations', () => {
    it('changes view modes', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      const viewModes = ['briefView', 'fullView'];

      viewModes.forEach(mode => {
        act(() => {
          result.current.handleKeyboardAction(mode);
        });

        expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));
      });
    });

    it('toggles hidden files', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('showHidden');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));
    });

    it('refreshes current panel', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('refresh');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('macOS-specific Actions', () => {
    it('handles macOS new window action', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      act(() => {
        result.current.handleKeyboardAction('macosNewWindow');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Open new window (macOS)');
      consoleSpy.mockRestore();
    });

    it('handles macOS quit action', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      act(() => {
        result.current.handleKeyboardAction('macosQuit');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Quit application (macOS)');
      consoleSpy.mockRestore();
    });

    it('opens preferences dialog for macOS preferences action', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('macosPreferences');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));

      const updateFunction = mockSetAppState.mock.calls[0][0];
      const newState = updateFunction(mockAppState);
      expect(newState.activeDialog).toBe('settings');
    });

    it('opens file viewer for macOS get info action when file is focused', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('macosGetInfo');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));

      const updateFunction = mockSetAppState.mock.calls[0][0];
      const newState = updateFunction(mockAppState);
      expect(newState.activeDialog).toBe('fileViewer');
    });

    it('navigates to system folders', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      const navigationActions = [
        { action: 'macosGoHome', expectedPath: '/Users/user' },
        { action: 'macosGoDesktop', expectedPath: '/Users/user/Desktop' },
        { action: 'macosGoDocuments', expectedPath: '/Users/user/Documents' },
        { action: 'macosGoApplications', expectedPath: '/Applications' },
        { action: 'macosGoUtilities', expectedPath: '/Applications/Utilities' },
      ];

      navigationActions.forEach(({ action }) => {
        act(() => {
          result.current.handleKeyboardAction(action);
        });

        expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));
      });
    });

    it('toggles hidden files for macOS show hidden action', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('macosShowHidden');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('Dialog Actions', () => {
    it('opens archive dialog', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('packFiles');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));

      const updateFunction = mockSetAppState.mock.calls[0][0];
      const newState = updateFunction(mockAppState);
      expect(newState.activeDialog).toBe('archive');
    });

    it('opens search dialog', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('findFiles');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));

      const updateFunction = mockSetAppState.mock.calls[0][0];
      const newState = updateFunction(mockAppState);
      expect(newState.activeDialog).toBe('search');
    });

    it('opens keyboard help dialog', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('keyboardHelp');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));

      const updateFunction = mockSetAppState.mock.calls[0][0];
      const newState = updateFunction(mockAppState);
      expect(newState.activeDialog).toBe('keyboardHelp');
    });

    it('opens network dialog', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('macosConnectToServer');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));

      const updateFunction = mockSetAppState.mock.calls[0][0];
      const newState = updateFunction(mockAppState);
      expect(newState.activeDialog).toBe('network');
    });
  });

  describe('Cancel and Escape Actions', () => {
    it('closes dialog when cancel action is called and dialog is open', () => {
      const stateWithDialog = { ...mockAppState, activeDialog: 'settings' };
      const { result } = renderHook(() => useKeyboardNavigation(stateWithDialog, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('cancel');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));

      const updateFunction = mockSetAppState.mock.calls[0][0];
      const newState = updateFunction(stateWithDialog);
      expect(newState.activeDialog).toBe(null);
    });

    it('clears selection when cancel action is called and no dialog is open', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.handleKeyboardAction('cancel');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('Utility Functions', () => {
    it('provides getActivePanel function', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      const activePanel = result.current.getActivePanel();
      expect(activePanel).toBe(mockAppState.leftPanel);
    });

    it('provides getInactivePanel function', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      const inactivePanel = result.current.getInactivePanel();
      expect(inactivePanel).toBe(mockAppState.rightPanel);
    });

    it('provides navigateToPath function', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.navigateToPath('left', '/new/path');
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));
    });

    it('provides updateActivePanel function', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      act(() => {
        result.current.updateActivePanel(panel => ({ ...panel, showHidden: true }));
      });

      expect(mockSetAppState).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('Unhandled Actions', () => {
    it('logs unhandled keyboard actions', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockAppState, mockSetAppState));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      act(() => {
        result.current.handleKeyboardAction('unknownAction');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Unhandled keyboard action:', 'unknownAction');
      consoleSpy.mockRestore();
    });
  });
});