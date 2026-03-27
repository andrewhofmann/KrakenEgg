import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, X, Folder, File } from 'lucide-react';
import CompactDialog from './CompactDialog';
import { FileInfo } from '../../types';
import { formatFileSize, formatDate } from '../../utils/fileUtils';

interface UltraSearchDialogProps {
  onClose: () => void;
}

const UltraSearchDialog = ({ onClose }: UltraSearchDialogProps) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<FileInfo[]>([]);
  const [searchLocation, setSearchLocation] = useState('current');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');

  useEffect(() => {
    if (query.length > 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        // TODO: Implement real file search using Tauri backend
        // For now, show empty results
        setResults([]);
        setIsSearching(false);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSearch = () => {
    if (query.trim()) {
      console.log(`Searching for: ${query} in ${searchLocation} (${fileTypeFilter})`);
      // TODO: Implement actual search functionality
    }
  };

  return (
    <CompactDialog
      title="Search Files"
      icon={<Search size={16} />}
      iconColor="bg-gradient-to-br from-mac26-blue-500 to-mac26-purple-500"
      onClose={onClose}
      onConfirm={handleSearch}
      confirmText="Search"
      cancelText="Cancel"
      size="lg"
      confirmDisabled={query.trim().length === 0}
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark mb-2">
            Search for:
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="File or folder name..."
              className="w-full pl-10 pr-4 py-2 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mac26-blue-500/50 focus:border-mac26-blue-500 transition-all duration-150"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  handleSearch();
                }
              }}
            />
            {isSearching && (
              <motion.div
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-4 h-4 border-2 border-mac26-blue-500 border-t-transparent rounded-full" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Search Options */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark mb-2">
              Search in:
            </label>
            <select
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-full px-3 py-2 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mac26-blue-500/50 focus:border-mac26-blue-500 transition-all duration-150"
            >
              <option value="current">Current folder</option>
              <option value="currentSubfolders">Current + subfolders</option>
              <option value="allFolders">All accessible folders</option>
              <option value="specific">Specific location...</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark mb-2">
              File type:
            </label>
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mac26-blue-500/50 focus:border-mac26-blue-500 transition-all duration-150"
            >
              <option value="all">All files</option>
              <option value="documents">Documents</option>
              <option value="images">Images</option>
              <option value="videos">Videos</option>
              <option value="audio">Audio</option>
              <option value="archives">Archives</option>
              <option value="folders">Folders only</option>
            </select>
          </div>
        </div>

        {/* Search Options */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="caseSensitive"
              className="w-4 h-4 text-mac26-blue-500 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark rounded focus:ring-mac26-blue-500 focus:ring-2"
            />
            <label htmlFor="caseSensitive" className="text-sm text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
              Case sensitive
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeHidden"
              className="w-4 h-4 text-mac26-blue-500 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark rounded focus:ring-mac26-blue-500 focus:ring-2"
            />
            <label htmlFor="includeHidden" className="text-sm text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
              Include hidden files
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="searchContent"
              className="w-4 h-4 text-mac26-blue-500 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark rounded focus:ring-mac26-blue-500 focus:ring-2"
            />
            <label htmlFor="searchContent" className="text-sm text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
              Search file contents
            </label>
          </div>
        </div>

        {/* Results Preview */}
        {query.length > 0 && (
          <div className="mt-4 p-3 bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark rounded-lg border border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark">
            <div className="flex items-center gap-2 mb-2">
              <Search size={14} className="text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark" />
              <span className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                Search Preview
              </span>
            </div>

            {query.length <= 2 ? (
              <p className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
                Type at least 3 characters to search
              </p>
            ) : isSearching ? (
              <p className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
                Searching...
              </p>
            ) : results.length === 0 ? (
              <p className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
                Click "Search" to find files matching "{query}"
              </p>
            ) : (
              <div className="space-y-1">
                {results.slice(0, 3).map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {file.isDirectory ? (
                      <Folder size={12} className="text-mac26-blue-500" />
                    ) : (
                      <File size={12} className="text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark" />
                    )}
                    <span className="text-mac26-text-primary-light dark:text-mac26-text-primary-dark truncate">
                      {file.name}
                    </span>
                  </div>
                ))}
                {results.length > 3 && (
                  <p className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
                    ...and {results.length - 3} more results
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </CompactDialog>
  );
};

export default UltraSearchDialog;