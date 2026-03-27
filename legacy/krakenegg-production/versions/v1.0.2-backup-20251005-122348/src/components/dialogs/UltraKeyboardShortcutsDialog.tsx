import { useState } from 'react';
import {
  Keyboard,
  Search,
  Command,
  Apple,
  Zap,
  Navigation,
  FileText,
  Copy,
  Archive,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Layers,
  Monitor
} from 'lucide-react';
import CompactDialog from './CompactDialog';

interface UltraKeyboardShortcutsDialogProps {
  onClose: () => void;
}

interface ShortcutCategory {
  id: string;
  name: string;
  icon: any;
  shortcuts: Array<{
    keys: string[];
    description: string;
    context?: string;
  }>;
}

const UltraKeyboardShortcutsDialog = ({ onClose }: UltraKeyboardShortcutsDialogProps) => {
  const [activeCategory, setActiveCategory] = useState('function-keys');
  const [searchQuery, setSearchQuery] = useState('');

  const shortcutCategories: ShortcutCategory[] = [
    {
      id: 'function-keys',
      name: 'Function Keys',
      icon: Zap,
      shortcuts: [
        { keys: ['F1'], description: 'Help / Show keyboard shortcuts' },
        { keys: ['F2'], description: 'Rename selected file' },
        { keys: ['F3'], description: 'View file content' },
        { keys: ['F4'], description: 'Edit file in default editor' },
        { keys: ['F5'], description: 'Copy files to opposite panel' },
        { keys: ['F6'], description: 'Move files to opposite panel' },
        { keys: ['F7'], description: 'Create new directory' },
        { keys: ['F8'], description: 'Delete selected files' },
        { keys: ['F9'], description: 'Activate top menu' },
        { keys: ['F10'], description: 'Quit application' },
        { keys: ['F11'], description: 'Show/hide command line' },
        { keys: ['F12'], description: 'Open terminal in current directory' }
      ]
    },
    {
      id: 'navigation',
      name: 'Navigation',
      icon: Navigation,
      shortcuts: [
        { keys: ['Tab'], description: 'Switch between left and right panel' },
        { keys: ['↑', '↓'], description: 'Navigate up/down in file list' },
        { keys: ['Enter'], description: 'Enter directory or open file' },
        { keys: ['Backspace'], description: 'Go to parent directory' },
        { keys: ['Home'], description: 'Go to first file' },
        { keys: ['End'], description: 'Go to last file' },
        { keys: ['Page Up'], description: 'Move up one page' },
        { keys: ['Page Down'], description: 'Move down one page' },
        { keys: ['Ctrl', '+', 'Home'], description: 'Go to root directory' },
        { keys: ['Ctrl', '+', 'End'], description: 'Go to home directory' }
      ]
    },
    {
      id: 'selection',
      name: 'Selection',
      icon: Layers,
      shortcuts: [
        { keys: ['Space'], description: 'Select/deselect current file' },
        { keys: ['Ctrl', '+', 'A'], description: 'Select all files' },
        { keys: ['Ctrl', '+', 'D'], description: 'Deselect all files' },
        { keys: ['Shift', '+', '↑/↓'], description: 'Extend selection' },
        { keys: ['Ctrl', '+', 'Click'], description: 'Toggle file selection' },
        { keys: ['Shift', '+', 'Click'], description: 'Select range' },
        { keys: ['Insert'], description: 'Select current file and move down' },
        { keys: ['*'], description: 'Invert selection', context: 'Number pad' }
      ]
    },
    {
      id: 'file-operations',
      name: 'File Operations',
      icon: FileText,
      shortcuts: [
        { keys: ['Ctrl', '+', 'C'], description: 'Copy selected files' },
        { keys: ['Ctrl', '+', 'X'], description: 'Cut selected files' },
        { keys: ['Ctrl', '+', 'V'], description: 'Paste files' },
        { keys: ['Delete'], description: 'Delete selected files' },
        { keys: ['Shift', '+', 'Delete'], description: 'Permanently delete files' },
        { keys: ['Ctrl', '+', 'Z'], description: 'Undo last operation' },
        { keys: ['Ctrl', '+', 'Y'], description: 'Redo last operation' },
        { keys: ['Ctrl', '+', 'N'], description: 'Create new file' }
      ]
    },
    {
      id: 'view-options',
      name: 'View & Display',
      icon: Eye,
      shortcuts: [
        { keys: ['Ctrl', '+', '1'], description: 'Brief view (list)' },
        { keys: ['Ctrl', '+', '2'], description: 'Full view (details)' },
        { keys: ['Ctrl', '+', '3'], description: 'Quick view' },
        { keys: ['Ctrl', '+', '4'], description: 'Tree view' },
        { keys: ['Ctrl', '+', '5'], description: 'Thumbnail view' },
        { keys: ['Ctrl', '+', 'R'], description: 'Refresh current panel' },
        { keys: ['Ctrl', '+', 'U'], description: 'Exchange directories' },
        { keys: ['Ctrl', '+', '\\'], description: 'Go to root directory' }
      ]
    },
    {
      id: 'archive',
      name: 'Archive Operations',
      icon: Archive,
      shortcuts: [
        { keys: ['Ctrl', '+', 'Shift', '+', 'A'], description: 'Pack files (create archive)' },
        { keys: ['Ctrl', '+', 'Shift', '+', 'U'], description: 'Unpack archive' },
        { keys: ['Ctrl', '+', 'Shift', '+', 'E'], description: 'Extract archive to folder' },
        { keys: ['Ctrl', '+', 'Shift', '+', 'T'], description: 'Test archive integrity' }
      ]
    },
    {
      id: 'macos-specific',
      name: 'macOS Shortcuts',
      icon: Apple,
      shortcuts: [
        { keys: ['Cmd', '+', 'N'], description: 'New Finder window' },
        { keys: ['Cmd', '+', 'W'], description: 'Close window' },
        { keys: ['Cmd', '+', 'Q'], description: 'Quit application' },
        { keys: ['Cmd', '+', ','], description: 'Open preferences' },
        { keys: ['Cmd', '+', 'Space'], description: 'Spotlight search' },
        { keys: ['Space'], description: 'Quick Look preview' },
        { keys: ['Cmd', '+', 'I'], description: 'Get file info' },
        { keys: ['Cmd', '+', 'Delete'], description: 'Move to Trash' },
        { keys: ['Cmd', '+', 'Shift', '+', 'Delete'], description: 'Empty Trash' }
      ]
    },
    {
      id: 'search-tools',
      name: 'Search & Tools',
      icon: Search,
      shortcuts: [
        { keys: ['Ctrl', '+', 'F'], description: 'Find files' },
        { keys: ['Ctrl', '+', 'Shift', '+', 'F'], description: 'Advanced search' },
        { keys: ['Ctrl', '+', 'H'], description: 'Search and replace in files' },
        { keys: ['Ctrl', '+', 'L'], description: 'Calculate directory sizes' },
        { keys: ['Ctrl', '+', 'M'], description: 'Multi-rename tool' },
        { keys: ['Ctrl', '+', 'P'], description: 'Print file list' }
      ]
    }
  ];

  const filteredCategories = shortcutCategories.map(category => ({
    ...category,
    shortcuts: category.shortcuts.filter(shortcut =>
      searchQuery === '' ||
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.keys.some(key => key.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(category => category.shortcuts.length > 0);

  const formatKeys = (keys: string[]) => {
    return keys.map((key, index) => (
      <span key={index} className="inline-flex items-center">
        <kbd className="px-1.5 py-0.5 text-xs font-mono bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark border border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark rounded">
          {key}
        </kbd>
        {index < keys.length - 1 && (
          <span className="mx-1 text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark">+</span>
        )}
      </span>
    ));
  };

  return (
    <CompactDialog
      title="Keyboard Shortcuts"
      subtitle="Complete keyboard reference for KrakenEgg"
      icon={<Keyboard className="text-mac26-blue-500" />}
      onClose={onClose}
      size="md"
      actions={[
        {
          label: 'Print Reference',
          variant: 'secondary',
          onClick: () => window.print(),
          icon: <FileText size={14} />
        },
        {
          label: 'Close',
          variant: 'primary',
          onClick: onClose
        }
      ]}
    >
      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shortcuts..."
            className="w-full pl-9 pr-4 py-2 compact-input"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex overflow-x-auto mb-4 border-b border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark">
        {filteredCategories.map(category => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeCategory === category.id
                  ? 'text-mac26-blue-500 border-mac26-blue-500'
                  : 'text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark border-transparent hover:text-mac26-text-primary-light dark:hover:text-mac26-text-primary-dark'
              }`}
              onClick={() => setActiveCategory(category.id)}
            >
              <Icon size={12} />
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Shortcuts content */}
      <div className="max-h-80 overflow-auto compact-scroll">
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Search size={24} className="text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark mb-2" />
            <p className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
              No shortcuts found for "{searchQuery}"
            </p>
          </div>
        ) : (
          filteredCategories
            .filter(category => activeCategory === category.id)
            .map(category => (
              <div key={category.id} className="space-y-2">
                {category.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded hover:bg-mac26-selection-light dark:hover:bg-mac26-selection-dark group"
                  >
                    <div className="flex-1">
                      <div className="text-xs font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                        {shortcut.description}
                      </div>
                      {shortcut.context && (
                        <div className="text-xs text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark">
                          {shortcut.context}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      {formatKeys(shortcut.keys)}
                    </div>
                  </div>
                ))}
              </div>
            ))
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark">
        <div className="flex items-center gap-4 text-xs text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark">
          <div className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark border border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark rounded text-xs">Cmd</kbd>
            <span>Command key</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark border border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark rounded text-xs">Ctrl</kbd>
            <span>Control key</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark border border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark rounded text-xs">⌘</kbd>
            <span>macOS shortcuts</span>
          </div>
        </div>
      </div>
    </CompactDialog>
  );
};

export default UltraKeyboardShortcutsDialog;