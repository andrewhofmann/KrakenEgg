import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileRow } from './FileRow';
import type { FileInfo, SortColumn } from '../store';

// Mock SmartTooltip to just render text
vi.mock('./SmartTooltip', () => ({
  SmartTooltip: ({ text, className }: { text: string; className?: string }) => (
    <span className={className}>{text}</span>
  ),
}));

const makeFile = (overrides: Partial<FileInfo> = {}): FileInfo => ({
  name: 'readme.txt',
  is_dir: false,
  size: 1024,
  modified_at: 1700000000,
  ...overrides,
});

const defaultColumns: SortColumn[] = ['name', 'ext', 'size', 'date'];

const defaultHandlers = {
  onClick: vi.fn(),
  onDoubleClick: vi.fn(),
  onContextMenu: vi.fn(),
  onDragStart: vi.fn(),
  onDragEnd: vi.fn(),
  onDragOver: vi.fn(),
  onDragLeave: vi.fn(),
  onDrop: vi.fn(),
};

const renderRow = (overrides: Record<string, unknown> = {}) => {
  const props = {
    file: makeFile(),
    index: 0,
    style: { height: 28 },
    isSelected: false,
    isCursor: false,
    isActive: false,
    isDragTarget: false,
    columns: defaultColumns,
    ...defaultHandlers,
    ...overrides,
  };
  return render(<FileRow {...props} />);
};

describe('FileRow', () => {
  it('renders the file name', () => {
    renderRow();
    expect(screen.getByText('readme.txt')).toBeInTheDocument();
  });

  it('renders extension for files', () => {
    renderRow({ file: makeFile({ name: 'photo.png' }) });
    expect(screen.getByText('png')).toBeInTheDocument();
  });

  it('renders "<DIR>" for directory without calculated size', () => {
    renderRow({ file: makeFile({ is_dir: true, name: 'Documents', size: 0 }) });
    expect(screen.getByText('<DIR>')).toBeInTheDocument();
  });

  it('renders calculated size for directory with size > 0', () => {
    renderRow({ file: makeFile({ is_dir: true, name: 'Documents', size: 1048576 }) });
    expect(screen.getByText('1.0 MB')).toBeInTheDocument();
  });

  it('renders empty extension for directories', () => {
    renderRow({ file: makeFile({ is_dir: true, name: 'src' }) });
    // The ext cell should render empty string for dirs
    expect(screen.getByText('src')).toBeInTheDocument();
  });

  it('renders formatted file size for regular files', () => {
    renderRow({ file: makeFile({ size: 1024 }) });
    expect(screen.getByText('1.0 KB')).toBeInTheDocument();
  });

  it('sets the correct id on the row', () => {
    renderRow({ index: 5 });
    expect(document.getElementById('row-5')).toBeInTheDocument();
  });

  it('is draggable', () => {
    renderRow();
    const row = document.getElementById('row-0')!;
    expect(row.getAttribute('draggable')).toBe('true');
  });

  it('calls onClick with index when clicked', () => {
    const onClick = vi.fn();
    renderRow({ onClick });
    fireEvent.click(document.getElementById('row-0')!);
    expect(onClick).toHaveBeenCalledWith(expect.any(Object), 0);
  });

  it('calls onDoubleClick with file when double-clicked', () => {
    const onDoubleClick = vi.fn();
    const file = makeFile({ name: 'test.js' });
    renderRow({ onDoubleClick, file });
    fireEvent.doubleClick(document.getElementById('row-0')!);
    expect(onDoubleClick).toHaveBeenCalledWith(expect.any(Object), file);
  });

  it('calls onContextMenu with file and index', () => {
    const onContextMenu = vi.fn();
    const file = makeFile();
    renderRow({ onContextMenu, file, index: 3 });
    fireEvent.contextMenu(document.getElementById('row-3')!);
    expect(onContextMenu).toHaveBeenCalledWith(expect.any(Object), file, 3);
  });

  it('calls onDragStart with file and index', () => {
    const onDragStart = vi.fn();
    const file = makeFile();
    renderRow({ onDragStart, file, index: 2 });
    fireEvent.dragStart(document.getElementById('row-2')!);
    expect(onDragStart).toHaveBeenCalledWith(expect.any(Object), file, 2);
  });

  it('calls onDragEnd when drag ends', () => {
    const onDragEnd = vi.fn();
    renderRow({ onDragEnd });
    fireEvent.dragEnd(document.getElementById('row-0')!);
    expect(onDragEnd).toHaveBeenCalled();
  });

  it('applies selected+active styling class', () => {
    renderRow({ isSelected: true, isActive: true });
    const row = document.getElementById('row-0')!;
    expect(row.className).toContain('bg-[#0058D0]');
  });

  it('renders only specified columns in order', () => {
    const columns: SortColumn[] = ['name', 'size'];
    renderRow({ columns, file: makeFile({ name: 'app.js', size: 2048 }) });
    expect(screen.getByText('app.js')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    // Extension column not rendered
    expect(screen.queryByText('js')).not.toBeInTheDocument();
  });

  it('shows inline rename input when isRenaming is true', () => {
    renderRow({ isRenaming: true, file: makeFile({ name: 'document.txt' }) });
    const input = document.querySelector('input[value="document.txt"]');
    expect(input).toBeInTheDocument();
  });

  it('calls onRenameSubmit with old and new name on Enter', () => {
    const onRenameSubmit = vi.fn();
    renderRow({ isRenaming: true, file: makeFile({ name: 'old.txt' }), onRenameSubmit });
    const input = document.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'new.txt' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRenameSubmit).toHaveBeenCalledWith('old.txt', 'new.txt');
  });

  it('calls onRenameCancel on Escape', () => {
    const onRenameCancel = vi.fn();
    renderRow({ isRenaming: true, file: makeFile({ name: 'test.txt' }), onRenameCancel });
    const input = document.querySelector('input')!;
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onRenameCancel).toHaveBeenCalled();
  });
});
