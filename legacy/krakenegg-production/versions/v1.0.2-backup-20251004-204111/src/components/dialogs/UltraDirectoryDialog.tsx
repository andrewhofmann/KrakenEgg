import { useState, useRef, useEffect } from 'react';
import { FolderPlus, AlertTriangle } from 'lucide-react';
import CompactDialog from './CompactDialog';

interface UltraDirectoryDialogProps {
  onClose: () => void;
}

const UltraDirectoryDialog = ({ onClose }: UltraDirectoryDialogProps) => {
  const [directoryName, setDirectoryName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Remove custom focus management - let CompactDialog handle it

  const validateName = (name: string) => {
    if (!name.trim()) return false;
    if (name.includes('/') || name.includes('\\')) {
      setError('Cannot contain / or \\');
      return false;
    }
    if (name.startsWith('.')) {
      setError('Cannot start with .');
      return false;
    }
    if (name.length > 255) {
      setError('Name too long');
      return false;
    }
    setError('');
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDirectoryName(value);
    if (value) {
      validateName(value);
    } else {
      setError('');
    }
  };

  const handleCreate = () => {
    if (validateName(directoryName)) {
      console.log('Creating directory:', directoryName);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
  };

  const isValid = directoryName.trim() && !error;

  return (
    <CompactDialog
      title="Create New Folder"
      icon={<FolderPlus size={14} className="text-white" />}
      iconColor="bg-mac26-green-500"
      onClose={onClose}
      onConfirm={handleCreate}
      onCancel={onClose}
      confirmText="Create"
      cancelText="Cancel"
      confirmDisabled={!isValid}
      size="sm"
    >
      <div className="space-y-3">
        {/* Input */}
        <div>
          <label className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark block mb-1">
            Folder name:
          </label>
          <input
            ref={inputRef}
            type="text"
            value={directoryName}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="New Folder"
            className={`w-full text-sm px-2 py-1.5 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border rounded focus:outline-none focus:border-mac26-blue-500 ${
              error
                ? 'border-mac26-red-500'
                : 'border-mac26-border-primary-light dark:border-mac26-border-primary-dark'
            }`}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-1 text-xs text-mac26-red-500">
            <AlertTriangle size={10} />
            {error}
          </div>
        )}

        {/* Path preview */}
        <div className="text-xs text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark">
          📁 /Users/user/Documents/{directoryName || 'New Folder'}
        </div>
      </div>
    </CompactDialog>
  );
};

export default UltraDirectoryDialog;