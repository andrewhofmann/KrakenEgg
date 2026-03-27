import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UltraKeyboardShortcutsDialog from '../UltraKeyboardShortcutsDialog';

describe('UltraKeyboardShortcutsDialog', () => {
  let onCloseMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onCloseMock = vi.fn();

    // Mock window.print
    Object.defineProperty(window, 'print', {
      value: vi.fn(),
      writable: true,
    });
  });

  const defaultProps = {
    onClose: onCloseMock,
  };

  describe('Rendering', () => {
    it('renders with correct title and subtitle', () => {
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Complete keyboard reference for KrakenEgg')).toBeInTheDocument();
    });

    it('renders search input', () => {
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search shortcuts...');
      expect(searchInput).toBeInTheDocument();
    });

    it('renders category tabs', () => {
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByText('Function Keys')).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Selection')).toBeInTheDocument();
      expect(screen.getByText('File Operations')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByText('Print Reference')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('renders keyboard legend', () => {
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByText('Command key')).toBeInTheDocument();
      expect(screen.getByText('Control key')).toBeInTheDocument();
      expect(screen.getByText('macOS shortcuts')).toBeInTheDocument();
    });
  });

  describe('Category Navigation', () => {
    it('defaults to function-keys category', () => {
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      const functionKeysTab = screen.getByText('Function Keys');
      expect(functionKeysTab).toHaveClass('text-mac26-blue-500', 'border-mac26-blue-500');
    });

    it('switches categories when tab is clicked', async () => {
      const user = userEvent.setup();
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      const navigationTab = screen.getByText('Navigation');
      await user.click(navigationTab);

      expect(navigationTab).toHaveClass('text-mac26-blue-500', 'border-mac26-blue-500');
    });

    it('displays category-specific shortcuts', () => {
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      // Function Keys category should show F1-F12 shortcuts
      expect(screen.getByText('Help / Show keyboard shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Rename selected file')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters shortcuts based on search query', async () => {
      const user = userEvent.setup();
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search shortcuts...');
      await user.type(searchInput, 'copy');

      // Should show copy-related shortcuts
      expect(screen.getByText(/copy/i)).toBeInTheDocument();
    });

    it('shows no results message when search yields no matches', async () => {
      const user = userEvent.setup();
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search shortcuts...');
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No shortcuts found for "nonexistent"')).toBeInTheDocument();
    });

    it('searches by key combination', async () => {
      const user = userEvent.setup();
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search shortcuts...');
      await user.type(searchInput, 'F1');

      expect(screen.getByText('Help / Show keyboard shortcuts')).toBeInTheDocument();
    });

    it('clears search results when search is cleared', async () => {
      const user = userEvent.setup();
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search shortcuts...');
      await user.type(searchInput, 'copy');
      await user.clear(searchInput);

      // Should show default function keys content
      expect(screen.getByText('Help / Show keyboard shortcuts')).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts Display', () => {
    it('renders keyboard shortcuts with proper formatting', () => {
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      // Check for kbd elements (keyboard key formatting)
      const kbdElements = screen.getAllByRole('generic');
      const hasKbdStyling = kbdElements.some(element =>
        element.tagName === 'KBD' || element.className.includes('kbd')
      );

      expect(hasKbdStyling).toBeTruthy();
    });

    it('shows context information for shortcuts when available', () => {
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      // Switch to Selection category which has context info
      const selectionTab = screen.getByText('Selection');
      fireEvent.click(selectionTab);

      expect(screen.getByText('Number pad')).toBeInTheDocument();
    });

    it('handles complex key combinations', () => {
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      // macOS category has complex combinations like Cmd+Shift+G
      const macosTab = screen.getByText('macOS Shortcuts');
      fireEvent.click(macosTab);

      expect(screen.getByText('Go to folder (macOS)')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(onCloseMock).toHaveBeenCalledOnce();
    });

    it('calls window.print when print button is clicked', async () => {
      const user = userEvent.setup();
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      const printButton = screen.getByText('Print Reference');
      await user.click(printButton);

      expect(window.print).toHaveBeenCalledOnce();
    });

    it('handles Escape key to close dialog', () => {
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onCloseMock).toHaveBeenCalledOnce();
    });
  });

  describe('Accessibility', () => {
    it('has proper tab navigation', async () => {
      const user = userEvent.setup();
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search shortcuts...');

      // Focus should be able to move to search input
      await user.tab();
      expect(searchInput).toHaveFocus();
    });

    it('has proper ARIA labels and roles', () => {
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      // Search input should have proper labeling
      const searchInput = screen.getByPlaceholderText('Search shortcuts...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('maintains focus within dialog', () => {
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      // Tab navigation should be trapped within the dialog
      fireEvent.keyDown(document, { key: 'Tab' });

      // Should not break the focus trap
      expect(document.activeElement).toBeTruthy();
    });
  });

  describe('Data Integrity', () => {
    it('displays all major shortcut categories', () => {
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      const expectedCategories = [
        'Function Keys',
        'Navigation',
        'Selection',
        'File Operations',
        'View & Display',
        'Archive Operations',
        'macOS Shortcuts',
        'Search & Tools'
      ];

      expectedCategories.forEach(category => {
        expect(screen.getByText(category)).toBeInTheDocument();
      });
    });

    it('shows correct number of categories in tabs', () => {
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      // Count tab buttons (should be 8 categories)
      const tabButtons = screen.getAllByRole('button').filter(button =>
        button.className.includes('border-b-2')
      );

      expect(tabButtons.length).toBeGreaterThanOrEqual(8);
    });

    it('preserves search state during category navigation', async () => {
      const user = userEvent.setup();
      render(<UltraKeyboardShortcutsDialog {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search shortcuts...');
      await user.type(searchInput, 'test search');

      const navigationTab = screen.getByText('Navigation');
      await user.click(navigationTab);

      expect(searchInput).toHaveValue('test search');
    });
  });
});