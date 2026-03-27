import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabBar } from './TabBar';
import { useStore } from '../store';

// Mock framer-motion Reorder components
vi.mock('framer-motion', () => ({
  Reorder: {
    Group: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div className={className} data-testid="reorder-group">{children}</div>
    ),
    Item: ({ children, onClick, className, value }: {
      children: React.ReactNode;
      onClick?: (e: React.MouseEvent) => void;
      className?: string;
      value: unknown;
    }) => (
      <div className={className} onClick={onClick} data-testid="reorder-item">
        {children}
      </div>
    ),
  },
}));

const createTab = (path: string, id?: string) => ({
  id: id || Math.random().toString(),
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

const DEFAULT_LAYOUT = {
  sortColumn: 'name' as const,
  sortDirection: 'asc' as const,
  columns: ['name' as const, 'ext' as const, 'size' as const, 'date' as const],
  columnWidths: { name: 300, ext: 60, size: 80, date: 140 },
};

describe('TabBar', () => {
  beforeEach(() => {
    // Reset store to known state
    useStore.setState({
      left: {
        tabs: [createTab('/Users/andrew/Documents', 'tab-1')],
        activeTabIndex: 0,
        layout: DEFAULT_LAYOUT,
      },
      right: {
        tabs: [createTab('/Users/andrew/Downloads', 'tab-2')],
        activeTabIndex: 0,
        layout: DEFAULT_LAYOUT,
      },
      activeSide: 'left',
      setActiveTab: vi.fn(),
      setActiveSide: vi.fn(),
      closeTab: vi.fn(),
      addTab: vi.fn(),
      setTabs: vi.fn(),
      moveTab: vi.fn(),
    });
  });

  it('renders tab name from path', () => {
    render(<TabBar side="left" />);
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('renders "Root" for root path', () => {
    useStore.setState({
      left: {
        tabs: [createTab('/', 'tab-root')],
        activeTabIndex: 0,
        layout: DEFAULT_LAYOUT,
      },
    });
    render(<TabBar side="left" />);
    expect(screen.getByText('Root')).toBeInTheDocument();
  });

  it('renders multiple tabs', () => {
    useStore.setState({
      left: {
        tabs: [
          createTab('/Users/andrew/Documents', 'tab-a'),
          createTab('/Users/andrew/Desktop', 'tab-b'),
        ],
        activeTabIndex: 0,
        layout: DEFAULT_LAYOUT,
      },
    });
    render(<TabBar side="left" />);
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Desktop')).toBeInTheDocument();
  });

  it('calls setActiveTab and setActiveSide when tab is clicked', () => {
    const setActiveTab = vi.fn();
    const setActiveSide = vi.fn();
    useStore.setState({ setActiveTab, setActiveSide });

    render(<TabBar side="left" />);
    fireEvent.click(screen.getByTestId('reorder-item'));
    expect(setActiveTab).toHaveBeenCalledWith('left', 0);
    expect(setActiveSide).toHaveBeenCalledWith('left');
  });

  it('calls addTab when the add button is clicked', () => {
    const addTab = vi.fn();
    useStore.setState({ addTab });

    render(<TabBar side="left" />);
    // The add button has a Plus icon, find it by role
    const buttons = screen.getAllByRole('button');
    // Last button is the add tab button (close buttons come first per tab)
    const addButton = buttons[buttons.length - 1];
    fireEvent.click(addButton);
    expect(addTab).toHaveBeenCalledWith('left', '/Users/andrew/Documents');
  });

  it('calls closeTab when close button is clicked', () => {
    const closeTab = vi.fn();
    useStore.setState({ closeTab });

    render(<TabBar side="left" />);
    const buttons = screen.getAllByRole('button');
    // First button is the close button for the first tab
    fireEvent.click(buttons[0]);
    expect(closeTab).toHaveBeenCalledWith('left', 0);
  });

  it('renders the right side tabs', () => {
    render(<TabBar side="right" />);
    expect(screen.getByText('Downloads')).toBeInTheDocument();
  });

  it('has correct tabbar id', () => {
    render(<TabBar side="left" />);
    expect(document.getElementById('tabbar-left')).toBeInTheDocument();
  });
});
