import React, { useState } from 'react';
import { PanelState, ViewMode, SortBy, SortOrder } from '../../types';
import {
  ChevronDown,
  List,
  Columns,
  Image,
  Grid3X3,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';

interface PanelHeaderProps {
  side: 'left' | 'right';
  panel: PanelState;
  isActive: boolean;
  onUpdatePanel: (updater: (panel: PanelState) => PanelState) => void;
  onShowDialog: (dialogId: string) => void;
}

const PanelHeader: React.FC<PanelHeaderProps> = ({
  side,
  panel,
  isActive,
  onUpdatePanel,
  onShowDialog
}) => {
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const viewModes = [
    { id: ViewMode.Brief, icon: List, label: 'Brief' },
    { id: ViewMode.Detailed, icon: Columns, label: 'Detailed' },
    { id: ViewMode.Thumbnails, icon: Image, label: 'Thumbnails' },
    { id: ViewMode.Tree, icon: Grid3X3, label: 'Tree' }
  ];

  const sortOptions = [
    { id: SortBy.Name, label: 'Name' },
    { id: SortBy.Size, label: 'Size' },
    { id: SortBy.Modified, label: 'Modified' },
    { id: SortBy.Extension, label: 'Extension' },
    { id: SortBy.Type, label: 'Type' }
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
    <div className="panel-header px-3 py-2 flex items-center gap-2 text-sm">
      {/* Panel title */}
      <div className="flex-1">
        <span className="font-medium text-macos-text-primary-light dark:text-macos-text-primary-dark">
          {side === 'left' ? 'Left Panel' : 'Right Panel'}
        </span>
        {isActive && (
          <span className="ml-2 text-xs text-macos-blue">●</span>
        )}
      </div>

      {/* View mode selector */}
      <div className="relative">
        <button
          className="flex items-center gap-1 px-2 py-1 hover:bg-macos-bg-light dark:hover:bg-macos-bg-dark rounded focus-visible-ring"
          onClick={() => setShowViewMenu(!showViewMenu)}
          title={`View Mode: ${currentViewMode?.label}`}
        >
          <CurrentViewIcon size={16} />
          <ChevronDown size={12} />
        </button>

        {showViewMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowViewMenu(false)}
            />
            <div className="absolute top-full right-0 z-50 min-w-32 bg-macos-bg-light dark:bg-macos-bg-dark border border-macos-border-light dark:border-macos-border-dark rounded-md shadow-lg py-1">
              {viewModes.map(mode => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    className={`w-full px-3 py-1 text-left hover:bg-macos-blue hover:text-white flex items-center gap-2 ${
                      panel.viewMode === mode.id ? 'bg-macos-blue text-white' : ''
                    }`}
                    onClick={() => handleViewModeChange(mode.id)}
                  >
                    <Icon size={14} />
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Sort selector */}
      <div className="relative">
        <button
          className="flex items-center gap-1 px-2 py-1 hover:bg-macos-bg-light dark:hover:bg-macos-bg-dark rounded focus-visible-ring"
          onClick={() => setShowSortMenu(!showSortMenu)}
          title={`Sort by: ${panel.sortBy} (${panel.sortOrder})`}
        >
          <span className="text-xs capitalize">{panel.sortBy}</span>
          {panel.sortOrder === SortOrder.Ascending ? (
            <SortAsc size={12} />
          ) : (
            <SortDesc size={12} />
          )}
          <ChevronDown size={12} />
        </button>

        {showSortMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowSortMenu(false)}
            />
            <div className="absolute top-full right-0 z-50 min-w-32 bg-macos-bg-light dark:bg-macos-bg-dark border border-macos-border-light dark:border-macos-border-dark rounded-md shadow-lg py-1">
              {sortOptions.map(option => (
                <button
                  key={option.id}
                  className={`w-full px-3 py-1 text-left hover:bg-macos-blue hover:text-white ${
                    panel.sortBy === option.id ? 'bg-macos-blue text-white' : ''
                  }`}
                  onClick={() => handleSortChange(option.id)}
                >
                  {option.label}
                </button>
              ))}
              <div className="border-t border-macos-border-light dark:border-macos-border-dark my-1" />
              <button
                className="w-full px-3 py-1 text-left hover:bg-macos-blue hover:text-white flex items-center gap-2"
                onClick={toggleSortOrder}
              >
                {panel.sortOrder === SortOrder.Ascending ? (
                  <>
                    <SortDesc size={14} />
                    Descending
                  </>
                ) : (
                  <>
                    <SortAsc size={14} />
                    Ascending
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Hidden files toggle */}
      <button
        className={`p-1 hover:bg-macos-bg-light dark:hover:bg-macos-bg-dark rounded focus-visible-ring ${
          panel.showHidden ? 'text-macos-blue' : 'text-macos-text-secondary-light dark:text-macos-text-secondary-dark'
        }`}
        onClick={toggleHiddenFiles}
        title={panel.showHidden ? 'Hide hidden files' : 'Show hidden files'}
      >
        {panel.showHidden ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>

      {/* Panel options */}
      <button
        className="p-1 hover:bg-macos-bg-light dark:hover:bg-macos-bg-dark rounded focus-visible-ring text-macos-text-secondary-light dark:text-macos-text-secondary-dark"
        onClick={() => onShowDialog('panelSettings')}
        title="Panel settings"
      >
        <Settings size={16} />
      </button>
    </div>
  );
};

export default PanelHeader;