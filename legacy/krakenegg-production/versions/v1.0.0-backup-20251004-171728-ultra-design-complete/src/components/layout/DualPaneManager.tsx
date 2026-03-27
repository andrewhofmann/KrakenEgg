import React, { useEffect } from 'react';
import { useFileSystemStore } from '../../stores/useFileSystemStore';
import FilePanel from '../panels/FilePanel';
import { logger } from '../../lib/logger';

const DualPaneManager: React.FC = () => {
  const { loadSystemInfo, goToHome } = useFileSystemStore();

  useEffect(() => {
    const initializeApp = async () => {
      logger.info('UI', '🚀 KrakenEgg Frontend: Starting app initialization');

      try {
        logger.info('UI', '📊 Loading system information...');
        await loadSystemInfo();

        logger.info('UI', '🏠 Initializing both panels to home directory...');
        await Promise.all([
          goToHome('left'),
          goToHome('right')
        ]);

        logger.info('UI', '✅ App initialization completed successfully');
      } catch (error) {
        logger.error('UI', '❌ App initialization failed', error);
      }
    };

    initializeApp();
  }, [loadSystemInfo, goToHome]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Title Bar */}
      <div className="bg-gray-800 text-white p-2 text-center font-medium text-sm">
        KrakenEgg - Total Commander Clone
      </div>

      {/* Toolbar */}
      <div className="bg-gray-100 border-b border-gray-300 p-2">
        <div className="flex space-x-4 text-sm">
          <button className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">
            F3 View
          </button>
          <button className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">
            F4 Edit
          </button>
          <button className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">
            F5 Copy
          </button>
          <button className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">
            F6 Move
          </button>
          <button className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">
            F7 New Folder
          </button>
          <button className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">
            F8 Delete
          </button>
        </div>
      </div>

      {/* Main Panel Area */}
      <div className="flex-1 flex">
        {/* Left Panel */}
        <div className="flex-1 border-r border-gray-300">
          <FilePanel side="left" />
        </div>

        {/* Right Panel */}
        <div className="flex-1">
          <FilePanel side="right" />
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 border-t border-gray-300 p-2 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Ready</span>
          <span>F1 Help | F2 Rename | F3 View | F4 Edit | F5 Copy | F6 Move | F7 New | F8 Delete | F9 Terminal | F10 Quit</span>
        </div>
      </div>
    </div>
  );
};

export default DualPaneManager;