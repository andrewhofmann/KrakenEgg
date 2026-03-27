import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileInfo } from '../../types';
import { formatFileSize, getFileIcon } from '../../utils/fileUtils';
import {
  Copy,
  Move,
  Trash2,
  AlertTriangle,
  FolderOpen,
  Play,
  Pause,
  X
} from 'lucide-react';
import CompactDialog from './CompactDialog';
import CompactProgress from '../common/CompactProgress';

interface UltraFileOperationDialogProps {
  type: 'copy' | 'move' | 'delete';
  onClose: () => void;
  data?: {
    files: FileInfo[];
    destination?: string;
  };
}

const UltraFileOperationDialog = ({ type, onClose, data }: UltraFileOperationDialogProps) => {
  const [destination, setDestination] = useState(data?.destination || '/Users/user/Documents');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [isPaused, setIsPaused] = useState(false);
  const [overwriteMode, setOverwriteMode] = useState<'ask' | 'skip' | 'overwrite'>('ask');

  const files = data?.files || [];
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  const operationConfig = {
    copy: {
      title: 'Copy Files',
      icon: <Copy size={14} className="text-white" />,
      iconColor: 'bg-mac26-blue-500',
      actionText: 'Copy'
    },
    move: {
      title: 'Move Files',
      icon: <Move size={14} className="text-white" />,
      iconColor: 'bg-mac26-orange-500',
      actionText: 'Move'
    },
    delete: {
      title: 'Delete Files',
      icon: <Trash2 size={14} className="text-white" />,
      iconColor: 'bg-mac26-red-500',
      actionText: 'Delete'
    }
  };

  const config = operationConfig[type];

  useEffect(() => {
    if (isRunning && !isPaused) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsRunning(false);
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 5;
        });

        if (files.length > 0) {
          const randomFile = files[Math.floor(Math.random() * files.length)];
          setCurrentFile(randomFile.name);
        }
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isRunning, isPaused, files]);

  const handleStart = () => {
    setIsRunning(true);
    setProgress(0);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleCancel = () => {
    setIsRunning(false);
    setProgress(0);
    setCurrentFile('');
    onClose();
  };

  if (isRunning) {
    return (
      <CompactDialog
        title={`${config.actionText}ing Files`}
        icon={config.icon}
        iconColor={config.iconColor}
        onClose={handleCancel}
        size="sm"
      >
        <div className="space-y-3">
          {/* Progress */}
          <CompactProgress
            progress={progress}
            label={`${files.length} files • ${formatFileSize(totalSize)}`}
            sublabel={isPaused ? 'Paused' : currentFile ? `Processing: ${currentFile}` : 'Processing...'}
            color={type === 'delete' ? 'red' : type === 'move' ? 'orange' : 'blue'}
            size="sm"
          />

          {/* Compact controls */}
          <div className="flex justify-center gap-2 pt-1">
            <button
              className="px-2 py-1 text-xs bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark rounded transition-colors duration-150 flex items-center gap-1"
              onClick={handlePause}
            >
              {isPaused ? <Play size={10} /> : <Pause size={10} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              className="px-2 py-1 text-xs bg-mac26-red-500 hover:bg-mac26-red-600 text-white rounded transition-colors duration-150 flex items-center gap-1"
              onClick={handleCancel}
            >
              <X size={10} />
              Cancel
            </button>
          </div>
        </div>
      </CompactDialog>
    );
  }

  return (
    <CompactDialog
      title={config.title}
      icon={config.icon}
      iconColor={config.iconColor}
      onClose={onClose}
      onConfirm={handleStart}
      onCancel={onClose}
      confirmText={config.actionText}
      cancelText="Cancel"
      size="md"
    >
      <div className="space-y-3">
        {/* File summary */}
        <div className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
          {files.length} file{files.length !== 1 ? 's' : ''} • {formatFileSize(totalSize)}
        </div>

        {/* File list - compact */}
        {files.length <= 3 ? (
          <div className="space-y-1">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-2 text-xs">
                <span className="text-sm">{getFileIcon(file)}</span>
                <span className="text-mac26-text-primary-light dark:text-mac26-text-primary-dark truncate flex-1">
                  {file.name}
                </span>
                <span className="text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark">
                  {formatFileSize(file.size)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark rounded px-2 py-1">
            {files.slice(0, 2).map(f => f.name).join(', ')} and {files.length - 2} more...
          </div>
        )}

        {/* Destination for copy/move */}
        {type !== 'delete' && (
          <div className="space-y-1">
            <label className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
              To:
            </label>
            <div className="flex gap-1">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleStart();
                  }
                }}
                className="flex-1 text-xs px-2 py-1 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border border-mac26-border-primary-light dark:border-mac26-border-primary-dark rounded focus:outline-none focus:border-mac26-blue-500"
                placeholder="Destination..."
              />
              <button
                className="px-2 py-1 text-xs bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark border border-mac26-border-primary-light dark:border-mac26-border-primary-dark rounded transition-colors duration-150"
                title="Browse"
              >
                <FolderOpen size={10} />
              </button>
            </div>
          </div>
        )}

        {/* Options - compact toggles */}
        {type !== 'delete' && (
          <div className="space-y-1">
            <label className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
              If file exists:
            </label>
            <div className="flex gap-1">
              {[
                { id: 'ask', label: 'Ask' },
                { id: 'skip', label: 'Skip' },
                { id: 'overwrite', label: 'Replace' }
              ].map(option => (
                <button
                  key={option.id}
                  className={`px-2 py-1 text-xs rounded transition-all duration-150 ${
                    overwriteMode === option.id
                      ? 'bg-mac26-blue-500 text-white'
                      : 'bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark'
                  }`}
                  onClick={() => setOverwriteMode(option.id as any)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Delete warning */}
        {type === 'delete' && (
          <div className="p-2 bg-mac26-red-500/10 border border-mac26-red-500/20 rounded flex items-center gap-2">
            <AlertTriangle size={12} className="text-mac26-red-500 flex-shrink-0" />
            <div className="text-xs">
              <span className="text-mac26-red-500 font-medium">Warning:</span>
              <span className="text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark"> This cannot be undone</span>
            </div>
          </div>
        )}
      </div>
    </CompactDialog>
  );
};

export default UltraFileOperationDialog;