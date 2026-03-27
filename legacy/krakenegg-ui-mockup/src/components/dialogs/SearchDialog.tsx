import React, { useState } from 'react';
import { AppState } from '../../types';
import { X, Search } from 'lucide-react';

interface SearchDialogProps {
  appState: AppState;
  onClose: () => void;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ appState, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="dialog-overlay">
      <div className="dialog-content max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-macos-border-light dark:border-macos-border-dark">
          <div className="flex items-center gap-2">
            <Search size={20} />
            <h2 className="text-lg font-semibold">Find Files</h2>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Search for files..."
          />
          <div className="mt-4 text-sm text-gray-500">Advanced search options would go here...</div>
        </div>
        <div className="p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded">Search</button>
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;