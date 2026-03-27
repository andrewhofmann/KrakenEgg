import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    mockInvoke.mockResolvedValue(files);

    await act(async () => {
      renderHook(() => usePanelData('left'));
    });

    expect(mockInvoke).toHaveBeenCalledWith('list_directory', { path: '/test' });
  });

  it('sets files in store on successful response', async () => {
    const files = [{ name: 'a.txt', is_dir: false, size: 50, modified_at: 1000 }];
    mockInvoke.mockResolvedValue(files);

    await act(async () => {
      renderHook(() => usePanelData('left'));
    });

    expect(useStore.getState().left.tabs[0].files).toEqual(files);
  });

  it('sets error on failed invoke', async () => {
    mockInvoke.mockRejectedValue('Permission denied');

    await act(async () => {
      renderHook(() => usePanelData('left'));
    });

    expect(useStore.getState().left.tabs[0].error).toBe('Permission denied');
  });

  it('cleans up interval on unmount', async () => {
    vi.useFakeTimers();
    mockInvoke.mockResolvedValue([]);

    let hookResult: ReturnType<typeof renderHook>;
    await act(async () => {
      hookResult = renderHook(() => usePanelData('left'));
    });

    mockInvoke.mockClear();
    hookResult!.unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    expect(mockInvoke).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
