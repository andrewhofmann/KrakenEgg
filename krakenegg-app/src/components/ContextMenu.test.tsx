import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContextMenu } from './ContextMenu';

const defaultItems = [
  { label: 'Open', action: vi.fn() },
  { label: 'Copy', action: vi.fn() },
  { label: '---', action: vi.fn() },
  { label: 'Delete', action: vi.fn() },
];

const renderMenu = (overrides: Record<string, unknown> = {}) => {
  const props = {
    x: 100,
    y: 200,
    items: defaultItems,
    onClose: vi.fn(),
    ...overrides,
  };
  return render(<ContextMenu {...props} />);
};

describe('ContextMenu', () => {
  it('renders all non-separator menu items as buttons', () => {
    renderMenu();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders separator items as dividers (not buttons)', () => {
    renderMenu();
    // Separators should not be rendered as buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3); // Open, Copy, Delete (not ---)
  });

  it('calls action and onClose when a menu item is clicked', () => {
    const action = vi.fn();
    const onClose = vi.fn();
    renderMenu({
      items: [{ label: 'Open', action }],
      onClose,
    });
    fireEvent.click(screen.getByText('Open'));
    expect(action).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call action when a disabled item is clicked', () => {
    const action = vi.fn();
    const onClose = vi.fn();
    renderMenu({
      items: [{ label: 'Locked', action, disabled: true }],
      onClose,
    });
    fireEvent.click(screen.getByText('Locked'));
    expect(action).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    renderMenu({ onClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on click outside', () => {
    const onClose = vi.fn();
    renderMenu({ onClose });
    fireEvent.mouseDown(document);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on click inside the menu', () => {
    const onClose = vi.fn();
    renderMenu({ onClose });
    // Click on a menu item should trigger action+close, but mousedown inside menu should not trigger outside handler
    const openButton = screen.getByText('Open');
    fireEvent.mouseDown(openButton);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders disabled items with disabled attribute', () => {
    renderMenu({
      items: [{ label: 'Disabled Item', action: vi.fn(), disabled: true }],
    });
    expect(screen.getByText('Disabled Item')).toBeDisabled();
  });

  it('prevents default context menu on the menu itself', () => {
    renderMenu();
    const menu = screen.getByText('Open').closest('[class*="fixed"]')!;
    const event = new MouseEvent('contextmenu', { bubbles: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    menu.dispatchEvent(event);
    expect(preventDefault).toHaveBeenCalled();
  });
});
