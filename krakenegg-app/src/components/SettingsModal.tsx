import { useState, useEffect } from "react";
import { useStore, PaneLayout, HotkeyAction } from "../store";
import { DEFAULT_HOTKEYS, createTab } from "../store/constants";
import { X, Save, Layout, Settings, Monitor, MousePointer, Keyboard, RotateCcw } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import clsx from "clsx";

type Tab = 'general' | 'appearance' | 'behavior' | 'shortcuts' | 'layouts';

const HOTKEY_LABELS: Record<HotkeyAction, string> = {
  toggle_side: 'Switch Panel',
  go_up_dir: 'Go Up (Parent)',
  go_back: 'History Back',
  go_forward: 'History Forward',
  open_search: 'Search Files',
  swap_panes: 'Swap Panes',
  new_file: 'New File',
  new_folder: 'New Folder',
  copy: 'Copy to Clipboard',
  cut: 'Cut to Clipboard',
  paste: 'Paste from Clipboard',
  delete: 'Delete',
  rename: 'Rename',
  view_file: 'View File (F3)',
  edit_file: 'Edit File (F4)',
  copy_to_opposite: 'Copy to Other Pane',
  move_to_opposite: 'Move to Other Pane',
  compress_selection: 'Compress',
  extract_selection: 'Extract Archive',
  select_all: 'Select All',
  invert_selection: 'Invert Selection',
  select_by_pattern: 'Select by Pattern',
  deselect_all: 'Deselect All',
  goto_path_modal: 'Go to Path',
  open_settings: 'Settings',
  refresh_panel: 'Refresh',
  toggle_quick_view: 'Quick View',
  multi_rename: 'Multi-Rename',
};

const HOTKEY_CATEGORIES: { label: string; keys: HotkeyAction[] }[] = [
  { label: 'Navigation', keys: ['toggle_side', 'go_up_dir', 'go_back', 'go_forward', 'goto_path_modal', 'swap_panes', 'refresh_panel'] },
  { label: 'File Operations', keys: ['copy_to_opposite', 'move_to_opposite', 'delete', 'rename', 'new_file', 'new_folder', 'compress_selection', 'extract_selection', 'multi_rename'] },
  { label: 'Clipboard', keys: ['copy', 'cut', 'paste'] },
  { label: 'Selection', keys: ['select_all', 'deselect_all', 'invert_selection', 'select_by_pattern'] },
  { label: 'View', keys: ['view_file', 'edit_file', 'open_search', 'toggle_quick_view', 'open_settings'] },
];

// Shared components
const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-sm font-medium pb-2 mb-4" style={{ color: 'var(--ke-accent)', borderBottom: '1px solid var(--ke-border-subtle)' }}>{children}</h4>
);

const Toggle = ({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) => (
  <label className="flex items-center space-x-3 cursor-pointer group py-1">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded accent-[var(--ke-accent)]"
      style={{ backgroundColor: 'var(--ke-bg-input)' }}
    />
    <div>
      <div className="text-sm" style={{ color: 'var(--ke-text)' }}>{label}</div>
      {description && <div className="text-xs" style={{ color: 'var(--ke-text-tertiary)' }}>{description}</div>}
    </div>
  </label>
);

const NumberInput = ({ label, value, onChange, min, max, hint }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; hint?: string }) => (
  <div>
    <label className="block text-xs mb-1" style={{ color: 'var(--ke-text-secondary)' }}>{label}</label>
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        let v = parseInt(e.target.value);
        if (isNaN(v)) return;
        if (min !== undefined) v = Math.max(min, v);
        if (max !== undefined) v = Math.min(max, v);
        onChange(v);
      }}
      className="w-full rounded px-3 py-2 text-sm outline-none"
      style={{ backgroundColor: 'var(--ke-bg-input)', border: '1px solid var(--ke-border)', color: 'var(--ke-text)' }}
    />
    {hint && <div className="text-[10px] mt-1" style={{ color: 'var(--ke-text-disabled)' }}>{hint}</div>}
  </div>
);

