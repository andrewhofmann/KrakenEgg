import { useEffect } from 'react';
import { useStore, HotkeyAction } from '../store';
import { invoke } from '@tauri-apps/api/core';
import { joinPath, isHotkeyMatched } from './keyboardUtils';


export function useKeyboard() {
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Priority: Handle Tab (Toggle Side) globally and immediately
      if (e.key === 'Tab') {
          const state = useStore.getState();
          // If a modal is open, allow standard Tab navigation (focus cycling)
          if (state.confirmation.show || state.inputModal.show || state.settingsModal.show || state.operationStatus.conflict) {
              return;
          }

          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
          
          const other = state.activeSide === 'left' ? 'right' : 'left';
          state.setActiveSide(other);
          return;
      }

      // Get a fresh state for each keydown event
      const state = useStore.getState();
      const {
        activeSide,
        requestInput,
        createNewFile,
        showGoToPathModal,
        showSettingsModal,
        goBack,
        goForward,
        compressSelection,
        extractSelection,
        copySelectedFiles,
        cutSelectedFiles,
        pasteFiles,
        setSelection,
        setCursor,
        setPath,
        showViewer,
        showEditor,
        requestConfirmation,
        refreshPanel,
        showOperationStatus,
        setOperationError,
        hotkeys, // Get hotkeys from store
        setActiveSide, // Corrected: use setActiveSide from state
        triggerFilterFocus,
        copyToOppositePanel,
        moveToOppositePanel,
        swapPanes,
        deleteSelectedFiles,
      } = state;

      // Ignore if input is focused (e.g. Search bar) or if a modal is open
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || 
          state.confirmation.show || state.inputModal.show || state.goToPathModal.show || state.settingsModal.show) {
        // Allow specific hotkeys to always work, e.g., Escape to close modal
        if (e.key === 'Escape') {
          if (state.confirmation.show) state.closeConfirmation();
          else if (state.inputModal.show) state.closeInputModal();
          else if (state.goToPathModal.show) state.hideGoToPathModal();
          else if (state.settingsModal.show) state.hideSettingsModal();
        }
        return; 
      }
      
      // Font zoom shortcuts (Cmd+Plus / Cmd+Minus / Cmd+0)
      if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        const current = state.preferences.appearance.fontSize;
        state.setPreference('appearance', 'fontSize', Math.min(24, current + 1));
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        const current = state.preferences.appearance.fontSize;
        state.setPreference('appearance', 'fontSize', Math.max(9, current - 1));
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        state.setPreference('appearance', 'fontSize', 13); // Reset to default
        return;
      }

      // Ctrl+H: Toggle hidden files
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        const current = state.preferences.general.showHiddenFiles;
        state.setPreference('general', 'showHiddenFiles', !current);
        return;
      }

      // Ctrl+Enter: Open terminal at current directory
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const currentPath = state[activeSide].tabs[state[activeSide].activeTabIndex]?.path;
        if (currentPath) {
          invoke('open_with_default', { path: currentPath }).catch(() => {});
        }
        return;
      }

      const otherSide = activeSide === 'left' ? 'right' : 'left';
      const activeTab = state[activeSide].tabs[state[activeSide].activeTabIndex];

      if (!activeTab) return;

      // --- Hotkey handling based on stored hotkeys ---
      const handleHotkeyAction = async (actionId: HotkeyAction) => {
        e.preventDefault(); // Prevent default browser action for this hotkey
        switch (actionId) {
          case 'toggle_side':
            setActiveSide(otherSide); // Corrected: use setActiveSide from state
            break;
          case 'go_up_dir':
            if (activeTab.path !== "/") {
              const parentPath = activeTab.path.substring(0, activeTab.path.lastIndexOf('/')) || '/';
              setPath(activeSide, parentPath);
            }
            break;
          case 'go_back':
            goBack(activeSide);
            break;
          case 'go_forward':
            goForward(activeSide);
            break;
          case 'open_search':
            triggerFilterFocus(activeSide);
            break;
          case 'copy_to_opposite':
            copyToOppositePanel(activeSide);
            break;
          case 'move_to_opposite':
            moveToOppositePanel(activeSide);
            break;
          case 'swap_panes':
            swapPanes();
            break;
          case 'refresh_panel':
            refreshPanel(activeSide);
            break;
          case 'new_file':
            requestInput(
              "New File",
              "Enter new file name:",
              "untitled.txt",
              (name) => { if (name) createNewFile(activeSide, name); }
            );
            break;
          case 'new_folder':
            requestInput(
              "New Folder",
              "Enter folder name:",
              "New Folder",
              async (name) => {
                  if (name) {
                      const path = joinPath(activeTab.path, name);
                      try {
                        showOperationStatus(`Creating directory '${name}'...`);
                        await invoke('create_directory', { path });
                        refreshPanel(activeSide);
                        showOperationStatus(`Directory '${name}' created successfully.`);
                      } catch (err) {
                        setOperationError(`Create directory failed: ${err}`);
                      }
                  }
              }
            );
            break;
          case 'copy':
            copySelectedFiles(activeSide);
            break;
          case 'cut':
            cutSelectedFiles(activeSide);
            break;
          case 'paste':
            pasteFiles(activeSide);
            break;
          case 'delete':
            deleteSelectedFiles(activeSide);
            break;
          case 'rename':
            const currentFile = activeTab.files[activeTab.cursorIndex];
            if (!currentFile || currentFile.name === "..") return;
            requestInput(
              "Rename Item",
              `Enter new name for "${currentFile.name}":`,
              currentFile.name,
              async (newName) => {
                  if (newName && newName !== currentFile.name) {
                      const oldPath = joinPath(activeTab.path, currentFile.name);
                      const newPath = joinPath(activeTab.path, newName);
                       try {
                          showOperationStatus(`Renaming '${currentFile.name}' to '${newName}'...`);
                          await invoke('move_items', { sources: [oldPath], dest: newPath });
                          refreshPanel(activeSide);
                          showOperationStatus(`Renamed '${currentFile.name}' to '${newName}' successfully.`);
                      } catch (err) {
                          setOperationError(`Rename failed: ${err}`);
                      }
                  }
              }
            );
            break;
          case 'view_file':
            const fileToView = activeTab.files[activeTab.cursorIndex];
            if (fileToView && !fileToView.is_dir && fileToView.name !== "..") {
              const filePath = joinPath(activeTab.path, fileToView.name);
              showViewer(fileToView.name, filePath);
            } else if (fileToView && fileToView.is_dir) {
              setOperationError("Cannot view a directory.");
            }
            break;
          case 'edit_file':
            const fileToEdit = activeTab.files[activeTab.cursorIndex];
            if (fileToEdit && !fileToEdit.is_dir && fileToEdit.name !== "..") {
              const filePath = joinPath(activeTab.path, fileToEdit.name);
              showEditor(fileToEdit.name, filePath);
            } else if (fileToEdit && fileToEdit.is_dir) {
              setOperationError("Cannot edit a directory.");
            }
            break;
          case 'compress_selection':
            compressSelection(activeSide);
            break;
          case 'extract_selection':
            const fileToExtract = activeTab.files[activeTab.cursorIndex];
            if (fileToExtract && !fileToExtract.is_dir && (fileToExtract.name.endsWith('.zip') || fileToExtract.name.endsWith('.tar.gz') || fileToExtract.name.endsWith('.tgz') || fileToExtract.name.endsWith('.tar'))) {
                requestConfirmation(
                "Extract Archive",
                `Extract ${fileToExtract.name} here?`,
                () => extractSelection(activeSide)
                );
            } else {
                setOperationError("Please select an archive file to extract.");
            }
            break;
          case 'select_all': {
            const allIndices = activeTab.files.map((_: unknown, i: number) => i);
            setSelection(activeSide, allIndices);
            break;
          }
          case 'invert_selection': {
            const allFileIndices = activeTab.files.map((_: unknown, i: number) => i);
            const currentSelection = new Set(activeTab.selection);
            const inverted = allFileIndices.filter((i: number) => !currentSelection.has(i));
            setSelection(activeSide, inverted);
            break;
          }
          case 'deselect_all':
            setSelection(activeSide, []);
            break;
          case 'select_by_pattern': {
            state.requestInput(
              'Select by Pattern',
              'Enter pattern (e.g., *.txt, photo*, *.{js,ts}):',
              '*.*',
              (pattern: string) => {
                if (!pattern) return;
                // Convert glob pattern to regex
                const regexStr = pattern
                  .replace(/\./g, '\\.')
                  .replace(/\*/g, '.*')
                  .replace(/\?/g, '.')
                  .replace(/\{([^}]+)\}/g, '($1)')
                  .replace(/,/g, '|');
                try {
                  const regex = new RegExp(`^${regexStr}$`, 'i');
                  const matches = activeTab.files
                    .map((f: { name: string }, i: number) => ({ f, i }))
                    .filter(({ f }: { f: { name: string } }) => regex.test(f.name))
                    .map(({ i }: { i: number }) => i);
                  // Add to existing selection
                  const merged = [...new Set([...activeTab.selection, ...matches])];
                  setSelection(activeSide, merged);
                } catch {
                  state.setOperationError('Invalid pattern');
                }
              }
            );
            break;
          }
          case 'goto_path_modal':
            showGoToPathModal(activeTab.path);
            break;
          case 'open_settings':
            showSettingsModal();
            break;
          case 'multi_rename':
            state.openMultiRename(activeSide);
            break;
          default:
            // No action defined for this hotkey
            return;
        }
      };

      for (const actionId of Object.keys(hotkeys) as HotkeyAction[]) {
        if (isHotkeyMatched(e, hotkeys[actionId])) {
          handleHotkeyAction(actionId);
          return; // Only handle one hotkey per event
        }
      }

      // --- Fallback/non-customizable actions (ArrowUp/Down, Space, Enter, Tab) ---
      // These actions are typically not remappable or have complex logic, so handle them outside the hotkey map
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          const minIndexUp = activeTab.path === "/" ? 0 : -1;
          if (e.shiftKey) {
             const currentIndex = activeTab.cursorIndex;
             const newIndex = Math.max(minIndexUp, currentIndex - 1);
             setCursor(activeSide, newIndex);
             const newSelection = [...activeTab.selection];
             if (!newSelection.includes(newIndex)) {
                 newSelection.push(newIndex);
             }
             setSelection(activeSide, newSelection);
          } else {
             state.moveCursor(activeSide, -1);
             if (!e.ctrlKey && !e.metaKey) {
                 const newIndex = Math.max(minIndexUp, activeTab.cursorIndex - 1);
                 setSelection(activeSide, [newIndex]);
             }
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (e.shiftKey) {
             const currentIndex = activeTab.cursorIndex;
             const newIndex = Math.min(activeTab.files.length - 1, currentIndex + 1);
             setCursor(activeSide, newIndex);
             const newSelection = [...activeTab.selection];
             if (!newSelection.includes(newIndex)) {
                 newSelection.push(newIndex);
             }
             setSelection(activeSide, newSelection);
          } else {
             state.moveCursor(activeSide, 1);
             if (!e.ctrlKey && !e.metaKey) {
                 const newIndex = Math.min(activeTab.files.length - 1, activeTab.cursorIndex + 1);
                 setSelection(activeSide, [newIndex]);
             }
          }
          break;
        case 'Home':
          e.preventDefault();
          {
            const firstIndex = activeTab.path === "/" ? 0 : -1;
            setCursor(activeSide, firstIndex);
            if (!e.shiftKey) setSelection(activeSide, [firstIndex]);
          }
          break;
        case 'End':
          e.preventDefault();
          {
            const lastIndex = activeTab.files.length - 1;
            setCursor(activeSide, lastIndex);
            if (!e.shiftKey) setSelection(activeSide, [lastIndex]);
          }
          break;
        case ' ': // Space - Preview file OR calculate folder size (like TC)
          e.preventDefault();
          const fileToPreview = activeTab.files[activeTab.cursorIndex];
          if (fileToPreview && fileToPreview.name !== "..") {
            const filePath = joinPath(activeTab.path, fileToPreview.name);
            if (fileToPreview.is_dir) {
              // Calculate folder size on Space (Total Commander behavior)
              try {
                const size = await invoke<number>('calculate_folder_size', { path: filePath });
                // Update the file's size in the store
                const updatedFiles = [...activeTab.files];
                updatedFiles[activeTab.cursorIndex] = { ...fileToPreview, size };
                state.setFiles(activeSide, updatedFiles);
              } catch (err) {
                state.setOperationError(`Size calculation failed: ${err}`);
              }
              state.toggleSelection(activeSide);
              state.moveCursor(activeSide, 1);
            } else {
              // Preview file with Quick Look
              try {
                await invoke('preview_file', { path: filePath });
              } catch (err) {
                state.setOperationError(`QuickLook failed: ${err}`);
              }
            }
          } else {
             state.toggleSelection(activeSide);
             state.moveCursor(activeSide, 1);
          }
          break;
        case 'Enter': {
          e.preventDefault();
          if (activeTab.cursorIndex === -1 && activeTab.path !== "/") {
              const parentPath = activeTab.path.substring(0, activeTab.path.lastIndexOf('/')) || '/';
              setPath(activeSide, parentPath);
              break;
          }

          const file = activeTab.files[activeTab.cursorIndex];
          if (file) {
            const isArchiveFile = /\.(zip|tar|gz|tgz)$/i.test(file.name);
            if (file.is_dir || isArchiveFile) {
              const newPath = activeTab.path === "/" ? `/${file.name}` : `${activeTab.path}/${file.name}`;
              setPath(activeSide, newPath);
            } else {
              const filePath = joinPath(activeTab.path, file.name);
              try {
                await invoke('open_with_default', { path: filePath });
              } catch (err) {
                setOperationError(`Failed to open: ${err}`);
              }
            }
          }
          }
          break;
        case 'Delete':
          e.preventDefault();
          handleHotkeyAction('delete');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);
}