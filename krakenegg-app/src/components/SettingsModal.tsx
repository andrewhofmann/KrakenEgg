import { useState, useEffect } from "react";
import { useStore, Preferences, AppState, PaneLayout } from "../store";
import { X, Save, Layout, Settings, Monitor, MousePointer, PenTool } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import clsx from "clsx";

type Tab = 'general' | 'appearance' | 'behavior' | 'layouts';

export const SettingsModal = () => {
  const { show } = useStore((state) => state.settingsModal);
  const hideSettingsModal = useStore((state) => state.hideSettingsModal);
  const preferences = useStore((state) => state.preferences);
  const setPreference = useStore((state) => state.setPreference);
  const requestInput = useStore((state) => state.requestInput);
  const showOperationStatus = useStore((state) => state.showOperationStatus);
  const setOperationError = useStore((state) => state.setOperationError);
  
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [layouts, setLayouts] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (show && activeTab === 'layouts') {
      invoke<string[]>('list_layouts')
        .then(setLayouts)
        .catch(() => { /* layouts unavailable — non-critical */ });
    }
  }, [show, activeTab, refreshTrigger]);

  const handleSaveLayout = () => {
    requestInput(
        "Save Layout", 
        "Enter a name for this layout:", 
        "My Layout", 
        async (name) => {
            if (!name) return;
            try {
                const currentState = useStore.getState();
                const config = {
                    left: {
                        tabs: currentState.left.tabs.map(t => ({
                            id: t.id,
                            path: t.path,
                            history: t.history,
                            history_index: t.historyIndex
                        })),
                        active_tab_index: currentState.left.activeTabIndex
                    },
                    right: {
                        tabs: currentState.right.tabs.map(t => ({
                            id: t.id,
                            path: t.path,
                            history: t.history,
                            history_index: t.historyIndex
                        })),
                        active_tab_index: currentState.right.activeTabIndex
                    },
                    active_side: currentState.activeSide,
                    hotkeys: currentState.hotkeys,
                    preferences: currentState.preferences
                };

                await invoke('save_named_layout', { name, state: config });
                showOperationStatus(`Layout '${name}' saved.`);
                setRefreshTrigger(prev => prev + 1);
            } catch (err) {
                setOperationError(`Failed to save layout: ${err}`);
            }
        }
    );
  };

  const handleLoadLayout = async (name: string) => {
      try {
          interface SavedPanelConfig { tabs: { id: string; path: string; history: string[]; history_index: number }[]; active_tab_index: number; }
          interface SavedLayoutState { left: SavedPanelConfig; right: SavedPanelConfig; active_side: string; }
          const loadedState = await invoke<SavedLayoutState | null>('load_named_layout', { name });
          if (loadedState && loadedState.left && loadedState.right) {
              const createTab = (path: string) => ({
                  id: Math.random().toString(36).substring(7),
                  path,
                  files: [],
                  selection: [],
                  cursorIndex: 0,
                  loading: false,
                  error: null,
                  refreshVersion: 0,
                  filterQuery: '',
                  filterFocusSignal: 0,
                  showFilterWidget: false,
                  history: [path],
                  historyIndex: 0,
              });

              const DEFAULT_LAYOUT: PaneLayout = {
                  sortColumn: 'name',
                  sortDirection: 'asc',
                  columns: ['name', 'ext', 'size', 'date'],
                  columnWidths: { name: 0, ext: 45, size: 80, date: 140 },
              };

              useStore.setState({
                    left: {
                        tabs: loadedState.left.tabs.map((t: any) => ({
                            ...createTab(t.path),
                            id: t.id,
                            path: t.path,
                            history: t.history,
                            historyIndex: t.history_index ?? 0
                        })),
                        activeTabIndex: loadedState.left.active_tab_index,
                        layout: DEFAULT_LAYOUT
                    },
                    right: {
                        tabs: loadedState.right.tabs.map((t: any) => ({
                            ...createTab(t.path),
                            id: t.id,
                            path: t.path,
                            history: t.history,
                            historyIndex: t.history_index ?? 0
                        })),
                        activeTabIndex: loadedState.right.active_tab_index,
                        layout: DEFAULT_LAYOUT
                    },
                    activeSide: loadedState.active_side,
                    hotkeys: loadedState.hotkeys || useStore.getState().hotkeys, 
                    preferences: loadedState.preferences || preferences
              });
              showOperationStatus(`Layout '${name}' loaded.`);
              hideSettingsModal();
          }
      } catch (err) {
          setOperationError(`Failed to load layout: ${err}`);
      }
  };

  if (!show) return null;

  const NavItem = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: React.ElementType }) => (
      <button 
          onClick={() => setActiveTab(id)}
          className={clsx(
              "w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors mb-1",
              activeTab === id ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:bg-white/5 hover:text-white"
          )}
      >
          <Icon size={16} className="mr-3" />
          {label}
      </button>
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 font-sans">
      <div className="relative flex w-full max-w-3xl h-[600px] rounded-xl shadow-2xl bg-[#1e1e1e] border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <div className="w-56 bg-[#252525] border-r border-white/5 p-4 flex flex-col">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Settings</h3>
            <div className="flex-1">
                <NavItem id="general" label="General" icon={Settings} />
                <NavItem id="appearance" label="Appearance" icon={Monitor} />
                <NavItem id="behavior" label="Behavior" icon={MousePointer} />
                <NavItem id="layouts" label="Layouts" icon={Layout} />
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#252525]">
                <h2 className="text-lg font-semibold text-white capitalize">{activeTab}</h2>
                <button onClick={hideSettingsModal} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6">
                
                {activeTab === 'general' && (
                    <div className="space-y-6 max-w-lg">
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-blue-400 border-b border-white/10 pb-2">File Operations</h4>
                            
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={preferences.general.showHiddenFiles} 
                                    onChange={(e) => setPreference('general', 'showHiddenFiles', e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-600 bg-black/40 text-blue-500 focus:ring-offset-0 focus:ring-1 focus:ring-blue-500"
                                />
                                <div>
                                    <div className="text-sm text-white group-hover:text-blue-100">Show Hidden Files</div>
                                    <div className="text-xs text-gray-500">Display files starting with a dot (.)</div>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={preferences.general.confirmDelete} 
                                    onChange={(e) => setPreference('general', 'confirmDelete', e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-600 bg-black/40 text-blue-500 focus:ring-offset-0 focus:ring-1 focus:ring-blue-500"
                                />
                                <div>
                                    <div className="text-sm text-white group-hover:text-blue-100">Confirm Deletions</div>
                                    <div className="text-xs text-gray-500">Show a confirmation dialog before deleting files</div>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={preferences.general.saveHistoryOnExit} 
                                    onChange={(e) => setPreference('general', 'saveHistoryOnExit', e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-600 bg-black/40 text-blue-500 focus:ring-offset-0 focus:ring-1 focus:ring-blue-500"
                                />
                                <div>
                                    <div className="text-sm text-white group-hover:text-blue-100">Save History on Exit</div>
                                    <div className="text-xs text-gray-500">Remember visited directories and tabs</div>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {activeTab === 'appearance' && (
                    <div className="space-y-6 max-w-lg">
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-blue-400 border-b border-white/10 pb-2">List View</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Font Size (px)</label>
                                    <input 
                                        type="number" 
                                        value={preferences.appearance.fontSize}
                                        onChange={(e) => setPreference('appearance', 'fontSize', parseInt(e.target.value) || 13)}
                                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Row Height (px)</label>
                                    <input 
                                        type="number" 
                                        value={preferences.appearance.rowHeight}
                                        onChange={(e) => setPreference('appearance', 'rowHeight', parseInt(e.target.value) || 22)}
                                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center space-x-3 cursor-pointer group pt-2">
                                <input 
                                    type="checkbox" 
                                    checked={preferences.appearance.showGridLines} 
                                    onChange={(e) => setPreference('appearance', 'showGridLines', e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-600 bg-black/40 text-blue-500 focus:ring-offset-0 focus:ring-1 focus:ring-blue-500"
                                />
                                <div className="text-sm text-white group-hover:text-blue-100">Show Grid Lines</div>
                            </label>
                        </div>
                    </div>
                )}

                {activeTab === 'behavior' && (
                    <div className="space-y-6 max-w-lg">
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-blue-400 border-b border-white/10 pb-2">Interaction</h4>
                            
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Selection Mode</label>
                                <select 
                                    value={preferences.behavior.mouseSelection}
                                    onChange={(e) => setPreference('behavior', 'mouseSelection', e.target.value as any)}
                                    className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none appearance-none"
                                >
                                    <option value="standard">Standard (Left click selects)</option>
                                    <option value="commander">Commander (Right click selects) [WIP]</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Commander mode mimics Total Commander's classic behavior.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'layouts' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-base font-medium text-white">Saved Layouts</h4>
                                <p className="text-sm text-gray-400">Save and restore your panel configuration.</p>
                            </div>
                            <button 
                                onClick={handleSaveLayout}
                                className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors"
                            >
                                <Save size={14} className="mr-2" />
                                Save Current
                            </button>
                        </div>

                        <div className="space-y-2">
                            {layouts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm italic border border-dashed border-white/10 rounded-lg">
                                    No saved layouts found.
                                </div>
                            ) : (
                                layouts.map(name => (
                                    <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 transition-colors group">
                                        <div className="flex items-center">
                                            <Layout size={16} className="text-gray-400 mr-3 group-hover:text-blue-400 transition-colors" />
                                            <span className="text-sm font-medium text-white">{name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button 
                                                onClick={() => handleLoadLayout(name)}
                                                className="px-3 py-1 text-xs bg-white/5 hover:bg-blue-600 text-white rounded transition-colors"
                                            >
                                                Load
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
