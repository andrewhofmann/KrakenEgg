import React, { useState } from 'react';
import { AppState } from '../../types';
import { X, Trash2, AlertTriangle } from 'lucide-react';

interface DeleteDialogProps {
  appState: AppState;
  onClose: () => void;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  appState,
  onClose
}) => {
  const activePanel = appState.activePanel === 'left' ? appState.leftPanel : appState.rightPanel;
  const selectedFiles = activePanel.files.filter(f => activePanel.selectedFiles.has(f.id));

  const [useTrash, setUseTrash] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmDelete) {
      alert('Please confirm the deletion by checking the confirmation box.');
      return;
    }

    console.log('Deleting files:', {
      files: selectedFiles.map(f => f.name),
      useTrash,
      confirmed: confirmDelete
    });

    // In a real app, this would trigger the actual deletion
    onClose();
  };

  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const hasDirectories = selectedFiles.some(f => f.isDirectory);

  return (
    <div className="dialog-overlay">
      <div className="dialog-content max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-macos-border-light dark:border-macos-border-dark">
          <div className="flex items-center gap-2">
            <Trash2 size={20} className="text-macos-red" />
            <h2 className="text-lg font-semibold">Delete Files</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-macos-bg-panel-light dark:hover:bg-macos-bg-panel-dark rounded"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Warning */}
          <div className="p-4 border-b border-macos-border-light dark:border-macos-border-dark">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-yellow-800 dark:text-yellow-200">
                  Are you sure you want to delete {selectedFiles.length} item{selectedFiles.length !== 1 ? 's' : ''}?
                </div>
                <div className="text-yellow-700 dark:text-yellow-300 mt-1">
                  {useTrash ? 'Items will be moved to Trash and can be restored.' : 'This action cannot be undone!'}
                </div>
              </div>
            </div>
          </div>

          {/* File list */}
          <div className="p-4 border-b border-macos-border-light dark:border-macos-border-dark">
            <div className="text-sm font-medium mb-2">
              Files to delete:
            </div>
            <div className="max-h-32 overflow-auto bg-macos-bg-panel-light dark:bg-macos-bg-panel-dark rounded p-2">
              {selectedFiles.map(file => (
                <div key={file.id} className="flex items-center gap-2 text-sm py-1">
                  <span>{file.isDirectory ? '📁' : '📄'}</span>
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
                    {file.isDirectory ? 'Folder' : formatSize(file.size)}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-xs text-macos-text-secondary-light dark:text-macos-text-secondary-dark mt-2">
              Total size: {formatSize(totalSize)}
              {hasDirectories && (
                <div className="text-macos-red mt-1">
                  ⚠️ Folders and their contents will also be deleted
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="p-4 border-b border-macos-border-light dark:border-macos-border-dark space-y-4">
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="deleteMethod"
                  checked={useTrash}
                  onChange={() => setUseTrash(true)}
                  className="mr-2"
                />
                <span className="text-sm">Move to Trash (recommended)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="deleteMethod"
                  checked={!useTrash}
                  onChange={() => setUseTrash(false)}
                  className="mr-2"
                />
                <span className="text-sm">Delete permanently (cannot be undone)</span>
              </label>
            </div>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
                className="mr-2 mt-0.5"
              />
              <span className="text-sm">
                I understand that this will {useTrash ? 'move the selected items to Trash' : 'permanently delete the selected items and this action cannot be undone'}
              </span>
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
              className={`px-4 py-2 rounded text-white disabled:opacity-50 ${
                useTrash
                  ? 'bg-macos-orange hover:bg-orange-600'
                  : 'bg-macos-red hover:bg-red-600'
              }`}
              disabled={!confirmDelete}
            >
              {useTrash ? 'Move to Trash' : 'Delete Permanently'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteDialog;