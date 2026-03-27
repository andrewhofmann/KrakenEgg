import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelState, ViewMode, SortBy, SortOrder } from '../../types';
import {
  ChevronDown,
  List,
  Columns,
  Image,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Settings,
  MoreVertical
} from 'lucide-react';

interface UltraPanelHeaderProps {
  side: 'left' | 'right';
  panel: PanelState;
  isActive: boolean;
  onUpdatePanel: (updater: (panel: PanelState) => PanelState) => void;
  onShowDialog: (dialogId: string) => void;
}

const UltraPanelHeader = ({
  side,
  panel,
  isActive,
  onUpdatePanel,
  onShowDialog
}: UltraPanelHeaderProps) => {
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const viewModes = [
    { id: ViewMode.Brief, icon: List, label: 'Brief', description: 'Names only' },
    { id: ViewMode.Detailed, icon: Columns, label: 'Detailed', description: 'Full information' }
  ];

  const sortOptions = [
    { id: SortBy.Name, label: 'Name', description: 'Alphabetical order' },
    { id: SortBy.Size, label: 'Size', description: 'File size' },
    { id: SortBy.Modified, label: 'Modified', description: 'Last modified date' },
    { id: SortBy.Extension, label: 'Extension', description: 'File type' },
    { id: SortBy.Type, label: 'Type', description: 'File category' }
  ];

  const currentViewMode = viewModes.find(mode => mode.id === panel.viewMode);
  const CurrentViewIcon = currentViewMode?.icon || List;

  const handleViewModeChange = (viewMode: ViewMode) => {
    onUpdatePanel(panel => ({ ...panel, viewMode }));
    setShowViewMenu(false);
  };

  const handleSortChange = (sortBy: SortBy) => {
    onUpdatePanel(panel => ({ ...panel, sortBy }));
    setShowSortMenu(false);
  };

  const toggleSortOrder = () => {
    onUpdatePanel(panel => ({
      ...panel,
      sortOrder: panel.sortOrder === SortOrder.Ascending ? SortOrder.Descending : SortOrder.Ascending
    }));
  };

  const toggleHiddenFiles = () => {
    onUpdatePanel(panel => ({ ...panel, showHidden: !panel.showHidden }));
  };

  return (
    <motion.div
      className="flex items-center justify-between px-3 py-1.5 border-b border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {/* Panel status - removed blue dot */}
      <div className="flex items-center gap-3">
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* View mode selector */}
        <div className="relative">
          <motion.button
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark transition-colors duration-150"
            onClick={() => setShowViewMenu(!showViewMenu)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={currentViewMode?.label}
          >
            <CurrentViewIcon size={12} />
            <ChevronDown size={10} className={`transition-transform duration-150 ${showViewMenu ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {showViewMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowViewMenu(false)}
                />
                <motion.div
                  className="absolute top-full right-0 z-50 mt-2 ultra-dialog rounded-xl shadow-mac26-lg py-2 min-w-48"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  {viewModes.map(mode => {
                    const Icon = mode.icon;
                    return (
                      <motion.button
                        key={mode.id}
                        className={`w-full px-4 py-3 text-left hover:bg-mac26-selection-light dark:hover:bg-mac26-selection-dark flex items-start gap-3 ${
                          panel.viewMode === mode.id ? 'bg-mac26-blue-500 text-white' : ''
                        }`}
                        onClick={() => handleViewModeChange(mode.id)}
                        whileHover={{ x: 2 }}
                      >
                        <Icon size={16} className="mt-0.5" />
                        <div>
                          <div className="text-sm font-medium">{mode.label}</div>
                          <div className="text-xs opacity-70">{mode.description}</div>
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Sort selector */}
        <div className="relative">
          <motion.button
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark transition-colors duration-150"
            onClick={() => setShowSortMenu(!showSortMenu)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={`Sort by ${panel.sortBy} (${panel.sortOrder})`}
          >
            {panel.sortOrder === SortOrder.Ascending ? (
              <TrendingUp size={10} />
            ) : (
              <TrendingDown size={10} />
            )}
            <ChevronDown size={10} className={`transition-transform duration-150 ${showSortMenu ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {showSortMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSortMenu(false)}
                />
                <motion.div
                  className="absolute top-full right-0 z-50 mt-2 ultra-dialog rounded-xl shadow-mac26-lg py-2 min-w-48"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  {sortOptions.map(option => (
                    <motion.button
                      key={option.id}
                      className={`w-full px-4 py-3 text-left hover:bg-mac26-selection-light dark:hover:bg-mac26-selection-dark ${
                        panel.sortBy === option.id ? 'bg-mac26-blue-500 text-white' : ''
                      }`}
                      onClick={() => handleSortChange(option.id)}
                      whileHover={{ x: 2 }}
                    >
                      <div className="text-sm font-medium">{option.label}</div>
                      <div className="text-xs opacity-70">{option.description}</div>
                    </motion.button>
                  ))}

                  <div className="border-t border-mac26-border-primary-light dark:border-mac26-border-primary-dark my-2 mx-3" />

                  <motion.button
                    className="w-full px-4 py-2 text-left hover:bg-mac26-selection-light dark:hover:bg-mac26-selection-dark flex items-center gap-3"
                    onClick={toggleSortOrder}
                    whileHover={{ x: 2 }}
                  >
                    {panel.sortOrder === SortOrder.Ascending ? (
                      <>
                        <TrendingDown size={14} />
                        <span className="text-sm">Sort Descending</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp size={14} />
                        <span className="text-sm">Sort Ascending</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Hidden files toggle */}
        <motion.button
          className={`p-1 rounded-md transition-all duration-150 ${
            panel.showHidden
              ? 'bg-mac26-blue-500 text-white shadow-md'
              : 'bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark'
          }`}
          onClick={toggleHiddenFiles}
          title={panel.showHidden ? 'Hide hidden files' : 'Show hidden files'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {panel.showHidden ? <Eye size={12} /> : <EyeOff size={12} />}
        </motion.button>

        {/* More options */}
        <motion.button
          className="p-1 rounded-md bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark transition-colors duration-150"
          onClick={() => onShowDialog('panelSettings')}
          title="Panel settings"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MoreVertical size={12} />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default UltraPanelHeader;