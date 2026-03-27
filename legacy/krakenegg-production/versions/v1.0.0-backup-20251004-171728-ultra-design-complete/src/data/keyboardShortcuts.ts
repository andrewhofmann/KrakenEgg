import { KeyboardShortcuts, KeyboardCategory } from '../types';

export const defaultKeyboardShortcuts: KeyboardShortcuts = {
  // Function Keys (F1-F12)
  'F1': { action: 'help', description: 'Show help documentation', category: KeyboardCategory.Tools },
  'F2': { action: 'refresh', description: 'Refresh current panel', category: KeyboardCategory.Navigation },
  'F3': { action: 'view', description: 'View selected file', category: KeyboardCategory.FileOperations },
  'F4': { action: 'edit', description: 'Edit selected file', category: KeyboardCategory.FileOperations },
  'F5': { action: 'copy', description: 'Copy files to opposite panel', category: KeyboardCategory.FileOperations },
  'F6': { action: 'move', description: 'Move/rename files', category: KeyboardCategory.FileOperations },
  'F7': { action: 'createDirectory', description: 'Create new directory', category: KeyboardCategory.FileOperations },
  'F8': { action: 'delete', description: 'Delete selected files', category: KeyboardCategory.FileOperations },
  'F9': { action: 'activateMenu', description: 'Activate top menu', category: KeyboardCategory.Navigation },
  'F10': { action: 'menuControl', description: 'Menu control', category: KeyboardCategory.Navigation },
  'F11': { action: 'extendedView', description: 'Extended view mode', category: KeyboardCategory.View },
  'F12': { action: 'briefView', description: 'Brief view mode', category: KeyboardCategory.View },

  // Ctrl + Function Keys
  'Ctrl+F1': { action: 'briefDisplay', description: 'Brief display mode', category: KeyboardCategory.View },
  'Ctrl+F2': { action: 'fullDetails', description: 'Full details view', category: KeyboardCategory.View },
  'Ctrl+F3': { action: 'sortByName', description: 'Sort by name', category: KeyboardCategory.View },
  'Ctrl+F4': { action: 'sortByExtension', description: 'Sort by extension', category: KeyboardCategory.View },
  'Ctrl+F5': { action: 'sortByDate', description: 'Sort by date', category: KeyboardCategory.View },
  'Ctrl+F6': { action: 'sortBySize', description: 'Sort by size', category: KeyboardCategory.View },
  'Ctrl+F8': { action: 'directoryTree', description: 'Show directory tree', category: KeyboardCategory.View },
  'Ctrl+F11': { action: 'showPrograms', description: 'Show executable files only', category: KeyboardCategory.View },
  'Ctrl+F12': { action: 'showCustom', description: 'Show custom file types', category: KeyboardCategory.View },

  // Alt + Function Keys
  'Alt+F1': { action: 'changeLeftDrive', description: 'Change left panel drive', category: KeyboardCategory.Navigation },
  'Alt+F2': { action: 'changeRightDrive', description: 'Change right panel drive', category: KeyboardCategory.Navigation },
  'Alt+F4': { action: 'exit', description: 'Exit application', category: KeyboardCategory.Tools },
  'Alt+F5': { action: 'packFiles', description: 'Create archive', category: KeyboardCategory.Archive },
  'Alt+F6': { action: 'unpackFiles', description: 'Extract archive', category: KeyboardCategory.Archive },
  'Alt+F7': { action: 'findFiles', description: 'Find files', category: KeyboardCategory.Search },
  'Alt+F9': { action: 'unpackArchive', description: 'Extract archive (alt)', category: KeyboardCategory.Archive },
  'Alt+F11': { action: 'leftDirectoryBar', description: 'Toggle left directory bar', category: KeyboardCategory.View },
  'Alt+F12': { action: 'rightDirectoryBar', description: 'Toggle right directory bar', category: KeyboardCategory.View },

  // Shift + Function Keys
  'Shift+F2': { action: 'compareLists', description: 'Compare file lists', category: KeyboardCategory.Tools },
  'Shift+F4': { action: 'createFile', description: 'Create new file', category: KeyboardCategory.FileOperations },
  'Shift+F5': { action: 'copyName', description: 'Copy filename to clipboard', category: KeyboardCategory.FileOperations },
  'Shift+F6': { action: 'renameFile', description: 'Rename file inline', category: KeyboardCategory.FileOperations },
  'Shift+F10': { action: 'contextMenu', description: 'Show context menu', category: KeyboardCategory.Navigation },

  // Basic File Operations
  'Ctrl+C': { action: 'copyToClipboard', description: 'Copy to clipboard', category: KeyboardCategory.FileOperations },
  'Ctrl+X': { action: 'cutToClipboard', description: 'Cut to clipboard', category: KeyboardCategory.FileOperations },
  'Ctrl+V': { action: 'pasteFromClipboard', description: 'Paste from clipboard', category: KeyboardCategory.FileOperations },
  'Delete': { action: 'delete', description: 'Delete files', category: KeyboardCategory.FileOperations },
  'Shift+Delete': { action: 'permanentDelete', description: 'Permanent delete', category: KeyboardCategory.FileOperations },

  // Advanced File Operations
  'Ctrl+M': { action: 'multiRename', description: 'Multi-rename tool', category: KeyboardCategory.Tools },
  'Ctrl+B': { action: 'viewBranch', description: 'View all files in subdirectories', category: KeyboardCategory.View },
  'Ctrl+Z': { action: 'undo', description: 'Undo last operation', category: KeyboardCategory.FileOperations },
  'Ctrl+Y': { action: 'redo', description: 'Redo operation', category: KeyboardCategory.FileOperations },

  // Panel Navigation
  'Tab': { action: 'switchPanel', description: 'Switch between panels', category: KeyboardCategory.Navigation },
  'Ctrl+U': { action: 'exchangeDirectories', description: 'Exchange directories', category: KeyboardCategory.Navigation },
  'Cmd+U': { action: 'exchangeDirectories', description: 'Exchange directories (macOS)', category: KeyboardCategory.Navigation },
  'Ctrl+ArrowRight': { action: 'openInRight', description: 'Open in right panel', category: KeyboardCategory.Navigation },
  'Ctrl+ArrowLeft': { action: 'openInLeft', description: 'Open in left panel', category: KeyboardCategory.Navigation },

  // Directory Navigation
  'Enter': { action: 'enterDirectory', description: 'Enter directory or execute', category: KeyboardCategory.Navigation },
  'Backspace': { action: 'parentDirectory', description: 'Go to parent directory', category: KeyboardCategory.Navigation },
  'Ctrl+PageUp': { action: 'upOneLevel', description: 'Go up one level', category: KeyboardCategory.Navigation },
  'Alt+ArrowLeft': { action: 'back', description: 'Go back in history', category: KeyboardCategory.Navigation },
  'Alt+ArrowRight': { action: 'forward', description: 'Go forward in history', category: KeyboardCategory.Navigation },
  'Ctrl+D': { action: 'directoryHotlist', description: 'Directory bookmarks', category: KeyboardCategory.Navigation },

  // Quick Navigation
  'Ctrl+Shift+G': { action: 'goToDirectory', description: 'Go to directory', category: KeyboardCategory.Navigation },
  'Ctrl+R': { action: 'refresh', description: 'Refresh directory', category: KeyboardCategory.Navigation },
  'Ctrl+S': { action: 'quickFilter', description: 'Quick filter files', category: KeyboardCategory.Search },
  '/': { action: 'rootDirectory', description: 'Go to root', category: KeyboardCategory.Navigation },
  '\\': { action: 'rootDirectoryAlt', description: 'Go to root (alt)', category: KeyboardCategory.Navigation },

  // File Selection
  'Space': { action: 'toggleSelection', description: 'Toggle selection', category: KeyboardCategory.Selection },
  'Insert': { action: 'toggleAndAdvance', description: 'Toggle selection and advance', category: KeyboardCategory.Selection },
  'Ctrl+A': { action: 'selectAll', description: 'Select all files', category: KeyboardCategory.Selection },
  'Ctrl+Shift+A': { action: 'deselectAll', description: 'Deselect all files', category: KeyboardCategory.Selection },
  'NumpadAdd': { action: 'expandSelection', description: 'Expand selection by pattern', category: KeyboardCategory.Selection },
  'NumpadSubtract': { action: 'shrinkSelection', description: 'Shrink selection by pattern', category: KeyboardCategory.Selection },
  'NumpadMultiply': { action: 'invertSelection', description: 'Invert selection', category: KeyboardCategory.Selection },

  // Range Selection
  'Shift+ArrowDown': { action: 'extendSelectionDown', description: 'Extend selection down', category: KeyboardCategory.Selection },
  'Shift+ArrowUp': { action: 'extendSelectionUp', description: 'Extend selection up', category: KeyboardCategory.Selection },
  'Shift+PageDown': { action: 'extendPageDown', description: 'Extend selection page down', category: KeyboardCategory.Selection },
  'Shift+PageUp': { action: 'extendPageUp', description: 'Extend selection page up', category: KeyboardCategory.Selection },
  'Shift+End': { action: 'extendToEnd', description: 'Extend selection to end', category: KeyboardCategory.Selection },
  'Shift+Home': { action: 'extendToStart', description: 'Extend selection to start', category: KeyboardCategory.Selection },

  // Archive Operations
  'Ctrl+Alt+F5': { action: 'packWithOptions', description: 'Pack files with options', category: KeyboardCategory.Archive },

  // Search Operations
  'Ctrl+Alt+F7': { action: 'findInArchives', description: 'Find in archives', category: KeyboardCategory.Search },
  'Ctrl+G': { action: 'goToLine', description: 'Go to line (in viewer)', category: KeyboardCategory.Navigation },
  'Ctrl+F': { action: 'findText', description: 'Find text', category: KeyboardCategory.Search },
  'F3+InSearch': { action: 'findNext', description: 'Find next', category: KeyboardCategory.Search },
  'Shift+F3': { action: 'findPrevious', description: 'Find previous', category: KeyboardCategory.Search },

  // View Modes
  'Ctrl+Digit1': { action: 'briefView', description: 'Brief view', category: KeyboardCategory.View },
  'Ctrl+2': { action: 'fullView', description: 'Full view', category: KeyboardCategory.View },
  'Ctrl+3': { action: 'customColumns', description: 'Custom columns', category: KeyboardCategory.View },
  'Ctrl+4': { action: 'customView', description: 'Custom view', category: KeyboardCategory.View },

  // Display Options
  'Ctrl+H': { action: 'showHidden', description: 'Toggle hidden files', category: KeyboardCategory.View },
  'Ctrl+Shift+H': { action: 'showSystem', description: 'Toggle system files', category: KeyboardCategory.View },
  'Ctrl+T': { action: 'thumbnailView', description: 'Toggle thumbnails', category: KeyboardCategory.View },
  'Ctrl+Q': { action: 'quickView', description: 'Toggle quick view', category: KeyboardCategory.View },

  // Network and FTP
  'Ctrl+Shift+F': { action: 'disconnectFTP', description: 'Disconnect FTP', category: KeyboardCategory.Tools },
  'Ctrl+N': { action: 'newFTPConnection', description: 'New FTP connection', category: KeyboardCategory.Tools },
  'Ctrl+Shift+N': { action: 'ftpDownload', description: 'FTP download', category: KeyboardCategory.Tools },
  'Ctrl+K': { action: 'network', description: 'Open network', category: KeyboardCategory.Navigation },
  'Ctrl+Shift+K': { action: 'mapNetworkDrive', description: 'Map network drive', category: KeyboardCategory.Tools },

  // Tab Management
  'Ctrl+W': { action: 'closeTab', description: 'Close tab', category: KeyboardCategory.Navigation },
  'Ctrl+Shift+W': { action: 'closeAllTabs', description: 'Close all tabs', category: KeyboardCategory.Navigation },
  'Ctrl+Tab': { action: 'nextTab', description: 'Next tab', category: KeyboardCategory.Navigation },
  'Ctrl+Shift+Tab': { action: 'previousTab', description: 'Previous tab', category: KeyboardCategory.Navigation },

  // Window Management
  'F11+Window': { action: 'fullscreen', description: 'Toggle fullscreen', category: KeyboardCategory.View },
  'Ctrl+Alt+L': { action: 'lock', description: 'Lock application', category: KeyboardCategory.Tools },

  // Utility Functions
  'Ctrl+Alt+C': { action: 'calculate', description: 'Calculate directory sizes', category: KeyboardCategory.Tools },
  'Ctrl+Alt+S': { action: 'synchronize', description: 'Synchronize directories', category: KeyboardCategory.Tools },
  'Ctrl+Alt+V': { action: 'versionInfo', description: 'Show version info', category: KeyboardCategory.Tools },
  'Ctrl+Alt+P': { action: 'printList', description: 'Print file list', category: KeyboardCategory.Tools },

  // Configuration
  'Ctrl+O': { action: 'options', description: 'Open options', category: KeyboardCategory.Tools },
  'Ctrl+Shift+O': { action: 'layoutOptions', description: 'Layout options', category: KeyboardCategory.Tools },

  // Command Line
  'Ctrl+ArrowDown': { action: 'commandHistory', description: 'Command history', category: KeyboardCategory.Tools },
  'Ctrl+Enter': { action: 'executeCommand', description: 'Execute command', category: KeyboardCategory.Tools },
  'Ctrl+Shift+Enter': { action: 'executeAsAdmin', description: 'Execute as admin', category: KeyboardCategory.Tools },

  // macOS-specific shortcuts
  'Meta+C': { action: 'copyToClipboard', description: 'Copy to clipboard (macOS)', category: KeyboardCategory.FileOperations },
  'Cmd+X': { action: 'cutToClipboard', description: 'Cut to clipboard (macOS)', category: KeyboardCategory.FileOperations },
  'Cmd+V': { action: 'pasteFromClipboard', description: 'Paste from clipboard (macOS)', category: KeyboardCategory.FileOperations },
  'Cmd+A': { action: 'selectAll', description: 'Select all (macOS)', category: KeyboardCategory.Selection },
  'Cmd+Z': { action: 'undo', description: 'Undo (macOS)', category: KeyboardCategory.FileOperations },
  'Cmd+Shift+Z': { action: 'redo', description: 'Redo (macOS)', category: KeyboardCategory.FileOperations },
  'Cmd+N': { action: 'newTab', description: 'New tab (macOS)', category: KeyboardCategory.Navigation },
  'Cmd+W': { action: 'closeTab', description: 'Close tab (macOS)', category: KeyboardCategory.Navigation },
  'Cmd+T': { action: 'newTab', description: 'New tab (macOS)', category: KeyboardCategory.Navigation },
  'Cmd+R': { action: 'refresh', description: 'Refresh (macOS)', category: KeyboardCategory.Navigation },
  'Cmd+F': { action: 'findText', description: 'Find (macOS)', category: KeyboardCategory.Search },
  'Cmd+G': { action: 'findNext', description: 'Find next (macOS)', category: KeyboardCategory.Search },
  'Cmd+Shift+G': { action: 'findPrevious', description: 'Find previous (macOS)', category: KeyboardCategory.Search },
  'Cmd+Q': { action: 'exit', description: 'Quit application (macOS)', category: KeyboardCategory.Tools },
  'Cmd+,': { action: 'options', description: 'Preferences (macOS)', category: KeyboardCategory.Tools },

  // Additional navigation
  'ArrowUp': { action: 'navigateUp', description: 'Navigate up', category: KeyboardCategory.Navigation },
  'ArrowDown': { action: 'navigateDown', description: 'Navigate down', category: KeyboardCategory.Navigation },
  'ArrowLeft': { action: 'navigateLeft', description: 'Navigate left', category: KeyboardCategory.Navigation },
  'ArrowRight': { action: 'navigateRight', description: 'Navigate right', category: KeyboardCategory.Navigation },
  'PageUp': { action: 'pageUp', description: 'Page up', category: KeyboardCategory.Navigation },
  'PageDown': { action: 'pageDown', description: 'Page down', category: KeyboardCategory.Navigation },
  'Home': { action: 'goToStart', description: 'Go to start', category: KeyboardCategory.Navigation },
  'End': { action: 'goToEnd', description: 'Go to end', category: KeyboardCategory.Navigation },

  // Quick access
  'Escape': { action: 'cancel', description: 'Cancel operation', category: KeyboardCategory.Tools },
  'Cmd+Shift+P': { action: 'commandPalette', description: 'Command palette', category: KeyboardCategory.Tools },
  'Cmd+?': { action: 'keyboardHelp', description: 'Keyboard shortcuts help', category: KeyboardCategory.Tools },
};