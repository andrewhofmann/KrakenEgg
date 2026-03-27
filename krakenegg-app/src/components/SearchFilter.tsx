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
    if (focusSignal) {
        inputRef.current?.focus();
        inputRef.current?.select();
    }
  }, [focusSignal]);

  return (
    <div className={clsx("relative flex items-center", className)}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-macos-textSecondary" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          "w-full bg-black/20 border border-white/10 rounded-md py-1.5 pl-9 pr-3 text-sm text-macos-text",
          "focus:outline-none focus:bg-black/40 focus:border-macos-active/50 transition-all",
          "placeholder:text-white/20"
        )}
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-macos-textSecondary hover:text-white"
          aria-label="Clear filter"
        >
          <XCircle size={16} />
        </button>
      )}
    </div>
  );
};