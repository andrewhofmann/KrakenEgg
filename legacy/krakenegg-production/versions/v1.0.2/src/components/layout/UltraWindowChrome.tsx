import { motion } from 'framer-motion';
import { Theme } from '../../types';
import { Sun, Moon } from 'lucide-react';

interface UltraWindowChromeProps {
  onToggleTheme: () => void;
  theme: Theme;
}

const UltraWindowChrome = ({ onToggleTheme, theme }: UltraWindowChromeProps) => {
  const getThemeIcon = () => {
    switch (theme) {
      case Theme.Light: return Sun;
      case Theme.Dark: return Moon;
      default: return Sun;
    }
  };

  const ThemeIcon = getThemeIcon();

  return (
    <motion.div
      className="window-chrome flex items-center justify-between px-3 py-1.5 relative z-40"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* App title - since we're using native menu bar */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
          KrakenEgg
        </span>
      </div>

      {/* Center spacer - native macOS menu bar will handle menus */}
      <div className="flex-1"></div>


      {/* Minimal controls - theme only, others handled by native menu */}
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
      </div>
    </motion.div>
  );
};

export default UltraWindowChrome;