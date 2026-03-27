# KrakenEgg Application Architecture

## Overview
KrakenEgg is built using a modern, cross-platform architecture that prioritizes performance, maintainability, and user experience. The application follows a clean separation of concerns with a Rust backend for file operations and a React frontend for the user interface.

## Technology Stack

### Core Framework: Tauri
- **Frontend**: React 18+ with TypeScript
- **Backend**: Rust with Tauri framework
- **Bundler**: Vite for fast development builds
- **Styling**: Tailwind CSS for responsive design
- **State Management**: Zustand for lightweight state management
- **Testing**: Vitest + React Testing Library

### Why Tauri?
1. **Performance**: Native-level performance with minimal memory footprint (~4MB)
2. **Security**: Rust's memory safety + sandboxed frontend
3. **Size**: Tiny bundle size (<600KB) using system webview
4. **Cross-platform**: Single codebase for macOS, Windows, Linux
5. **Native Integration**: Direct access to system APIs

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React/TS)                  │
├─────────────────────────────────────────────────────────┤
│                    Tauri IPC Bridge                     │
├─────────────────────────────────────────────────────────┤
│                    Backend (Rust)                       │
├─────────────────────────────────────────────────────────┤
│                    System APIs                          │
└─────────────────────────────────────────────────────────┘
```

## Frontend Architecture (React/TypeScript)

### Component Structure
```
src/
├── components/
│   ├── common/           # Reusable UI components
│   ├── panels/           # File panel components (UltraFilePanel, UltraFileList, UltraTabHeaderBar)
│   │   ├── UltraFilePanel.tsx      # Main panel container with drag/drop
│   │   ├── UltraFileList.tsx       # Virtual scrolling file list with keyboard nav
│   │   ├── UltraTabHeaderBar.tsx   # Tab management and panel controls
│   │   └── UltraDirectoryPath.tsx  # Breadcrumb navigation
│   ├── dialogs/          # Modal dialogs
│   ├── layout/           # Layout components (StatusBar, MenuBar)
│   └── viewers/          # File viewers and editors
├── hooks/                # Custom React hooks
│   └── useKeyboardNavigation.ts    # Centralized keyboard handling
├── stores/               # Zustand stores
├── utils/                # Utility functions
│   ├── fileUtils.ts      # File operations and formatting
│   └── archiveUtils.ts   # Archive navigation and parsing
├── data/                 # Static data and configurations
│   ├── keyboardShortcuts.ts       # Keyboard shortcut definitions
│   └── mockFiles.ts      # Development file data
├── types/                # TypeScript type definitions
└── App.tsx              # Main application component
```

### Key Architectural Patterns

#### 1. Centralized Keyboard Navigation
- **Single Source of Truth**: All keyboard shortcuts defined in `keyboardShortcuts.ts`
- **Action-Based System**: Keyboard combinations map to semantic action names
- **Centralized Handler**: `useKeyboardNavigation.ts` handles all keyboard actions
- **Extensible Design**: Easy to add new shortcuts and actions

#### 2. Layout Shift Prevention
- **Space Reservation**: UI elements reserve space even when hidden
- **Transparent Styling**: Use transparent colors instead of conditional rendering
- **Fixed Positioning**: Critical UI elements use absolute positioning
- **Animation Constraints**: Avoid layout-affecting animations in favor of transform/opacity

#### 3. Virtual Archive Navigation
- **Path Parsing**: Archive paths like `/path/to/archive.zip/internal/file.txt`
- **Transparent Navigation**: Archives behave like directories in the UI
- **Efficient Mock System**: Generate virtual file structures for development
- **Breadcrumb Integration**: Archive navigation shows in path breadcrumbs

### State Management Strategy

#### Zustand Stores
```typescript
// File Manager Store
interface FileManagerStore {
  leftPanel: PanelState;
  rightPanel: PanelState;
  activePanel: 'left' | 'right';
  operations: FileOperation[];

  // Actions
  switchPanel: () => void;
  navigateToPath: (panel: Panel, path: string) => void;
  selectFiles: (panel: Panel, files: FileInfo[]) => void;
  executeOperation: (operation: FileOperation) => void;
}

