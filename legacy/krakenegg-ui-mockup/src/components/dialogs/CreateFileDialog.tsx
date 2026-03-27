import React, { useState } from 'react';
import { AppState } from '../../types';
import { X, FilePlus } from 'lucide-react';

interface CreateFileDialogProps {
  appState: AppState;
  onClose: () => void;
}

const CreateFileDialog: React.FC<CreateFileDialogProps> = ({ appState, onClose }) => {
  const [fileName, setFileName] = useState('new-file.txt');

  return (
    <div className="dialog-overlay">
      <div className="dialog-content max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-macos-border-light dark:border-macos-border-dark">
          <div className="flex items-center gap-2">
            <FilePlus size={20} />
            <h2 className="text-lg font-semibold">Create File</h2>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-4">
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="File name..."
          />
        </div>
        <div className="p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded">Create</button>
        </div>
      </div>
    </div>
  );
};

export default CreateFileDialog;