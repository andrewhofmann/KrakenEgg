import { motion } from 'framer-motion';
import { PanelState, FileOperation } from '../../types';
import { formatFileSize, getFileCount, getTotalSize } from '../../utils/fileUtils';
import { Activity, Clock, HardDrive } from 'lucide-react';

interface UltraStatusBarProps {
  leftPanel: PanelState;
  rightPanel: PanelState;
  activePanel: 'left' | 'right';
  operations: FileOperation[];
}

const UltraStatusBar = ({
  leftPanel,
  rightPanel,
  activePanel,
  operations
}: UltraStatusBarProps) => {
  const currentPanel = activePanel === 'left' ? leftPanel : rightPanel;
  const { files, directories, total } = getFileCount(currentPanel.files);
  const selectedCount = currentPanel.selectedFiles.size;
  const totalSize = getTotalSize(currentPanel.files);
  const selectedFiles = currentPanel.files.filter(f => currentPanel.selectedFiles.has(f.id));
  const selectedSize = getTotalSize(selectedFiles);

  const runningOperations = operations.filter(op => op.status === 'running');

  return (
    <motion.div
      className="ultra-status-bar"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="relative flex items-center">
        <div className="flex items-center gap-6">
          {/* File statistics */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <HardDrive size={12} className="text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark" />
              <span className="text-xs">
                {total} items
              </span>
            </div>

            <div className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
              {directories} folders, {files} files
            </div>

            <div className="text-xs">
              {formatFileSize(totalSize)}
            </div>

            <div className={`flex items-center gap-2 px-2 py-1 rounded-md transition-opacity ${
              selectedCount > 0
                ? 'bg-mac26-blue-500 text-white opacity-100'
                : 'bg-transparent text-transparent opacity-0'
            }`}>
              <span className="text-xs font-medium">
                {selectedCount > 0 ? `${selectedCount} selected` : '0 selected'}
              </span>
              <span className="text-xs opacity-90">
                ({formatFileSize(selectedSize)})
              </span>
            </div>
          </div>

        </div>

        <div className="absolute right-0 flex items-center gap-6">
          {/* Running operations */}
          {runningOperations.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-mac26-green-50 dark:bg-mac26-green-900/20 text-mac26-green-600 dark:text-mac26-green-400">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Activity size={12} />
              </motion.div>
              <span className="text-xs font-medium">
                {runningOperations.length} operation{runningOperations.length !== 1 ? 's' : ''} running
              </span>
            </div>
          )}


          {/* System info */}
          <div className="flex items-center gap-4 text-xs text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <span className="font-mono">
              KrakenEgg v2.0
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UltraStatusBar;