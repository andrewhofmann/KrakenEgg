// Core file system types - matching src-tauri/src/types.rs
export interface FileInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  is_directory: boolean;
  isDirectory: boolean; // alias for compatibility
  is_hidden: boolean;
  isHidden: boolean; // alias for compatibility
  is_symlink: boolean;
  created: string | Date; // support both string and Date
  modified: string | Date; // support both string and Date
  accessed: string | Date; // support both string and Date
  permissions: FilePermissions;
  extension: string | null | undefined; // support undefined
  mime_type: string | null;
  type?: FileType; // legacy field for backward compatibility
}

export interface FilePermissions {
  readable: boolean;
  writable: boolean;
  executable: boolean;
  mode: number | string; // support both number and string for compatibility
  owner?: string; // legacy field
  group?: string; // legacy field
}

export interface DirectoryListing {
  path: string;
  files: FileInfo[];
  total_size: number;
  file_count: number;
  directory_count: number;
}

export interface FileOperation {
  id: string;
  operation_type: OperationType;
  source: string;
  destination: string | null;
  progress: number;
  status: OperationStatus;
  error: string | null;
  bytes_processed: number;
  total_bytes: number;
  files_processed: number;
  total_files: number;
  started_at: string;
  estimated_completion: string | null;
}

export enum OperationType {
  Copy = "Copy",
  Move = "Move",
  Delete = "Delete",
  CreateDirectory = "CreateDirectory",
  Rename = "Rename",
  CreateArchive = "CreateArchive",
  ExtractArchive = "ExtractArchive",
}

export enum OperationStatus {
  Pending = "Pending",
  InProgress = "InProgress",
  Paused = "Paused",
  Completed = "Completed",
  Failed = "Failed",
  Cancelled = "Cancelled",
  Running = "running", // legacy alias for InProgress
}

export interface ArchiveInfo {
  path: string;
  format: ArchiveFormat;
  entries: ArchiveEntry[];
  total_size: number;
  compressed_size: number;
  compression_ratio: number;
}

export enum ArchiveFormat {
  Zip = "Zip",
  SevenZ = "SevenZ",
  Tar = "Tar",
  TarGz = "TarGz",
  TarBz2 = "TarBz2",
  Rar = "Rar",
}

export interface ArchiveEntry {
  name: string;
  path: string;
  size: number;
  compressed_size: number;
  is_directory: boolean;
  modified: string;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  home_directory: string;
  current_directory: string;
  temp_directory: string;
  total_memory: number;
  available_memory: number;
  cpu_count: number;
}

export interface NetworkConnection {
  id: string;
  protocol: NetworkProtocol;
  host: string;
  port: number;
  username: string | null;
  current_path: string;
  status: ConnectionStatus;
}

export enum NetworkProtocol {
  Ftp = "Ftp",
  Sftp = "Sftp",
  Ftps = "Ftps",
}

export type ConnectionStatus =
  | "Disconnected"
  | "Connecting"
  | "Connected"
  | { Error: string };

// Application state types
export interface Tab {
  id: string;
  name: string;
  path: string;
  isActive: boolean;
}

export enum ViewMode {
  Brief = 'brief',
  Detailed = 'detailed',
  Thumbnails = 'thumbnails'
}

export enum SortBy {
  Name = 'name',
  Size = 'size',
  Modified = 'modified',
  Extension = 'extension',
  Type = 'type' // legacy field for compatibility
}

export enum SortOrder {
  Ascending = 'asc',
  Descending = 'desc'
}

export interface PanelState {
  id: string;
  currentPath: string;
  files: FileInfo[];
  selectedFiles: Set<string>;
  focusedFile: string | null;
  selectionAnchor: string | null;
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
  showHidden: boolean;
  tabs: Tab[];
  activeTab: string;
  history: string[];
  historyIndex: number;
}

export enum Theme {
  Light = 'light',
  Dark = 'dark'
}

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  keys: string[];
  action: string;
  category: string;
  enabled: boolean;
  modifiers?: string[];
  condition?: string;
}

export interface AppState {
  leftPanel: PanelState;
  rightPanel: PanelState;
  activePanel: 'left' | 'right';
  theme: Theme;
  showCommandLine: boolean;
  showStatusBar: boolean;
  activeDialog: string | null;
  operations: FileOperation[];
  keyboardShortcuts: KeyboardShortcut[];
}

// Legacy type aliases for backward compatibility
export type KeyboardShortcuts = KeyboardShortcut[];
export type PanelTab = Tab;
export type FileType = 'file' | 'directory' | 'symlink' | 'archive' | 'unknown';

export interface KeyboardCategory {
  id: string;
  name: string;
  description: string;
}