// Settings Store
interface SettingsStore {
  theme: 'light' | 'dark' | 'auto';
  keyboardShortcuts: KeyboardMapping;
  panelLayout: PanelLayout;
  columnSettings: ColumnConfig[];

  // Actions
  updateTheme: (theme: Theme) => void;
  updateShortcuts: (shortcuts: KeyboardMapping) => void;
}

// UI Store
interface UIStore {
  showHiddenFiles: boolean;
  viewMode: ViewMode;
  splitPosition: number;
  activeDialog: string | null;

  // Actions
  toggleHiddenFiles: () => void;
  setViewMode: (mode: ViewMode) => void;
  showDialog: (dialog: string) => void;
}
```

### Component Architecture

#### Main Application Layout
```typescript
function App() {
  return (
    <div className="h-screen flex flex-col">
      <MenuBar />
      <Toolbar />
      <div className="flex-1 flex">
        <FilePanel side="left" />
        <PanelSplitter />
        <FilePanel side="right" />
      </div>
      <StatusBar />
      <CommandLine />
      <DialogManager />
    </div>
  );
}
```

#### File Panel Component
```typescript
interface FilePanelProps {
  side: 'left' | 'right';
}

function FilePanel({ side }: FilePanelProps) {
  const panel = useFileStore(state => state[`${side}Panel`]);

  return (
    <div className="flex-1 flex flex-col">
      <PanelHeader side={side} />
      <TabBar side={side} />
      <DirectoryPath side={side} />
      <FileList side={side} />
      <PanelFooter side={side} />
    </div>
  );
}
```

### Keyboard Navigation System

#### Event Handling Architecture
```typescript
// Global keyboard handler
function useGlobalKeyboard() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const action = getKeyboardAction(event);
      if (action) {
        event.preventDefault();
        executeAction(action);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}

// Keyboard mapping system
interface KeyboardMapping {
  [key: string]: KeyboardAction;
}

type KeyboardAction =
  | { type: 'file_operation'; operation: FileOperation }
  | { type: 'navigation'; direction: Direction }
  | { type: 'panel_action'; action: PanelAction }
  | { type: 'dialog'; dialog: string };
```

## Backend Architecture (Rust)

### Module Structure
```
src-tauri/
├── src/
│   ├── commands/         # Tauri command handlers
│   ├── file_system/      # File operations
│   ├── archive/          # Archive handling
│   ├── network/          # FTP/SFTP client
│   ├── search/           # File search engine
│   ├── plugins/          # Plugin system
│   └── main.rs          # Application entry point
├── Cargo.toml           # Rust dependencies
└── tauri.conf.json      # Tauri configuration
```

### Core Modules

#### File System Module
```rust
pub mod file_system {
    use std::path::PathBuf;

    #[derive(serde::Serialize, Clone)]
    pub struct FileInfo {
        pub name: String,
        pub path: PathBuf,
        pub size: u64,
        pub modified: SystemTime,
        pub is_directory: bool,
        pub permissions: FilePermissions,
        pub file_type: FileType,
    }

    pub async fn list_directory(path: &Path) -> Result<Vec<FileInfo>, Error> {
        // Implementation using async file operations
    }

    pub async fn copy_files(sources: Vec<PathBuf>, dest: PathBuf) -> Result<(), Error> {
        // Background file copying with progress reporting
    }

    pub async fn move_files(sources: Vec<PathBuf>, dest: PathBuf) -> Result<(), Error> {
        // File moving with conflict resolution
    }
}
```

#### Archive Module
```rust
pub mod archive {
    use zip::ZipArchive;

    pub trait ArchiveHandler {
        async fn list_contents(&self, path: &Path) -> Result<Vec<ArchiveEntry>, Error>;
        async fn extract_file(&self, entry: &str, dest: &Path) -> Result<(), Error>;
        async fn add_file(&self, file: &Path, archive_path: &str) -> Result<(), Error>;
    }

    pub struct ZipHandler;
    pub struct SevenZipHandler;
    pub struct TarHandler;

