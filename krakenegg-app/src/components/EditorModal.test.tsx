import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useStore } from '../store';
import { EditorModal } from './EditorModal';

beforeEach(() => {
  useStore.setState({
    editor: {
      show: false,
      title: '',
      path: '',
      content: '',
      loading: false,
      error: null,
      dirty: false,
    },
  });
});

describe('EditorModal', () => {
  it('renders nothing when show is false', () => {
    const { container } = render(<EditorModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders title and textarea when show is true', () => {
    useStore.setState({
      editor: {
        show: true,
        title: 'config.json',
        path: '/home/config.json',
        content: '{"key": "value"}',
        loading: false,
        error: null,
        dirty: false,
      },
    });

    render(<EditorModal />);

    expect(screen.getByText('config.json')).toBeInTheDocument();
    expect(screen.getByDisplayValue('{"key": "value"}')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useStore.setState({
      editor: {
        show: true,
        title: 'file.txt',
        path: '/file.txt',
        content: '',
        loading: true,
        error: null,
        dirty: false,
      },
    });

    render(<EditorModal />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    useStore.setState({
      editor: {
        show: true,
        title: 'file.txt',
        path: '/file.txt',
        content: '',
        loading: false,
        error: 'File not found',
        dirty: false,
      },
    });

    render(<EditorModal />);

    expect(screen.getByText('File not found')).toBeInTheDocument();
  });

  it('shows unsaved indicator when dirty', () => {
    useStore.setState({
      editor: {
        show: true,
        title: 'file.txt',
        path: '/file.txt',
        content: 'hello',
        loading: false,
        error: null,
        dirty: true,
      },
    });

    render(<EditorModal />);

    expect(screen.getByText('(Unsaved)')).toBeInTheDocument();
  });

  it('calls setEditorContent when textarea changes', () => {
    const setEditorContent = vi.fn();

    useStore.setState({
      editor: {
        show: true,
        title: 'file.txt',
        path: '/file.txt',
        content: 'original',
        loading: false,
        error: null,
        dirty: false,
      },
      setEditorContent,
    });

    render(<EditorModal />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'modified' } });

    expect(setEditorContent).toHaveBeenCalledWith('modified');
  });

  it('calls saveEditorContent when Save button is clicked', () => {
    const saveEditorContent = vi.fn();

    useStore.setState({
      editor: {
        show: true,
        title: 'file.txt',
        path: '/file.txt',
        content: 'edited',
        loading: false,
        error: null,
        dirty: true,
      },
      saveEditorContent,
    });

    render(<EditorModal />);

    fireEvent.click(screen.getByText('Save'));

    expect(saveEditorContent).toHaveBeenCalled();
  });

  it('disables Save button when not dirty', () => {
    useStore.setState({
      editor: {
        show: true,
        title: 'file.txt',
        path: '/file.txt',
        content: 'content',
        loading: false,
        error: null,
        dirty: false,
      },
    });

    render(<EditorModal />);

    const saveButton = screen.getByText('Save').closest('button');
    expect(saveButton).toBeDisabled();
  });

  it('calls hideEditor when close button is clicked', () => {
    const hideEditor = vi.fn();

    useStore.setState({
      editor: {
        show: true,
        title: 'file.txt',
        path: '/file.txt',
        content: 'content',
        loading: false,
        error: null,
        dirty: false,
      },
      hideEditor,
    });

    render(<EditorModal />);

    // Close button is the second button (after Save)
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(btn => !btn.textContent?.includes('Save'));
    fireEvent.click(closeButton!);

    expect(hideEditor).toHaveBeenCalled();
  });
});
