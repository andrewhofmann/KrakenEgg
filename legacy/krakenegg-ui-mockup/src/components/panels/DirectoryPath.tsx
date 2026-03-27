import React, { useState } from 'react';
import { PanelState } from '../../types';
import { createBreadcrumb } from '../../utils/fileUtils';
import { generateMockFiles } from '../../data/mockFiles';
import { ChevronRight, Home, Edit2 } from 'lucide-react';

interface DirectoryPathProps {
  side: 'left' | 'right';
  panel: PanelState;
  onUpdatePanel: (updater: (panel: PanelState) => PanelState) => void;
}

const DirectoryPath: React.FC<DirectoryPathProps> = ({
  side,
  panel,
  onUpdatePanel
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPath, setEditPath] = useState(panel.currentPath);

  const breadcrumb = createBreadcrumb(panel.currentPath);

  const handleBreadcrumbClick = (path: string) => {
    if (path !== panel.currentPath) {
      const files = generateMockFiles(path);
      onUpdatePanel(panel => ({
        ...panel,
        currentPath: path,
        files,
        selectedFiles: new Set(),
        focusedFile: files.length > 0 ? files[0].id : null,
        history: [...panel.history.slice(0, panel.historyIndex + 1), path],
        historyIndex: panel.historyIndex + 1
      }));
    }
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setEditPath(panel.currentPath);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editPath !== panel.currentPath) {
      try {
        const files = generateMockFiles(editPath);
        onUpdatePanel(panel => ({
          ...panel,
          currentPath: editPath,
          files,
          selectedFiles: new Set(),
          focusedFile: files.length > 0 ? files[0].id : null,
          history: [...panel.history.slice(0, panel.historyIndex + 1), editPath],
          historyIndex: panel.historyIndex + 1
        }));
      } catch (error) {
        console.error('Invalid path:', editPath);
        setEditPath(panel.currentPath);
      }
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditPath(panel.currentPath);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  return (
    <div className="px-3 py-2 bg-macos-bg-panel-light dark:bg-macos-bg-panel-dark border-b border-macos-border-light dark:border-macos-border-dark">
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={editPath}
            onChange={(e) => setEditPath(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleEditCancel}
            className="flex-1 bg-macos-bg-light dark:bg-macos-bg-dark border border-macos-border-light dark:border-macos-border-dark rounded px-2 py-1 text-sm font-mono focus-visible-ring"
            autoFocus
          />
        </form>
      ) : (
        <div className="flex items-center gap-1 text-sm">
          <button
            className="flex items-center gap-1 hover:bg-macos-bg-light dark:hover:bg-macos-bg-dark rounded px-2 py-1"
            onClick={() => handleBreadcrumbClick('/')}
            title="Go to root"
          >
            <Home size={14} />
          </button>

          {breadcrumb.slice(1).map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              <ChevronRight size={12} className="text-macos-text-secondary-light dark:text-macos-text-secondary-dark" />
              <button
                className="hover:bg-macos-bg-light dark:hover:bg-macos-bg-dark rounded px-2 py-1 text-macos-text-primary-light dark:text-macos-text-primary-dark"
                onClick={() => handleBreadcrumbClick(crumb.path)}
                title={crumb.path}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}

          <div className="flex-1" />

          <button
            className="p-1 hover:bg-macos-bg-light dark:hover:bg-macos-bg-dark rounded text-macos-text-secondary-light dark:text-macos-text-secondary-dark"
            onClick={handleEditStart}
            title="Edit path (Cmd+L)"
          >
            <Edit2 size={14} />
          </button>
        </div>
      )}

      {/* Path info */}
      <div className="mt-1 text-xs text-macos-text-secondary-light dark:text-macos-text-secondary-dark font-mono">
        {panel.currentPath}
      </div>
    </div>
  );
};

export default DirectoryPath;