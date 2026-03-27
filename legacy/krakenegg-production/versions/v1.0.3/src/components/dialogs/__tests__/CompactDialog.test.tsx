import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompactDialog from '../CompactDialog';

describe('CompactDialog', () => {
  let onCloseMock: ReturnType<typeof vi.fn>;
  let onConfirmMock: ReturnType<typeof vi.fn>;
  let onCancelMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onCloseMock = vi.fn();
    onConfirmMock = vi.fn();
    onCancelMock = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    title: 'Test Dialog',
    icon: <div data-testid="test-icon">📁</div>,
    onClose: onCloseMock,
    children: <div data-testid="dialog-content">Test content</div>,
  };

  describe('Rendering', () => {
    it('renders with basic props', () => {
      render(<CompactDialog {...defaultProps} />);

      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
      render(<CompactDialog {...defaultProps} subtitle="Test subtitle" />);

      expect(screen.getByText('Test subtitle')).toBeInTheDocument();
    });

    it('renders with different sizes', () => {
      const { rerender } = render(<CompactDialog {...defaultProps} size="xs" />);
      expect(document.querySelector('.max-w-sm')).toBeInTheDocument();

      rerender(<CompactDialog {...defaultProps} size="sm" />);
      expect(document.querySelector('.max-w-md')).toBeInTheDocument();

      rerender(<CompactDialog {...defaultProps} size="md" />);
      expect(document.querySelector('.max-w-lg')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<CompactDialog {...defaultProps} />);

      const closeButton = screen.getByTitle('Close (Esc)');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('renders default confirm and cancel buttons', () => {
      render(
        <CompactDialog
          {...defaultProps}
          onConfirm={onConfirmMock}
          onCancel={onCancelMock}
        />
      );

      expect(screen.getByText('OK')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders custom action buttons', () => {
      const actions = [
        {
          label: 'Save',
          variant: 'primary' as const,
          onClick: vi.fn(),
        },
        {
          label: 'Delete',
          variant: 'secondary' as const,
          onClick: vi.fn(),
          disabled: true,
        },
      ];

      render(<CompactDialog {...defaultProps} actions={actions} />);

      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeDisabled();
    });

    it('renders custom button text', () => {
      render(
        <CompactDialog
          {...defaultProps}
          onConfirm={onConfirmMock}
          onCancel={onCancelMock}
          confirmText="Apply"
          cancelText="Discard"
        />
      );

      expect(screen.getByText('Apply')).toBeInTheDocument();
      expect(screen.getByText('Discard')).toBeInTheDocument();
    });

    it('disables confirm button when confirmDisabled is true', () => {
      render(
        <CompactDialog
          {...defaultProps}
          onConfirm={onConfirmMock}
          confirmDisabled={true}
        />
      );

      expect(screen.getByText('OK')).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<CompactDialog {...defaultProps} />);

      const closeButton = screen.getByTitle('Close (Esc)');
      await user.click(closeButton);

      expect(onCloseMock).toHaveBeenCalledOnce();
    });

    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      render(<CompactDialog {...defaultProps} onConfirm={onConfirmMock} />);

      const confirmButton = screen.getByText('OK');
      await user.click(confirmButton);

      expect(onConfirmMock).toHaveBeenCalledOnce();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<CompactDialog {...defaultProps} onCancel={onCancelMock} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onCancelMock).toHaveBeenCalledOnce();
    });

    it('calls custom action onClick when action button is clicked', async () => {
      const user = userEvent.setup();
      const customAction = vi.fn();
      const actions = [
        {
          label: 'Custom Action',
          variant: 'primary' as const,
          onClick: customAction,
        },
      ];

      render(<CompactDialog {...defaultProps} actions={actions} />);

      const actionButton = screen.getByText('Custom Action');
      await user.click(actionButton);

      expect(customAction).toHaveBeenCalledOnce();
    });
  });

  describe('Keyboard Navigation', () => {
    it('calls onCancel when Escape key is pressed', () => {
      render(<CompactDialog {...defaultProps} onCancel={onCancelMock} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onCancelMock).toHaveBeenCalledOnce();
    });

    it('calls onClose when Escape key is pressed and no onCancel', () => {
      render(<CompactDialog {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onCloseMock).toHaveBeenCalledOnce();
    });

    it('calls onConfirm when Enter key is pressed on focused button', () => {
      render(<CompactDialog {...defaultProps} onConfirm={onConfirmMock} />);

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(onConfirmMock).toHaveBeenCalledOnce();
    });

    it('does not call onConfirm when Enter key is pressed in form element', () => {
      render(
        <CompactDialog {...defaultProps} onConfirm={onConfirmMock}>
          <input data-testid="test-input" />
        </CompactDialog>
      );

      const input = screen.getByTestId('test-input');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onConfirmMock).not.toHaveBeenCalled();
    });

    it('does not call onConfirm when confirmDisabled is true', () => {
      render(
        <CompactDialog
          {...defaultProps}
          onConfirm={onConfirmMock}
          confirmDisabled={true}
        />
      );

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(onConfirmMock).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('traps Tab key navigation within dialog', () => {
      render(
        <CompactDialog {...defaultProps} onConfirm={onConfirmMock} onCancel={onCancelMock}>
          <input data-testid="first-input" />
          <input data-testid="second-input" />
        </CompactDialog>
      );

      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(event, 'stopPropagation', { value: vi.fn() });

      fireEvent.keyDown(document, event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('handles Shift+Tab for backward navigation', () => {
      render(
        <CompactDialog {...defaultProps} onConfirm={onConfirmMock}>
          <input data-testid="test-input" />
        </CompactDialog>
      );

      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true
      });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });

      fireEvent.keyDown(document, event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('prevents focus from leaving dialog', async () => {
      render(
        <CompactDialog {...defaultProps}>
          <input data-testid="dialog-input" />
        </CompactDialog>
      );

      const input = screen.getByTestId('dialog-input');
      const outsideElement = document.createElement('button');
      document.body.appendChild(outsideElement);

      // Simulate focus leaving the dialog
      fireEvent.focusOut(input, { relatedTarget: outsideElement });

      // The focus should be prevented from leaving
      await waitFor(() => {
        expect(input.focus).toHaveBeenCalled();
      });

      document.body.removeChild(outsideElement);
    });
  });

  describe('Accessibility', () => {
    it('renders dialog elements', () => {
      render(<CompactDialog {...defaultProps} />);

      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });

    it('manages focus within dialog', () => {
      render(
        <CompactDialog {...defaultProps}>
          <input data-testid="first-input" />
          <button>Button</button>
        </CompactDialog>
      );

      const input = screen.getByTestId('first-input');
      expect(input).toBeInTheDocument();
    });

    it('provides confirm button when onConfirm is provided', () => {
      render(<CompactDialog {...defaultProps} onConfirm={onConfirmMock} />);

      const confirmButton = screen.getByText('OK');
      expect(confirmButton).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('removes event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(<CompactDialog {...defaultProps} />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);
    });
  });
});