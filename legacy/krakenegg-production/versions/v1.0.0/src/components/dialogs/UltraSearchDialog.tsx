import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileInfo } from '../../types';
import { formatFileSize, formatDate, getFileIcon } from '../../utils/fileUtils';
import { generateMockFiles } from '../../data/mockFiles';
import {
  Search,
  Filter,
  Calendar,
  HardDrive,
  Type,
  Settings,
  X,
  CheckCircle,
  Clock,
  Star,
  Folder,
  ArrowRight
} from 'lucide-react';

interface UltraSearchDialogProps {
  onClose: () => void;
}

const UltraSearchDialog = ({ onClose }: UltraSearchDialogProps) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<FileInfo[]>([]);
  const [selectedFilters, setSelectedFilters] = useState({
    fileTypes: [] as string[],
    sizeRange: 'any' as 'any' | 'small' | 'medium' | 'large',
    dateRange: 'any' as 'any' | 'today' | 'week' | 'month' | 'year',
    location: 'everywhere' as 'everywhere' | 'current' | 'specific'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (query.length > 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        const mockResults = generateMockFiles('/search-results').filter(file =>
          file.name.toLowerCase().includes(query.toLowerCase())
        );
        setResults(mockResults.slice(0, 50));
        setIsSearching(false);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query]);

  const fileTypes = [
    { id: 'documents', label: 'Documents', extensions: ['pdf', 'doc', 'txt'] },
    { id: 'images', label: 'Images', extensions: ['jpg', 'png', 'gif'] },
    { id: 'videos', label: 'Videos', extensions: ['mp4', 'mov', 'avi'] },
    { id: 'audio', label: 'Audio', extensions: ['mp3', 'wav', 'flac'] },
    { id: 'archives', label: 'Archives', extensions: ['zip', 'rar', '7z'] },
    { id: 'code', label: 'Code', extensions: ['js', 'ts', 'py', 'swift'] }
  ];

  const toggleFileType = (typeId: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      fileTypes: prev.fileTypes.includes(typeId)
        ? prev.fileTypes.filter(t => t !== typeId)
        : [...prev.fileTypes, typeId]
    }));
  };

  return (
    <div className="w-full max-w-4xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-mac26-blue-500/10 flex items-center justify-center">
            <Search size={24} className="text-mac26-blue-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
              Universal Search
            </h3>
            <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
              Find files across your entire system
            </p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="p-6 border-b border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for files, folders, and content..."
            className="w-full pl-12 pr-4 py-3 ultra-input text-lg"
            autoFocus
          />
          {isSearching && (
            <motion.div
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-5 h-5 border-2 border-mac26-blue-500 border-t-transparent rounded-full" />
            </motion.div>
          )}
        </div>

        {/* Quick filters */}
        <div className="flex items-center gap-2 mt-4">
          <motion.button
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-2 ${
              showAdvanced
                ? 'bg-mac26-blue-500 text-white'
                : 'bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark'
            }`}
            onClick={() => setShowAdvanced(!showAdvanced)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter size={14} />
            Advanced Filters
          </motion.button>

          <div className="flex gap-2">
            {fileTypes.slice(0, 4).map(type => (
              <motion.button
                key={type.id}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  selectedFilters.fileTypes.includes(type.id)
                    ? 'bg-mac26-blue-500 text-white'
                    : 'bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark'
                }`}
                onClick={() => toggleFileType(type.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {type.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            className="p-6 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border-b border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-3 gap-6">
              {/* File types */}
              <div>
                <h4 className="text-sm font-semibold text-mac26-text-primary-light dark:text-mac26-text-primary-dark mb-3 flex items-center gap-2">
                  <Type size={14} />
                  File Types
                </h4>
                <div className="space-y-2">
                  {fileTypes.map(type => (
                    <motion.label
                      key={type.id}
                      className="flex items-center gap-2 cursor-pointer"
                      whileHover={{ x: 2 }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFilters.fileTypes.includes(type.id)}
                        onChange={() => toggleFileType(type.id)}
                        className="ultra-checkbox"
                      />
                      <span className="text-sm text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                        {type.label}
                      </span>
                      <span className="text-xs text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark">
                        {type.extensions.join(', ')}
                      </span>
                    </motion.label>
                  ))}
                </div>
              </div>

              {/* Size range */}
              <div>
                <h4 className="text-sm font-semibold text-mac26-text-primary-light dark:text-mac26-text-primary-dark mb-3 flex items-center gap-2">
                  <HardDrive size={14} />
                  File Size
                </h4>
                <div className="space-y-2">
                  {[
                    { id: 'any', label: 'Any size' },
                    { id: 'small', label: 'Small (< 1 MB)' },
                    { id: 'medium', label: 'Medium (1-100 MB)' },
                    { id: 'large', label: 'Large (> 100 MB)' }
                  ].map(option => (
                    <motion.label
                      key={option.id}
                      className="flex items-center gap-2 cursor-pointer"
                      whileHover={{ x: 2 }}
                    >
                      <input
                        type="radio"
                        name="sizeRange"
                        checked={selectedFilters.sizeRange === option.id}
                        onChange={() => setSelectedFilters(prev => ({ ...prev, sizeRange: option.id as any }))}
                        className="ultra-radio"
                      />
                      <span className="text-sm text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                        {option.label}
                      </span>
                    </motion.label>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div>
                <h4 className="text-sm font-semibold text-mac26-text-primary-light dark:text-mac26-text-primary-dark mb-3 flex items-center gap-2">
                  <Calendar size={14} />
                  Modified Date
                </h4>
                <div className="space-y-2">
                  {[
                    { id: 'any', label: 'Any time' },
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'This week' },
                    { id: 'month', label: 'This month' },
                    { id: 'year', label: 'This year' }
                  ].map(option => (
                    <motion.label
                      key={option.id}
                      className="flex items-center gap-2 cursor-pointer"
                      whileHover={{ x: 2 }}
                    >
                      <input
                        type="radio"
                        name="dateRange"
                        checked={selectedFilters.dateRange === option.id}
                        onChange={() => setSelectedFilters(prev => ({ ...prev, dateRange: option.id as any }))}
                        className="ultra-radio"
                      />
                      <span className="text-sm text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                        {option.label}
                      </span>
                    </motion.label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="flex-1 overflow-auto ultra-scroll">
        {query.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <motion.div
                className="text-6xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                🔍
              </motion.div>
              <div>
                <h4 className="text-lg font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                  Start typing to search
                </h4>
                <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
                  Find files, folders, and content across your system
                </p>
              </div>
            </div>
          </div>
        )}

        {query.length > 0 && query.length <= 2 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
                Type at least 3 characters to search
              </p>
            </div>
          </div>
        )}

        {isSearching && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-mac26-blue-500 border-t-transparent rounded-full mx-auto"
              />
              <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
                Searching...
              </p>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                Found {results.length} results for "{query}"
              </h4>
              <div className="flex gap-2">
                <motion.button
                  className="p-2 rounded-lg bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark transition-colors duration-150"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Sort results"
                >
                  <Settings size={14} />
                </motion.button>
              </div>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {results.map((file, index) => (
                  <motion.div
                    key={file.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-mac26-selection-light dark:hover:bg-mac26-selection-dark cursor-pointer group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ x: 4 }}
                  >
                    <span className="text-lg">{getFileIcon(file)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark truncate">
                          {file.name}
                        </p>
                        {file.isDirectory && (
                          <Folder size={12} className="text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
                        <span>/Users/user/Documents/{file.name}</span>
                        <span>{formatFileSize(file.size)}</span>
                        <span>{formatDate(file.modified)}</span>
                      </div>
                    </div>
                    <motion.div
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      whileHover={{ scale: 1.1 }}
                    >
                      <ArrowRight size={14} className="text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark" />
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {query.length > 2 && !isSearching && results.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <motion.div
                className="text-6xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              >
                🚫
              </motion.div>
              <div>
                <h4 className="text-lg font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                  No results found
                </h4>
                <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
                  Try different keywords or adjust your filters
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UltraSearchDialog;