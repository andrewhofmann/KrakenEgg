import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchFilter } from './SearchFilter';

describe('SearchFilter', () => {
  it('renders with default placeholder', () => {
    render(<SearchFilter value="" onChange={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByPlaceholderText('Filter files...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(
      <SearchFilter value="" onChange={vi.fn()} onClear={vi.fn()} placeholder="Search here..." />
    );
    expect(screen.getByPlaceholderText('Search here...')).toBeInTheDocument();
  });

  it('displays the current value', () => {
    render(<SearchFilter value="test query" onChange={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });

  it('calls onChange when user types', () => {
    const onChange = vi.fn();
    render(<SearchFilter value="" onChange={onChange} onClear={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Filter files...'), {
      target: { value: 'hello' },
    });
    expect(onChange).toHaveBeenCalledWith('hello');
  });

  it('shows clear button when value is non-empty', () => {
    render(<SearchFilter value="something" onChange={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByLabelText('Clear filter')).toBeInTheDocument();
  });

  it('hides clear button when value is empty', () => {
    render(<SearchFilter value="" onChange={vi.fn()} onClear={vi.fn()} />);
    expect(screen.queryByLabelText('Clear filter')).not.toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    render(<SearchFilter value="query" onChange={vi.fn()} onClear={onClear} />);
    fireEvent.click(screen.getByLabelText('Clear filter'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <SearchFilter value="" onChange={vi.fn()} onClear={vi.fn()} className="my-custom-class" />
    );
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('renders the input as type text', () => {
    render(<SearchFilter value="" onChange={vi.fn()} onClear={vi.fn()} />);
    const input = screen.getByPlaceholderText('Filter files...');
    expect(input).toHaveAttribute('type', 'text');
  });
});
