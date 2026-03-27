import { create } from 'zustand';
import { TauriFileSystem, DirectoryListing, FileInfo, SystemInfo, handleTauriError } from '../lib/tauri';
import { logger, logTimingAsync } from '../lib/logger';

interface FileSystemState {
  // Current directories
  leftPanelListing: DirectoryListing | null;
  rightPanelListing: DirectoryListing | null;

  // System info
  systemInfo: SystemInfo | null;

  // Loading states
  isLoadingLeft: boolean;
  isLoadingRight: boolean;

  // Error states
  leftPanelError: string | null;
  rightPanelError: string | null;

  // Selected files
  leftPanelSelected: Set<string>;
  rightPanelSelected: Set<string>;

  // Actions
  navigateLeftPanel: (path: string) => Promise<void>;
  navigateRightPanel: (path: string) => Promise<void>;
  refreshLeftPanel: () => Promise<void>;
  refreshRightPanel: () => Promise<void>;
  selectFileLeft: (fileId: string) => void;
  selectFileRight: (fileId: string) => void;
  clearSelectionLeft: () => void;
  clearSelectionRight: () => void;
  createDirectory: (panelSide: 'left' | 'right', path: string) => Promise<void>;
  deleteFile: (panelSide: 'left' | 'right', path: string) => Promise<void>;
  renameFile: (panelSide: 'left' | 'right', oldPath: string, newPath: string) => Promise<void>;
  copyFile: (source: string, destination: string) => Promise<void>;
  moveFile: (source: string, destination: string) => Promise<void>;
  loadSystemInfo: () => Promise<void>;
  goToHome: (panelSide: 'left' | 'right') => Promise<void>;
  goToDesktop: (panelSide: 'left' | 'right') => Promise<void>;
  goToDocuments: (panelSide: 'left' | 'right') => Promise<void>;
  goToApplications: (panelSide: 'left' | 'right') => Promise<void>;
}

