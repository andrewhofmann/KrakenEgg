# Changelog

All notable changes to KrakenEgg will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Rust unwrap() panic risk on path.parent() in compress command
- Unnecessary braces warnings in commands.rs
- All console.error() replaced with user-visible error notifications or silent fallbacks
- `any` types in store loadState replaced with typed SavedState interface
- Config corruption fallback — loadState silently uses defaults on parse failure
- File name validation in createNewFile (rejects special characters, reserved names)

### Added
- Async directory listing with spawn_blocking for non-blocking I/O
- File extension and symlink detection fields in FileInfo (computed in Rust)
- Native filesystem watcher (notify crate) replacing 2-second polling
- Dynamic home directory detection on startup (get_home_directory command)
- File type icons: 60+ extension-to-icon mappings with color coding
- Clickable breadcrumb path navigation bar
- Status bar with folder/file count and selection size
- Symlink indicator on file names
- Byte-based progress tracking for file operations (bytes_done/bytes_total)
- On-demand folder size calculation (Space key on folder, like Total Commander)
- Invert selection (Cmd+Shift+A)
- Select by glob pattern (Cmd+Shift+P) with *, ?, {a,b} syntax
- Deselect all (Cmd+D)
- Loading skeleton animation replacing "Loading items..." text
- Improved drag-drop visual feedback (rounded highlight ring)
- Pre-computed file extension from Rust (avoids frontend recomputation)
- Z-index constants system (centralized, no more magic numbers)
- ConflictResolution typed enum replacing string literals
- File name validation utility (validateFileName)
- ARIA accessibility attributes on FileRow (role, aria-selected, aria-label, tabIndex)
- Real byte-level progress tracking in copy operations with percentage display
- Font zoom shortcuts (Cmd+Plus, Cmd+Minus, Cmd+0 to reset)
- Subtle grid lines on file rows
- Font size now inherits from panel preferences (was hardcoded 13px)
- AutoSizer debounced via requestAnimationFrame (no excessive re-renders)
- Git version control with develop/feature branching strategy
- Comprehensive test suite: 259 tests (216 frontend unit, 33 Rust unit, 10 E2E)
- Vitest test infrastructure with jsdom, @testing-library/react, coverage reporting
- Rust unit tests for utils, app_state, mrt, and archive modules
- Playwright E2E test suite with Tauri API mocking
- CHANGELOG.md for release notes tracking
- BACKLOG.md for bug tracking
- TEST_CATALOG.md documenting all tests by category
- Extracted keyboard utilities into testable module (keyboardUtils.ts)

### Changed
- Added test scripts to package.json (test, test:watch, test:coverage, test:rust, test:e2e, test:all)
- Updated vite.config.ts with test setup files and coverage configuration

## [0.1.0] - 2026-03-26

### Added
- Dual-pane file browsing with independent navigation and history per pane
- File operations: copy, move, delete, rename with progress tracking and conflict resolution
- Archive support: ZIP, TAR, TAR.GZ, TGZ (browse, extract, compress)
- Search: filename and content search with result navigation
- Quick viewer: text and image file preview (F3)
- Text editor: in-app editing with save capability (F4)
- Multi-Rename Tool (MRT): pattern-based batch renaming with preview
- Tab management: multiple tabs per pane with navigation history
- Settings/Preferences: appearance (font size, row height, grid lines, compact mode), behavior (mouse selection mode), general (hidden files, confirm delete, save history)
- Saved layouts: save and restore workspace configurations
- Keyboard navigation: 21 customizable hotkey actions with macOS defaults
- Context menu: right-click file operations
- Virtual scrolling: efficient rendering for 100,000+ file lists
- State persistence: save/load entire app state across sessions
- macOS native menu bar integration
- Quick filter: inline file list filtering
- Go-to-path modal: direct path navigation
- Operations drawer: background operation tracking
- Rust backend: async file operations with Tauri v2 IPC
