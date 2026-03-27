import { useState, useEffect } from 'react';

interface FunctionKey {
  key: string;
  label: string;
  action?: () => void;
}

interface FunctionKeySet {
  [modifier: string]: FunctionKey[];
}

interface UltraFunctionKeyBarProps {
  onFunctionKeyPress?: (functionKey: string, modifiers: string[]) => void;
}

const UltraFunctionKeyBar = ({ onFunctionKeyPress }: UltraFunctionKeyBarProps) => {
  const [activeModifiers, setActiveModifiers] = useState<string[]>([]);

  // Define function key mappings for different modifier combinations
  const functionKeySets: FunctionKeySet = {
    'default': [
      { key: 'F1', label: 'Help' },
      { key: 'F2', label: 'User Menu' },
      { key: 'F3', label: 'View' },
      { key: 'F4', label: 'Edit' },
      { key: 'F5', label: 'Copy' },
      { key: 'F6', label: 'Move' },
      { key: 'F7', label: 'MkDir' },
      { key: 'F8', label: 'Delete' },
      { key: 'F9', label: 'Quit' },
      { key: 'F10', label: 'Exit' }
    ],
    'shift': [
      { key: 'F1', label: 'Help' },
      { key: 'F2', label: 'Filter' },
      { key: 'F3', label: 'Quick Look' },
      { key: 'F4', label: 'Create File' },
      { key: 'F5', label: 'Copy to...' },
      { key: 'F6', label: 'Move to...' },
      { key: 'F7', label: 'Search' },
      { key: 'F8', label: 'Delete All' },
      { key: 'F9', label: 'Config' },
      { key: 'F10', label: 'Last Menu' }
    ],
    'cmd': [
      { key: 'F1', label: 'Left Tree' },
      { key: 'F2', label: 'Right Tree' },
      { key: 'F3', label: 'Sort Name' },
      { key: 'F4', label: 'Sort Time' },
      { key: 'F5', label: 'Pack' },
      { key: 'F6', label: 'UnPack' },
      { key: 'F7', label: 'Find' },
      { key: 'F8', label: 'History' },
      { key: 'F9', label: 'Info' },
      { key: 'F10', label: 'Tree' }
    ],
    'ctrl': [
      { key: 'F1', label: 'Brief' },
      { key: 'F2', label: 'Detailed' },
      { key: 'F3', label: 'By Name' },
      { key: 'F4', label: 'By Ext' },
      { key: 'F5', label: 'By Time' },
      { key: 'F6', label: 'By Size' },
      { key: 'F7', label: 'Unsorted' },
      { key: 'F8', label: 'Reverse' },
      { key: 'F9', label: 'Hidden' },
      { key: 'F10', label: 'Branch' }
    ],
    'option': [
      { key: 'F1', label: 'Left Drive' },
      { key: 'F2', label: 'Right Drive' },
      { key: 'F3', label: 'Source' },
      { key: 'F4', label: 'Target' },
      { key: 'F5', label: 'Sync Dirs' },
      { key: 'F6', label: 'Compare' },
      { key: 'F7', label: 'Quick Dir' },
      { key: 'F8', label: 'Cleanup' },
      { key: 'F9', label: 'Network' },
      { key: 'F10', label: 'FTP' }
    ]
  };

  // Track modifier keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const modifiers: string[] = [];
      if (event.shiftKey) modifiers.push('shift');
      if (event.metaKey) modifiers.push('cmd'); // Command key on macOS
      if (event.ctrlKey) modifiers.push('ctrl');
      if (event.altKey) modifiers.push('option'); // Option key on macOS

      setActiveModifiers(modifiers);

      // Handle function key presses
      if (event.key.startsWith('F') && event.key.length >= 2) {
        const functionKey = event.key;
        onFunctionKeyPress?.(functionKey, modifiers);
        event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Update modifiers when keys are released
      const modifiers: string[] = [];
      if (event.shiftKey) modifiers.push('shift');
      if (event.metaKey) modifiers.push('cmd');
      if (event.ctrlKey) modifiers.push('ctrl');
      if (event.altKey) modifiers.push('option');

      setActiveModifiers(modifiers);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onFunctionKeyPress]);

  // Get the current function key set based on active modifiers
  const getCurrentFunctionKeys = (): FunctionKey[] => {
    if (activeModifiers.length === 0) {
      return functionKeySets.default;
    }

    // Priority order for modifier combinations
    if (activeModifiers.includes('cmd')) {
      return functionKeySets.cmd;
    }
    if (activeModifiers.includes('ctrl')) {
      return functionKeySets.ctrl;
    }
    if (activeModifiers.includes('option')) {
      return functionKeySets.option;
    }
    if (activeModifiers.includes('shift')) {
      return functionKeySets.shift;
    }

    return functionKeySets.default;
  };

  const currentKeys = getCurrentFunctionKeys();

  const handleFunctionKeyClick = (functionKey: FunctionKey) => {
    onFunctionKeyPress?.(functionKey.key, activeModifiers);
    functionKey.action?.();
  };

  const getModifierDisplay = () => {
    if (activeModifiers.length === 0) return '';
    return activeModifiers.map(mod => {
      switch (mod) {
        case 'cmd': return '⌘';
        case 'ctrl': return '⌃';
        case 'option': return '⌥';
        case 'shift': return '⇧';
        default: return mod;
      }
    }).join('');
  };

  return (
    <div className="flex items-center h-6 bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark border-t border-mac26-border-primary-light dark:border-mac26-border-primary-dark text-xs">
      {/* Fixed-width modifier indicator to prevent shifting */}
      <div className="w-8 flex justify-center ml-1 mr-1">
        {activeModifiers.length > 0 && (
          <div className="px-1.5 py-0.5 bg-mac26-blue-500 text-white rounded-sm text-xs font-medium">
            {getModifierDisplay()}
          </div>
        )}
      </div>

      {/* Function keys */}
      <div className="flex-1 flex items-center">
        {currentKeys.map((funcKey, index) => (
          <button
            key={funcKey.key}
            onClick={() => handleFunctionKeyClick(funcKey)}
            className="flex items-center px-1.5 py-0.5 hover:bg-mac26-selection-light dark:hover:bg-mac26-selection-dark transition-colors duration-100 text-xs"
            title={`${getModifierDisplay()}${funcKey.key}: ${funcKey.label}`}
          >
            <span className="text-mac26-blue-500 font-medium mr-1.5 min-w-[18px]">
              {funcKey.key}
            </span>
            <span className="text-mac26-text-primary-light dark:text-mac26-text-primary-dark truncate">
              {funcKey.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default UltraFunctionKeyBar;