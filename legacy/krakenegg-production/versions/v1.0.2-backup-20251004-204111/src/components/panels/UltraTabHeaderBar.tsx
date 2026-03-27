import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelState, PanelTab, ViewMode, SortBy, SortOrder } from '../../types';
import { X, Plus, ChevronDown, List, Columns, Grid3X3, TrendingUp, TrendingDown, Eye, EyeOff, Settings, MoreVertical } from 'lucide-react';
import { getFolderNameFromPath } from '../../utils/fileUtils';
import { generateMockFiles } from '../../data/mockFiles';

interface UltraTabHeaderBarProps {
  side: 'left' | 'right';
  panel: PanelState;
  isActive: boolean;
  onUpdatePanel: (updater: (panel: PanelState) => PanelState) => void;
  onShowDialog: (dialogId: string) => void;
}

const UltraTabHeaderBar = ({ side, panel, isActive, onUpdatePanel, onShowDialog }: UltraTabHeaderBarProps) => {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Tab functionality
  const handleTabClick = (tabId: string) => {
    if (tabId !== panel.activeTab) {
      const selectedTab = panel.tabs.find(tab => tab.id === tabId);
      if (selectedTab) {
        const files = generateMockFiles(selectedTab.path);
        onUpdatePanel(panel => ({
          ...panel,
          activeTab: tabId,
          currentPath: selectedTab.path,
          files,
          selectedFiles: new Set(),
          focusedFile: files.length > 0 ? files[0].id : null,
          history: panel.currentPath !== selectedTab.path
            ? [...panel.history.slice(0, panel.historyIndex + 1), selectedTab.path]
            : panel.history,
          historyIndex: panel.currentPath !== selectedTab.path
            ? panel.historyIndex + 1
            : panel.historyIndex
        }));
      }
    }
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (panel.tabs.length <= 1) return;

    onUpdatePanel(panel => {
      const newTabs = panel.tabs.filter(tab => tab.id !== tabId);
      let newActiveTab = panel.activeTab;

      if (panel.activeTab === tabId) {
        newActiveTab = newTabs[0]?.id || '';
      }

      return { ...panel, tabs: newTabs, activeTab: newActiveTab };
    });
  };

  const handleNewTab = () => {
    const newTabId = `${side}-tab-${Date.now()}`;
    const newTab: PanelTab = {
      id: newTabId,
      name: getFolderNameFromPath(panel.currentPath),
      path: panel.currentPath,
      isActive: false
    };

    onUpdatePanel(panel => ({
      ...panel,
      tabs: [...panel.tabs, newTab],
      activeTab: newTabId
    }));
  };

  // Panel control functionality
  const getViewIcon = (mode: ViewMode) => {
    switch (mode) {
      case ViewMode.Brief: return List;
      case ViewMode.Detailed: return Columns;
      case ViewMode.Tree: return Grid3X3;
    }
  };

  const getSortIcon = () => {
    return panel.sortOrder === SortOrder.Ascending ? TrendingUp : TrendingDown;
  };

  return (
    <div className="flex items-center bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border-b border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark">
      {/* Tabs Section */}
      <div className="flex-1 flex items-center overflow-x-auto min-w-0">
        <AnimatePresence>
          {panel.tabs.map(tab => (
            <motion.div
              key={tab.id}
              className={`flex items-center gap-2 px-3 py-1 cursor-pointer min-w-0 relative border-r border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark last:border-r-0 ${
                tab.id === panel.activeTab
                  ? 'bg-mac26-bg-primary-light dark:bg-mac26-bg-primary-dark text-mac26-text-primary-light dark:text-mac26-text-primary-dark'
                  : 'hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark'
              }`}
              onClick={() => handleTabClick(tab.id)}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              whileHover={{ y: -0.5 }}
            >

              <span className="text-sm truncate min-w-0 max-w-28">
                {tab.name}
              </span>

              {panel.tabs.length > 1 && (
                <motion.button
                  className="p-0.5 rounded hover:bg-mac26-border-primary-light dark:hover:bg-mac26-border-primary-dark opacity-60 hover:opacity-100 transition-all duration-150"
                  onClick={(e) => handleCloseTab(tab.id, e)}
                >
                  <X size={10} />
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.button
          className="p-1 hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark border-l border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark transition-colors duration-150"
          onClick={handleNewTab}
          title="New tab (⌘T)"
        >
          <Plus size={12} />
        </motion.button>
      </div>

      {/* Panel Controls Section */}
      <div className="flex items-center gap-1 px-2 border-l border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark">
        {/* View Mode Selector */}
        <div className="relative">
          <motion.button
            className={`p-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1 shadow-sm ${
              isActive
                ? 'bg-mac26-blue-500 text-white shadow-mac26-border-primary-light dark:shadow-mac26-border-primary-dark'
                : 'hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark shadow-transparent'
            }`}
            onClick={() => setShowViewMenu(!showViewMenu)}
            title="View mode"
          >
            {React.createElement(getViewIcon(panel.viewMode), { size: 12 })}
          </motion.button>

          <AnimatePresence>
            {showViewMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowViewMenu(false)} />
                <motion.div
                  className="absolute top-full right-0 z-50 mt-1 ultra-dialog rounded-xl shadow-mac26-lg py-2 min-w-32"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  {Object.values(ViewMode).map((mode) => (
                    <motion.button
                      key={mode}
                      className={`w-full px-3 py-2 text-left hover:bg-mac26-selection-light dark:hover:bg-mac26-selection-dark flex items-center gap-2 text-sm ${
                        panel.viewMode === mode ? 'text-mac26-blue-500' : ''
                      }`}
                      onClick={() => {
                        onUpdatePanel(panel => ({ ...panel, viewMode: mode }));
                        setShowViewMenu(false);
                      }}
                      whileHover={{ x: 2 }}
                    >
                      {React.createElement(getViewIcon(mode), { size: 14 })}
                      <span className="capitalize">{mode}</span>
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Sort Selector */}
        <div className="relative">
          <motion.button
            className="p-1.5 rounded-md hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark transition-colors duration-150 flex items-center gap-1"
            onClick={() => setShowSortMenu(!showSortMenu)}
            title={`Sort by ${panel.sortBy} (${panel.sortOrder})`}
          >
            {React.createElement(getSortIcon(), { size: 12 })}
          </motion.button>

          <AnimatePresence>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                <motion.div
                  className="absolute top-full right-0 z-50 mt-1 ultra-dialog rounded-xl shadow-mac26-lg py-2 min-w-36"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  {Object.values(SortBy).map((sortBy) => (
                    <motion.button
                      key={sortBy}
                      className={`w-full px-3 py-2 text-left hover:bg-mac26-selection-light dark:hover:bg-mac26-selection-dark text-sm ${
                        panel.sortBy === sortBy ? 'text-mac26-blue-500' : ''
                      }`}
                      onClick={() => {
                        onUpdatePanel(panel => ({
                          ...panel,
                          sortBy,
                          sortOrder: panel.sortBy === sortBy && panel.sortOrder === SortOrder.Ascending
                            ? SortOrder.Descending
                            : SortOrder.Ascending
                        }));
                        setShowSortMenu(false);
                      }}
                      whileHover={{ x: 2 }}
                    >
                      <span className="capitalize">{sortBy}</span>
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Show Hidden Toggle */}
        <motion.button
          className={`p-1.5 rounded-md transition-colors duration-150 ${
            panel.showHidden
              ? 'bg-mac26-blue-500 text-white'
              : 'hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark'
          }`}
          onClick={() => onUpdatePanel(panel => ({ ...panel, showHidden: !panel.showHidden }))}
          title={`${panel.showHidden ? 'Hide' : 'Show'} hidden files`}
        >
          {panel.showHidden ? <Eye size={12} /> : <EyeOff size={12} />}
        </motion.button>

        {/* Options Menu */}
        <div className="relative">
          <motion.button
            className="p-1.5 rounded-md hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark transition-colors duration-150"
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            title="Panel options"
          >
            <MoreVertical size={12} />
          </motion.button>

          <AnimatePresence>
            {showOptionsMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowOptionsMenu(false)} />
                <motion.div
                  className="absolute top-full right-0 z-50 mt-1 ultra-dialog rounded-xl shadow-mac26-lg py-2 min-w-40"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <motion.button
                    className="w-full px-3 py-2 text-left hover:bg-mac26-selection-light dark:hover:bg-mac26-selection-dark flex items-center gap-2 text-sm"
                    onClick={() => {
                      onShowDialog('settings');
                      setShowOptionsMenu(false);
                    }}
                    whileHover={{ x: 2 }}
                  >
                    <Settings size={14} />
                    <span>Settings</span>
                  </motion.button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default UltraTabHeaderBar;