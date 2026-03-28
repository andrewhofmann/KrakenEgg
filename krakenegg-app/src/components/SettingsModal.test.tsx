import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsModal } from './SettingsModal';
import { useStore } from '../store';
import { DEFAULT_HOTKEYS, DEFAULT_PREFERENCES } from '../store/constants';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(),
}));

const showSettings = () => {
  useStore.setState({
    settingsModal: { show: true },
    preferences: { ...DEFAULT_PREFERENCES },
    hotkeys: { ...DEFAULT_HOTKEYS },
    hotlist: [],
  });
};

describe('SettingsModal', () => {
  beforeEach(() => {
    useStore.setState({ settingsModal: { show: false } });
  });

  // ─── Visibility ───

  it('renders nothing when show is false', () => {
    render(<SettingsModal />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders when show is true', () => {
    showSettings();
    render(<SettingsModal />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-label on dialog', () => {
    showSettings();
    render(<SettingsModal />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Settings');
  });

  // ─── Navigation Tabs ───

  it('shows General tab by default', () => {
    showSettings();
    render(<SettingsModal />);
    expect(screen.getByText('File Operations')).toBeInTheDocument();
  });

  it('shows all 5 navigation tabs', () => {
    showSettings();
    render(<SettingsModal />);
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Behavior')).toBeInTheDocument();
    expect(screen.getByText('Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Layouts')).toBeInTheDocument();
  });

  it('shows version number', () => {
    showSettings();
    render(<SettingsModal />);
    expect(screen.getByText(/v0\.2\.0/)).toBeInTheDocument();
  });

  // ─── General Tab ───

  it('shows Show Hidden Files toggle', () => {
    showSettings();
    render(<SettingsModal />);
    expect(screen.getByText('Show Hidden Files')).toBeInTheDocument();
  });

  it('shows Confirm Deletions toggle', () => {
    showSettings();
    render(<SettingsModal />);
    expect(screen.getByText('Confirm Deletions')).toBeInTheDocument();
  });

  it('shows Save History toggle', () => {
    showSettings();
    render(<SettingsModal />);
    expect(screen.getByText('Save History on Exit')).toBeInTheDocument();
  });

  it('shows Favorites section', () => {
    showSettings();
    render(<SettingsModal />);
    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });

  it('shows empty favorites message when no hotlist', () => {
    showSettings();
    render(<SettingsModal />);
    expect(screen.getByText(/No favorites saved/)).toBeInTheDocument();
  });

  it('shows favorites when hotlist has items', () => {
    useStore.setState({
      settingsModal: { show: true },
      preferences: { ...DEFAULT_PREFERENCES },
      hotkeys: { ...DEFAULT_HOTKEYS },
      hotlist: ['/Users/test/Documents', '/tmp'],
    });
    render(<SettingsModal />);
    expect(screen.getByText('/Users/test/Documents')).toBeInTheDocument();
    expect(screen.getByText('/tmp')).toBeInTheDocument();
  });

  it('toggles showHiddenFiles when clicked', () => {
    showSettings();
    render(<SettingsModal />);
    const checkbox = screen.getByText('Show Hidden Files').closest('label')!.querySelector('input')!;
    fireEvent.click(checkbox);
    expect(useStore.getState().preferences.general.showHiddenFiles).toBe(true);
  });

  // ─── Appearance Tab ───

  it('switches to Appearance tab', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Appearance'));
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('shows dark/light/system theme buttons', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Appearance'));
    expect(screen.getByText('dark')).toBeInTheDocument();
    expect(screen.getByText('light')).toBeInTheDocument();
    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('shows Font Size input with hint', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Appearance'));
    expect(screen.getByText('Font Size (px)')).toBeInTheDocument();
    expect(screen.getByText(/9–24px/)).toBeInTheDocument();
  });

  it('shows Row Height input with hint', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Appearance'));
    expect(screen.getByText('Row Height (px)')).toBeInTheDocument();
    expect(screen.getByText(/16–48px/)).toBeInTheDocument();
  });

  it('shows Show Grid Lines toggle', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Appearance'));
    expect(screen.getByText('Show Grid Lines')).toBeInTheDocument();
  });

  it('shows Compact Mode toggle', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Appearance'));
    expect(screen.getByText('Compact Mode')).toBeInTheDocument();
  });

  it('shows zoom shortcuts reference', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Appearance'));
    expect(screen.getByText('Zoom')).toBeInTheDocument();
  });

  // ─── Behavior Tab ───

  it('switches to Behavior tab', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Behavior'));
    expect(screen.getByText('Mouse Interaction')).toBeInTheDocument();
  });

  it('shows Selection Mode dropdown without WIP', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Behavior'));
    const select = document.querySelector('select') as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(select.innerHTML).not.toContain('[WIP]');
  });

  it('shows Sorting section with Folders First', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Behavior'));
    expect(screen.getByText('Sorting')).toBeInTheDocument();
    expect(screen.getByText('Folders First')).toBeInTheDocument();
  });

  // ─── Shortcuts Tab ───

  it('switches to Shortcuts tab', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Shortcuts'));
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('shows all hotkey categories', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Shortcuts'));
    expect(screen.getByText('Clipboard')).toBeInTheDocument();
    expect(screen.getByText('Selection')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
  });

  it('shows hotkey labels', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Shortcuts'));
    expect(screen.getByText('Switch Panel')).toBeInTheDocument();
    expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
    expect(screen.getByText('Select All')).toBeInTheDocument();
  });

  it('shows Reset All button', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Shortcuts'));
    expect(screen.getByText('Reset All')).toBeInTheDocument();
  });

  it('clicking Reset All restores default hotkeys', () => {
    showSettings();
    useStore.getState().setHotkey('toggle_side', 'Shift+Tab');
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Shortcuts'));
    fireEvent.click(screen.getByText('Reset All'));
    expect(useStore.getState().hotkeys.toggle_side).toBe('Tab');
  });

  it('clicking a hotkey button enters edit mode', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Shortcuts'));
    const tabBtn = screen.getByText('Tab');
    fireEvent.click(tabBtn);
    expect(screen.getByText('Press keys...')).toBeInTheDocument();
  });

  it('displays hotkey with macOS symbols', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Shortcuts'));
    // CmdOrCtrl+c should display as ⌘+c
    expect(screen.getByText('⌘+c')).toBeInTheDocument();
  });

  // ─── Layouts Tab ───

  it('switches to Layouts tab', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Layouts'));
    expect(screen.getByText('Saved Layouts')).toBeInTheDocument();
  });

  it('shows Save Current button', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Layouts'));
    expect(screen.getByText('Save Current')).toBeInTheDocument();
  });

  it('shows empty layouts message', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Layouts'));
    expect(screen.getByText('No saved layouts found.')).toBeInTheDocument();
  });

  // ─── Close ───

  it('close button has aria-label', () => {
    showSettings();
    render(<SettingsModal />);
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  it('clicking close hides modal', () => {
    showSettings();
    render(<SettingsModal />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(useStore.getState().settingsModal.show).toBe(false);
  });
});
