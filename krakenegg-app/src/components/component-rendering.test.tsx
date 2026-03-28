import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock ResizeObserver for AutoSizer tests
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

// --- ErrorBoundary Tests ---
import { ErrorBoundary } from './ErrorBoundary';

const ThrowingChild = ({ shouldThrow, message = 'Boom!' }: { shouldThrow: boolean; message?: string }) => {
  if (shouldThrow) throw new Error(message);
  return <div>All good</div>;
};

describe('ErrorBoundary rendering', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <span>Content here</span>
      </ErrorBoundary>
    );
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  it('catches error and shows fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.queryByText('All good')).not.toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows custom fallbackTitle', () => {
    render(
      <ErrorBoundary fallbackTitle="Custom error title">
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error title')).toBeInTheDocument();
  });

  it('shows the error message', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} message="Specific failure" />
      </ErrorBoundary>
    );
    expect(screen.getByText('Specific failure')).toBeInTheDocument();
  });

  it('shows Try Again button in error state', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('calls onReset when Try Again clicked', () => {
    const resetFn = vi.fn();
    render(
      <ErrorBoundary onReset={resetFn}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByText('Try Again'));
    expect(resetFn).toHaveBeenCalledTimes(1);
  });

  it('renders multiple children without error', () => {
    render(
      <ErrorBoundary>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });

  it('renders with no fallbackTitle and shows default', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('resets error state when Try Again is clicked', () => {
    const resetFn = vi.fn();
    render(
      <ErrorBoundary onReset={resetFn}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Try Again'));
    // onReset is called, confirming the error state was cleared
    expect(resetFn).toHaveBeenCalledTimes(1);
  });
});

// --- SmartTooltip Tests ---
import { SmartTooltip } from './SmartTooltip';

describe('SmartTooltip rendering', () => {
  it('renders the provided text', () => {
    render(<SmartTooltip text="Hello World" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders with empty text', () => {
    const { container } = render(<SmartTooltip text="" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const { container } = render(<SmartTooltip text="test" className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });

  it('renders with custom style', () => {
    const { container } = render(<SmartTooltip text="styled" style={{ color: 'red' }} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.color).toBe('red');
  });

  it('has truncate class for overflow handling', () => {
    const { container } = render(<SmartTooltip text="some text" />);
    expect(container.firstChild).toHaveClass('truncate');
  });

  it('renders long text without crashing', () => {
    const longText = 'A'.repeat(5000);
    render(<SmartTooltip text={longText} />);
    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it('renders special characters', () => {
    render(<SmartTooltip text="<script>alert('xss')</script>" />);
    expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument();
  });
});

// --- SearchFilter Tests ---
import { SearchFilter } from './SearchFilter';

describe('SearchFilter rendering', () => {
  it('renders with default placeholder', () => {
    render(<SearchFilter value="" onChange={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByPlaceholderText('Filter files...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchFilter value="" onChange={vi.fn()} onClear={vi.fn()} placeholder="Type to search" />);
    expect(screen.getByPlaceholderText('Type to search')).toBeInTheDocument();
  });

  it('renders with value', () => {
    render(<SearchFilter value="my query" onChange={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByDisplayValue('my query')).toBeInTheDocument();
  });

  it('clear button visible when value set', () => {
    render(<SearchFilter value="data" onChange={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByLabelText('Clear filter')).toBeInTheDocument();
  });

  it('clear button hidden when value empty', () => {
    render(<SearchFilter value="" onChange={vi.fn()} onClear={vi.fn()} />);
    expect(screen.queryByLabelText('Clear filter')).not.toBeInTheDocument();
  });

  it('calls onChange on typing', () => {
    const onChange = vi.fn();
    render(<SearchFilter value="" onChange={onChange} onClear={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Filter files...'), { target: { value: 'new' } });
    expect(onChange).toHaveBeenCalledWith('new');
  });

  it('calls onClear when clear button clicked', () => {
    const onClear = vi.fn();
    render(<SearchFilter value="something" onChange={vi.fn()} onClear={onClear} />);
    fireEvent.click(screen.getByLabelText('Clear filter'));
    expect(onClear).toHaveBeenCalled();
  });

  it('renders input as type text', () => {
    render(<SearchFilter value="" onChange={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByPlaceholderText('Filter files...')).toHaveAttribute('type', 'text');
  });

  it('applies custom className', () => {
    const { container } = render(
      <SearchFilter value="" onChange={vi.fn()} onClear={vi.fn()} className="extra-class" />
    );
    expect(container.firstChild).toHaveClass('extra-class');
  });

  it('renders without crashing with all props', () => {
    const { container } = render(
      <SearchFilter
        value="test"
        onChange={vi.fn()}
        onClear={vi.fn()}
        placeholder="Search..."
        autoFocus={true}
        className="my-search"
        focusSignal={1}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

// --- AutoSizer Tests ---
import { AutoSizer } from './AutoSizer';

describe('AutoSizer rendering', () => {
  it('renders wrapper div', () => {
    const { container } = render(
      <AutoSizer>
        {({ height, width }) => <div data-testid="inner">h:{height} w:{width}</div>}
      </AutoSizer>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AutoSizer className="custom-auto">
        {() => <div>content</div>}
      </AutoSizer>
    );
    expect(container.firstChild).toHaveClass('custom-auto');
  });

  it('wrapper has overflow hidden style', () => {
    const { container } = render(
      <AutoSizer>
        {() => <div>test</div>}
      </AutoSizer>
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.overflow).toBe('hidden');
  });

  it('wrapper has 100% width and height', () => {
    const { container } = render(
      <AutoSizer>
        {() => <div>test</div>}
      </AutoSizer>
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('100%');
    expect(el.style.height).toBe('100%');
  });

  it('applies custom style merged with defaults', () => {
    const { container } = render(
      <AutoSizer style={{ backgroundColor: 'blue' }}>
        {() => <div>styled</div>}
      </AutoSizer>
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.backgroundColor).toBe('blue');
    expect(el.style.overflow).toBe('hidden');
  });

  it('does not render children when size is 0 (initial state in jsdom)', () => {
    // In jsdom, getBoundingClientRect returns 0x0 so children should not render
    render(
      <AutoSizer>
        {({ height, width }) => <div data-testid="inner">h:{height} w:{width}</div>}
      </AutoSizer>
    );
    expect(screen.queryByTestId('inner')).not.toBeInTheDocument();
  });
});
