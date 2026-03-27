import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useStore } from '../store';
import { DEFAULT_PREFERENCES } from '../store/constants';
import { SettingsModal } from './SettingsModal';

beforeEach(() => {
  useStore.setState({
    settingsModal: { show: false },
    preferences: DEFAULT_PREFERENCES,
  });
});

describe('SettingsModal', () => {
  it('renders nothing when show is false', () => {
    const { container } = render(<SettingsModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders settings panel with sidebar when show is true', () => {
    useStore.setState({
      settingsModal: { show: true },
    });

    render(<SettingsModal />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Behavior')).toBeInTheDocument();
    expect(screen.getByText('Layouts')).toBeInTheDocument();
  });

  it('shows general tab by default with checkboxes', () => {
    useStore.setState({
      settingsModal: { show: true },
    });

    render(<SettingsModal />);

    expect(screen.getByText('Show Hidden Files')).toBeInTheDocument();
    expect(screen.getByText('Confirm Deletions')).toBeInTheDocument();
    expect(screen.getByText('Save History on Exit')).toBeInTheDocument();
  });

  it('toggles showHiddenFiles preference', () => {
    const setPreference = vi.fn();

    useStore.setState({
      settingsModal: { show: true },
      setPreference,
    });

    render(<SettingsModal />);

    // Find the checkbox for Show Hidden Files (it starts unchecked per default preferences)
    const checkbox = screen.getByText('Show Hidden Files').closest('label')!.querySelector('input')!;
    fireEvent.click(checkbox);

    expect(setPreference).toHaveBeenCalledWith('general', 'showHiddenFiles', true);
  });

  it('switches to appearance tab', () => {
    useStore.setState({
      settingsModal: { show: true },
    });

    render(<SettingsModal />);

    fireEvent.click(screen.getByText('Appearance'));

    expect(screen.getByText('Font Size (px)')).toBeInTheDocument();
    expect(screen.getByText('Row Height (px)')).toBeInTheDocument();
    expect(screen.getByText('Show Grid Lines')).toBeInTheDocument();
  });

  it('switches to behavior tab', () => {
    useStore.setState({
      settingsModal: { show: true },
    });

    render(<SettingsModal />);

    fireEvent.click(screen.getByText('Behavior'));

    expect(screen.getByText('Selection Mode')).toBeInTheDocument();
  });

  it('switches to layouts tab', () => {
    useStore.setState({
      settingsModal: { show: true },
    });

    render(<SettingsModal />);

    fireEvent.click(screen.getByText('Layouts'));

    expect(screen.getByText('Saved Layouts')).toBeInTheDocument();
    expect(screen.getByText('Save Current')).toBeInTheDocument();
  });

  it('shows empty layouts message when no layouts exist', () => {
    useStore.setState({
      settingsModal: { show: true },
    });

    render(<SettingsModal />);

    fireEvent.click(screen.getByText('Layouts'));

    expect(screen.getByText('No saved layouts found.')).toBeInTheDocument();
  });

  it('calls hideSettingsModal when close button is clicked', () => {
    const hideSettingsModal = vi.fn();

    useStore.setState({
      settingsModal: { show: true },
      hideSettingsModal,
    });

    render(<SettingsModal />);

    // The close X button is in the content header
    const buttons = screen.getAllByRole('button');
    // The close button is the one that is not a nav item and not "Save Current"
    const closeButton = buttons.find(btn => {
      const text = btn.textContent || '';
      return !text.includes('General') && !text.includes('Appearance') &&
             !text.includes('Behavior') && !text.includes('Layouts') &&
             !text.includes('Save Current') && text.trim() === '';
    });

    if (closeButton) {
      fireEvent.click(closeButton);
      expect(hideSettingsModal).toHaveBeenCalled();
    }
  });

  it('updates fontSize preference in appearance tab', () => {
    const setPreference = vi.fn();

    useStore.setState({
      settingsModal: { show: true },
      setPreference,
    });

    render(<SettingsModal />);

    fireEvent.click(screen.getByText('Appearance'));

    const fontSizeInput = screen.getByDisplayValue('13');
    fireEvent.change(fontSizeInput, { target: { value: '16' } });

    expect(setPreference).toHaveBeenCalledWith('appearance', 'fontSize', 16);
  });
});
