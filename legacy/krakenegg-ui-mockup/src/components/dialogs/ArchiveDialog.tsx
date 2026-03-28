import React from 'react';
import { AppState } from '../../types';
import { X, Archive } from 'lucide-react';

interface ArchiveDialogProps {
  appState: AppState;
  onClose: () => void;
}

const ArchiveDialog: React.FC<ArchiveDialogProps> = ({ appState, onClose }) => (
  <div className="dialog-overlay">
    <div className="dialog-content max-w-md">
      <div className="flex items-center justify-between p-4 border-b border-macos-border-light dark:border-macos-border-dark">
        <div className="flex items-center gap-2">
          <Archive size={20} />
          <h2 className="text-lg font-semibold">Create Archive</h2>
        </div>
        <button onClick={onClose}><X size={20} /></button>
      </div>
      <div className="p-4">Archive creation dialog content...</div>
      <div className="p-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
        <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded">Create</button>
      </div>
    </div>
  </div>
);

export default ArchiveDialog;