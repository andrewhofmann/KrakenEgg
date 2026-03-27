import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Palette,
  Keyboard,
  Monitor,
  Shield,
  Zap,
  Archive,
  Network,
  HardDrive,
  Search,
  Moon,
  Sun,
  Laptop,
  ChevronRight,
  X,
  Globe,
  Bell,
  User,
  Info
} from 'lucide-react';

interface UltraSettingsDialogProps {
  onClose: () => void;
}

interface SettingCategory {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
  items: SettingItem[];
}

interface SettingItem {
  id: string;
  name: string;
  description: string;
  type: 'toggle' | 'select' | 'button' | 'text';
  value?: any;
  options?: Array<{ id: string; label: string; icon?: any }>;
}

const UltraSettingsDialog = ({ onClose }: UltraSettingsDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, any>>({
    theme: 'auto',
    showHiddenFiles: false,
    confirmDeletes: true,
    enableAnimations: true,
    autoSave: true,
    fontSize: 'medium',
    accentColor: 'blue',
    language: 'english',
    soundEffects: false,
    enableNotifications: true,
    keyboardShortcuts: 'default'
  });
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Always allow Escape to close dialog regardless of focus
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      // Handle Tab navigation - ALWAYS trap within dialog
      if (e.key === 'Tab') {
        if (!dialogRef.current) return;

        e.preventDefault();
        e.stopPropagation();

        const focusableElements = dialogRef.current.querySelectorAll(
          'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        const focusableArray = Array.from(focusableElements) as HTMLElement[];

        if (focusableArray.length === 0) return;

        const currentIndex = focusableArray.indexOf(document.activeElement as HTMLElement);
        let nextIndex;

        if (e.shiftKey) {
          // Shift+Tab - go backwards
          nextIndex = currentIndex <= 0 ? focusableArray.length - 1 : currentIndex - 1;
        } else {
          // Tab - go forwards
          nextIndex = currentIndex >= focusableArray.length - 1 ? 0 : currentIndex + 1;
        }

        focusableArray[nextIndex]?.focus();
        return;
      }
    };

    // Additional focus trap - prevent focus from leaving dialog
    const handleFocusOut = (e: FocusEvent) => {
      if (!dialogRef.current) return;

      const newFocusTarget = e.relatedTarget as HTMLElement;

      // If focus is moving outside the dialog, bring it back
      if (newFocusTarget && !dialogRef.current.contains(newFocusTarget)) {
        e.preventDefault();

        // Focus the first focusable element in the dialog
        const focusableElements = dialogRef.current.querySelectorAll(
          'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        const firstFocusable = focusableElements[0] as HTMLElement;
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }
    };

    // Use capture phase to intercept ALL keyboard events
    document.addEventListener('keydown', handleKeyDown, true);

    // Add focus trap
    if (dialogRef.current) {
      dialogRef.current.addEventListener('focusout', handleFocusOut);
    }

    // Initial focus
    setTimeout(() => {
      if (dialogRef.current) {
        const firstFocusable = dialogRef.current.querySelector('input, button') as HTMLElement;
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      if (dialogRef.current) {
        dialogRef.current.removeEventListener('focusout', handleFocusOut);
      }
    };
  }, [onClose]);

  const categories: SettingCategory[] = [
    {
      id: 'general',
      name: 'General',
      icon: Settings,
      color: 'bg-gray-500',
      description: 'Basic app settings and preferences',
      items: [
        {
          id: 'language',
          name: 'Language',
          description: 'Choose your preferred language',
          type: 'select',
          options: [
            { id: 'english', label: 'English' },
            { id: 'spanish', label: 'Español' },
            { id: 'french', label: 'Français' },
            { id: 'german', label: 'Deutsch' }
          ]
        },
        {
          id: 'autoSave',
          name: 'Auto-save settings',
          description: 'Automatically save changes to preferences',
          type: 'toggle'
        },
        {
          id: 'enableNotifications',
          name: 'Enable notifications',
          description: 'Show system notifications for operations',
          type: 'toggle'
        }
      ]
    },
    {
      id: 'appearance',
      name: 'Appearance',
      icon: Palette,
      color: 'bg-purple-500',
      description: 'Customize the look and feel',
      items: [
        {
          id: 'theme',
          name: 'Theme',
          description: 'Choose your preferred color scheme',
          type: 'select',
          options: [
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'auto', label: 'Auto', icon: Laptop }
          ]
        },
        {
          id: 'accentColor',
          name: 'Accent Color',
          description: 'Set the accent color for UI elements',
          type: 'select',
          options: [
            { id: 'blue', label: 'Blue' },
            { id: 'purple', label: 'Purple' },
            { id: 'green', label: 'Green' },
            { id: 'orange', label: 'Orange' },
            { id: 'red', label: 'Red' }
          ]
        },
        {
          id: 'fontSize',
          name: 'Font Size',
          description: 'Adjust text size throughout the app',
          type: 'select',
          options: [
            { id: 'small', label: 'Small' },
            { id: 'medium', label: 'Medium' },
            { id: 'large', label: 'Large' }
          ]
        },
        {
          id: 'enableAnimations',
          name: 'Enable animations',
          description: 'Smooth transitions and micro-interactions',
          type: 'toggle'
        },
        {
          id: 'soundEffects',
          name: 'Sound effects',
          description: 'Audio feedback for actions',
          type: 'toggle'
        }
      ]
    },
    {
      id: 'fileOperations',
      name: 'File Operations',
      icon: HardDrive,
      color: 'bg-blue-500',
      description: 'Configure file management behavior',
      items: [
        {
          id: 'showHiddenFiles',
          name: 'Show hidden files',
          description: 'Display files and folders that start with a dot',
          type: 'toggle'
        },
        {
          id: 'confirmDeletes',
          name: 'Confirm delete operations',
          description: 'Show confirmation dialog before deleting files',
          type: 'toggle'
        }
      ]
    },
    {
      id: 'keyboard',
      name: 'Keyboard',
      icon: Keyboard,
      color: 'bg-green-500',
      description: 'Customize keyboard shortcuts',
      items: [
        {
          id: 'keyboardShortcuts',
          name: 'Shortcut scheme',
          description: 'Choose your preferred keyboard shortcuts',
          type: 'select',
          options: [
            { id: 'default', label: 'Default' },
            { id: 'totalcommander', label: 'Total Commander' },
            { id: 'custom', label: 'Custom' }
          ]
        }
      ]
    }
  ];

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;

    return categories.map(category => ({
      ...category,
      items: category.items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(category => category.items.length > 0);
  }, [searchQuery, categories]);

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    onClose();
  };

  const renderSettingItem = (item: SettingItem) => {
    const currentValue = settings[item.id];

    switch (item.type) {
      case 'toggle':
        return (
          <label className="flex items-center justify-between cursor-pointer py-2">
            <div className="flex-1">
              <div className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                {item.name}
              </div>
              <div className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
                {item.description}
              </div>
            </div>
            <input
              type="checkbox"
              checked={currentValue || false}
              onChange={(e) => updateSetting(item.id, e.target.checked)}
              className="w-4 h-4 text-mac26-blue-500 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border-mac26-border-primary-light dark:border-mac26-border-primary-dark rounded focus:ring-mac26-blue-500 focus:ring-1"
            />
          </label>
        );

      case 'select':
        return (
          <div className="py-2">
            <div className="mb-2">
              <div className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                {item.name}
              </div>
              <div className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
                {item.description}
              </div>
            </div>
            <select
              value={currentValue || item.options?.[0]?.id}
              onChange={(e) => updateSetting(item.id, e.target.value)}
              className="w-full text-sm px-3 py-2 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border border-mac26-border-primary-light dark:border-mac26-border-primary-dark rounded focus:outline-none focus:border-mac26-blue-500"
            >
              {item.options?.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  if (selectedCategory) {
    const category = categories.find(c => c.id === selectedCategory);
    if (!category) return null;

    return (
      <div ref={dialogRef} className="w-full max-w-2xl max-h-[80vh] bg-mac26-bg-primary-light dark:bg-mac26-bg-primary-dark rounded-xl shadow-mac26-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-mac26-border-primary-light dark:border-mac26-border-primary-dark">
          <button
            onClick={() => setSelectedCategory(null)}
            className="w-6 h-6 rounded-md hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark flex items-center justify-center text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark transition-colors duration-150"
          >
            <ChevronRight size={14} className="rotate-180" />
          </button>
          <div className={`w-8 h-8 rounded-lg ${category.color} flex items-center justify-center flex-shrink-0`}>
            <category.icon size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
              {category.name}
            </h3>
            <p className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
              {category.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark flex items-center justify-center text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark transition-colors duration-150"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          <div className="space-y-1">
            {category.items.map((item, index) => (
              <div
                key={item.id}
                className={`${index > 0 ? 'border-t border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark' : ''}`}
              >
                {renderSettingItem(item)}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-mac26-border-primary-light dark:border-mac26-border-primary-dark bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark">
          <button
            className="px-4 py-2 text-sm font-medium text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark rounded-lg transition-colors duration-150"
            onClick={() => setSelectedCategory(null)}
          >
            Back
          </button>
          <button
            className="px-6 py-2 bg-mac26-blue-500 hover:bg-mac26-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-150"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={dialogRef} className="w-full max-w-2xl max-h-[80vh] bg-mac26-bg-primary-light dark:bg-mac26-bg-primary-dark rounded-xl shadow-mac26-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-mac26-border-primary-light dark:border-mac26-border-primary-dark">
        <div className="w-8 h-8 rounded-lg bg-mac26-blue-500 flex items-center justify-center flex-shrink-0">
          <Settings size={16} className="text-white" />
        </div>
        <h3 className="text-lg font-semibold text-mac26-text-primary-light dark:text-mac26-text-primary-dark flex-1">
          Settings
        </h3>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark flex items-center justify-center text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark transition-colors duration-150"
        >
          <X size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border border-mac26-border-primary-light dark:border-mac26-border-primary-dark rounded-lg focus:outline-none focus:border-mac26-blue-500"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="px-6 py-4 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {filteredCategories.map(category => (
            <motion.button
              key={category.id}
              className="p-4 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark rounded-lg border border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark transition-all duration-150 text-left group"
              onClick={() => setSelectedCategory(category.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center flex-shrink-0`}>
                  <category.icon size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark truncate">
                      {category.name}
                    </h4>
                    <ChevronRight size={14} className="text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark group-hover:text-mac26-text-secondary-light dark:group-hover:text-mac26-text-secondary-dark transition-colors" />
                  </div>
                  <p className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark mt-1 line-clamp-2">
                    {category.description}
                  </p>
                  {searchQuery && (
                    <p className="text-xs text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark mt-1">
                      {category.items.length} setting{category.items.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {filteredCategories.length === 0 && searchQuery && (
          <div className="text-center py-8">
            <Search size={48} className="mx-auto text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark mb-4" />
            <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
              No settings found for "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      {/* App Info Footer */}
      <div className="px-6 py-4 border-t border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-mac26-blue-500 to-mac26-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-sm">🐙</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
              KrakenEgg v1.0.0
            </p>
            <p className="text-xs text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark">
              Build 2024.10.02
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltraSettingsDialog;