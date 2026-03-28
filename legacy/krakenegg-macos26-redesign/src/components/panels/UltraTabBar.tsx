import { motion, AnimatePresence } from 'framer-motion';
import { PanelState, PanelTab } from '../../types';
import { X, Plus } from 'lucide-react';
import { getFolderNameFromPath } from '../../utils/fileUtils';
import { generateMockFiles } from '../../data/mockFiles';

interface UltraTabBarProps {
  side: 'left' | 'right';
  panel: PanelState;
  onUpdatePanel: (updater: (panel: PanelState) => PanelState) => void;
}

const UltraTabBar = ({ side, panel, onUpdatePanel }: UltraTabBarProps) => {
  const handleTabClick = (tabId: string) => {
    if (tabId !== panel.activeTab) {
      const selectedTab = panel.tabs.find(tab => tab.id === tabId);
      if (selectedTab) {
        // Navigate to the tab's saved path and update the panel
        const files = generateMockFiles(selectedTab.path);
        onUpdatePanel(panel => ({
          ...panel,
          activeTab: tabId,
          currentPath: selectedTab.path,
          files,
          selectedFiles: new Set(),
          focusedFile: files.length > 0 ? files[0].id : null,
          // Add to history if it's a different path
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

  return (
    <div className="flex items-center bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border-b border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark">
      <div className="flex-1 flex items-center overflow-x-auto">
        <AnimatePresence>
          {panel.tabs.map(tab => (
            <motion.div
              key={tab.id}
              className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer min-w-0 relative ${
                tab.id === panel.activeTab
                  ? 'bg-mac26-bg-primary-light dark:bg-mac26-bg-primary-dark text-mac26-text-primary-light dark:text-mac26-text-primary-dark'
                  : 'hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark'
              }`}
              onClick={() => handleTabClick(tab.id)}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              whileHover={{ y: -1 }}
            >
              {tab.id === panel.activeTab && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-mac26-blue-500"
                  layoutId={`tab-indicator-${side}`}
                  transition={{ duration: 0.2 }}
                />
              )}

              <span className="text-sm truncate min-w-0 max-w-32">
                {tab.name}
              </span>

              {panel.tabs.length > 1 && (
                <motion.button
                  className="p-0.5 rounded hover:bg-mac26-border-primary-light dark:hover:bg-mac26-border-primary-dark opacity-60 hover:opacity-100 transition-all duration-150"
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={12} />
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.button
        className="p-2 hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark border-l border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark transition-colors duration-150"
        onClick={handleNewTab}
        title="New tab (⌘T)"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus size={14} />
      </motion.button>
    </div>
  );
};

export default UltraTabBar;