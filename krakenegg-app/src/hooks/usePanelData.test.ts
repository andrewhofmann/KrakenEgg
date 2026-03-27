import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePanelData } from './usePanelData';
import { useStore } from '../store';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(),
}));

const mockInvoke = invoke as ReturnType<typeof vi.fn>;

beforeEach(() => {
  useStore.setState({
    left: {
      tabs: [{
        id: 'tab1', path: '/test', files: [], selection: [], cursorIndex: 0,
        loading: false, error: null, refreshVersion: 0, filterQuery: '',
        filterFocusSignal: 0, showFilterWidget: false, history: ['/test'], historyIndex: 0,
      }],
      activeTabIndex: 0,
      layout: { sortColumn: 'name', sortDirection: 'asc', columns: ['name'], columnWidths: { name: 0 } },
    },
  } as any);
  mockInvoke.mockReset();
});

describe('usePanelData', () => {
  it('calls list_directory with current path on mount', async () => {
    const files = [{ name: 'file.txt', is_dir: false, size: 100 }];
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'list_directory') return Promise.resolve(files);
      return Promise.resolve(); // watch_directory, etc.
    });

    await act(async () => {
      renderHook(() => usePanelData('left'));
    });

    expect(mockInvoke).toHaveBeenCalledWith('list_directory', { path: '/test' });
  });

  it('sets files in store on successful response', async () => {
    const files = [{ name: 'a.txt', is_dir: false, size: 50, modified_at: 1000 }];
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'list_directory') return Promise.resolve(files);
      return Promise.resolve();
    });

    await act(async () => {
      renderHook(() => usePanelData('left'));
    });

    expect(useStore.getState().left.tabs[0].files).toEqual(files);
  });

  it('sets error on failed invoke', async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'list_directory') return Promise.reject('Permission denied');
      return Promise.resolve();
    });

    await act(async () => {
      renderHook(() => usePanelData('left'));
    });

    expect(useStore.getState().left.tabs[0].error).toBe('Permission denied');
  });

  it('sets up filesystem watcher', async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'list_directory') return Promise.resolve([]);
      return Promise.resolve();
    });

    await act(async () => {
      renderHook(() => usePanelData('left'));
    });

    expect(mockInvoke).toHaveBeenCalledWith('watch_directory', { path: '/test' });
  });

  it('unwatches on unmount', async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'list_directory') return Promise.resolve([]);
      return Promise.resolve();
    });

    let hookResult: ReturnType<typeof renderHook>;
    await act(async () => {
      hookResult = renderHook(() => usePanelData('left'));
    });

    mockInvoke.mockClear();
    hookResult!.unmount();

    // Give cleanup a tick to run
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    expect(mockInvoke).toHaveBeenCalledWith('unwatch_directory', { path: '/test' });
  });
});
