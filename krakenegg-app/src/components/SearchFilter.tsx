import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';
import { Search, XCircle } from 'lucide-react';

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  focusSignal?: number;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Filter files...',
  autoFocus = false,
  className,
  focusSignal,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (focusSignal != null && focusSignal > 0) {
        inputRef.current?.focus();
        inputRef.current?.select();
    }
  }, [focusSignal]);

  return (
    <div className={clsx("relative flex items-center", className)}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ke-text-secondary)' }} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          "w-full rounded-md py-1.5 pl-9 pr-3 text-sm border transition-all",
          "focus:outline-none",
          "[&::placeholder]:opacity-30"
        )}
        style={{
          backgroundColor: 'var(--ke-bg-input)',
          borderColor: 'var(--ke-border-subtle)',
          color: 'var(--ke-text)',
        }}
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 transition-colors"
          style={{ color: 'var(--ke-text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--ke-text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--ke-text-secondary)'}
          aria-label="Clear filter"
        >
          <XCircle size={16} />
        </button>
      )}
    </div>
  );
};