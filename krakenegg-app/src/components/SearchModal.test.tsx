import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useStore } from '../store';
import { SearchModal } from './SearchModal';

beforeEach(() => {
  useStore.setState({
    search: {
      show: false,
      query: '',
      searchContent: false,
      results: [],
      loading: false,
      error: null,
    },
  });
});

describe('SearchModal', () => {
  it('renders nothing when show is false', () => {
    const { container } = render(<SearchModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders search interface when show is true', () => {
    useStore.setState({
      search: {
        show: true,
        query: '',
        searchContent: false,
        results: [],
        loading: false,
        error: null,
      },
    });

    render(<SearchModal />);

    expect(screen.getByText('Search Files')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search filename or content...')).toBeInTheDocument();
    expect(screen.getByText('Search', { selector: 'button' })).toBeInTheDocument();
    expect(screen.getByText('Search file content')).toBeInTheDocument();
  });

  it('calls setSearchQuery on input change', () => {
    const setSearchQuery = vi.fn();

    useStore.setState({
      search: {
        show: true,
        query: '',
        searchContent: false,
        results: [],
        loading: false,
        error: null,
      },
      setSearchQuery,
    });

    render(<SearchModal />);

    const input = screen.getByPlaceholderText('Search filename or content...');
    fireEvent.change(input, { target: { value: 'test-file' } });

    expect(setSearchQuery).toHaveBeenCalledWith('test-file');
  });

  it('calls executeSearch on Search button click', () => {
    const executeSearch = vi.fn();

    useStore.setState({
      search: {
        show: true,
        query: 'something',
        searchContent: false,
        results: [],
        loading: false,
        error: null,
      },
      executeSearch,
    });

    render(<SearchModal />);

    fireEvent.click(screen.getByText('Search', { selector: 'button' }));

    expect(executeSearch).toHaveBeenCalled();
  });

  it('calls executeSearch on Enter key press', () => {
    const executeSearch = vi.fn();

    useStore.setState({
      search: {
        show: true,
        query: 'something',
        searchContent: false,
        results: [],
        loading: false,
        error: null,
      },
      executeSearch,
    });

    render(<SearchModal />);

    const input = screen.getByPlaceholderText('Search filename or content...');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(executeSearch).toHaveBeenCalled();
  });

  it('calls hideSearch on Escape key press', () => {
    const hideSearch = vi.fn();

    useStore.setState({
      search: {
        show: true,
        query: '',
        searchContent: false,
        results: [],
        loading: false,
        error: null,
      },
      hideSearch,
    });

    render(<SearchModal />);

    const input = screen.getByPlaceholderText('Search filename or content...');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(hideSearch).toHaveBeenCalled();
  });

  it('calls hideSearch when close button is clicked', () => {
    const hideSearch = vi.fn();

    useStore.setState({
      search: {
        show: true,
        query: '',
        searchContent: false,
        results: [],
        loading: false,
        error: null,
      },
      hideSearch,
    });

    render(<SearchModal />);

    // Close button is in the header next to title
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(btn => !btn.textContent?.includes('Search'));
    fireEvent.click(closeButton!);

    expect(hideSearch).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    useStore.setState({
      search: {
        show: true,
        query: 'test',
        searchContent: false,
        results: [],
        loading: true,
        error: null,
      },
    });

    render(<SearchModal />);

    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    useStore.setState({
      search: {
        show: true,
        query: 'test',
        searchContent: false,
        results: [],
        loading: false,
        error: 'Search failed',
      },
    });

    render(<SearchModal />);

    expect(screen.getByText('Error: Search failed')).toBeInTheDocument();
  });

  it('shows no results message', () => {
    useStore.setState({
      search: {
        show: true,
        query: 'nonexistent',
        searchContent: false,
        results: [],
        loading: false,
        error: null,
      },
    });

    render(<SearchModal />);

    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });

  it('displays search results with files and folders', () => {
    useStore.setState({
      search: {
        show: true,
        query: 'test',
        searchContent: false,
        results: [
          { name: 'test-folder', is_dir: true, size: 0 },
          { name: 'test-file.txt', is_dir: false, size: 2048 },
        ],
        loading: false,
        error: null,
      },
    });

    render(<SearchModal />);

    expect(screen.getByText('test-folder')).toBeInTheDocument();
    expect(screen.getByText('test-file.txt')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
  });

  it('toggles search content checkbox', () => {
    const setSearchContent = vi.fn();

    useStore.setState({
      search: {
        show: true,
        query: '',
        searchContent: false,
        results: [],
        loading: false,
        error: null,
      },
      setSearchContent,
    });

    render(<SearchModal />);

    const checkbox = screen.getByText('Search file content').closest('label')!.querySelector('input')!;
    fireEvent.click(checkbox);

    expect(setSearchContent).toHaveBeenCalledWith(true);
  });

  it('disables Search button when query is empty', () => {
    useStore.setState({
      search: {
        show: true,
        query: '',
        searchContent: false,
        results: [],
        loading: false,
        error: null,
      },
    });

    render(<SearchModal />);

    const searchButton = screen.getByText('Search', { selector: 'button' });
    expect(searchButton).toBeDisabled();
  });

  it('disables Search button when loading', () => {
    useStore.setState({
      search: {
        show: true,
        query: 'test',
        searchContent: false,
        results: [],
        loading: true,
        error: null,
      },
    });

    render(<SearchModal />);

    const searchButton = screen.getByText('Search', { selector: 'button' });
    expect(searchButton).toBeDisabled();
  });
});
