import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RefreshCw,
  Search,
  Archive,
  Package,
  FolderPlus,
  FilePlus,
  Copy,
  Move,
  Trash2,
  Settings,
  Terminal,
  BarChart3,
  Eye,
  EyeOff,
  Grid3X3,
  List,
  Columns,
  Image
} from 'lucide-react';

interface ToolbarProps {
  onShowDialog: (dialogId: string) => void;
  onToggleCommandLine: () => void;
  onToggleStatusBar: () => void;
  showCommandLine: boolean;
  showStatusBar: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onShowDialog,
  onToggleCommandLine,
  onToggleStatusBar,
  showCommandLine,
  showStatusBar
}) => {
  const toolbarSections = [
    {
      id: 'navigation',
      items: [
        { icon: ArrowLeft, label: 'Back', shortcut: 'Alt+←', action: () => console.log('Back') },
        { icon: ArrowRight, label: 'Forward', shortcut: 'Alt+→', action: () => console.log('Forward') },
        { icon: ArrowUp, label: 'Up', shortcut: 'Backspace', action: () => console.log('Up') },
        { icon: RefreshCw, label: 'Refresh', shortcut: 'F2', action: () => console.log('Refresh') }
      ]
    },
    {
      id: 'fileOps',
      items: [
        { icon: Copy, label: 'Copy', shortcut: 'F5', action: () => onShowDialog('copy') },
        { icon: Move, label: 'Move', shortcut: 'F6', action: () => onShowDialog('move') },
        { icon: Trash2, label: 'Delete', shortcut: 'F8', action: () => onShowDialog('delete') },
        { icon: FolderPlus, label: 'New Folder', shortcut: 'F7', action: () => onShowDialog('createDirectory') },
        { icon: FilePlus, label: 'New File', shortcut: 'Shift+F4', action: () => onShowDialog('createFile') }
      ]
    },
    {
      id: 'tools',
      items: [
        { icon: Search, label: 'Find Files', shortcut: 'Alt+F7', action: () => onShowDialog('search') },
        { icon: Archive, label: 'Extract', shortcut: 'Alt+F6', action: () => onShowDialog('extract') },
        { icon: Package, label: 'Archive', shortcut: 'Alt+F5', action: () => onShowDialog('archive') }
      ]
    },
    {
      id: 'view',
      items: [
        { icon: List, label: 'Brief View', shortcut: 'Ctrl+1', action: () => console.log('Brief View') },
        { icon: Columns, label: 'Detailed View', shortcut: 'Ctrl+2', action: () => console.log('Detailed View') },
        { icon: Image, label: 'Thumbnails', shortcut: 'Ctrl+T', action: () => console.log('Thumbnails') },
        { icon: Grid3X3, label: 'Tiles', shortcut: 'Ctrl+3', action: () => console.log('Tiles') }
      ]
    },
    {
      id: 'options',
      items: [
        {
          icon: showCommandLine ? EyeOff : Eye,
          label: showCommandLine ? 'Hide Command Line' : 'Show Command Line',
          action: onToggleCommandLine
        },
        {
          icon: showStatusBar ? EyeOff : Eye,
          label: showStatusBar ? 'Hide Status Bar' : 'Show Status Bar',
          action: onToggleStatusBar
        },
        { icon: Terminal, label: 'Terminal', action: () => console.log('Open Terminal') },
        { icon: BarChart3, label: 'Calculate Sizes', shortcut: 'Ctrl+Alt+C', action: () => console.log('Calculate Sizes') },
        { icon: Settings, label: 'Settings', shortcut: 'Cmd+,', action: () => onShowDialog('settings') }
      ]
    }
  ];

  const ToolbarButton: React.FC<{
    icon: any;
    label: string;
    shortcut?: string;
    action: () => void;
  }> = ({ icon: Icon, label, shortcut, action }) => (
    <button
      className="toolbar-button flex items-center gap-1 px-2 py-1 text-xs hover:bg-macos-bg-panel-light dark:hover:bg-macos-bg-panel-dark rounded focus-visible-ring"
      onClick={action}
      title={shortcut ? `${label} (${shortcut})` : label}
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="panel-header px-4 py-2 flex items-center gap-4 overflow-x-auto">
      {toolbarSections.map((section, sectionIndex) => (
        <div key={section.id} className="flex items-center gap-2">
          {sectionIndex > 0 && (
            <div className="w-px h-6 bg-macos-border-light dark:bg-macos-border-dark mx-2" />
          )}
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
      ))}

      <div className="flex-1" />

      {/* Quick access buttons */}
      <div className="flex items-center gap-2">
        <button
          className="toolbar-button px-2 py-1 text-xs"
          onClick={() => onShowDialog('keyboardHelp')}
          title="Keyboard Shortcuts (Cmd+?)"
        >
          <span className="text-xs">?</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;