import { useStore } from "../store";
import { X, Search, File, Folder } from "lucide-react";
import { useEffect, useRef } from "react";
import { formatSize } from "../utils/format";
import { getFileIcon, getFileIconColor } from "../utils/fileIcons";

export const SearchModal = () => {
  const { show, query, results, loading, error, searchContent, searchMode } = useStore((state) => state.search);
  const hideSearch = useStore((state) => state.hideSearch);
  const setSearchQuery = useStore((state) => state.setSearchQuery);
  const setSearchContent = useStore((state) => state.setSearchContent);
  const setSearchMode = useStore((state) => state.setSearchMode);
  const executeSearch = useStore((state) => state.executeSearch);
  const setPath = useStore((state) => state.setPath);
  const activeSide = useStore((state) => state.activeSide);
  const activePanel = useStore((state) => state[state.activeSide]);
  const activeTab = activePanel.tabs[activePanel.activeTabIndex];

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show && inputRef.current) {
      inputRef.current.focus();
    }
  }, [show]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch();
    } else if (e.key === 'Escape') {
      hideSearch();
    }
  };

  const handleResultClick = (fileName: string) => {
    // fileName is a relative path from the search root (e.g., "subdir/file.txt")
    const searchRoot = activeTab?.path || '/';
    const parts = fileName.split('/');
    if (parts.length > 1) {
      // Navigate to the parent directory of the result
      const parentDir = parts.slice(0, -1).join('/');
      const targetPath = searchRoot === '/' ? `/${parentDir}` : `${searchRoot}/${parentDir}`;
      setPath(activeSide, targetPath);
    }
    // For root-level results, we're already in the right directory — just close
    hideSearch();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
      <div className="relative flex flex-col w-full max-w-2xl h-3/4 rounded-lg shadow-2xl bg-macos-glass border border-[var(--ke-border)]">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[var(--ke-border)] shrink-0">
          <h3 className="text-sm font-semibold text-[var(--ke-text)]">Search Files</h3>
          <button onClick={hideSearch} className="p-1 rounded-md hover:bg-[var(--ke-bg-hover)] text-macos-textSecondary hover:text-[var(--ke-text)] transition-colors" aria-label="Close search">
            <X size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[var(--ke-border)] flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-macos-textSecondary" />
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-[var(--ke-bg-input)] border border-[var(--ke-border)] rounded-md py-2 pl-10 pr-4 text-sm text-[var(--ke-text)] focus:outline-none focus:border-macos-active placeholder:text-[var(--ke-text-disabled)]"
                placeholder="Search filename or content..."
                value={query}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button
              onClick={() => executeSearch()}
              disabled={loading || !query}
              className="px-4 py-2 bg-[var(--ke-accent)] hover:bg-[var(--ke-accent-hover)] text-[var(--ke-text)] text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Search
            </button>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-[var(--ke-text-secondary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={searchContent}
                onChange={(e) => setSearchContent(e.target.checked)}
                className="accent-macos-active"
              />
              Search content
            </label>
            <div className="flex gap-1 ml-auto">
              {(['substring', 'glob', 'regex'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSearchMode(mode)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    searchMode === mode
                      ? 'bg-[var(--ke-accent)] text-[var(--ke-text)]'
                      : 'bg-[var(--ke-bg-hover)] text-[var(--ke-text-tertiary)] hover:bg-[var(--ke-bg-active)] hover:text-[var(--ke-text-secondary)]'
                  }`}
                >
                  {mode === 'substring' ? 'Text' : mode === 'glob' ? 'Glob' : 'Regex'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3" style={{ color: 'var(--ke-text-secondary)' }}>
              <Search size={20} className="animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center py-12 gap-2" style={{ color: 'var(--ke-error)' }}>
              <span className="text-sm font-medium">Search failed</span>
              <span className="text-xs opacity-70">{error}</span>
            </div>
          )}

          {!loading && !error && results.length === 0 && query && (
            <div className="flex flex-col items-center justify-center py-12 gap-2" style={{ color: 'var(--ke-text-tertiary)' }}>
              <Search size={24} className="opacity-30" />
              <span className="text-sm">No results found</span>
              <span className="text-xs opacity-60">Try a different search term or mode</span>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <>
              <div className="px-3 py-1 text-[10px] text-[var(--ke-text-tertiary)] font-medium">
                {results.length} result{results.length !== 1 ? 's' : ''} found
                {results.length >= 1000 && ' (limit reached — refine your search)'}
              </div>
              {results.map((file, i) => {
                const Icon = getFileIcon(file);
                const iconColor = getFileIconColor(file, false, true);
                // Highlight the matching part of the name
                const lowerName = file.name.toLowerCase();
                const lowerQuery = query.toLowerCase();
                const matchIndex = lowerName.indexOf(lowerQuery);

                return (
                  <div
                    key={i}
                    onClick={() => handleResultClick(file.name)}
                    className="flex items-center px-3 py-2 rounded-md hover:bg-[var(--ke-bg-hover)] cursor-pointer group transition-colors"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleResultClick(file.name); }}
                  >
                    <Icon size={16} className={`${iconColor} mr-3 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[var(--ke-text)] truncate">
                        {matchIndex >= 0 ? (
                          <>
                            {file.name.slice(0, matchIndex)}
                            <span className="bg-[var(--ke-selection-light)] text-[var(--ke-warning)] rounded-sm px-0.5">
                              {file.name.slice(matchIndex, matchIndex + query.length)}
                            </span>
                            {file.name.slice(matchIndex + query.length)}
                          </>
                        ) : (
                          file.name
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--ke-text-tertiary)] truncate">{activeTab?.path}/{file.name}</div>
                    </div>
                    <div className="text-xs text-[var(--ke-text-tertiary)] shrink-0 ml-2">
                      {file.is_dir ? '<DIR>' : formatSize(file.size)}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
