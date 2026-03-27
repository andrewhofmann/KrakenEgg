import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { formatSize } from "../utils/format";
import { FileRow } from "./FileRow";
import { FileInfo } from "../store";
// ... imports

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
            if (listRef.current && typeof listRef.current.scrollToItem === 'function') {
                listRef.current.scrollToItem(matchIndex, "center");
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
    };
  }, [isActive, processedFiles, side, setCursor, setSelection, isPathEditing, showHistory]);


  useEffect(() => {
    if (isActive && activeTab && listRef.current) {
      if (typeof listRef.current.scrollToItem === 'function') {
          listRef.current.scrollToItem(activeTab.cursorIndex, "smart");
      }
    }
  }, [activeTab?.cursorIndex, isActive]);

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
                    const newW = startW - delta;
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
        if (context) context.font = '13px system-ui';
        
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

  const joinPath = (dir: string, file: string) => dir === "/" ? `/${file}` : `${dir}/${file}`;

  const getSelectedPaths = (files: FileInfo[]) => {
    if (!activeTab) return [];
    if (activeTab.selection.length > 0) {
      return activeTab.selection.map(i => joinPath(activeTab.path, files[i].name));
    } else {
      const file = files[activeTab.cursorIndex];
      if (file && file.name !== "..") {
        return [joinPath(activeTab.path, file.name)];
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

  const handleFileClick = useCallback((e: React.MouseEvent, index: number) => {
    setActiveSide(side);
    if (!activeTab) return;
    
    if (index === -1) {
        setCursor(side, -1);
        setSelection(side, [-1]);
        return;
    }

    if (e.shiftKey) {
      const start = Math.max(0, Math.min(activeTab.cursorIndex, index));
      const end = Math.max(activeTab.cursorIndex, index);
      const newSelection = [];
      for (let i = start; i <= end; i++) {
        newSelection.push(i);
      }
      setSelection(side, newSelection);
      setCursor(side, index);
    } else if (e.metaKey || e.ctrlKey) {
      const isSelected = activeTab.selection.includes(index);
      let newSelection;
      if (isSelected) {
        newSelection = activeTab.selection.filter(i => i !== index);
      } else {
        newSelection = [...activeTab.selection, index];
      }
      setSelection(side, newSelection);
      setCursor(side, index);
    } else {
      setCursor(side, index);
      setSelection(side, [index]);
    }
    hideContextMenu();
  }, [activeTab, side, setActiveSide, setSelection, setCursor, hideContextMenu]);

  const handleDoubleClick = useCallback(async (_e: React.MouseEvent, file: FileInfo) => {
    const isArchiveFile = /\.(zip|tar|gz|tgz)$/i.test(file.name);
    
    if ((file.is_dir || isArchiveFile) && activeTab) {
      const newPath = activeTab.path === "/" ? `/${file.name}` : `${activeTab.path}/${file.name}`;
      setPath(side, newPath);
    } else if (file && activeTab) {
      const path = joinPath(activeTab.path, file.name);
      try {
        await invoke('open_with_default', { path });
      } catch (err) {
        useStore.getState().setOperationError(`Failed to open file: ${err}`);
      }
    }
    hideContextMenu();
  }, [activeTab, side, setPath, hideContextMenu]);

  const handleUpDir = () => {
    if (!activeTab) return;
    const parentPath = activeTab.path.substring(0, activeTab.path.lastIndexOf('/')) || '/';
    setPath(side, parentPath);
    hideContextMenu();
  };

  const handleDragStart = useCallback((e: React.DragEvent, file: FileInfo, _index: number) => {
    setIsDraggingFiles(true);
    if (!activeTab) return;
    const isDraggedItemSelected = activeTab.selection.length > 0 && activeTab.selection.some(i => processedFiles[i] && processedFiles[i].name === file.name);
    
    const paths = isDraggedItemSelected
        ? activeTab.selection.map(i => joinPath(activeTab.path, processedFiles[i].name))
        : [joinPath(activeTab.path, file.name)];

    // Use standard URI list for compatibility and a custom type for internal state
    e.dataTransfer.setData("text/uri-list", paths.join('\r\n'));
    e.dataTransfer.setData("application/x-krakenegg-source", side);
    e.dataTransfer.effectAllowed = "copyMove";
  }, [activeTab, processedFiles, side]);

  const handleDragEnd = useCallback(() => {
    setIsDraggingFiles(false);
    setDragTargetIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number, file: FileInfo) => {
      e.preventDefault();
      e.stopPropagation();
      if (file.is_dir && file.name !== "..") {
          setDragTargetIndex(index);
          e.dataTransfer.dropEffect = e.altKey ? "copy" : "move";
      } else {
          setDragTargetIndex(null);
      }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, file: FileInfo) => {
    e.preventDefault();
    e.stopPropagation();
    setDragTargetIndex(null);
    setPanelDragOver(false);
    setIsDraggingFiles(false);

    if (!activeTab) return;

    try {
        const uriList = e.dataTransfer.getData("text/uri-list");
        const sourceSide = e.dataTransfer.getData("application/x-krakenegg-source") as "left" | "right" | "";
        
        if (!uriList) return;
        const sources = uriList.split('\r\n').filter(s => s.length > 0);
        
        let dest = activeTab.path;
        if (file && file.is_dir && file.name !== "..") {
            dest = joinPath(activeTab.path, file.name);
        }

        if (!dest || sources.length === 0) return;
        // If dropped on the same panel and same directory, do nothing
        if (sourceSide === side && dest === activeTab.path) return; 

        const isCopy = e.altKey;

        requestConfirmation(
        isCopy ? "Copy Files" : "Move Files",
        `${isCopy ? "Copy" : "Move"} ${sources.length} items to ${dest}?`,
        async () => {
            const { showOperationStatus, setOperationError } = useStore.getState();
            try {
              showOperationStatus(`${isCopy ? "Copying" : "Moving"} ${sources.length} items...`);
              if (isCopy) {
                  await invoke('copy_items', { sources, dest });
              } else {
                  await invoke('move_items', { sources, dest });
              }
              refreshPanel(side);
              if (sourceSide) refreshPanel(sourceSide);
              showOperationStatus(`${isCopy ? "Copied" : "Moved"} ${sources.length} items successfully.`);
            } catch (err) {
              setOperationError(`${isCopy ? "Copy" : "Move"} failed: ${err}`);
            }
        }
        );
    } catch (err) {
        useStore.getState().setOperationError(`Drop failed: ${err}`);
    }
  }, [activeTab, side, requestConfirmation, refreshPanel]);
  }, [activeTab, side, requestConfirmation, refreshPanel]);

  const handleContextMenu = useCallback((e: React.MouseEvent, file: FileInfo, index: number) => {
    e.preventDefault();
    if (!activeTab) return;
    
    setActiveSide(side);
    if (index !== -1 && !activeTab.selection.includes(index)) {
      setCursor(side, index);
      setSelection(side, [index]);
    } else if (index === -1) {
        setCursor(side, -1);
        setSelection(side, [-1]);
    }

    const currentSelection = getSelectedPaths(processedFiles);
    const hasSelection = currentSelection.length > 0;
    const isSingleFile = hasSelection && currentSelection.length === 1 && file && !file.is_dir;
    const isSingleDir = hasSelection && currentSelection.length === 1 && file && file.is_dir;
    const isArchiveFile = isSingleFile && (file.name.endsWith('.zip') || file.name.endsWith('.tar.gz') || file.name.endsWith('.tgz') || file.name.endsWith('.tar'));

    const items = [];

    if (file) {
      if (file.is_dir) {
        items.push({ label: "Open", action: () => handleDoubleClick(e, file) });
        items.push({ label: "Open in New Tab", action: () => addTab(side, joinPath(activeTab.path, file.name)) });
      } else {
        items.push({ label: "Open", action: () => handleDoubleClick(e, file) }); 
      }
      items.push({ label: "View (F3)", action: () => useStore.getState().showViewer(file.name, joinPath(activeTab.path, file.name)) });
      items.push({ label: useStore.getState().quickView ? "Hide Quick Info (Ctrl+Q)" : "Quick Info (Ctrl+Q)", action: () => useStore.getState().toggleQuickView() });
      items.push({ 
        label: "Quick Look (Space)", 
        action: async () => {
            const path = joinPath(activeTab.path, file.name);
            try {
                await invoke('preview_file', { path });
            } catch (err) {
                useStore.getState().setOperationError(`Quick Look failed: ${err}`);
            }
        } 
      });
      if (!file.is_dir) {
        items.push({ label: "Edit (F4)", action: () => useStore.getState().showEditor(file.name, joinPath(activeTab.path, file.name)) });
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
            requestInput("New Folder", "Enter folder name:", "New Folder", async (name) => {
                if (name) {
                    const path = joinPath(activeTab.path, name);
                    const { showOperationStatus, setOperationError } = useStore.getState();
                    try {
                      showOperationStatus(`Creating directory '${name}'...`);
                      await invoke('create_directory', { path });
                      refreshPanel(side);
                      showOperationStatus(`Directory '${name}' created successfully.`);
                    } catch (err) {
                      setOperationError(`Create directory failed: ${err}`);
                    }
                }
            });
        }
    });
    items.push({ label: "---", action: () => {} });

    items.push({ 
      label: "Copy to Other Pane (F5)", 
      action: () => copyToOppositePanel(side),
      disabled: !hasSelection && index !== -1
    });
    items.push({ 
      label: "Move to Other Pane (F6)", 
      action: () => moveToOppositePanel(side),
      disabled: !hasSelection && index !== -1
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
      label: "Delete (F8)", 
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
        const currentFile = processedFiles[activeTab.cursorIndex];
        if (!currentFile || currentFile.name === "..") return;
        setRenamingIndex(activeTab.cursorIndex);
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
    if (!activeTab) return;
    setRenamingIndex(null);
    const oldPath = joinPath(activeTab.path, oldName);
    const newPath = joinPath(activeTab.path, newName);
    try {
      useStore.getState().showOperationStatus(`Renaming '${oldName}' to '${newName}'...`);
      await invoke('move_items', { sources: [oldPath], dest: newPath });
      refreshPanel(side);
      useStore.getState().showOperationStatus(`Renamed successfully.`);
    } catch (err) {
      useStore.getState().setOperationError(`Rename failed: ${err}`);
    }
  }, [activeTab, side, refreshPanel]);

  const handleRenameCancel = useCallback(() => {
    setRenamingIndex(null);
  }, []);

  // Row component for react-window FixedSizeList
  const Row = useCallback(({ data, index, style: rowStyle }: { data: FileInfo[]; index: number; style: React.CSSProperties }) => {
    const file = data[index];
    if (!file) return null;
    return (
      <FileRow
        file={file}
        index={index}
        style={rowStyle}
        isSelected={activeTab?.selection?.includes(index) ?? false}
        isCursor={activeTab?.cursorIndex === index}
        isActive={isActive}
        isDragTarget={dragTargetIndex === index}
        isRenaming={renamingIndex === index}
        columns={layout.columns}
        onClick={handleFileClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onRenameSubmit={handleRenameSubmit}
        onRenameCancel={handleRenameCancel}
      />
    );
  }, [activeTab?.selection, activeTab?.cursorIndex, isActive, dragTargetIndex, renamingIndex, layout.columns, handleFileClick, handleDoubleClick, handleContextMenu, handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop, handleRenameSubmit, handleRenameCancel]);

  // -- CONDITIONAL RENDER MUST BE AT END --
  if (!isActive && quickView) {
      return <QuickInfoPanel side={side} />;
  }

  return (
    <div 
      ref={containerRef} onClick={() => setActiveSide(side)} onContextMenu={handlePanelContextMenu} onDragOver={(e) => { e.preventDefault(); if (isDraggingFiles) { e.dataTransfer.dropEffect = e.altKey ? "copy" : "move"; setPanelDragOver(true); } }} onDragLeave={() => setPanelDragOver(false)} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setPanelDragOver(false); setIsDraggingFiles(false); }}
      className={clsx("flex-1 flex flex-col h-full overflow-hidden transition-all duration-200 border-r border-macos-border last:border-r-0 relative group", isActive ? "bg-macos-bg" : "bg-macos-bg/30 saturate-50 opacity-70", panelDragOver && "border-macos-active border-2")}
      style={{ gridTemplateColumns: gridTemplate, fontSize: `${preferences.appearance.fontSize}px` } as React.CSSProperties}
    >
      <div className="flex flex-col shrink-0 bg-macos-sidebar border-b border-macos-border backdrop-blur-md pt-1 pb-1">
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
                       { label: 'Copy Path', action: async () => { try { await navigator.clipboard.writeText(`"${activeTab.path}"`); } catch (err) { useStore.getState().setOperationError("Failed to copy"); } } },
                       { label: 'Paste & Go', disabled: !hasText, action: async () => { try { const text = await navigator.clipboard.readText(); if (text) setPath(side, text.trim().replace(/^"|"$/g, '')); } catch (err) { useStore.getState().setOperationError("Failed to paste"); } } },
                       { label: 'Edit Address', action: () => handlePathClick() }
                   ]);
               }}
           >
              <div className="flex items-center">
                {isArchive ? <Package size={13} className="text-blue-300 mr-2 shrink-0" /> : <HardDrive size={13} className="text-macos-textSecondary mr-2 shrink-0" />}
                
                {isPathEditing ? (
                    <input 
                        ref={pathInputRef}
                        type="text" 
                        value={pathInputValue}
                        onChange={(e) => setPathInputValue(e.target.value)}
                        onKeyDown={handlePathKeyDown}
                        onBlur={() => setIsPathEditing(false)}
                        className="flex-1 text-[11px] font-medium bg-black/30 text-white px-1 py-0.5 rounded border border-blue-500/50 outline-none"
                    />
                ) : (
                    <div className="flex items-center min-w-0 overflow-hidden" title={activeTab.path}>
                        {(() => {
                            const parts = activeTab.path.split('/').filter(Boolean);
                            if (parts.length === 0) {
                                return <span className={clsx("text-[11px] font-medium opacity-90 cursor-pointer", isArchive ? "text-blue-300" : "text-macos-text")} onClick={handlePathClick}>/</span>;
                            }
                            return parts.map((segment, i) => {
                                const targetPath = '/' + parts.slice(0, i + 1).join('/');
                                const isLast = i === parts.length - 1;
                                return (
                                    <span key={i} className="flex items-center shrink-0">
                                        {i > 0 && <ChevronRight size={10} className="text-gray-500 mx-0.5 shrink-0" />}
                                        <span
                                            className={clsx(
                                                "text-[11px] font-medium cursor-pointer rounded px-0.5 transition-colors",
                                                isLast ? "opacity-100" : "opacity-70 hover:opacity-100",
                                                isArchive ? "text-blue-300 hover:bg-blue-500/20" : "text-macos-text hover:bg-white/10"
                                            )}
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
                  className={clsx("p-0.5 rounded transition-colors", showHistory ? "bg-white/20 text-white" : "text-macos-textSecondary hover:bg-white/10 hover:text-white")}
                  title="History & Bookmarks (Alt+Down)"
              >
                  <ChevronDown size={12} />
              </button>
              
              {activeTab.showFilterWidget && <SearchFilter value={activeTab.filterQuery || ''} onChange={(val) => setFilterQuery(side, val)} onClear={() => setFilterQuery(side, '')} className="w-32 focus-within:w-48 transition-all duration-200" focusSignal={activeTab.filterFocusSignal} autoFocus={true} />}
              <button onClick={handleUpDir} className="p-0.5 hover:bg-white/10 rounded text-macos-textSecondary hover:text-white transition-colors" aria-label="Go Up"><ChevronRight size={14} className="rotate-270" /></button>
           </div>

           {/* History Dropdown */}
           {showHistory && (
               <div className="absolute top-full left-0 w-full bg-[#252525] border border-white/10 rounded-b-md shadow-2xl z-50 flex flex-col animate-in slide-in-from-top-2 duration-100">
                   {/* Backdrop to close */}
                   <div className="fixed inset-0 z-[-1]" onClick={() => setShowHistory(false)} />
                   
                   <div className="p-1 border-b border-white/5 bg-[#1e1e1e]">
                        <div className="px-2 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Bookmarks</div>
                        {hotlist.length === 0 && <div className="px-2 py-1 text-xs text-gray-500 italic">No bookmarks</div>}
                        {hotlist.map(path => (
                            <div key={path} className="flex items-center justify-between px-2 py-1 hover:bg-blue-600 rounded cursor-pointer group" onClick={() => { setPath(side, path); setShowHistory(false); }}>
                                <div className="flex items-center truncate">
                                    <Star size={12} className="mr-2 text-yellow-500" />
                                    <span className="truncate text-xs">{path}</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); removeFromHotlist(path); }} className="opacity-0 group-hover:opacity-100 hover:text-red-300"><ChevronRight size={12} className="rotate-45" /></button>
                            </div>
                        ))}
                        <button 
                            className="w-full text-left px-2 py-1 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-white/5 rounded mt-1 flex items-center"
                            onClick={() => { addToHotlist(activeTab.path); setShowHistory(false); }}
                        >
                            <Star size={10} className="mr-1" /> Add current
                        </button>
                   </div>

                   <div className="p-1 bg-[#1e1e1e] max-h-60 overflow-y-auto">
                        <div className="px-2 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">History</div>
                        {globalHistory.length === 0 && <div className="px-2 py-1 text-xs text-gray-500 italic">No history</div>}
                        {globalHistory.map(path => (
                            <div key={path} className="flex items-center px-2 py-1 hover:bg-blue-600 rounded cursor-pointer text-xs" onClick={() => { setPath(side, path); setShowHistory(false); }}>
                                <Clock size={12} className="mr-2 text-gray-500" />
                                <span className="truncate">{path}</span>
                            </div>
                        ))}
                   </div>
               </div>
           )}
        </div>

        <div className="grid text-[11px] px-3 py-0.5 border-t border-white/5 bg-black/20 text-macos-textSecondary sticky top-0 z-10 backdrop-blur-sm select-none" style={{ gridTemplateColumns: gridTemplate }}>
            {layout.columns.map((col, index) => (
                <div 
                    key={col} 
                    className={clsx(
                        "relative flex items-center cursor-pointer hover:text-white group",
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
        {activeTab.loading && (
          <div className="p-2 space-y-0.5 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center px-3 gap-2" style={{ height: preferences.appearance.rowHeight }}>
                <div className="w-4 h-3.5 bg-white/5 rounded" />
                <div className="h-3 bg-white/5 rounded" style={{ width: `${45 + (i * 7) % 40}%` }} />
                <div className="w-10 h-3 bg-white/5 rounded ml-auto" />
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
              <div id={`${side}-row--1`} onClick={(e) => { e.stopPropagation(); handleFileClick(e, -1); }} onDoubleClick={handleUpDir} style={{ gridTemplateColumns: gridTemplate }} className={clsx("grid items-center px-3 py-0.5 border-b border-white/5 cursor-default text-[13px] transition-colors", activeTab.cursorIndex === -1 && isActive ? "bg-macos-active text-white ring-1 ring-white/40" : "hover:bg-macos-hover text-macos-textSecondary hover:text-white")}>
                <div className="flex items-center"><ChevronRight size={14} className="mr-2 rotate-180 opacity-50" /><span>..</span></div>
                {layout.columns.slice(1).map(c => <div key={c}></div>)}
              </div>
            )}
            {processedFiles.length > 0 ? (
              <AutoSizer>{({ height, width }: { height: number; width: number }) => (<FixedSizeList ref={listRef} height={height - (activeTab.path !== "/" ? 24 : 0)} itemCount={processedFiles.length} itemSize={preferences.appearance.rowHeight} width={width} itemData={processedFiles}>{Row}</FixedSizeList>)}</AutoSizer>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center" style={{ color: 'var(--ke-text-tertiary)' }}>
                  {activeTab.filterQuery ? (
                    <>
                      <div className="text-sm mb-1">No files match filter</div>
                      <div className="text-xs" style={{ color: 'var(--ke-text-disabled)' }}>"{activeTab.filterQuery}"</div>
                    </>
                  ) : (
                    <div className="text-sm">This folder is empty</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* Type-ahead search indicator */}
      {typeAheadDisplay && isActive && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 border border-white/20 rounded-md px-3 py-1 text-sm text-yellow-300 font-mono shadow-lg z-30 animate-in fade-in duration-100">
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
                <span className="text-blue-400">
                  {selectedIndices.length} selected
                  {selectedSize > 0 && ` (${formatSize(selectedSize)})`}
                </span>
              )}
            </>
          );
        })()}
      </div>
      {isActive && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-macos-active shadow-[0_0_10px_rgba(0,122,255,0.5)]" />}
    </div>
  );
};