export const useFileSystemStore = create<FileSystemState>((set, get) => ({
  // Initial state
  leftPanelListing: null,
  rightPanelListing: null,
  systemInfo: null,
  isLoadingLeft: false,
  isLoadingRight: false,
  leftPanelError: null,
  rightPanelError: null,
  leftPanelSelected: new Set(),
  rightPanelSelected: new Set(),

  // Navigation actions
  navigateLeftPanel: async (path: string) => {
    logger.navigation(`LEFT PANEL: Starting navigation to '${path}'`);
    set({ isLoadingLeft: true, leftPanelError: null });

    try {
      const listing = await logTimingAsync(`LEFT PANEL navigate to ${path}`, async () => {
        logger.tauri(`LEFT PANEL: Calling TauriFileSystem.navigateToPath with '${path}'`);
        return await TauriFileSystem.navigateToPath(path);
      });

      logger.navigation(`LEFT PANEL: Navigation successful to '${path}' - ${listing.file_count} files, ${listing.directory_count} dirs`, listing);
      set({ leftPanelListing: listing, isLoadingLeft: false, leftPanelSelected: new Set() });
    } catch (error) {
      const errorMessage = handleTauriError(error);
      logger.error('NAVIGATION', `LEFT PANEL: Navigation failed for '${path}': ${errorMessage}`, error);
      set({ leftPanelError: errorMessage, isLoadingLeft: false });
    }
  },

  navigateRightPanel: async (path: string) => {
    console.log('🔄 RIGHT: Navigating to path:', path);
    set({ isLoadingRight: true, rightPanelError: null });
    try {
      console.log('🔄 RIGHT: Calling TauriFileSystem.navigateToPath...');
      const listing = await TauriFileSystem.navigateToPath(path);
      console.log('✅ RIGHT: Got listing:', listing);
      set({ rightPanelListing: listing, isLoadingRight: false, rightPanelSelected: new Set() });
    } catch (error) {
      console.error('❌ RIGHT: Navigation error:', error);
      set({ rightPanelError: handleTauriError(error), isLoadingRight: false });
    }
  },

  refreshLeftPanel: async () => {
    const { leftPanelListing } = get();
    if (leftPanelListing) {
      await get().navigateLeftPanel(leftPanelListing.path);
    }
  },

  refreshRightPanel: async () => {
    const { rightPanelListing } = get();
    if (rightPanelListing) {
      await get().navigateRightPanel(rightPanelListing.path);
    }
  },

  // Selection actions
  selectFileLeft: (fileId: string) => {
    set(state => {
      const newSelected = new Set(state.leftPanelSelected);
      if (newSelected.has(fileId)) {
        newSelected.delete(fileId);
      } else {
        newSelected.add(fileId);
      }
      return { leftPanelSelected: newSelected };
    });
  },

  selectFileRight: (fileId: string) => {
    set(state => {
      const newSelected = new Set(state.rightPanelSelected);
      if (newSelected.has(fileId)) {
        newSelected.delete(fileId);
      } else {
        newSelected.add(fileId);
      }
      return { rightPanelSelected: newSelected };
    });
  },

  clearSelectionLeft: () => set({ leftPanelSelected: new Set() }),
  clearSelectionRight: () => set({ rightPanelSelected: new Set() }),

  // File operations
  createDirectory: async (panelSide: 'left' | 'right', path: string) => {
    try {
      await TauriFileSystem.createDirectory(path);
      // Refresh the appropriate panel
      if (panelSide === 'left') {
        await get().refreshLeftPanel();
      } else {
        await get().refreshRightPanel();
      }
    } catch (error) {
      const errorMessage = handleTauriError(error);
      if (panelSide === 'left') {
        set({ leftPanelError: errorMessage });
      } else {
        set({ rightPanelError: errorMessage });
      }
    }
  },

  deleteFile: async (panelSide: 'left' | 'right', path: string) => {
    try {
      await TauriFileSystem.deleteFile(path);
      // Refresh the appropriate panel
      if (panelSide === 'left') {
        await get().refreshLeftPanel();
      } else {
        await get().refreshRightPanel();
      }
    } catch (error) {
      const errorMessage = handleTauriError(error);
      if (panelSide === 'left') {
        set({ leftPanelError: errorMessage });
      } else {
        set({ rightPanelError: errorMessage });
      }
    }
  },

  renameFile: async (panelSide: 'left' | 'right', oldPath: string, newPath: string) => {
    try {
      await TauriFileSystem.renameFile(oldPath, newPath);
      // Refresh the appropriate panel
      if (panelSide === 'left') {
        await get().refreshLeftPanel();
      } else {
        await get().refreshRightPanel();
      }
    } catch (error) {
      const errorMessage = handleTauriError(error);
      if (panelSide === 'left') {
        set({ leftPanelError: errorMessage });
      } else {
        set({ rightPanelError: errorMessage });
      }
    }
  },

  copyFile: async (source: string, destination: string) => {
    try {
      await TauriFileSystem.copyFile(source, destination);
      // Refresh both panels
      await Promise.all([
        get().refreshLeftPanel(),
        get().refreshRightPanel()
      ]);
    } catch (error) {
      // Set error on both panels since we don't know which one contains the destination
      const errorMessage = handleTauriError(error);
      set({ leftPanelError: errorMessage, rightPanelError: errorMessage });
    }
  },

  moveFile: async (source: string, destination: string) => {
    try {
      await TauriFileSystem.moveFile(source, destination);
      // Refresh both panels
      await Promise.all([
        get().refreshLeftPanel(),
        get().refreshRightPanel()
      ]);
    } catch (error) {
      // Set error on both panels since we don't know which one contains the destination
      const errorMessage = handleTauriError(error);
      set({ leftPanelError: errorMessage, rightPanelError: errorMessage });
    }
  },

  // System actions
  loadSystemInfo: async () => {
    try {
      const systemInfo = await TauriFileSystem.getSystemInfo();
      set({ systemInfo });
    } catch (error) {
      console.error('Failed to load system info:', handleTauriError(error));
    }
  },

  // Quick navigation
  goToHome: async (panelSide: 'left' | 'right') => {
    logger.navigation(`${panelSide.toUpperCase()} PANEL: Navigating to home directory`);

    try {
      const homePath = await logTimingAsync(`${panelSide.toUpperCase()} PANEL get home directory`, async () => {
        logger.tauri(`${panelSide.toUpperCase()} PANEL: Calling TauriFileSystem.getHomeDirectory`);
        return await TauriFileSystem.getHomeDirectory();
      });

      logger.navigation(`${panelSide.toUpperCase()} PANEL: Home directory resolved to '${homePath}'`);

      if (panelSide === 'left') {
        await get().navigateLeftPanel(homePath);
      } else {
        await get().navigateRightPanel(homePath);
      }
    } catch (error) {
      const errorMessage = handleTauriError(error);
      logger.error('NAVIGATION', `${panelSide.toUpperCase()} PANEL: Failed to get home directory: ${errorMessage}`, error);

      if (panelSide === 'left') {
        set({ leftPanelError: errorMessage });
      } else {
        set({ rightPanelError: errorMessage });
      }
    }
  },

  goToDesktop: async (panelSide: 'left' | 'right') => {
    try {
      const desktopPath = await TauriFileSystem.getDesktopDirectory();
      if (panelSide === 'left') {
        await get().navigateLeftPanel(desktopPath);
      } else {
        await get().navigateRightPanel(desktopPath);
      }
    } catch (error) {
      const errorMessage = handleTauriError(error);
      if (panelSide === 'left') {
        set({ leftPanelError: errorMessage });
      } else {
        set({ rightPanelError: errorMessage });
      }
    }
  },

  goToDocuments: async (panelSide: 'left' | 'right') => {
    try {
      const documentsPath = await TauriFileSystem.getDocumentsDirectory();
      if (panelSide === 'left') {
        await get().navigateLeftPanel(documentsPath);
      } else {
        await get().navigateRightPanel(documentsPath);
      }
    } catch (error) {
      const errorMessage = handleTauriError(error);
      if (panelSide === 'left') {
        set({ leftPanelError: errorMessage });
      } else {
        set({ rightPanelError: errorMessage });
      }
    }
  },

  goToApplications: async (panelSide: 'left' | 'right') => {
    try {
      const applicationsPath = await TauriFileSystem.getApplicationsDirectory();
      if (panelSide === 'left') {
        await get().navigateLeftPanel(applicationsPath);
      } else {
        await get().navigateRightPanel(applicationsPath);
      }
    } catch (error) {
      const errorMessage = handleTauriError(error);
      if (panelSide === 'left') {
        set({ leftPanelError: errorMessage });
      } else {
        set({ rightPanelError: errorMessage });
      }
    }
  },
}));