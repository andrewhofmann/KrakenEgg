import React, { useState } from 'react';
import { Theme } from '../../types';
import { Sun, Moon, Monitor, Settings, HelpCircle, Info } from 'lucide-react';

interface MenuBarProps {
  onToggleTheme: () => void;
  onShowDialog: (dialogId: string) => void;
  theme: Theme;
}

const MenuBar: React.FC<MenuBarProps> = ({ onToggleTheme, onShowDialog, theme }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menus = [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New Tab', shortcut: 'Cmd+T', action: () => console.log('New Tab') },
        { label: 'Close Tab', shortcut: 'Cmd+W', action: () => console.log('Close Tab') },
        { separator: true },
        { label: 'Copy', shortcut: 'F5', action: () => console.log('Copy') },
        { label: 'Move', shortcut: 'F6', action: () => console.log('Move') },
        { label: 'Delete', shortcut: 'F8', action: () => console.log('Delete') },
        { separator: true },
        { label: 'Create Directory', shortcut: 'F7', action: () => onShowDialog('createDirectory') },
        { label: 'Create File', shortcut: 'Shift+F4', action: () => onShowDialog('createFile') },
        { separator: true },
        { label: 'Properties', shortcut: 'Cmd+I', action: () => console.log('Properties') }
      ]
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { label: 'Select All', shortcut: 'Cmd+A', action: () => console.log('Select All') },
        { label: 'Invert Selection', shortcut: 'Num *', action: () => console.log('Invert Selection') },
        { label: 'Deselect All', shortcut: 'Cmd+Shift+A', action: () => console.log('Deselect All') },
        { separator: true },
        { label: 'Copy to Clipboard', shortcut: 'Cmd+C', action: () => console.log('Copy to Clipboard') },
        { label: 'Cut to Clipboard', shortcut: 'Cmd+X', action: () => console.log('Cut to Clipboard') },
        { label: 'Paste from Clipboard', shortcut: 'Cmd+V', action: () => console.log('Paste from Clipboard') },
        { separator: true },
        { label: 'Multi-Rename', shortcut: 'Ctrl+M', action: () => onShowDialog('multiRename') }
      ]
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { label: 'Brief View', shortcut: 'Ctrl+1', action: () => console.log('Brief View') },
        { label: 'Detailed View', shortcut: 'Ctrl+2', action: () => console.log('Detailed View') },
        { label: 'Thumbnail View', shortcut: 'Ctrl+T', action: () => console.log('Thumbnail View') },
        { separator: true },
        { label: 'Sort by Name', shortcut: 'Ctrl+F3', action: () => console.log('Sort by Name') },
        { label: 'Sort by Size', shortcut: 'Ctrl+F6', action: () => console.log('Sort by Size') },
        { label: 'Sort by Date', shortcut: 'Ctrl+F5', action: () => console.log('Sort by Date') },
        { label: 'Sort by Extension', shortcut: 'Ctrl+F4', action: () => console.log('Sort by Extension') },
        { separator: true },
        { label: 'Show Hidden Files', shortcut: 'Cmd+Shift+.', action: () => console.log('Show Hidden Files') },
        { label: 'Refresh', shortcut: 'F2', action: () => console.log('Refresh') }
      ]
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [
        { label: 'Find Files', shortcut: 'Alt+F7', action: () => onShowDialog('search') },
        { label: 'Compare Directories', shortcut: 'Shift+F2', action: () => console.log('Compare Directories') },
        { label: 'Synchronize Directories', shortcut: 'Ctrl+Alt+S', action: () => console.log('Synchronize Directories') },
        { separator: true },
        { label: 'Create Archive', shortcut: 'Alt+F5', action: () => onShowDialog('archive') },
        { label: 'Extract Archive', shortcut: 'Alt+F6', action: () => onShowDialog('extract') },
        { separator: true },
        { label: 'FTP Connect', shortcut: 'Ctrl+F', action: () => onShowDialog('ftp') },
        { label: 'Calculate Directory Sizes', shortcut: 'Ctrl+Alt+C', action: () => console.log('Calculate Sizes') },
        { separator: true },
        { label: 'Command Palette', shortcut: 'Cmd+Shift+P', action: () => onShowDialog('commandPalette') }
      ]
    },
    {
      id: 'options',
      label: 'Options',
      items: [
        { label: 'Preferences', shortcut: 'Cmd+,', action: () => onShowDialog('settings'), icon: Settings },
        { separator: true },
        {
          label: 'Theme',
          submenu: [
            {
              label: 'Light',
              action: onToggleTheme,
              icon: Sun,
              checked: theme === Theme.Light
            },
            {
              label: 'Dark',
              action: onToggleTheme,
              icon: Moon,
              checked: theme === Theme.Dark
            },
            {
              label: 'Auto',
              action: onToggleTheme,
              icon: Monitor,
              checked: theme === Theme.Auto
            }
          ]
        },
        { separator: true },
        { label: 'Show Command Line', action: () => console.log('Toggle Command Line') },
        { label: 'Show Status Bar', action: () => console.log('Toggle Status Bar') },
        { label: 'Show Toolbar', action: () => console.log('Toggle Toolbar') }
      ]
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { label: 'Keyboard Shortcuts', shortcut: 'Cmd+?', action: () => onShowDialog('keyboardHelp'), icon: HelpCircle },
        { label: 'User Guide', action: () => console.log('User Guide') },
        { separator: true },
        { label: 'About KrakenEgg', action: () => onShowDialog('about'), icon: Info }
      ]
    }
  ];

  const handleMenuClick = (menuId: string) => {
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  const handleItemClick = (action: () => void) => {
    action();
    setActiveMenu(null);
  };

  const renderMenuItem = (item: any, index: number) => {
    if (item.separator) {
      return <div key={index} className="border-t border-macos-border-light dark:border-macos-border-dark my-1" />;
    }

    const Icon = item.icon;

    return (
      <div
        key={index}
        className="px-3 py-1 hover:bg-macos-blue hover:text-white cursor-pointer flex items-center justify-between group"
        onClick={() => handleItemClick(item.action)}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} />}
          <span className="text-sm">{item.label}</span>
          {item.checked && <span className="ml-2">✓</span>}
        </div>
        {item.shortcut && (
          <span className="text-xs text-macos-text-secondary-light dark:text-macos-text-secondary-dark group-hover:text-white">
            {item.shortcut}
          </span>
        )}
        {item.submenu && <span className="text-xs">▶</span>}
      </div>
    );
  };

  return (
    <div className="menu-bar px-4 py-1 flex items-center gap-4 text-sm relative">
      {menus.map(menu => (
        <div key={menu.id} className="relative">
          <button
            className={`px-2 py-1 rounded hover:bg-macos-bg-panel-light dark:hover:bg-macos-bg-panel-dark ${
              activeMenu === menu.id ? 'bg-macos-blue text-white' : ''
            }`}
            onClick={() => handleMenuClick(menu.id)}
          >
            {menu.label}
          </button>

          {activeMenu === menu.id && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setActiveMenu(null)}
              />
              <div className="absolute top-full left-0 z-50 min-w-48 bg-macos-bg-light dark:bg-macos-bg-dark border border-macos-border-light dark:border-macos-border-dark rounded-md shadow-lg py-1">
                {menu.items.map((item, index) => renderMenuItem(item, index))}
              </div>
            </>
          )}
        </div>
      ))}

      <div className="flex-1" />

      {/* macOS-style window controls would go here in a real app */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      </div>
    </div>
  );
};

export default MenuBar;