    impl ArchiveHandler for ZipHandler {
        // ZIP-specific implementation
    }
}
```

#### Network Module
```rust
pub mod network {
    use tokio_ftp::FtpStream;

    pub struct FtpClient {
        stream: FtpStream,
        config: FtpConfig,
    }

    impl FtpClient {
        pub async fn connect(config: FtpConfig) -> Result<Self, Error> {
            // FTP connection implementation
        }

        pub async fn list_directory(&mut self, path: &str) -> Result<Vec<FileInfo>, Error> {
            // Directory listing
        }

        pub async fn upload_file(&mut self, local: &Path, remote: &str) -> Result<(), Error> {
            // File upload with progress
        }
    }
}
```

### Command Handlers (Tauri Commands)

#### File Operations
```rust
#[tauri::command]
async fn get_directory_listing(path: String) -> Result<Vec<FileInfo>, String> {
    file_system::list_directory(&PathBuf::from(path))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn copy_files(sources: Vec<String>, destination: String) -> Result<(), String> {
    let sources: Vec<PathBuf> = sources.into_iter().map(PathBuf::from).collect();
    let dest = PathBuf::from(destination);

    file_system::copy_files(sources, dest)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn search_files(pattern: String, directory: String) -> Result<Vec<FileInfo>, String> {
    search::find_files(&pattern, &PathBuf::from(directory))
        .await
        .map_err(|e| e.to_string())
}
```

## Data Flow Architecture

### File Operation Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   UI Event  │───▶│  Frontend   │───▶│   Backend   │
│ (Key Press) │    │  (React)    │    │   (Rust)    │
└─────────────┘    └─────────────┘    └─────────────┘
                          │                   │
                          ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  UI Update  │◀───│State Update │◀───│File System  │
│             │    │ (Zustand)   │    │ Operation   │
└─────────────┘    └─────────────┘    └─────────────┘
```

### IPC Communication Pattern
```typescript
// Frontend: Invoke backend command
const files = await invoke<FileInfo[]>('get_directory_listing', {
  path: '/Users/username/Documents'
});

// Backend: Handle command
#[tauri::command]
async fn get_directory_listing(path: String) -> Result<Vec<FileInfo>, String> {
  // Implementation
}

// Frontend: Listen for progress events
await listen<ProgressEvent>('file-operation-progress', (event) => {
  updateProgressBar(event.payload.progress);
});

// Backend: Emit progress events
app.emit_all("file-operation-progress", ProgressEvent {
  progress: 50.0
}).unwrap();
```

## Plugin Architecture

### Plugin System Design
```rust
pub trait Plugin {
    fn name(&self) -> &str;
    fn version(&self) -> &str;
    fn init(&mut self, context: &PluginContext) -> Result<(), Error>;
}

pub trait ViewerPlugin: Plugin {
    fn supported_extensions(&self) -> Vec<&str>;
    fn can_view(&self, file: &FileInfo) -> bool;
    fn view_file(&self, file: &Path) -> Result<ViewResult, Error>;
}

pub trait ArchivePlugin: Plugin {
    fn supported_formats(&self) -> Vec<&str>;
    fn create_handler(&self) -> Box<dyn ArchiveHandler>;
}
```

### Plugin Loading System
```rust
pub struct PluginManager {
    plugins: HashMap<String, Box<dyn Plugin>>,
    viewers: Vec<Box<dyn ViewerPlugin>>,
    archives: Vec<Box<dyn ArchivePlugin>>,
}

impl PluginManager {
    pub fn load_plugin(&mut self, path: &Path) -> Result<(), Error> {
        // Load plugin from WASM or dynamic library
    }

    pub fn get_viewer_for_file(&self, file: &FileInfo) -> Option<&dyn ViewerPlugin> {
        self.viewers.iter().find(|v| v.can_view(file))
    }
}
```

## Performance Architecture

### Async Operation Management
```rust
pub struct OperationManager {
    active_operations: Arc<Mutex<HashMap<Uuid, OperationHandle>>>,
    max_concurrent: usize,
}

impl OperationManager {
    pub async fn execute_operation(&self, op: FileOperation) -> Result<Uuid, Error> {
        let id = Uuid::new_v4();
        let handle = tokio::spawn(async move {
            // Execute operation with progress reporting
        });

        self.active_operations.lock().unwrap().insert(id, handle);
        Ok(id)
    }

    pub fn cancel_operation(&self, id: Uuid) -> Result<(), Error> {
        // Cancel running operation
    }
}
```

### Memory Management
```typescript
// Frontend: Virtual scrolling for large file lists
function VirtualFileList({ files }: { files: FileInfo[] }) {
  const virtualized = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24, // Row height
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      {virtualized.getVirtualItems().map(virtualRow => (
        <FileRow
          key={virtualRow.index}
          file={files[virtualRow.index]}
          style={{
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }}
        />
      ))}
    </div>
  );
}
```

## Security Architecture

### Sandboxing Strategy
```json
// tauri.conf.json
{
  "tauri": {
    "security": {
      "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'",
      "dangerousinlinemarkup": false
    },
    "allowlist": {
      "all": false,
      "fs": {
        "readFile": true,
        "writeFile": true,
        "readDir": true,
        "createDir": true,
        "removeFile": true,
        "scope": ["$HOME/**", "/Volumes/**"]
      },
      "network": {
        "request": true,
        "scope": ["https://**", "ftp://**", "sftp://**"]
      }
    }
  }
}
```

### Permission Management
```rust
pub struct PermissionManager {
    allowed_paths: Vec<PathBuf>,
    network_permissions: NetworkPermissions,
}

impl PermissionManager {
    pub fn check_file_access(&self, path: &Path) -> Result<(), Error> {
        if !self.is_path_allowed(path) {
            return Err(Error::PermissionDenied);
        }
        Ok(())
    }

    pub fn check_network_access(&self, url: &Url) -> Result<(), Error> {
        // Validate network access permissions
    }
}
```

## Testing Architecture

### Frontend Testing
```typescript
// Component testing with React Testing Library
describe('FilePanel', () => {
  it('should display files correctly', async () => {
    const mockFiles = [
      { name: 'file1.txt', size: 1024, isDirectory: false },
      { name: 'folder1', size: 0, isDirectory: true },
    ];

    render(<FilePanel side="left" />);

    // Mock backend response
    when(invoke).calledWith('get_directory_listing').mockResolvedValue(mockFiles);

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
      expect(screen.getByText('folder1')).toBeInTheDocument();
    });
  });
});
```

### Backend Testing
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_file_operations() {
        let temp_dir = tempdir().unwrap();
        let source = temp_dir.path().join("source.txt");
        let dest = temp_dir.path().join("dest.txt");

        std::fs::write(&source, "test content").unwrap();

        let result = file_system::copy_files(vec![source], dest.clone()).await;
        assert!(result.is_ok());

        let content = std::fs::read_to_string(dest).unwrap();
        assert_eq!(content, "test content");
    }
}
```

### Integration Testing
```typescript
// E2E testing with Playwright
test('file copy operation', async ({ page }) => {
  await page.goto('/');

  // Select file in left panel
  await page.click('[data-testid="file-item-document.txt"]');

  // Press F5 to copy
  await page.keyboard.press('F5');

  // Verify copy dialog appears
  await expect(page.locator('[data-testid="copy-dialog"]')).toBeVisible();

  // Confirm copy
  await page.click('[data-testid="copy-confirm"]');

  // Verify file appears in right panel
  await expect(page.locator('[data-testid="right-panel"] [data-testid="file-item-document.txt"]')).toBeVisible();
});
```

## Deployment Architecture

### Build Process
```json
// package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

### Distribution Strategy
1. **macOS**: App Store + direct download (.dmg)
2. **Windows**: Microsoft Store + installer (.msi)
3. **Linux**: AppImage + package managers

### Auto-updater Integration
```rust
// Auto-updater configuration
#[cfg(feature = "updater")]
fn setup_updater(app: &App) {
    let updater = app.updater();
    updater.check_update().spawn();
}
```

This architecture provides a solid foundation for building KrakenEgg with excellent performance, maintainability, and cross-platform compatibility while ensuring a native macOS experience.