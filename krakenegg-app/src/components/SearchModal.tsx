import { useStore } from "../store";
import { X, Search, File, Folder } from "lucide-react";
import { useEffect, useRef } from "react";

export const SearchModal = () => {
  const { show, query, results, loading, error, searchContent } = useStore((state) => state.search);
  const hideSearch = useStore((state) => state.hideSearch);
  const setSearchQuery = useStore((state) => state.setSearchQuery);
  const setSearchContent = useStore((state) => state.setSearchContent);
  const executeSearch = useStore((state) => state.executeSearch);
  
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

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
      <div className="relative flex flex-col w-full max-w-2xl h-3/4 rounded-lg shadow-2xl bg-macos-glass border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/10 shrink-0">
          <h3 className="text-sm font-semibold text-white">Search Files</h3>
          <button onClick={hideSearch} className="p-1 rounded-md hover:bg-white/10 text-macos-textSecondary hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-white/10 flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-macos-textSecondary" />
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-black/20 border border-white/10 rounded-md py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-macos-active placeholder:text-white/20"
                placeholder="Search filename or content..."
                value={query}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button 
              onClick={() => executeSearch()}
              disabled={loading || !query}
              className="px-4 py-2 bg-macos-active hover:bg-macos-activeHover text-white text-sm rounded-md disabled:opacity-50 transition-colors"
            >
              Search
            </button>
          </div>
          
          <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer select-none w-fit">
            <input 
              type="checkbox" 
              checked={searchContent} 
              onChange={(e) => setSearchContent(e.target.checked)}
              className="accent-macos-active"
            />
            Search file content
          </label>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
          {loading && <div className="text-center py-8 text-white/60">Searching...</div>}
          {error && <div className="text-red-400 py-8 text-center">Error: {error}</div>}
          
          {!loading && !error && results.length === 0 && query && (
            <div className="text-center py-8 text-white/40">No results found.</div>
          )}

          {!loading && !error && results.map((file, i) => (
            <div key={i} className="flex items-center px-3 py-2 rounded-md hover:bg-white/10 cursor-pointer group">
              {file.is_dir ? <Folder size={16} className="text-blue-400 mr-3" /> : <File size={16} className="text-gray-400 mr-3" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{file.name}</div>
                {/* Path would go here if backend returned full path */}
              </div>
              <div className="text-xs text-white/40">{file.is_dir ? '' : (file.size / 1024).toFixed(1) + ' KB'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
