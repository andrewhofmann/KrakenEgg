import { useState } from 'react';
import { motion } from 'framer-motion';
import { Theme } from '../../types';
import { Sun, Moon, Settings, HelpCircle, Info, Maximize2 } from 'lucide-react';

interface UltraWindowChromeProps {
  onToggleTheme: () => void;
  onShowDialog: (dialogId: string) => void;
  theme: Theme;
}

const UltraWindowChrome = ({ onToggleTheme, onShowDialog, theme }: UltraWindowChromeProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState<string | null>(null);

  const getThemeIcon = () => {
    switch (theme) {
      case Theme.Light: return Sun;
      case Theme.Dark: return Moon;
      default: return Sun;
    }
  };

  const ThemeIcon = getThemeIcon();

  const menuItems = [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New Tab', shortcut: '⌘T', action: () => console.log('New Tab') },
        { label: 'Close Tab', shortcut: '⌘W', action: () => console.log('Close Tab') },
        { separator: true },
        { label: 'Copy', shortcut: 'F5', action: () => onShowDialog('copy') },
        { label: 'Move', shortcut: 'F6', action: () => onShowDialog('move') },
        { label: 'Delete', shortcut: 'F8', action: () => onShowDialog('delete') }
      ]
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { label: 'Brief View', shortcut: '⌃1', action: () => console.log('Brief View') },
        { label: 'Detailed View', shortcut: '⌃2', action: () => console.log('Detailed View') },
        { separator: true },
        { label: 'Show Hidden Files', shortcut: '⌘⇧.', action: () => console.log('Show Hidden') }
      ]
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [
        { label: 'Find Files', shortcut: '⌥F7', action: () => onShowDialog('search') },
        { label: 'Create Archive', shortcut: '⌥F5', action: () => onShowDialog('archive') },
        { separator: true },
        { label: 'Preferences', shortcut: '⌘,', action: () => onShowDialog('settings'), icon: Settings }
      ]
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { label: 'Keyboard Shortcuts', shortcut: '⌘?', action: () => onShowDialog('keyboardHelp'), icon: HelpCircle },
        { separator: true },
        { label: 'About KrakenEgg', action: () => onShowDialog('about'), icon: Info }
      ]
    }
  ];

  return (
    <motion.div
      className="window-chrome flex items-center justify-between px-3 py-1.5 relative z-40"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Traffic lights */}
      <div className="flex items-center gap-1.5">
        <motion.div
          className="w-2.5 h-2.5 bg-mac26-red-500 rounded-full cursor-pointer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        />
        <motion.div
          className="w-2.5 h-2.5 bg-mac26-orange-500 rounded-full cursor-pointer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        />
        <motion.div
          className="w-2.5 h-2.5 bg-mac26-green-500 rounded-full cursor-pointer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        />
      </div>

      {/* Menu bar */}
      <div className="flex items-center gap-4">
        {menuItems.map(menu => (
          <div key={menu.id} className="relative">
            <motion.button
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                isMenuOpen === menu.id
                  ? 'bg-mac26-blue-500 text-white shadow-md'
                  : 'text-mac26-text-primary-light dark:text-mac26-text-primary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark'
              }`}
              onClick={() => setIsMenuOpen(isMenuOpen === menu.id ? null : menu.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {menu.label}
            </motion.button>

            {isMenuOpen === menu.id && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(null)}
                />
                <motion.div
                  className="absolute top-full left-0 z-50 min-w-48 mt-2 ultra-dialog rounded-xl shadow-mac26-lg py-2"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  {menu.items.map((item, index) => {
                    if (item.separator) {
                      return <div key={index} className="border-t border-mac26-border-primary-light dark:border-mac26-border-primary-dark my-2 mx-3" />;
                    }

                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={index}
                        className="w-full px-4 py-2 text-left hover:bg-mac26-selection-light dark:hover:bg-mac26-selection-dark flex items-center justify-between group transition-colors duration-150"
                        onClick={() => {
                          item.action?.();
                          setIsMenuOpen(null);
                        }}
                        whileHover={{ x: 2 }}
                      >
                        <div className="flex items-center gap-3">
                          {Icon && <Icon size={14} className="text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark" />}
                          <span className="text-sm">{item.label}</span>
                        </div>
                        {item.shortcut && (
                          <span className="text-xs text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark font-mono">
                            {item.shortcut}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </div>
        ))}
      </div>


      {/* Right controls */}
      <div className="flex items-center gap-2">
        <motion.button
          className="toolbar-btn"
          onClick={onToggleTheme}
          title={`Theme: ${theme}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ThemeIcon size={16} />
        </motion.button>

        <motion.button
          className="toolbar-btn"
          onClick={() => onShowDialog('keyboardHelp')}
          title="Keyboard Shortcuts (⌘?)"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <HelpCircle size={16} />
        </motion.button>

        <motion.button
          className="toolbar-btn"
          title="Maximize"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Maximize2 size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default UltraWindowChrome;