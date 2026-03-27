import React, { useState } from 'react';
import { AppState, KeyboardCategory } from '../../types';
import { X, Search } from 'lucide-react';

interface KeyboardHelpDialogProps {
  appState: AppState;
  onClose: () => void;
}

const KeyboardHelpDialog: React.FC<KeyboardHelpDialogProps> = ({
  appState,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<KeyboardCategory | 'all'>('all');

  const shortcuts = appState.keyboardShortcuts;

  const categories = [
    { id: 'all', label: 'All Shortcuts' },
    { id: KeyboardCategory.FileOperations, label: 'File Operations' },
    { id: KeyboardCategory.Navigation, label: 'Navigation' },
    { id: KeyboardCategory.Selection, label: 'Selection' },
    { id: KeyboardCategory.View, label: 'View' },
    { id: KeyboardCategory.Archive, label: 'Archive' },
    { id: KeyboardCategory.Search, label: 'Search' },
    { id: KeyboardCategory.Tools, label: 'Tools' }
  ];

  const filteredShortcuts = Object.entries(shortcuts).filter(([key, shortcut]) => {
    const matchesCategory = selectedCategory === 'all' || shortcut.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.action.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const groupedShortcuts = filteredShortcuts.reduce((groups, [key, shortcut]) => {
    const category = shortcut.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push([key, shortcut]);
    return groups;
  }, {} as Record<KeyboardCategory, Array<[string, any]>>);

  const formatKey = (key: string): string => {
    return key
      .replace('Cmd', '⌘')
      .replace('Ctrl', '⌃')
      .replace('Alt', '⌥')
      .replace('Shift', '⇧')
      .replace('ArrowUp', '↑')
      .replace('ArrowDown', '↓')
      .replace('ArrowLeft', '←')
      .replace('ArrowRight', '→')
      .replace('Backspace', '⌫')
      .replace('Delete', '⌦')
      .replace('Enter', '↩')
      .replace('Space', '␣')
      .replace('Tab', '⇥')
      .replace('Escape', '⎋');
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog-content max-w-4xl w-full max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-macos-border-light dark:border-macos-border-dark">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-macos-bg-panel-light dark:hover:bg-macos-bg-panel-dark rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search and filter */}
        <div className="p-4 border-b border-macos-border-light dark:border-macos-border-dark">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-macos-text-secondary-light dark:text-macos-text-secondary-dark" />
              <input
                type="text"
                placeholder="Search shortcuts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-macos-border-light dark:border-macos-border-dark rounded focus-visible-ring bg-macos-bg-light dark:bg-macos-bg-dark"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as KeyboardCategory | 'all')}
              className="px-3 py-2 border border-macos-border-light dark:border-macos-border-dark rounded focus-visible-ring bg-macos-bg-light dark:bg-macos-bg-dark"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Shortcuts list */}
        <div className="flex-1 overflow-auto p-4">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-semibold text-macos-text-secondary-light dark:text-macos-text-secondary-dark uppercase tracking-wide mb-3">
                {categories.find(c => c.id === category)?.label || category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map(([key, shortcut]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-2 px-3 hover:bg-macos-bg-panel-light dark:hover:bg-macos-bg-panel-dark rounded"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{shortcut.description}</div>
                      <div className="text-xs text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
                        Action: {shortcut.action}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {key.split('+').map((part, index) => (
                        <React.Fragment key={index}>
                          {index > 0 && <span className="text-macos-text-secondary-light dark:text-macos-text-secondary-dark">+</span>}
                          <kbd className="px-2 py-1 text-xs bg-macos-bg-panel-light dark:bg-macos-bg-panel-dark border border-macos-border-light dark:border-macos-border-dark rounded">
                            {formatKey(part)}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredShortcuts.length === 0 && (
            <div className="text-center py-8 text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
              <div className="text-4xl mb-2">🔍</div>
              <div>No shortcuts found</div>
              <div className="text-sm mt-1">Try a different search or category</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-macos-border-light dark:border-macos-border-dark text-xs text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
          <div className="flex items-center justify-between">
            <span>
              Showing {filteredShortcuts.length} of {Object.keys(shortcuts).length} shortcuts
            </span>
            <span>
              Press Escape to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardHelpDialog;