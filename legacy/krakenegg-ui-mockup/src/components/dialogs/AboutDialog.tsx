import React from 'react';
import { AppState } from '../../types';
import { X, Info } from 'lucide-react';

interface AboutDialogProps {
  appState: AppState;
  onClose: () => void;
}

const AboutDialog: React.FC<AboutDialogProps> = ({ appState, onClose }) => (
  <div className="dialog-overlay">
    <div className="dialog-content max-w-md">
      <div className="flex items-center justify-between p-4 border-b border-macos-border-light dark:border-macos-border-dark">
        <div className="flex items-center gap-2">
          <Info size={20} />
          <h2 className="text-lg font-semibold">About KrakenEgg</h2>
        </div>
        <button onClick={onClose}><X size={20} /></button>
      </div>
      <div className="p-4 text-center">
        <div className="text-6xl mb-4">🦑</div>
        <h3 className="text-xl font-bold mb-2">KrakenEgg</h3>
        <div className="text-sm text-gray-600 mb-4">
          Version 1.0.0 (UI Mockup)<br/>
          A modern Total Commander clone for macOS
        </div>
        <div className="text-xs text-gray-500">
          Built with React, TypeScript, and Tailwind CSS
        </div>
      </div>
      <div className="p-4 flex justify-center">
        <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded">Close</button>
      </div>
    </div>
  </div>
);

export default AboutDialog;