import React from 'react';
import { PanelState, PanelTab } from '../../types';
import { X, Plus } from 'lucide-react';

interface TabBarProps {
  side: 'left' | 'right';
  panel: PanelState;
  onUpdatePanel: (updater: (panel: PanelState) => PanelState) => void;
}

const TabBar: React.FC<TabBarProps> = ({ side, panel, onUpdatePanel }) => {
  const handleTabClick = (tabId: string) => {
    if (tabId !== panel.activeTab) {
      onUpdatePanel(panel => ({
        ...panel,
        activeTab: tabId
      }));
    }
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (panel.tabs.length <= 1) return; // Don't close last tab

    onUpdatePanel(panel => {
      const newTabs = panel.tabs.filter(tab => tab.id !== tabId);
      let newActiveTab = panel.activeTab;

      // If we're closing the active tab, switch to the first remaining tab
      if (panel.activeTab === tabId) {
        newActiveTab = newTabs[0]?.id || '';
      }

      return {
        ...panel,
        tabs: newTabs,
        activeTab: newActiveTab
      };
    });
  };

  const handleNewTab = () => {
    const newTabId = `${side}-tab-${Date.now()}`;
    const newTab: PanelTab = {
      id: newTabId,
      name: 'New Tab',
      path: panel.currentPath,
      isActive: false
    };

    onUpdatePanel(panel => ({
      ...panel,
      tabs: [...panel.tabs, newTab],
      activeTab: newTabId
    }));
  };

  const truncateTabName = (name: string, maxLength: number = 15) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
  };

  return (
    <div className="flex items-center bg-macos-bg-panel-light dark:bg-macos-bg-panel-dark border-b border-macos-border-light dark:border-macos-border-dark">
      <div className="flex-1 flex items-center overflow-x-auto">
        {panel.tabs.map(tab => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-2 border-r border-macos-border-light dark:border-macos-border-dark cursor-pointer min-w-0 ${
              tab.id === panel.activeTab
                ? 'bg-macos-bg-light dark:bg-macos-bg-dark text-macos-text-primary-light dark:text-macos-text-primary-dark'
                : 'hover:bg-macos-bg-light dark:hover:bg-macos-bg-dark text-macos-text-secondary-light dark:text-macos-text-secondary-dark'
            }`}
            onClick={() => handleTabClick(tab.id)}
            title={`${tab.name} - ${tab.path}`}
          >
            <span className="text-sm truncate min-w-0">
              {truncateTabName(tab.name)}
            </span>
            {panel.tabs.length > 1 && (
              <button
                className="hover:bg-macos-border-light dark:hover:bg-macos-border-dark rounded p-0.5 opacity-60 hover:opacity-100"
                onClick={(e) => handleCloseTab(tab.id, e)}
                title="Close tab"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* New tab button */}
      <button
        className="px-2 py-2 hover:bg-macos-bg-light dark:hover:bg-macos-bg-dark text-macos-text-secondary-light dark:text-macos-text-secondary-dark border-l border-macos-border-light dark:border-macos-border-dark"
        onClick={handleNewTab}
        title="New tab (Cmd+T)"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};

export default TabBar;