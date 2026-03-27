import { useState, useRef, useEffect } from 'react';
import { PanelState } from '../../types';
import { createBreadcrumb, getFolderNameFromPath } from '../../utils/fileUtils';
import { generateRealFiles } from '../../data/realFiles';
import { ChevronRight, Home, Edit2, FolderOpen, Copy, Check, MoreHorizontal, Type, MoreVertical } from 'lucide-react';

interface BreadcrumbItem {
  path: string;
  name: string;
  isEllipsis?: boolean;
}

interface UltraDirectoryPathProps {
  side: 'left' | 'right';
  panel: PanelState;
  onUpdatePanel: (updater: (panel: PanelState) => PanelState) => void;
  onEditingChange?: (isEditing: boolean) => void;
}

const UltraDirectoryPath = ({ side, panel, onUpdatePanel, onEditingChange }: UltraDirectoryPathProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPath, setEditPath] = useState(panel.currentPath);
  const [showFullPath, setShowFullPath] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPathMenu, setShowPathMenu] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [showCollapsedMenu, setShowCollapsedMenu] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const breadcrumbRef = useRef<HTMLDivElement>(null);

  const breadcrumb = createBreadcrumb(panel.currentPath);

  // Notify parent when editing state changes
  useEffect(() => {
    onEditingChange?.(isEditing);
  }, [isEditing, onEditingChange]);

  // Monitor container width for responsive behavior
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Dynamic path truncation logic - show as much as possible
  const getDisplayBreadcrumbs = () => {
    if (!containerWidth || breadcrumb.length <= 2) {
      return { displayCrumbs: breadcrumb, collapsedCrumbs: [] };
    }

    // Available width calculation (more precise)
    const reservedWidth = 120; // Home button + actions + padding
    const availableWidth = containerWidth - reservedWidth;
    const chevronWidth = 16; // ChevronRight icon width
    const ellipsisWidth = 40; // Three dots button width

    // Start with all breadcrumbs and measure if they fit
    let totalWidth = 0;
    const crumbWidths: number[] = [];

    // Estimate width for each crumb (more dynamic sizing based on content)
    breadcrumb.forEach((crumb, index) => {
      if (index === 0) {
        crumbWidths.push(0); // Home button handled separately
        return;
      }

      // Estimate based on text length with some padding
      const estimatedWidth = Math.min(Math.max(crumb.name.length * 8 + 20, 60), 120);
      crumbWidths.push(estimatedWidth + chevronWidth);
      totalWidth += estimatedWidth + chevronWidth;
    });

    // If everything fits, show all
    if (totalWidth <= availableWidth) {
      return { displayCrumbs: breadcrumb, collapsedCrumbs: [] };
    }

    // Find the optimal truncation point
    let displayCrumbs: BreadcrumbItem[] = [...breadcrumb];
    let collapsedCrumbs: BreadcrumbItem[] = [];

    // Always try to keep the last folder visible
    let currentWidth = crumbWidths[crumbWidths.length - 1] || 0; // Last folder
    const keepIndices = [0, breadcrumb.length - 1]; // Always keep root and current

    // Add folders from the end backwards while they fit
    for (let i = breadcrumb.length - 2; i > 0; i--) {
      const crumbWidth = crumbWidths[i];
      if (currentWidth + crumbWidth + ellipsisWidth <= availableWidth) {
        keepIndices.unshift(i);
        currentWidth += crumbWidth;
      } else {
        break;
      }
    }

    // Build the display and collapsed arrays
    if (keepIndices.length < breadcrumb.length) {
      // We need to collapse some items
      keepIndices.sort((a, b) => a - b);
      displayCrumbs = [];
      collapsedCrumbs = [];

      let lastKeptIndex = -1;
      keepIndices.forEach((index) => {
        if (lastKeptIndex !== -1 && index > lastKeptIndex + 1) {
          // There's a gap, add ellipsis
          if (displayCrumbs[displayCrumbs.length - 1]?.name !== '...') {
            displayCrumbs.push({ path: '...', name: '...', isEllipsis: true } as BreadcrumbItem);
          }
          // Collect collapsed items
          for (let j = lastKeptIndex + 1; j < index; j++) {
            collapsedCrumbs.push(breadcrumb[j]);
          }
        }
        displayCrumbs.push(breadcrumb[index]);
        lastKeptIndex = index;
      });
    }

    return { displayCrumbs, collapsedCrumbs };
  };

  const { displayCrumbs: displayBreadcrumbs, collapsedCrumbs: collapsedItems } = getDisplayBreadcrumbs();
  const hasCollapsedItems = collapsedItems.length > 0;

  const handleBreadcrumbClick = async (path: string) => {
    if (path !== panel.currentPath) {
      try {
        const files = await generateRealFiles(path);
        onUpdatePanel(panel => {
          // Update the current tab's path
          const updatedTabs = panel.tabs.map(tab =>
            tab.id === panel.activeTab
              ? { ...tab, name: getFolderNameFromPath(path), path: path }
              : tab
          );

          return {
            ...panel,
            currentPath: path,
            files,
            selectedFiles: new Set(),
            focusedFile: files.length > 0 ? files[0].id : null,
            tabs: updatedTabs,
            history: [...panel.history.slice(0, panel.historyIndex + 1), path],
            historyIndex: panel.historyIndex + 1
          };
        });
      } catch (error) {
        console.error('🦑 Error loading files for breadcrumb:', error);
        // Fallback to empty files array
        onUpdatePanel(panel => {
          const updatedTabs = panel.tabs.map(tab =>
            tab.id === panel.activeTab
              ? { ...tab, name: getFolderNameFromPath(path), path: path }
              : tab
          );

          return {
            ...panel,
            currentPath: path,
            files: [],
            selectedFiles: new Set(),
            focusedFile: null,
            tabs: updatedTabs,
            history: [...panel.history.slice(0, panel.historyIndex + 1), path],
            historyIndex: panel.historyIndex + 1
          };
        });
      }
    }
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setEditPath(panel.currentPath);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editPath !== panel.currentPath) {
      try {
        const files = await generateRealFiles(editPath);
        onUpdatePanel(panel => {
          // Update the current tab's path
          const updatedTabs = panel.tabs.map(tab =>
            tab.id === panel.activeTab
              ? { ...tab, name: getFolderNameFromPath(editPath), path: editPath }
              : tab
          );

          return {
            ...panel,
            currentPath: editPath,
            files,
            selectedFiles: new Set(),
            focusedFile: files.length > 0 ? files[0].id : null,
            tabs: updatedTabs,
            history: [...panel.history.slice(0, panel.historyIndex + 1), editPath],
            historyIndex: panel.historyIndex + 1
          };
        });
      } catch (error) {
        console.error('🦑 Invalid path or error loading files:', editPath, error);
        setEditPath(panel.currentPath);
      }
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditPath(panel.currentPath);
  };

  const handlePathClick = () => {
    if (!showFullPath) {
      setShowFullPath(true);
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(panel.currentPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy path:', err);
    }
  };

  return (
    <div
      ref={containerRef}
      className="px-3 py-1.5 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border-b border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark min-w-0 overflow-hidden"
    >
      {isEditing ? (
        <form
          onSubmit={handleEditSubmit}
          className="flex items-center gap-2"
        >
          <FolderOpen size={16} className="text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark" />
          <input
            type="text"
            value={editPath}
            onChange={(e) => setEditPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && handleEditCancel()}
            onBlur={handleEditCancel}
            className="flex-1 ultra-input text-sm font-mono"
            autoFocus
          />
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              try {
                await navigator.clipboard.writeText(editPath);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch (err) {
                console.error('Failed to copy path:', err);
              }
            }}
            className="p-1.5 rounded-lg hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark transition-colors duration-150 flex-shrink-0"
            title="Copy path to clipboard"
          >
            {copied ? (
              <Check size={12} className="text-mac26-green-500" />
            ) : (
              <Copy size={12} />
            )}
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-2 text-sm min-w-0 overflow-hidden">
          {!showFullPath ? (
            <>
              <button
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark transition-colors duration-150"
                onClick={() => handleBreadcrumbClick('/')}
                title="Go to root"
              >
                <Home size={14} className="text-mac26-blue-500" />
              </button>

              <div
                ref={breadcrumbRef}
                className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden cursor-pointer"
                onDoubleClick={handleEditStart}
                title="Double-click to edit path"
              >
                {displayBreadcrumbs.slice(1).map((crumb, index) => (
                  <div
                    key={crumb.path}
                    className="flex items-center gap-1"
                  >
                    <ChevronRight
                      size={10}
                      className="text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark flex-shrink-0"
                    />
                    {crumb.isEllipsis ? (
                      <div className="relative">
                        <button
                          className="px-1.5 py-0.5 rounded-md hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-primary-light dark:text-mac26-text-primary-dark transition-colors duration-150 text-xs"
                          onClick={() => setShowCollapsedMenu(!showCollapsedMenu)}
                          title="Show hidden path segments"
                        >
                          <MoreVertical size={12} />
                        </button>

                        {showCollapsedMenu && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setShowCollapsedMenu(false)}
                            />
                            <div className="absolute top-full left-0 z-50 mt-1 ultra-dialog rounded-xl shadow-mac26-lg py-2 min-w-48 max-w-64">
                              <div className="px-3 py-1 text-xs font-medium text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark border-b border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark mb-1">
                                Hidden Path Segments
                              </div>
                              {collapsedItems.map((hiddenCrumb, hiddenIndex) => (
                                <button
                                  key={hiddenCrumb.path}
                                  className="w-full px-3 py-2 text-left hover:bg-mac26-selection-light dark:hover:bg-mac26-selection-dark flex items-center gap-2 text-sm"
                                  onClick={() => {
                                    handleBreadcrumbClick(hiddenCrumb.path);
                                    setShowCollapsedMenu(false);
                                  }}
                                >
                                  <FolderOpen size={14} />
                                  <span className="truncate">{hiddenCrumb.name}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <button
                        className="px-1.5 py-0.5 rounded-md hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-primary-light dark:text-mac26-text-primary-dark transition-colors duration-150 text-xs flex-shrink-0 max-w-20 overflow-hidden text-ellipsis whitespace-nowrap"
                        onClick={() => handleBreadcrumbClick(crumb.path)}
                        title={`${crumb.name} (${crumb.path})`}
                      >
                        {crumb.name}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Combined path actions menu */}
              <div className="relative">
                <button
                  className="p-1 rounded-lg hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark transition-colors duration-150"
                  onClick={() => setShowPathMenu(!showPathMenu)}
                  title="Path actions"
                >
                  <MoreHorizontal size={12} />
                </button>

                {showPathMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowPathMenu(false)}
                    />
                    <div className="absolute top-full right-0 z-50 mt-2 ultra-dialog rounded-xl shadow-mac26-lg py-2 min-w-40">
                      <button
                        className="w-full px-4 py-2 text-left hover:bg-mac26-selection-light dark:hover:bg-mac26-selection-dark flex items-center gap-3"
                        onClick={() => {
                          handlePathClick();
                          setShowPathMenu(false);
                        }}
                      >
                        <Type size={14} />
                        <span className="text-sm">Show full path</span>
                      </button>

                      <button
                        className="w-full px-4 py-2 text-left hover:bg-mac26-selection-light dark:hover:bg-mac26-selection-dark flex items-center gap-3"
                        onClick={() => {
                          handleEditStart();
                          setShowPathMenu(false);
                        }}
                      >
                        <Edit2 size={14} />
                        <span className="text-sm">Edit path</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                className="flex items-center gap-2 flex-1 px-2 py-1 rounded-lg bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-primary-light dark:text-mac26-text-primary-dark transition-colors duration-150 font-mono text-xs min-w-0"
                onClick={copyToClipboard}
                onDoubleClick={handleEditStart}
                title={`Click to copy, double-click to edit: ${panel.currentPath}`}
              >
                <span className="truncate overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0">
                  {panel.currentPath}
                </span>
                <div className="flex-shrink-0">
                  {copied ? (
                    <Check size={12} className="text-mac26-green-500" />
                  ) : (
                    <Copy size={12} className="text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark" />
                  )}
                </div>
              </button>

              <button
                className="p-1 rounded-lg hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark transition-colors duration-150"
                onClick={() => setShowFullPath(false)}
                title="Show breadcrumbs"
              >
                <ChevronRight size={12} />
              </button>

              {/* Combined path actions menu for full path view */}
              <div className="relative">
                <button
                  className="p-1 rounded-lg hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark transition-colors duration-150"
                  onClick={() => setShowPathMenu(!showPathMenu)}
                  title="Path actions"
                >
                  <MoreHorizontal size={12} />
                </button>

                {showPathMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowPathMenu(false)}
                    />
                    <div className="absolute top-full right-0 z-50 mt-2 ultra-dialog rounded-xl shadow-mac26-lg py-2 min-w-40">
                      <button
                        className="w-full px-4 py-2 text-left hover:bg-mac26-selection-light dark:hover:bg-mac26-selection-dark flex items-center gap-3"
                        onClick={() => {
                          handleEditStart();
                          setShowPathMenu(false);
                        }}
                      >
                        <Edit2 size={14} />
                        <span className="text-sm">Edit path</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UltraDirectoryPath;