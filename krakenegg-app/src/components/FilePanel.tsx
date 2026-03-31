import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { formatSize } from "../utils/format";
import { FileRow } from "./FileRow";
import { FileInfo } from "../store";
import { invoke } from "@tauri-apps/api/core";
import { useStore, SortColumn, getProcessedFiles } from "../store";
import { List as FixedSizeList } from "react-window";
import { AutoSizer } from "./AutoSizer";
import { TabBar } from "./TabBar";
import { SearchFilter } from "./SearchFilter";
import { QuickInfoPanel } from "./QuickInfoPanel";
import { formatDate, getExtension } from "../utils/format";
import clsx from "clsx";
import { ChevronRight, ChevronDown, ArrowUp, ArrowDown, HardDrive, Package, Clock, Star, Compass } from "lucide-react";
import { QuickNav } from "./QuickNav";

// Global drag state — HTML5 DnD is completely broken in Tauri's WKWebView.
// Using mouse-based drag instead.
let _dragState: {
  sources: string[];
  sourceSide: string;
  fileName: string;
  active: boolean;
  ghostEl: HTMLDivElement | null;
} | null = null;

interface FilePanelProps {
  side: 'left' | 'right';
  usePanelDataHook: (side: 'left' | 'right') => void;
}


export const FilePanel = ({ side, usePanelDataHook }: FilePanelProps) => {
  usePanelDataHook(side);

  const activeTabIndex = useStore((s) => s[side].activeTabIndex);
  const activeTab = useStore((s) => s[side].tabs[activeTabIndex]);
  const layout = useStore((s) => s[side].layout);
  const preferences = useStore((s) => s.preferences);
  const activeSide = useStore((s) => s.activeSide);
  const isActive = activeSide === side;
  const quickView = useStore((s) => s.quickView);
  const globalHistory = useStore((s) => s.globalHistory);
  const hotlist = useStore((s) => s.hotlist);
  const clipboard = useStore((s) => s.clipboard);

  const { setActiveSide, setPath, setSort, setColumnOrder, setColumnWidth,
    setCursor, setSelection, setFilterQuery,
    showContextMenu, hideContextMenu, refreshPanel, addTab,
    copySelectedFiles, cutSelectedFiles, pasteFiles,
    copyToOppositePanel, moveToOppositePanel,
    addToHotlist, removeFromHotlist,
    requestInput,
  } = useStore((s) => s);

  const compressSelection = useStore((s) => s.archive.compressSelection);
  const extractSelection = useStore((s) => s.archive.extractSelection);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<any>(null);
  const pathInputRef = useRef<HTMLInputElement>(null);

  const [isPathEditing, setIsPathEditing] = useState(false);
  const [pathInputValue, setPathInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showQuickNav, setShowQuickNav] = useState(false);
  const quickNavBtnRef = useRef<HTMLButtonElement>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const [panelDragOver, setPanelDragOver] = useState(false);
  const [draggedCol, setDraggedCol] = useState<SortColumn | null>(null);
  const [dragOverCol, setDragOverCol] = useState<SortColumn | null>(null);

  const isArchive = activeTab?.path ? /\.(zip|tar\.gz|tgz|tar)(\/|$)/i.test(activeTab.path) : false;

  const resizingRef = useRef<{
      leftCol: SortColumn; 
      rightCol: SortColumn; 
      startX: number; 
      leftStartWidth: number; 
      rightStartWidth: number; 
      allWidths: Record<SortColumn, number>; 
  } | null>(null);

  const processedFiles = useMemo(() => {
    if (!activeTab || !layout) return [];
    return getProcessedFiles(activeTab.files, layout, activeTab.filterQuery, preferences.general.showHiddenFiles);
  }, [activeTab?.files, layout, activeTab?.filterQuery, preferences.general.showHiddenFiles]);

  const searchBuffer = useRef("");  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [typeAheadDisplay, setTypeAheadDisplay] = useState("");

  // Sync CSS variables from Store State on Mount/Update
  useEffect(() => {
      if (layout && containerRef.current) {
          containerRef.current.style.setProperty('--col-name', layout.columnWidths.name === 0 ? 'minmax(0, 1fr)' : `${layout.columnWidths.name}px`);
          containerRef.current.style.setProperty('--col-ext', `${layout.columnWidths.ext}px`);
          containerRef.current.style.setProperty('--col-size', `${layout.columnWidths.size}px`);
          containerRef.current.style.setProperty('--col-date', `${layout.columnWidths.date}px`);
      }
  }, [layout?.columnWidths, activeTab?.id]); 

  // Focus input when editing starts
  useEffect(() => {
      if (isPathEditing && pathInputRef.current) {
          pathInputRef.current.focus();
          pathInputRef.current.select();
      }
  }, [isPathEditing]);

  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
        // Alt+Down to toggle history
        if (e.altKey && e.key === 'ArrowDown') {
            e.preventDefault();
            setShowHistory(prev => !prev);
            return;
        }

        if (isPathEditing || showHistory) return; // Don't handle list nav if editing/history open

        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab', 'Escape', 'Backspace', 'Delete', ' '].includes(e.key)) return;
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        
        if (e.key.length !== 1) return;

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        const char = e.key.toLowerCase();
        const nextBuffer = searchBuffer.current + char;
        
        let matchIndex = processedFiles.findIndex(f => f.name.toLowerCase().startsWith(nextBuffer));

        if (matchIndex === -1 && searchBuffer.current !== "") {
             const singleCharMatch = processedFiles.findIndex(f => f.name.toLowerCase().startsWith(char));
             if (singleCharMatch !== -1) {
                 searchBuffer.current = char;
                 matchIndex = singleCharMatch;
             } else {
                 searchBuffer.current = nextBuffer;
             }
        } else {
            searchBuffer.current = nextBuffer;
        }
        
        if (matchIndex !== -1) {
            setCursor(side, matchIndex);
            setSelection(side, [matchIndex]);
            if (listRef.current && typeof listRef.current.scrollToRow === 'function' && matchIndex >= 0 && matchIndex < processedFiles.length) {
                try { listRef.current.scrollToRow({ index: matchIndex, align: 'center' }); } catch { /* ignore */ }
            }
        }

        setTypeAheadDisplay(searchBuffer.current);
        searchTimeout.current = setTimeout(() => {
            searchBuffer.current = "";
            setTypeAheadDisplay("");
        }, 400); 
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (searchTimeout.current) { clearTimeout(searchTimeout.current); searchTimeout.current = null; }
        // Clear type-ahead display when effect cleans up (e.g. path change, panel switch)
        searchBuffer.current = "";
        setTypeAheadDisplay("");
    };
  }, [isActive, processedFiles, side, setCursor, setSelection, isPathEditing, showHistory]);


  useEffect(() => {
    if (isActive && activeTab && listRef.current) {
      const idx = activeTab.cursorIndex;
      if (idx >= 0 && idx < processedFiles.length) {
        try {
          if (typeof listRef.current.scrollToRow === 'function') {
            listRef.current.scrollToRow({ index: idx, align: 'smart' });
          }
        } catch { /* ignore out-of-range during transitions */ }
      }
    }
  }, [activeTab?.cursorIndex, isActive, processedFiles.length]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (resizingRef.current && containerRef.current && layout) {
            const { leftCol, rightCol, startX, allWidths } = resizingRef.current;
            const delta = e.clientX - startX;
            const MIN_WIDTH = 30;

            if (leftCol === 'name') {
                const rightIndex = layout.columns.indexOf(rightCol);
                let remainingReduction = delta;
                if (remainingReduction > 0) {
                    for (let i = rightIndex; i < layout.columns.length; i++) {
                        const col = layout.columns[i];
                        const startW = allWidths[col];
                        const available = startW - MIN_WIDTH;
                        const take = Math.min(remainingReduction, available);
                        const newW = startW - take;
                        containerRef.current.style.setProperty(`--col-${col}`, `${newW}px`);
                        remainingReduction -= take;
                        if (remainingReduction <= 0) break;
                    }
                } else {
                    const startW = allWidths[rightCol];
                    const newW = Math.max(MIN_WIDTH, startW - delta);
                    containerRef.current.style.setProperty(`--col-${rightCol}`, `${newW}px`);
                }
            } else {
                const startL = allWidths[leftCol];
                const startR = allWidths[rightCol];
                let d = delta;
                if (startL + d < MIN_WIDTH) d = MIN_WIDTH - startL;
                if (startR - d < MIN_WIDTH) d = startR - MIN_WIDTH;
                containerRef.current.style.setProperty(`--col-${leftCol}`, `${startL + d}px`);
                containerRef.current.style.setProperty(`--col-${rightCol}`, `${startR - d}px`);
            }
        }
    };
    const handleMouseUp = () => {
        if (resizingRef.current) {
            if (containerRef.current && layout) {
                layout.columns.forEach(col => {
                    if (col !== 'name') {
                        const w = parseInt(containerRef.current!.style.getPropertyValue(`--col-${col}`)) || 50;
                        setColumnWidth(side, col, w);
                    }
                });
            }
            resizingRef.current = null;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto'; 
        }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [side, setColumnWidth, layout]);

  const startResize = (e: React.MouseEvent, leftCol: SortColumn, rightCol: SortColumn) => {
      e.preventDefault();
      e.stopPropagation();
      if (!layout) return;
      
      resizingRef.current = { 
          leftCol, 
          rightCol, 
          startX: e.clientX, 
          leftStartWidth: layout.columnWidths[leftCol],
          rightStartWidth: layout.columnWidths[rightCol],
          allWidths: { ...layout.columnWidths }
      };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; 
  };

  const handleHandleDoubleClick = (e: React.MouseEvent, col: SortColumn) => {
        e.stopPropagation();
        if (!activeTab || !containerRef.current) return;
        
        const MIN_WIDTHS = { name: 100, ext: 40, size: 70, date: 120 };
        const MAX_WIDTH = 400;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const fontSize = useStore.getState().preferences.appearance.fontSize || 13;
        if (context) context.font = `${fontSize}px system-ui`;
        
        let maxContentWidth = MIN_WIDTHS[col];
        
        processedFiles.forEach(file => {
            let text = '';
            if (col === 'ext') text = file.is_dir ? "" : getExtension(file.name);
            else if (col === 'size') text = file.is_dir ? "--" : formatSize(file.size);
            else if (col === 'date') text = formatDate(file.modified_at);
            
            const w = context?.measureText(text).width || 0;
            if (w > maxContentWidth) maxContentWidth = w;
        });
        
        const finalWidth = Math.min(MAX_WIDTH, maxContentWidth + 20); 
        
        containerRef.current.style.setProperty(`--col-${col}`, `${finalWidth}px`);
        setColumnWidth(side, col, finalWidth);
  };


  const getSelectedPaths = (files: FileInfo[]) => {
    if (!activeTab) return [];
    const buildPath = (name: string) => activeTab.path === "/" ? `/${name}` : `${activeTab.path}/${name}`;
    if (activeTab.selection.length > 0) {
      return activeTab.selection
        .map(i => files[i])
        .filter(f => f && f.name !== "..")
        .map(f => buildPath(f.name));
    } else {
      const file = files[activeTab.cursorIndex];
      if (file && file.name !== "..") {
        return [buildPath(file.name)];
      }
    }
    return [];
  };

  // Path Editing Handlers
  const handlePathClick = () => {
      setPathInputValue(activeTab.path);
      setIsPathEditing(true);
  };

  const handlePathKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          if (pathInputValue && pathInputValue !== activeTab.path) {
              setPath(side, pathInputValue.trim().replace(/^"|"$/g, ''));
          }
          setIsPathEditing(false);
      } else if (e.key === 'Escape') {
          setIsPathEditing(false);
      }
  };

  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingClickRef = useRef<{ index: number; e: React.MouseEvent } | null>(null);
  const lastClickRef = useRef<{ index: number; time: number } | null>(null);

  // Cleanup click timer on unmount to prevent state updates after unmount
  useEffect(() => {
    return () => { if (clickTimerRef.current) clearTimeout(clickTimerRef.current); };
  }, []);

  const handleDoubleClick = useCallback(async (_e: React.MouseEvent, file: FileInfo) => {
    const store = useStore.getState();
    const tab = store[side].tabs[store[side].activeTabIndex];
    if (!file || file.name === '..') {
      if (tab && tab.path !== '/') {
        const parentPath = tab.path.substring(0, tab.path.lastIndexOf('/')) || '/';
        store.setPath(side, parentPath);
      }
      store.hideContextMenu();
      return;
    }
    const isArchiveFile = /\.(zip|tar\.gz|tgz|tar)$/i.test(file.name);

    if ((file.is_dir || isArchiveFile) && tab) {
      const newPath = tab.path === "/" ? `/${file.name}` : `${tab.path}/${file.name}`;
      store.setPath(side, newPath);
    } else if (file && tab) {
      try {
        const openPath = tab.path === "/" ? `/${file.name}` : `${tab.path}/${file.name}`;
        await invoke('open_with_default', { path: openPath });
      } catch (err) {
        store.setOperationError(`Failed to open file: ${err}`);
      }
    }
    store.hideContextMenu();
  }, [side]);

  const handleDoubleClickWrapper = useCallback(async (e: React.MouseEvent, file: FileInfo) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    pendingClickRef.current = null;
    handleDoubleClick(e, file);
  }, [handleDoubleClick]);

  // STABLE click handler — detects double-click and slow-double-click (rename)
  const renameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFileClick = useCallback((e: React.MouseEvent, index: number) => {
    const store = useStore.getState();
    store.setActiveSide(side);
    const tab = store[side].tabs[store[side].activeTabIndex];
    if (!tab) return;

    // Cancel any pending rename trigger
    if (renameTimerRef.current) { clearTimeout(renameTimerRef.current); renameTimerRef.current = null; }

    const now = Date.now();
    const lastClick = lastClickRef.current;

    // Detect fast double-click: same index, within 400ms → navigate/open
    if (lastClick && lastClick.index === index && (now - lastClick.time) < 400) {
      lastClickRef.current = null;
      if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; }
      pendingClickRef.current = null;
      const file = processedFiles[index];
      if (file) handleDoubleClick(e, file);
      return;
    }

    // Detect slow double-click: same index, 500ms-2000ms, already selected, no modifier, active panel → inline rename
    const wasActive = store.activeSide === side;
    if (wasActive && lastClick && lastClick.index === index && (now - lastClick.time) >= 500 && (now - lastClick.time) < 2000
        && !e.shiftKey && !e.metaKey && !e.ctrlKey && index >= 0) {
      const file = processedFiles[index];
      if (file && file.name !== '..' && tab.cursorIndex === index) {
        lastClickRef.current = null;
        if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; }
        pendingClickRef.current = null;
        setRenamingIndex(index);
        return;
      }
    }

    lastClickRef.current = { index, time: now };

    store.setCursor(side, index);

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    pendingClickRef.current = { index, e };

    const clickIndex = index;
    const shiftKey = e.shiftKey;
    const metaKey = e.metaKey || e.ctrlKey;
    const prevCursor = tab.cursorIndex;
    const prevSelection = [...tab.selection];

    clickTimerRef.current = setTimeout(() => {
      if (!pendingClickRef.current || pendingClickRef.current.index !== clickIndex) return;
      pendingClickRef.current = null;

      if (clickIndex < 0) {
        store.setSelection(side, []);
      } else if (shiftKey) {
        const start = Math.max(0, Math.min(prevCursor, clickIndex));
        const end = Math.max(prevCursor, clickIndex);
        const newSelection = [];
        for (let i = start; i <= end; i++) newSelection.push(i);
        store.setSelection(side, newSelection);
      } else if (metaKey) {
        const isSelected = prevSelection.includes(clickIndex);
        const newSelection = isSelected
          ? prevSelection.filter(i => i !== clickIndex)
          : [...prevSelection, clickIndex];
        store.setSelection(side, newSelection);
      } else {
        store.setSelection(side, [clickIndex]);
      }
    }, 200);

    store.hideContextMenu();
  }, [side, processedFiles, handleDoubleClick]);

  const handleUpDir = () => {
    if (!activeTab) return;
    const parentPath = activeTab.path.substring(0, activeTab.path.lastIndexOf('/')) || '/';
    setPath(side, parentPath);
    hideContextMenu();
  };

  // Mouse-based drag — HTML5 DnD is broken in Tauri's WKWebView
  const handleMouseDragStart = useCallback((e: React.MouseEvent, file: FileInfo, _index: number) => {
    if (file.name === '..' || e.button !== 0) return;
    const store = useStore.getState();
    const tab = store[side].tabs[store[side].activeTabIndex];
    if (!tab) return;
    const pFiles = getProcessedFiles(tab.files, store[side].layout, tab.filterQuery, store.preferences.general.showHiddenFiles);
    const isDraggedItemSelected = tab.selection.length > 0 && tab.selection.some(i => pFiles[i] && pFiles[i].name === file.name);
    const joinP = (dir: string, name: string) => dir === "/" ? `/${name}` : `${dir}/${name}`;
    const paths = isDraggedItemSelected
        ? tab.selection.map(i => joinP(tab.path, pFiles[i]?.name)).filter(Boolean)
        : [joinP(tab.path, file.name)];

    const startX = e.clientX, startY = e.clientY;
    let dragging = false;

    const onMove = (me: MouseEvent) => {
      const dx = me.clientX - startX, dy = me.clientY - startY;
      if (!dragging && Math.abs(dx) + Math.abs(dy) > 8) {
        // Start drag
        dragging = true;
        _dragState = { sources: paths, sourceSide: side, fileName: file.name, active: true, ghostEl: null };
        const ghost = document.createElement('div');
        ghost.style.cssText = 'position:fixed;z-index:9999;display:flex;align-items:center;gap:6px;padding:5px 12px;border-radius:6px;font-size:12px;font-family:system-ui;color:#fff;background:#007AFF;pointer-events:none;white-space:nowrap;opacity:0.9;';
        const label = document.createElement('span');
        label.textContent = paths.length === 1 ? file.name : `${paths.length} items`;
        const badge = document.createElement('span');
        badge.style.cssText = 'font-size:10px;padding:1px 5px;border-radius:4px;font-weight:600;';
        badge.id = '__ke_drag_badge';
        badge.textContent = '→ Move';
        badge.style.background = 'rgba(255,255,255,0.2)';
        ghost.appendChild(label);
        ghost.appendChild(badge);
        document.body.appendChild(ghost);
        _dragState.ghostEl = ghost;
        document.body.style.cursor = 'grabbing';
      }
      if (dragging && _dragState?.ghostEl) {
        _dragState.ghostEl.style.left = `${me.clientX + 12}px`;
        _dragState.ghostEl.style.top = `${me.clientY + 12}px`;
        // Toggle Move/Copy badge based on Alt/Option key
        const badge = document.getElementById('__ke_drag_badge');
        if (badge) {
          badge.textContent = me.altKey ? '⌥ Copy' : '→ Move';
          badge.style.background = me.altKey ? 'rgba(52,199,89,0.5)' : 'rgba(255,255,255,0.2)';
        }
        // Highlight drop target panel
        const otherSide = side === 'left' ? 'right' : 'left';
        const otherPanel = document.querySelector(`[data-side="${otherSide}"]`);
        if (otherPanel) {
          const rect = otherPanel.getBoundingClientRect();
          const over = me.clientX >= rect.left && me.clientX <= rect.right && me.clientY >= rect.top && me.clientY <= rect.bottom;
          (otherPanel as HTMLElement).style.outline = over ? '2px solid var(--ke-accent)' : '';
        }
      }
    };

    const onUp = (me: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      // Clear highlight
      document.querySelectorAll('[data-side]').forEach(el => (el as HTMLElement).style.outline = '');

      if (dragging && _dragState) {
        if (_dragState.ghostEl) { document.body.removeChild(_dragState.ghostEl); _dragState.ghostEl = null; }
        // Check if dropped on other panel
        const otherSide = side === 'left' ? 'right' : 'left';
        const otherPanel = document.querySelector(`[data-side="${otherSide}"]`);
        if (otherPanel) {
          const rect = otherPanel.getBoundingClientRect();
          if (me.clientX >= rect.left && me.clientX <= rect.right && me.clientY >= rect.top && me.clientY <= rect.bottom) {
            // Dropped on other panel — trigger copy/move
            const s = useStore.getState();
            const t = s[otherSide].tabs[s[otherSide].activeTabIndex];
            if (t) {
              const sources = _dragState.sources;
              const isCopy = me.altKey;
              s.requestConfirmation(
                isCopy ? "Copy Files" : "Move Files",
                `${isCopy ? "Copy" : "Move"} ${sources.length} item${sources.length > 1 ? 's' : ''} to ${t.path}?`,
                async () => {
                  try {
                    const opId = Math.random().toString(36).substring(7);
                    useStore.getState().showOperationStatus(`${isCopy ? "Copying" : "Moving"}...`);
                    if (isCopy) await invoke('copy_items_with_progress', { id: opId, sources, dest: t.path });
                    else await invoke('move_items_with_progress', { id: opId, sources, dest: t.path });
                    useStore.getState().refreshPanel('left'); useStore.getState().refreshPanel('right');
                    useStore.getState().showOperationStatus(`${isCopy ? "Copied" : "Moved"} ${sources.length} items.`);
                  } catch (err) { useStore.getState().setOperationError(`${err}`); }
                }, true);
            }
          }
        }
        _dragState = null;
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [side]);

  // Keep old handlers as no-ops so FileRow/StableRowComponent don't break
  const handleDragStart = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
  const handleDragEnd = useCallback(() => {}, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
  const handleDragLeave = useCallback(() => {}, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, file: FileInfo, index: number) => {
    e.preventDefault();
    if (!activeTab) return;
    
    setActiveSide(side);
    if (index !== -1 && !activeTab.selection.includes(index)) {
      setCursor(side, index);
      setSelection(side, [index]);
    } else if (index === -1) {
        setCursor(side, -1);
        setSelection(side, []);  // Don't include -1 in selection — it's the parent row
    }

    const currentSelection = getSelectedPaths(processedFiles);
    const hasSelection = currentSelection.length > 0;
    const isSingleFile = hasSelection && currentSelection.length === 1 && file && !file.is_dir;
    const isSingleDir = hasSelection && currentSelection.length === 1 && file && file.is_dir;
    const isArchiveFile = isSingleFile && /\.(zip|tar\.gz|tgz|tar)$/i.test(file.name);

    const items = [];

    if (file) {
      items.push({ label: "Open", action: () => handleDoubleClick(e, file) });
      const filePath = activeTab.path === "/" ? `/${file.name}` : `${activeTab.path}/${file.name}`;
      items.push({ label: "Copy Path", action: async () => { try { await navigator.clipboard.writeText(filePath); useStore.getState().showOperationStatus("Path copied to clipboard."); } catch { useStore.getState().setOperationError("Failed to copy path"); } } });
      items.push({ label: useStore.getState().quickView ? "Hide Quick Info (Ctrl+Q)" : "Quick Info (Ctrl+Q)", action: () => useStore.getState().toggleQuickView() });
      items.push({ 
        label: "Quick Look (Space)", 
        action: async () => {
            try {
                const filePath = activeTab.path === "/" ? `/${file.name}` : `${activeTab.path}/${file.name}`;
                await invoke('preview_file', { path: filePath });
            } catch (err) {
                useStore.getState().setOperationError(`Quick Look failed: ${err}`);
            }
        } 
      });
      if (!file.is_dir) {
      }
    }

    items.push({ label: "---", action: () => {} });

    items.push({
        label: "New File (Shift+F4)",
        action: () => {
            requestInput("New File", "Enter new file name:", "untitled.txt", (name) => {
                if (name) useStore.getState().createNewFile(side, name);
            });
        }
    });

    items.push({
        label: "New Folder (F7)",
        action: () => {
            const _path = activeTab.path;
            useStore.getState().requestInput("New Folder", "Enter folder name:", "New Folder", async (name) => {
                if (name) {
                    try {
                      useStore.getState().showOperationStatus(`Creating directory '${name}'...`);
                      const dirPath = _path === "/" ? `/${name}` : `${_path}/${name}`;
                      await invoke('create_directory', { path: dirPath });
                      useStore.getState().refreshPanel(side);
                      useStore.getState().showOperationStatus(`Directory '${name}' created successfully.`);
                    } catch (err) {
                      useStore.getState().setOperationError(`Create directory failed: ${err}`);
                    }
                }
            });
        }
    });
    items.push({ label: "---", action: () => {} });

    items.push({
      label: "Copy to Other Pane (F5)",
      action: () => copyToOppositePanel(side),
      disabled: !hasSelection && (!file || file.name === '..')
    });
    items.push({
      label: "Move to Other Pane (F6)",
      action: () => moveToOppositePanel(side),
      disabled: !hasSelection && (!file || file.name === '..')
    });
    items.push({ label: "---", action: () => {} });

    items.push({ 
      label: "Copy (Cmd+C)", 
      action: () => copySelectedFiles(side),
      disabled: !hasSelection
    });
    items.push({ 
      label: "Cut (Cmd+X)", 
      action: () => cutSelectedFiles(side),
      disabled: !hasSelection
    });
    items.push({ 
      label: "Paste (Cmd+V)", 
      action: () => pasteFiles(side),
      disabled: !clipboard.items || clipboard.type !== 'files' || (clipboard.sourcePanel === side && clipboard.operation === 'cut')
    });
    items.push({ 
      label: "Delete (⌘⌫)", 
      action: () => {
          const sources = getSelectedPaths(processedFiles);
          if (sources.length === 0) return;
          useStore.getState().requestConfirmation(
              "Delete Files",
              `Delete ${sources.length} items? This cannot be undone.`,
              async () => {
                 try {
                   useStore.getState().showOperationStatus(`Deleting ${sources.length} items...`);
                   await invoke('delete_items', { paths: sources });
                   useStore.getState().refreshPanel('left');
                   useStore.getState().refreshPanel('right');
                   // Clear stale selection after delete
                   useStore.getState().setSelection(side, []);
                   useStore.getState().showOperationStatus(`Deleted ${sources.length} items successfully.`);
                 } catch (err) {
                   useStore.getState().setOperationError(`Delete failed: ${err}`);
                 }
              }
          );
      },
      disabled: !hasSelection
    });
    items.push({ label: "---", action: () => {} });

    items.push({
      label: "Rename (Shift+F6)",
      action: () => {
        if (!file || file.name === "..") return;
        setRenamingIndex(index);
      },
      disabled: !isSingleFile && !isSingleDir
    });

    items.push({
      label: "Compress (Alt+F5)",
      action: () => compressSelection(side),
      disabled: !hasSelection
    });
    items.push({
      label: "Extract (Alt+F9)",
      action: () => extractSelection(side),
      disabled: !isArchiveFile
    });
    
    items.push({
      label: "Multi-Rename (Cmd+M)",
      action: () => useStore.getState().openMultiRename(side),
      disabled: processedFiles.length === 0
    });

    showContextMenu(e.clientX, e.clientY, items);
  }, [activeTab, side, processedFiles, addTab, compressSelection, copySelectedFiles, cutSelectedFiles, extractSelection, hideContextMenu, pasteFiles, refreshPanel, requestInput, setActiveSide, setCursor, setSelection, showContextMenu, clipboard, copyToOppositePanel, moveToOppositePanel]);

  const handlePanelContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setActiveSide(side);
      const store = useStore.getState();
      const tab = store[side].tabs[store[side].activeTabIndex];
      if (!tab) return;
      const items = [];
      items.push({
          label: "New File (Shift+F4)",
          action: () => {
              store.requestInput("New File", "Enter new file name:", "untitled.txt", (name: string) => {
                  if (name) useStore.getState().createNewFile(side, name);
              });
          }
      });
      items.push({
          label: "New Folder (F7)",
          action: () => {
              const _path = tab.path;
              useStore.getState().requestInput("New Folder", "Enter folder name:", "New Folder", async (name: string) => {
                  if (name) {
                      try {
                          useStore.getState().showOperationStatus(`Creating directory '${name}'...`);
                          const dirPath = _path === "/" ? `/${name}` : `${_path}/${name}`;
                          await invoke('create_directory', { path: dirPath });
                          useStore.getState().refreshPanel(side);
                          useStore.getState().showOperationStatus(`Directory '${name}' created successfully.`);
                      } catch (err) {
                          useStore.getState().setOperationError(`Create directory failed: ${err instanceof Error ? err.message : String(err)}`);
                      }
                  }
              });
          }
      });
      items.push({ label: "---", action: () => {} });
      items.push({
          label: "Paste (Cmd+V)",
          action: () => store.pasteFiles(side),
          disabled: !store.clipboard.items || store.clipboard.type !== 'files'
      });
      items.push({ label: "---", action: () => {} });
      items.push({ label: "Refresh (F2)", action: () => { store.refreshPanel('left'); store.refreshPanel('right'); } });
      showContextMenu(e.clientX, e.clientY, items);
  };

  const handleHeaderDragStart = (e: React.DragEvent, col: SortColumn) => {
      e.dataTransfer.setData("col", col);
      setDraggedCol(col);
  };
  const handleHeaderDragOver = (e: React.DragEvent, col: SortColumn) => {
      e.preventDefault();
      if (dragOverCol !== col) setDragOverCol(col);
  };
  const handleHeaderDrop = (e: React.DragEvent, targetCol: SortColumn) => {
      e.preventDefault();
      const sourceCol = e.dataTransfer.getData("col") as SortColumn;
      if (sourceCol && sourceCol !== targetCol) {
          const newOrder = [...layout!.columns];
          const fromIdx = newOrder.indexOf(sourceCol);
          const toIdx = newOrder.indexOf(targetCol);
          newOrder.splice(fromIdx, 1);
          newOrder.splice(toIdx, 0, sourceCol);
          setColumnOrder(side, newOrder);
      }
      setDraggedCol(null);
      setDragOverCol(null);
  };

  const SortIcon = ({ col }: { col: SortColumn }) => {
      if (layout.sortColumn !== col) return null;
      return layout.sortDirection === 'asc' 
        ? <ArrowUp size={10} className="ml-1" /> 
        : <ArrowDown size={10} className="ml-1" />;
  };

  const gridTemplate = layout.columns.map(c => `var(--col-${c})`).join(' ');

  // Inline rename state
  const [renamingIndex, setRenamingIndex] = useState<number | null>(null);

  const handleRenameSubmit = useCallback(async (oldName: string, newName: string) => {
    const store = useStore.getState();
    const tab = store[side].tabs[store[side].activeTabIndex];
    if (!tab) return;
    setRenamingIndex(null);
    try {
      store.showOperationStatus(`Renaming '${oldName}' to '${newName}'...`);
      const oldPath = tab.path === "/" ? `/${oldName}` : `${tab.path}/${oldName}`;
      const newPath = tab.path === "/" ? `/${newName}` : `${tab.path}/${newName}`;
      await invoke('rename_item', { oldPath, newPath });
      // Set previousFolderName to the new name so cursor lands on the renamed file after refresh
      useStore.setState((s) => {
        const tabs = [...s[side].tabs];
        const ti = s[side].activeTabIndex;
        if (tabs[ti]) tabs[ti] = { ...tabs[ti], previousFolderName: newName };
        return { [side]: { ...s[side], tabs } };
      });
      useStore.getState().refreshPanel(side);
      useStore.getState().showOperationStatus(`Renamed successfully.`);
    } catch (err) {
      useStore.getState().setOperationError(`Rename failed: ${err}`);
    }
  }, [side]);

  const handleRenameCancel = useCallback(() => {
    setRenamingIndex(null);
  }, []);

  // Use refs for handlers that change frequently — keeps RowComponent stable
  const contextMenuRef = useRef(handleContextMenu);
  const renameSubmitRef = useRef(handleRenameSubmit);
  contextMenuRef.current = handleContextMenu;
  renameSubmitRef.current = handleRenameSubmit;

  // Row component — MUST stay stable to prevent react-window from remounting rows
  // (which destroys pending double-click events). Reads cursor/selection from store.
  const StableRowComponent = useMemo(() => {
    const Row = ({ index, style: rowStyle }: { index: number; style: React.CSSProperties }) => {
      const isCursor = useStore(s => s[side].tabs[s[side].activeTabIndex]?.cursorIndex === index);
      const isSelected = useStore(s => s[side].tabs[s[side].activeTabIndex]?.selection?.includes(index) ?? false);
      const file = processedFiles[index];
      if (!file) return null;
      return (
        <FileRow
          file={file}
          index={index}
          style={rowStyle}
          isSelected={isSelected}
          isCursor={isCursor}
          isActive={isActive}
          isDragTarget={dragTargetIndex === index}
          isRenaming={renamingIndex === index}
          columns={layout.columns}
          onClick={handleFileClick}
          onDoubleClick={handleDoubleClickWrapper}
          onContextMenu={(...args) => contextMenuRef.current(...args)}
          onDragStart={handleMouseDragStart}
          onRenameSubmit={(...args) => renameSubmitRef.current(...args)}
          onRenameCancel={handleRenameCancel}
        />
      );
    };
    return Row;
  }, [processedFiles, side, isActive, dragTargetIndex, renamingIndex, layout.columns, handleFileClick, handleDoubleClickWrapper, handleMouseDragStart, handleRenameCancel]);

  // -- CONDITIONAL RENDER MUST BE AT END --
  const showQuickView = !isActive && quickView;

  return (
    <div
      ref={containerRef} data-side={side} onClick={() => setActiveSide(side)} onContextMenu={handlePanelContextMenu}
      className={clsx("flex-1 flex flex-col h-full overflow-hidden transition-all duration-200 border-r border-[var(--ke-border)] last:border-r-0 relative group", isActive ? "bg-[var(--ke-bg)]" : "bg-[var(--ke-bg)]/30 saturate-50 opacity-70", panelDragOver && "border-[var(--ke-accent)] border-2")}
      style={{ gridTemplateColumns: gridTemplate, fontSize: `${preferences.appearance.fontSize}px` } as React.CSSProperties}
    >
      <div className="flex flex-col shrink-0 bg-[var(--ke-bg-secondary)] border-b border-[var(--ke-border)] backdrop-blur-md pt-1 pb-1">
        <TabBar side={side} />
        <div className="h-7 flex items-center px-3 space-x-2 relative">
           <div 
               className="flex-1 flex flex-col min-w-0 h-full justify-center cursor-text"
               onClick={handlePathClick}
               onContextMenu={async (e) => {
                   if (isPathEditing) return; 
                   e.preventDefault();
                   const target = e.currentTarget;
                   
                   let hasText = false;
                   try {
                       const text = await navigator.clipboard.readText();
                       hasText = !!text;
                   } catch (err) {}

                   const selection = window.getSelection();
                   const range = document.createRange();
                   if (target) range.selectNodeContents(target);
                   selection?.removeAllRanges();
                   selection?.addRange(range);
                   showContextMenu(e.clientX, e.clientY, [
                       { label: 'Copy Path', action: async () => { try { await navigator.clipboard.writeText(activeTab.path); useStore.getState().showOperationStatus("Path copied."); } catch (err) { useStore.getState().setOperationError("Failed to copy"); } } },
                       { label: 'Paste & Go', disabled: !hasText, action: async () => { try { const text = await navigator.clipboard.readText(); if (text) setPath(side, text.trim().replace(/^"|"$/g, '')); } catch (err) { useStore.getState().setOperationError("Failed to paste"); } } },
                       { label: 'Edit Address', action: () => handlePathClick() }
                   ]);
               }}
           >
              <div className="flex items-center">
                <button
                  ref={quickNavBtnRef}
                  onClick={(e) => { e.stopPropagation(); setShowQuickNav(!showQuickNav); setShowHistory(false); }}
                  className={clsx("p-0.5 rounded transition-colors mr-1.5 shrink-0", showQuickNav ? "bg-[var(--ke-bg-active)]" : "hover:bg-[var(--ke-bg-hover)]")}
                  title="Quick Navigation"
                >
                  <Compass size={13} style={{ color: showQuickNav ? 'var(--ke-accent)' : 'var(--ke-text-secondary)' }} />
                </button>
                {isArchive ? <Package size={13} className="mr-2 shrink-0" style={{ color: 'var(--ke-accent)' }} /> : <HardDrive size={13} className="text-[var(--ke-text-secondary)] mr-2 shrink-0" />}
                
                {isPathEditing ? (
                    <input 
                        ref={pathInputRef}
                        type="text" 
                        value={pathInputValue}
                        onChange={(e) => setPathInputValue(e.target.value)}
                        onKeyDown={handlePathKeyDown}
                        onBlur={() => setIsPathEditing(false)}
                        className="flex-1 text-[11px] font-medium px-1 py-0.5 rounded outline-none"
                        style={{ backgroundColor: 'var(--ke-bg-input)', color: 'var(--ke-text)', border: '1px solid var(--ke-accent)' }}
                    />
                ) : (
                    <div className="flex items-center min-w-0 overflow-hidden" title={activeTab.path}>
                        {(() => {
                            const parts = activeTab.path.split('/').filter(Boolean);
                            if (parts.length === 0) {
                                return <span className={clsx("text-[11px] font-medium opacity-90 cursor-pointer", !isArchive && "text-[var(--ke-text)]")} style={isArchive ? { color: 'var(--ke-accent)' } : undefined} onClick={handlePathClick}>/</span>;
                            }
                            return parts.map((segment, i) => {
                                const targetPath = '/' + parts.slice(0, i + 1).join('/');
                                const isLast = i === parts.length - 1;
                                return (
                                    <span key={i} className="flex items-center shrink-0">
                                        {i > 0 && <ChevronRight size={10} className="mx-0.5 shrink-0" style={{ color: 'var(--ke-text-tertiary)' }} />}
                                        <span
                                            className={clsx(
                                                "text-[11px] font-medium cursor-pointer rounded px-0.5 transition-colors",
                                                isLast ? "opacity-100" : "opacity-70 hover:opacity-100",
                                                isArchive ? "hover:bg-[var(--ke-selection-light)]" : "text-[var(--ke-text)] hover:bg-[var(--ke-bg-hover)]"
                                            )}
                                            style={isArchive ? { color: 'var(--ke-accent)' } : undefined}
                                            onClick={(e) => { e.stopPropagation(); if (!isLast) setPath(side, targetPath); }}
                                            onDoubleClick={(e) => { e.stopPropagation(); handlePathClick(); }}
                                        >
                                            {segment}
                                        </span>
                                    </span>
                                );
                            });
                        })()}
                    </div>
                )}
              </div>
           </div>
           
           <div className="flex items-center space-x-1">
              <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className={clsx("p-0.5 rounded transition-colors", showHistory ? "bg-[var(--ke-bg-active)]" : "text-[var(--ke-text-secondary)] hover:bg-[var(--ke-bg-hover)]")}
                  title="History & Bookmarks (Alt+Down)"
              >
                  <ChevronDown size={12} />
              </button>
              
              {activeTab.showFilterWidget && <SearchFilter value={activeTab.filterQuery || ''} onChange={(val) => setFilterQuery(side, val)} onClear={() => setFilterQuery(side, '')} onClose={() => useStore.getState().hideFilterWidget(side)} className="w-32 focus-within:w-48 transition-all duration-200" focusSignal={activeTab.filterFocusSignal} autoFocus={true} />}
              <button onClick={handleUpDir} className="p-0.5 hover:bg-[var(--ke-bg-hover)] rounded text-[var(--ke-text-secondary)] transition-colors" aria-label="Go Up"><ChevronRight size={14} className="rotate-270" /></button>
           </div>

           {/* Quick Navigation Popup */}
           {showQuickNav && (
               <QuickNav side={side} anchorRef={quickNavBtnRef} onClose={() => setShowQuickNav(false)} />
           )}

           {/* History Dropdown */}
           {showHistory && (
               <div className="absolute top-full left-0 w-full rounded-b-md shadow-2xl z-50 flex flex-col animate-in slide-in-from-top-2 duration-100" style={{ backgroundColor: 'var(--ke-bg-elevated)', border: '1px solid var(--ke-border)' }}>
                   {/* Backdrop to close — must be above main content but below dropdown */}
                   <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)} />
                   
                   <div className="p-1" style={{ borderBottom: '1px solid var(--ke-border-subtle)', backgroundColor: 'var(--ke-bg-secondary)' }}>
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ke-text-tertiary)' }}>Bookmarks</div>
                        {hotlist.length === 0 && <div className="px-2 py-1 text-xs italic" style={{ color: 'var(--ke-text-tertiary)' }}>No bookmarks</div>}
                        {hotlist.map(path => (
                            <div key={path} className="flex items-center justify-between px-2 py-1 hover:bg-[var(--ke-accent)] rounded cursor-pointer group" onClick={() => { setPath(side, path); setShowHistory(false); }}>
                                <div className="flex items-center truncate">
                                    <Star size={12} className="mr-2 text-[var(--ke-warning)]" />
                                    <span className="truncate text-xs">{path}</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); removeFromHotlist(path); }} className="opacity-0 group-hover:opacity-100" style={{ color: 'var(--ke-error)' }}><ChevronRight size={12} className="rotate-45" /></button>
                            </div>
                        ))}
                        <button 
                            className="w-full text-left px-2 py-1 text-[10px] hover:bg-[var(--ke-bg-hover)] rounded mt-1 flex items-center" style={{ color: 'var(--ke-accent)' }}
                            onClick={() => { addToHotlist(activeTab.path); setShowHistory(false); }}
                        >
                            <Star size={10} className="mr-1" /> Add current
                        </button>
                   </div>

                   <div className="p-1 max-h-60 overflow-y-auto" style={{ backgroundColor: 'var(--ke-bg-secondary)' }}>
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ke-text-tertiary)' }}>History</div>
                        {globalHistory.length === 0 && <div className="px-2 py-1 text-xs italic" style={{ color: 'var(--ke-text-tertiary)' }}>No history</div>}
                        {globalHistory.map(path => (
                            <div key={path} className="flex items-center px-2 py-1 hover:bg-[var(--ke-accent)] rounded cursor-pointer text-xs" onClick={() => { setPath(side, path); setShowHistory(false); }}>
                                <Clock size={12} className="mr-2" style={{ color: 'var(--ke-text-tertiary)' }} />
                                <span className="truncate">{path}</span>
                            </div>
                        ))}
                   </div>
               </div>
           )}
        </div>

        <div className="grid text-[11px] px-3 py-0.5 text-[var(--ke-text-secondary)] sticky top-0 z-10 backdrop-blur-sm select-none" style={{ borderTop: '1px solid var(--ke-border-subtle)', backgroundColor: 'var(--ke-bg-secondary)', gridTemplateColumns: gridTemplate }}>
            {layout.columns.map((col, index) => (
                <div 
                    key={col} 
                    className={clsx(
                        "relative flex items-center cursor-pointer group",
                        // Alignment Logic
                        col !== 'name' ? "justify-end text-right" : "",
                        col !== 'name' && index !== layout.columns.length - 1 ? "pr-2" : "",
                        index === layout.columns.length - 1 ? "pr-4" : "pr-2",
                        draggedCol === col && "opacity-50",
                        dragOverCol === col && "ring-l-2 ring-blue-500"
                    )}
                    draggable
                    onDragStart={(e) => handleHeaderDragStart(e, col)}
                    onDragOver={(e) => handleHeaderDragOver(e, col)}
                    onDrop={(e) => handleHeaderDrop(e, col)}
                    onDragEnd={() => { setDraggedCol(null); setDragOverCol(null); }}
                    onClick={() => setSort(side, col)}
                >
                    <div className="flex items-center truncate">
                        {col === 'name' ? 'Name' : col === 'ext' ? 'Ext' : col === 'size' ? 'Size' : 'Date'}
                        <SortIcon col={col} />
                    </div>
                    
                    {index < layout.columns.length - 1 && (
                        <div
                            className="absolute right-0 top-1 bottom-1 w-2 -mr-1 cursor-col-resize z-20 group/resize"
                            style={{ borderRight: '1px solid var(--ke-border-subtle)' }}
                            onMouseDown={(e) => startResize(e, col, layout.columns[index + 1])}
                            onDoubleClick={(e) => handleHandleDoubleClick(e, col)}
                            onClick={(e) => e.stopPropagation()}
                            draggable={true}
                            onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        />
                    )}
                </div>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {showQuickView ? (
          <QuickInfoPanel side={side} />
        ) : <>
        {activeTab.loading && (
          <div className="p-2 space-y-0.5 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center px-3 gap-2" style={{ height: preferences.appearance.rowHeight }}>
                <div className="w-4 h-3.5 bg-[var(--ke-bg-hover)] rounded" />
                <div className="h-3 bg-[var(--ke-bg-hover)] rounded" style={{ width: `${45 + (i * 7) % 40}%` }} />
                <div className="w-10 h-3 bg-[var(--ke-bg-hover)] rounded ml-auto" />
              </div>
            ))}
          </div>
        )}
        {activeTab.error && (
          <div className="p-4 m-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--ke-error-bg)', border: '1px solid var(--ke-error)', color: 'var(--ke-error)' }}>
            <div className="font-semibold mb-1">Cannot access this folder</div>
            <div className="text-xs opacity-80 mb-3">{activeTab.error}</div>
            <button onClick={handleUpDir} className="px-3 py-1.5 rounded-md text-xs font-medium" style={{ backgroundColor: 'var(--ke-bg-hover)', color: 'var(--ke-text)' }}>
              Go to Parent Folder
            </button>
          </div>
        )}
        {!activeTab.loading && !activeTab.error && (
          <>
            {activeTab.path !== "/" && (
              <div id={`${side}-row--1`} onClick={(e) => { e.stopPropagation(); handleFileClick(e, -1); }} onDoubleClick={handleUpDir} style={{ gridTemplateColumns: gridTemplate, height: preferences.appearance.rowHeight, borderBottom: '1px solid var(--ke-border-subtle)', ...(activeTab.cursorIndex === -1 && isActive ? { backgroundColor: 'var(--ke-accent)' } : {}) }} className={clsx("grid items-center px-3 cursor-default text-[13px] transition-colors", activeTab.cursorIndex === -1 && isActive ? "ring-1 ring-[var(--ke-border)]" : "hover:bg-[var(--ke-bg-hover)] text-[var(--ke-text-secondary)]")}>
                <div className="flex items-center"><ChevronRight size={14} className="mr-2 rotate-180 opacity-50" /><span>..</span></div>
                {layout.columns.slice(1).map(c => <div key={c}></div>)}
              </div>
            )}
            {processedFiles.length > 0 ? (
              <AutoSizer>{({ height, width }: { height: number; width: number }) => (
                <FixedSizeList
                  listRef={listRef}
                  style={{ height: height - (activeTab.path !== "/" ? preferences.appearance.rowHeight : 0), width }}
                  rowCount={processedFiles.length}
                  rowHeight={preferences.appearance.rowHeight}
                  rowComponent={StableRowComponent}
                  rowProps={{}}
                />
              )}</AutoSizer>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center" style={{ color: 'var(--ke-text-tertiary)' }}>
                  {activeTab.filterQuery ? (
                    <>
                      <div className="text-3xl mb-3 opacity-15">&#128269;</div>
                      <div className="text-sm mb-1">No files match filter</div>
                      <div className="text-xs" style={{ color: 'var(--ke-text-disabled)' }}>"{activeTab.filterQuery}"</div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl mb-3 opacity-15">&#128193;</div>
                      <div className="text-sm">This folder is empty</div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        </>}
      </div>
      {/* Type-ahead search indicator */}
      {typeAheadDisplay && isActive && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-md px-3 py-1.5 text-sm font-mono z-30 animate-in fade-in duration-100" style={{ backgroundColor: 'var(--ke-bg-elevated)', border: '1px solid var(--ke-border)', color: 'var(--ke-warning)', boxShadow: 'var(--ke-shadow-sm)' }}>
          {typeAheadDisplay}
        </div>
      )}
      {/* Status Bar */}
      <div className={clsx("px-3 py-1 text-[10px] font-medium flex items-center justify-between select-none shrink-0")} style={{ borderTop: '1px solid var(--ke-border-subtle)', color: 'var(--ke-text-secondary)' }}>
        {(() => {
          const dirs = processedFiles.filter(f => f.is_dir).length;
          const files = processedFiles.filter(f => !f.is_dir).length;
          const selectedIndices = activeTab.selection || [];
          const selectedFiles = selectedIndices.map(i => processedFiles[i]).filter(Boolean);
          const selectedSize = selectedFiles.reduce((sum, f) => sum + (f.is_dir ? 0 : f.size), 0);

          return (
            <>
              <span>{dirs} folder{dirs !== 1 ? 's' : ''}, {files} file{files !== 1 ? 's' : ''}</span>
              {selectedIndices.length > 0 && (
                <span style={{ color: 'var(--ke-accent)' }}>
                  {selectedIndices.length} selected
                  {selectedSize > 0 && ` (${formatSize(selectedSize)})`}
                </span>
              )}
            </>
          );
        })()}
      </div>
      {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ backgroundColor: 'var(--ke-accent)', boxShadow: '0 0 8px var(--ke-accent)' }} />}
    </div>
  );
};