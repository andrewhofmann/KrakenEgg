import { motion } from 'framer-motion';
import { AppState } from '../../types';
import {
  Search,
  Archive,
  Package,
  FolderPlus,
  FilePlus,
  Copy,
  Move,
  Trash2,
  Settings
} from 'lucide-react';

interface UltraToolbarProps {
  onShowDialog: (dialogId: string) => void;
  appState: AppState;
}

const UltraToolbar = ({ onShowDialog, appState }: UltraToolbarProps) => {
  const toolbarSections = [
    {
      id: 'fileOps',
      items: [
        { icon: Copy, label: 'Copy', shortcut: 'F5', action: () => onShowDialog('copy') },
        { icon: Move, label: 'Move', shortcut: 'F6', action: () => onShowDialog('move') },
        { icon: Trash2, label: 'Delete', shortcut: 'F8', action: () => onShowDialog('delete') },
        { icon: FolderPlus, label: 'New Folder', shortcut: 'F7', action: () => onShowDialog('createDirectory') },
        { icon: FilePlus, label: 'New File', shortcut: '⇧F4', action: () => onShowDialog('createFile') }
      ]
    },
    {
      id: 'tools',
      items: [
        { icon: Search, label: 'Find Files', shortcut: '⌥F7', action: () => onShowDialog('search') },
        { icon: Archive, label: 'Create Archive', shortcut: '⌥F5', action: () => onShowDialog('archive') },
        { icon: Package, label: 'Extract', shortcut: '⌥F6', action: () => onShowDialog('extract') }
      ]
    }
  ];

  const ToolbarButton = ({ icon: Icon, label, shortcut, action, isActive = false }: any) => (
    <div className="relative group">
      <motion.button
        className={`toolbar-btn flex items-center px-1.5 py-1 rounded-md ${
          isActive ? 'bg-mac26-blue-500 text-white shadow-md' : ''
        }`}
        onClick={action}
        whileHover={{ scale: 1.05, y: -1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.1 }}
      >
        <Icon size={14} />
      </motion.button>

      {/* Modern tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black dark:bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap transition-all duration-200 scale-90 group-hover:scale-100">
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {shortcut && (
            <span className="px-1 py-0.5 bg-gray-600 dark:bg-gray-700 rounded text-xs font-mono">
              {shortcut}
            </span>
          )}
        </div>
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black dark:border-t-gray-800" />
      </div>
    </div>
  );

  return (
    <motion.div
      className="ultra-toolbar border-b border-mac26-border-primary-light dark:border-mac26-border-primary-dark px-2 py-1"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {toolbarSections.map((section, sectionIndex) => (
            <div key={section.id} className="flex items-center">
              {sectionIndex > 0 && (
                <div className="w-px h-4 bg-mac26-border-secondary-light dark:bg-mac26-border-secondary-dark mx-2" />
              )}
              <div className="flex items-center gap-0.5">
                {section.items.map((item, itemIndex) => (
                  <ToolbarButton
                    key={itemIndex}
                    icon={item.icon}
                    label={item.label}
                    shortcut={item.shortcut}
                    action={item.action}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1">
          {/* Settings */}
          <motion.button
            className="toolbar-btn px-1.5 py-1"
            onClick={() => onShowDialog('settings')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Settings (⌘,)"
          >
            <Settings size={14} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default UltraToolbar;