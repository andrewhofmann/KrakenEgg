// Core file system types
export interface FileInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  modified: Date;
  created: Date;
  isDirectory: boolean;
  isHidden: boolean;
  permissions: FilePermissions;
  extension?: string;
  type: FileType;
  icon?: string;
}

export interface FilePermissions {
  readable: boolean;
  writable: boolean;
  executable: boolean;
  owner: string;
  group: string;
  mode: string;
}

export enum FileType {
  Directory = 'directory',
  File = 'file',
  Archive = 'archive',
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  Document = 'document',
  Code = 'code',
  Executable = 'executable',
  Link = 'link'
}

// Panel and UI types
export interface PanelState {
  id: string;
  currentPath: string;
  files: FileInfo[];
  selectedFiles: Set<string>;
  focusedFile: string | null;
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
  showHidden: boolean;
  tabs: PanelTab[];
  activeTab: string;
  history: string[];
  historyIndex: number;
}

export interface PanelTab {
  id: string;
  name: string;
  path: string;
  isActive: boolean;
}

export enum ViewMode {
  Brief = 'brief',
  Detailed = 'detailed',
  Thumbnails = 'thumbnails',
  Tree = 'tree'
}

export enum SortBy {
  Name = 'name',
  Size = 'size',
  Modified = 'modified',
  Extension = 'extension',
  Type = 'type'
}

export enum SortOrder {
  Ascending = 'asc',
  Descending = 'desc'
}

// Application state types
export interface AppState {
  leftPanel: PanelState;
  rightPanel: PanelState;
  activePanel: 'left' | 'right';
  theme: Theme;
  showCommandLine: boolean;
  showStatusBar: boolean;
  activeDialog: string | null;
  operations: FileOperation[];
  keyboardShortcuts: KeyboardShortcuts;
}

export enum Theme {
  Light = 'light',
  Dark = 'dark',
  Auto = 'auto'
}

// File operations
export interface FileOperation {
  id: string;
  type: OperationType;
  source: string[];
  destination: string;
  progress: number;
  status: OperationStatus;
  startTime: Date;
  estimatedTime?: number;
  error?: string;
}

export enum OperationType {
  Copy = 'copy',
  Move = 'move',
  Delete = 'delete',
  Archive = 'archive',
  Extract = 'extract'
}

export enum OperationStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Error = 'error',
  Cancelled = 'cancelled'
}

// Keyboard shortcuts
export interface KeyboardShortcuts {
  [key: string]: KeyboardAction;
}

export interface KeyboardAction {
  action: string;
  description: string;
  category: KeyboardCategory;
}

export enum KeyboardCategory {
  FileOperations = 'fileOperations',
  Navigation = 'navigation',
  Selection = 'selection',
  View = 'view',
  Archive = 'archive',
  Search = 'search',
  Tools = 'tools'
}

// Dialog types
export interface Dialog {
  id: string;
  type: DialogType;
  title: string;
  data?: any;
}

export enum DialogType {
  Copy = 'copy',
  Move = 'move',
  Delete = 'delete',
  Rename = 'rename',
  MultiRename = 'multiRename',
  CreateDirectory = 'createDirectory',
  CreateFile = 'createFile',
  Search = 'search',
  Archive = 'archive',
  Extract = 'extract',
  FTP = 'ftp',
  Settings = 'settings',
  About = 'about',
  KeyboardHelp = 'keyboardHelp'
}

// Search types
export interface SearchCriteria {
  pattern: string;
  path: string;
  includeSubdirectories: boolean;
  caseSensitive: boolean;
  useRegex: boolean;
  fileTypes: string[];
  dateRange?: DateRange;
  sizeRange?: SizeRange;
  content?: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface SizeRange {
  min: number;
  max: number;
  unit: 'bytes' | 'KB' | 'MB' | 'GB';
}

export interface SearchResult {
  file: FileInfo;
  matches?: SearchMatch[];
}

export interface SearchMatch {
  line: number;
  column: number;
  text: string;
  context: string;
}

// Archive types
export interface ArchiveEntry {
  name: string;
  path: string;
  size: number;
  compressedSize: number;
  modified: Date;
  isDirectory: boolean;
  compressionRatio: number;
}

export interface ArchiveInfo {
  name: string;
  format: ArchiveFormat;
  totalSize: number;
  compressedSize: number;
  fileCount: number;
  directoryCount: number;
  compressionRatio: number;
  isPasswordProtected: boolean;
  created: Date;
  entries: ArchiveEntry[];
}

export enum ArchiveFormat {
  ZIP = 'zip',
  SevenZ = '7z',
  RAR = 'rar',
  TAR = 'tar',
  TARGZ = 'tar.gz',
  TARBZ2 = 'tar.bz2',
  GZIP = 'gz',
  BZIP2 = 'bz2'
}

// FTP types
export interface FTPConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  protocol: FTPProtocol;
  passive: boolean;
  secure: boolean;
  keyFile?: string;
}

export enum FTPProtocol {
  FTP = 'ftp',
  FTPS = 'ftps',
  SFTP = 'sftp'
}

// Settings types
export interface Settings {
  appearance: AppearanceSettings;
  behavior: BehaviorSettings;
  keyboard: KeyboardSettings;
  network: NetworkSettings;
  plugins: PluginSettings;
}

export interface AppearanceSettings {
  theme: Theme;
  fontSize: number;
  iconSize: number;
  showThumbnails: boolean;
  showHiddenFiles: boolean;
  colorScheme: string;
  fontFamily: string;
}

export interface BehaviorSettings {
  confirmDelete: boolean;
  confirmOverwrite: boolean;
  useRecycleBin: boolean;
  autoRefresh: boolean;
  followSymlinks: boolean;
  sortDirectoriesFirst: boolean;
  rememberWindowState: boolean;
  autoSaveSettings: boolean;
}

export interface KeyboardSettings {
  shortcuts: KeyboardShortcuts;
  globalShortcuts: boolean;
  customBindings: { [key: string]: string };
}

export interface NetworkSettings {
  timeout: number;
  maxConnections: number;
  proxySettings?: ProxySettings;
  bufferSize: number;
}

export interface ProxySettings {
  enabled: boolean;
  host: string;
  port: number;
  username?: string;
  password?: string;
  type: 'http' | 'socks4' | 'socks5';
}

export interface PluginSettings {
  enabled: boolean;
  autoUpdate: boolean;
  allowUnsigned: boolean;
  trustedSources: string[];
}

// Context menu types
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  separator?: boolean;
  disabled?: boolean;
  submenu?: ContextMenuItem[];
  action: () => void;
}

// Event types
export interface KeyboardEvent {
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

export interface FileEvent {
  type: 'select' | 'focus' | 'doubleClick' | 'contextMenu';
  file: FileInfo;
  panel: 'left' | 'right';
}

export interface PanelEvent {
  type: 'navigate' | 'refresh' | 'switch';
  panel: 'left' | 'right';
  data?: any;
}

// Column configuration for detailed view
export interface ColumnConfig {
  id: string;
  label: string;
  width: number;
  visible: boolean;
  sortable: boolean;
  resizable: boolean;
  alignment: 'left' | 'center' | 'right';
  format?: (value: any) => string;
}