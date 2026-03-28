import React, { useState } from 'react';
import { AppState } from '../../types';
import { X, FolderPlus } from 'lucide-react';

interface CreateDirectoryDialogProps {
  appState: AppState;
  onClose: () => void;
}

const CreateDirectoryDialog: React.FC<CreateDirectoryDialogProps> = ({
  appState,
  onClose
}) => {
  const [directoryName, setDirectoryName] = useState('New Folder');
  const [createMultiple, setCreateMultiple] = useState(false);

  const activePanel = appState.activePanel === 'left' ? appState.leftPanel : appState.rightPanel;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!directoryName.trim()) {
      alert('Please enter a directory name.');
      return;
    }

    console.log('Creating directory:', {
      name: directoryName,
      path: activePanel.currentPath,
      createMultiple
    });

    // In a real app, this would create the directory
    onClose();
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog-content max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-macos-border-light dark:border-macos-border-dark">
          <div className="flex items-center gap-2">
            <FolderPlus size={20} />
            <h2 className="text-lg font-semibold">Create Directory</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-macos-bg-panel-light dark:hover:bg-macos-bg-panel-dark rounded"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Current location */}
          <div className="p-4 border-b border-macos-border-light dark:border-macos-border-dark">
            <div className="text-sm text-macos-text-secondary-light dark:text-macos-text-secondary-dark mb-2">
              Creating in:
            </div>
            <div className="text-sm font-mono bg-macos-bg-panel-light dark:bg-macos-bg-panel-dark p-2 rounded">
              {activePanel.currentPath}
            </div>
          </div>

          {/* Directory name */}
          <div className="p-4 border-b border-macos-border-light dark:border-macos-border-dark">
            <label className="block text-sm font-medium mb-2">
              Directory name:
            </label>
            <input
              type="text"
              value={directoryName}
              onChange={(e) => setDirectoryName(e.target.value)}
              className="w-full px-3 py-2 border border-macos-border-light dark:border-macos-border-dark rounded focus-visible-ring bg-macos-bg-light dark:bg-macos-bg-dark"
              placeholder="Enter directory name..."
              autoFocus
            />
            <div className="text-xs text-macos-text-secondary-light dark:text-macos-text-secondary-dark mt-1">
              Use "/" to create nested directories (e.g., "parent/child")
            </div>
          </div>

          {/* Options */}
          <div className="p-4 border-b border-macos-border-light dark:border-macos-border-dark">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={createMultiple}
                onChange={(e) => setCreateMultiple(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Create parent directories if they don't exist</span>
            </label>
          </div>

          {/* Actions */}
          <div className="p-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-macos-border-light dark:border-macos-border-dark rounded hover:bg-macos-bg-panel-light dark:hover:bg-macos-bg-panel-dark"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-macos-blue text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={!directoryName.trim()}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDirectoryDialog;