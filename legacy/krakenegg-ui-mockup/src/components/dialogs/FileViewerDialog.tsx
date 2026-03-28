import React from 'react';
import { AppState } from '../../types';
import { X, Eye } from 'lucide-react';

interface FileViewerDialogProps {
  appState: AppState;
  onClose: () => void;
}

const FileViewerDialog: React.FC<FileViewerDialogProps> = ({ appState, onClose }) => (
  <div className="dialog-overlay">
    <div className="dialog-content max-w-4xl h-3/4">
      <div className="flex items-center justify-between p-4 border-b border-macos-border-light dark:border-macos-border-dark">
        <div className="flex items-center gap-2">
          <Eye size={20} />
          <h2 className="text-lg font-semibold">File Viewer</h2>
        </div>
        <button onClick={onClose}><X size={20} /></button>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        File viewer content would go here...
      </div>
      <div className="p-4 flex justify-end">
        <button onClick={onClose} className="px-4 py-2 border rounded">Close</button>
      </div>
    </div>
  </div>
);

export default FileViewerDialog;