export const SettingsModal = () => {
  const { show } = useStore((state) => state.settingsModal);
  const hideSettingsModal = useStore((state) => state.hideSettingsModal);
  const preferences = useStore((state) => state.preferences);
  const setPreference = useStore((state) => state.setPreference);
  const hotkeys = useStore((state) => state.hotkeys);
  const setHotkey = useStore((state) => state.setHotkey);
  const resetHotkeys = useStore((state) => state.resetHotkeys);
  const hotlist = useStore((state) => state.hotlist);
  const removeFromHotlist = useStore((state) => state.removeFromHotlist);
  const requestInput = useStore((state) => state.requestInput);
  const showOperationStatus = useStore((state) => state.showOperationStatus);
  const setOperationError = useStore((state) => state.setOperationError);

  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [layouts, setLayouts] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingHotkey, setEditingHotkey] = useState<HotkeyAction | null>(null);

  useEffect(() => {
    if (show && activeTab === 'layouts') {
      invoke<string[]>('list_layouts')
        .then(setLayouts)
        .catch(() => {});
    }
  }, [show, activeTab, refreshTrigger]);

  // Hotkey capture handler
  useEffect(() => {
    if (!editingHotkey) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') { setEditingHotkey(null); return; }
      // Build hotkey string
      const parts: string[] = [];
      if (e.metaKey || e.ctrlKey) parts.push('CmdOrCtrl');
      if (e.shiftKey) parts.push('Shift');
      if (e.altKey) parts.push('Alt');
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        parts.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      } else {
        return; // Wait for non-modifier key
      }
      const newBinding = parts.join('+');
      // Check for conflicts — use fresh hotkeys state to avoid stale closure
      const currentHotkeys = useStore.getState().hotkeys;
      const conflict = Object.entries(currentHotkeys).find(
        ([action, binding]) => action !== editingHotkey && binding === newBinding
      );
      if (conflict) {
        const conflictLabel = HOTKEY_LABELS[conflict[0] as HotkeyAction] || conflict[0];
        // Clear the conflicting binding (last one wins) and notify user
        setHotkey(conflict[0] as HotkeyAction, '');
        useStore.getState().showOperationStatus(`Shortcut conflict: removed binding from "${conflictLabel}"`);
      }
      setHotkey(editingHotkey, newBinding);
      setEditingHotkey(null);
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [editingHotkey, setHotkey]);

  const handleSaveLayout = () => {
    requestInput("Save Layout", "Enter a name for this layout:", "My Layout", async (name) => {
      if (!name) return;
      try {
        const s = useStore.getState();
        const config = {
          left: { tabs: s.left.tabs.map(t => ({ id: t.id, path: t.path, history: t.history, history_index: t.historyIndex })), active_tab_index: s.left.activeTabIndex, layout: s.left.layout },
          right: { tabs: s.right.tabs.map(t => ({ id: t.id, path: t.path, history: t.history, history_index: t.historyIndex })), active_tab_index: s.right.activeTabIndex, layout: s.right.layout },
          active_side: s.activeSide, hotkeys: s.hotkeys, preferences: s.preferences
        };
        await invoke('save_named_layout', { name, state: config });
        showOperationStatus(`Layout '${name}' saved.`);
        setRefreshTrigger(p => p + 1);
      } catch (err) { setOperationError(`Failed to save layout: ${err}`); }
    });
  };

  const handleLoadLayout = async (name: string) => {
    try {
      interface SavedTab { id: string; path: string; history: string[]; history_index: number; }
      interface SavedPanel { tabs: SavedTab[]; active_tab_index: number; }
      interface SavedLayout { left: SavedPanel; right: SavedPanel; active_side: string; hotkeys?: any; preferences?: any; }
      const loaded = await invoke<SavedLayout | null>('load_named_layout', { name });
      if (loaded && loaded.left?.tabs?.length && loaded.left.tabs.length > 0 && loaded.right?.tabs?.length && loaded.right.tabs.length > 0) {
        const defLayout: PaneLayout = { sortColumn: 'name', sortDirection: 'asc', columns: ['name', 'ext', 'size', 'date'], columnWidths: { name: 0, ext: 45, size: 80, date: 140 } };
        const lt = loaded.left.tabs;
        const rt = loaded.right.tabs;
        useStore.setState({
          left: { tabs: lt.map(t => ({ ...createTab(t.path), id: t.id, history: t.history || [t.path], historyIndex: t.history_index ?? 0 })), activeTabIndex: Math.min(loaded.left.active_tab_index, lt.length - 1), layout: (loaded as any).left?.layout || defLayout },
          right: { tabs: rt.map(t => ({ ...createTab(t.path), id: t.id, history: t.history || [t.path], historyIndex: t.history_index ?? 0 })), activeTabIndex: Math.min(loaded.right.active_tab_index, rt.length - 1), layout: (loaded as any).right?.layout || defLayout },
          activeSide: loaded.active_side as 'left' | 'right',
        });
        showOperationStatus(`Layout '${name}' loaded.`);
        hideSettingsModal();
      }
    } catch (err) { setOperationError(`Failed to load layout: ${err}`); }
  };

  if (!show) return null;

  const NavItem = ({ id, label, icon: Icon }: { id: Tab; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={clsx("w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors mb-1")}
      style={activeTab === id
        ? { backgroundColor: 'var(--ke-accent)', color: '#fff' }
        : { color: 'var(--ke-text-secondary)' }
      }
      onMouseEnter={(e) => { if (activeTab !== id) (e.currentTarget.style.backgroundColor = 'var(--ke-bg-hover)'); }}
      onMouseLeave={(e) => { if (activeTab !== id) (e.currentTarget.style.backgroundColor = 'transparent'); }}
    >
      <Icon size={16} className="mr-3" />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 font-sans" role="dialog" aria-label="Settings">
      <div className="relative flex w-full max-w-3xl max-h-[80vh] h-[500px] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
           style={{ backgroundColor: 'var(--ke-bg-elevated)', border: '1px solid var(--ke-border)', boxShadow: 'var(--ke-shadow)' }}>

        {/* Sidebar */}
        <div className="w-56 p-4 flex flex-col" style={{ backgroundColor: 'var(--ke-bg-secondary)', borderRight: '1px solid var(--ke-border-subtle)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4 px-2" style={{ color: 'var(--ke-text-tertiary)' }}>Settings</h3>
          <div className="flex-1">
            <NavItem id="general" label="General" icon={Settings} />
            <NavItem id="appearance" label="Appearance" icon={Monitor} />
            <NavItem id="behavior" label="Behavior" icon={MousePointer} />
            <NavItem id="shortcuts" label="Shortcuts" icon={Keyboard} />
            <NavItem id="layouts" label="Layouts" icon={Layout} />
          </div>
          <div className="text-[10px] px-2 space-y-0.5" style={{ color: 'var(--ke-text-disabled)' }}>
            <div>KrakenEgg v0.2.0</div>
            <div>by Andrew Hofmann</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-14 flex items-center justify-between px-6" style={{ borderBottom: '1px solid var(--ke-border-subtle)', backgroundColor: 'var(--ke-bg-secondary)' }}>
            <h2 className="text-lg font-semibold capitalize" style={{ color: 'var(--ke-text)' }}>{activeTab}</h2>
            <button onClick={hideSettingsModal} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--ke-text-secondary)' }} aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">

            {/* ═══ GENERAL ═══ */}
            {activeTab === 'general' && (
              <div className="space-y-8 max-w-lg">
                <div>
                  <SectionHeader>File Operations</SectionHeader>
                  <div className="space-y-3">
                    <Toggle checked={preferences.general.showHiddenFiles} onChange={(v) => setPreference('general', 'showHiddenFiles', v)}
                      label="Show Hidden Files" description="Display files and folders starting with a dot (.)" />
                    <Toggle checked={preferences.general.confirmDelete} onChange={(v) => setPreference('general', 'confirmDelete', v)}
                      label="Confirm Deletions" description="Show a confirmation dialog before deleting files" />
                    <Toggle checked={preferences.general.saveHistoryOnExit} onChange={(v) => setPreference('general', 'saveHistoryOnExit', v)}
                      label="Save History on Exit" description="Remember visited directories, tabs, and session state" />
                  </div>
                </div>

                <div>
                  <SectionHeader>Favorites</SectionHeader>
                  {hotlist.length === 0 ? (
                    <div className="text-sm py-4 text-center rounded-lg" style={{ color: 'var(--ke-text-tertiary)', border: '1px dashed var(--ke-border)' }}>
                      No favorites saved. Right-click a folder to add it.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {hotlist.map(path => (
                        <div key={path} className="flex items-center justify-between px-3 py-2 rounded-md group" style={{ backgroundColor: 'var(--ke-bg-input)' }}>
                          <span className="text-sm truncate mr-2" style={{ color: 'var(--ke-text)' }}>{path}</span>
                          <button onClick={() => removeFromHotlist(path)} className="text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: 'var(--ke-error)', backgroundColor: 'var(--ke-error-bg)' }}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ APPEARANCE ═══ */}
            {activeTab === 'appearance' && (
              <div className="space-y-8 max-w-lg">
                <div>
                  <SectionHeader>Theme</SectionHeader>
                  <div className="flex gap-2">
                    {(['dark', 'light', 'system'] as const).map(t => (
                      <button key={t} onClick={() => setPreference('appearance', 'theme', t)}
                        className="px-5 py-2.5 rounded-md text-sm capitalize transition-colors font-medium"
                        style={preferences.appearance.theme === t
                          ? { backgroundColor: 'var(--ke-accent)', color: '#fff' }
                          : { backgroundColor: 'var(--ke-bg-hover)', color: 'var(--ke-text-secondary)' }
                        }>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <SectionHeader>List View</SectionHeader>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <NumberInput label="Font Size (px)" value={preferences.appearance.fontSize} onChange={(v) => setPreference('appearance', 'fontSize', v)} min={9} max={24} hint="9–24px, default 13" />
                    <NumberInput label="Row Height (px)" value={preferences.appearance.rowHeight} onChange={(v) => setPreference('appearance', 'rowHeight', v)} min={16} max={48} hint="16–48px, default 22" />
                  </div>
                  <div className="space-y-2">
                    <Toggle checked={preferences.appearance.showGridLines} onChange={(v) => setPreference('appearance', 'showGridLines', v)}
                      label="Show Grid Lines" description="Display subtle dividers between file rows" />
                    <Toggle checked={preferences.appearance.compactMode} onChange={(v) => { setPreference('appearance', 'compactMode', v); setPreference('appearance', 'rowHeight', v ? 18 : 22); setPreference('appearance', 'fontSize', v ? 11 : 13); }}
                      label="Compact Mode" description="Reduce padding for denser file list display" />
                  </div>
                </div>

                <div>
                  <SectionHeader>Zoom</SectionHeader>
                  <div className="text-xs space-y-1" style={{ color: 'var(--ke-text-tertiary)' }}>
                    <div><kbd className="font-semibold" style={{ color: 'var(--ke-text-secondary)' }}>⌘+</kbd> Zoom in</div>
                    <div><kbd className="font-semibold" style={{ color: 'var(--ke-text-secondary)' }}>⌘−</kbd> Zoom out</div>
                    <div><kbd className="font-semibold" style={{ color: 'var(--ke-text-secondary)' }}>⌘0</kbd> Reset to default</div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ BEHAVIOR ═══ */}
            {activeTab === 'behavior' && (
              <div className="space-y-8 max-w-lg">
                <div>
                  <SectionHeader>Mouse Interaction</SectionHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--ke-text-secondary)' }}>Selection Mode</label>
                      <select
                        value={preferences.behavior.mouseSelection}
                        onChange={(e) => setPreference('behavior', 'mouseSelection', e.target.value as 'standard' | 'commander')}
                        className="w-full rounded px-3 py-2 text-sm outline-none appearance-none"
                        style={{ backgroundColor: 'var(--ke-bg-input)', border: '1px solid var(--ke-border)', color: 'var(--ke-text)' }}
                      >
                        <option value="standard">Standard — click to select, double-click to open</option>
                        <option value="commander">Commander — right-click selects (TC-style)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <SectionHeader>Sorting</SectionHeader>
                  <div className="space-y-2">
                    <Toggle checked={true} onChange={() => {}} label="Folders First" description="Always show folders above files in the list" />
                  </div>
                </div>
              </div>
            )}

            {/* ═══ KEYBOARD SHORTCUTS ═══ */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs" style={{ color: 'var(--ke-text-tertiary)' }}>Click a shortcut to rebind it. Press Escape to cancel.</p>
                  <button onClick={resetHotkeys} className="flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                    style={{ backgroundColor: 'var(--ke-bg-hover)', color: 'var(--ke-text-secondary)' }}>
                    <RotateCcw size={12} className="mr-1.5" /> Reset All
                  </button>
                </div>

                {HOTKEY_CATEGORIES.map(cat => (
                  <div key={cat.label}>
                    <SectionHeader>{cat.label}</SectionHeader>
                    <div className="space-y-1">
                      {cat.keys.map(action => {
                        const isEditing = editingHotkey === action;
                        const binding = hotkeys[action] || '';
                        const isDefault = binding === (DEFAULT_HOTKEYS as Record<string, string>)[action];
                        return (
                          <div key={action} className="flex items-center justify-between px-3 py-2 rounded-md transition-colors"
                            style={{ backgroundColor: isEditing ? 'var(--ke-selection-light)' : 'transparent' }}>
                            <span className="text-sm" style={{ color: 'var(--ke-text)' }}>
                              {HOTKEY_LABELS[action] || action}
                            </span>
                            <button
                              onClick={() => setEditingHotkey(isEditing ? null : action)}
                              className="px-3 py-1 rounded text-xs font-mono min-w-[120px] text-center transition-colors"
                              style={isEditing
                                ? { backgroundColor: 'var(--ke-accent)', color: '#fff' }
                                : { backgroundColor: 'var(--ke-bg-input)', border: '1px solid var(--ke-border-subtle)', color: isDefault ? 'var(--ke-text-secondary)' : 'var(--ke-warning)' }
                              }
                            >
                              {isEditing ? 'Press keys...' : binding.replace('CmdOrCtrl', '⌘').replace('Shift', '⇧').replace('Alt', '⌥').replace('Backspace', '⌫').replace('ArrowLeft', '←').replace('ArrowRight', '→').replace('ArrowUp', '↑').replace('ArrowDown', '↓')}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ LAYOUTS ═══ */}
            {activeTab === 'layouts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-medium" style={{ color: 'var(--ke-text)' }}>Saved Layouts</h4>
                    <p className="text-sm" style={{ color: 'var(--ke-text-secondary)' }}>Save and restore your panel configuration.</p>
                  </div>
                  <button onClick={handleSaveLayout} className="flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                    style={{ backgroundColor: 'var(--ke-accent)', color: '#fff' }}>
                    <Save size={14} className="mr-2" /> Save Current
                  </button>
                </div>

                <div className="space-y-2">
                  {layouts.length === 0 ? (
                    <div className="text-center py-8 text-sm italic rounded-lg" style={{ color: 'var(--ke-text-tertiary)', border: '1px dashed var(--ke-border)' }}>
                      No saved layouts found.
                    </div>
                  ) : layouts.map(name => (
                    <div key={name} className="flex items-center justify-between p-3 rounded-lg transition-colors group"
                      style={{ backgroundColor: 'var(--ke-bg-input)', border: '1px solid var(--ke-border-subtle)' }}>
                      <div className="flex items-center">
                        <Layout size={16} className="mr-3" style={{ color: 'var(--ke-text-secondary)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--ke-text)' }}>{name}</span>
                      </div>
                      <button onClick={() => handleLoadLayout(name)} className="px-3 py-1 text-xs rounded transition-colors"
                        style={{ backgroundColor: 'var(--ke-bg-hover)', color: 'var(--ke-text)' }}>
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
