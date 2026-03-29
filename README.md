# KrakenEgg

A modern, cross-platform dual-pane file manager built for macOS, inspired by Total Commander and Finder.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-macOS-lightgrey.svg)
![Tests](https://img.shields.io/badge/tests-608%20passing-brightgreen.svg)
![CI](https://github.com/andrewhofmann/KrakenEgg/actions/workflows/ci.yml/badge.svg)

## Download

**[Download Latest Release (macOS)](https://github.com/andrewhofmann/KrakenEgg/releases/latest)**

Or build from source — see [Getting Started](#getting-started) below.

## Features

### Dual-Pane File Management
- **Independent panels** with tabs, history, and navigation per pane
- **Keyboard-driven** operation with 28+ customizable hotkeys
- **Virtual scrolling** for smooth handling of 100,000+ files
- **Remember cursor** — navigating up highlights the folder you came from

### File Operations
- Copy, move, delete with progress tracking and conflict resolution
- Multi-Rename Tool with regex find/replace, counters, and case conversion
- Archive support: ZIP, TAR, TAR.GZ, TGZ (browse, extract, compress)
- Inline rename with smart extension selection (.tar.gz aware)
- Drag-and-drop between panels with copy/move support

### Search & Navigation
- Substring, glob, and regex search modes with content search
- Clickable breadcrumb path navigation
- Type-ahead file search with visual indicator
- Folder size calculation on demand (Space key)
- Bookmarks and global history

### Modern UI
- Dark and light theme with system preference detection
- 60+ file type icons with theme-aware color coding
- Customizable font size, row height, grid lines, compact mode
- Error boundaries for crash resilience
- Accessible: ARIA roles, keyboard navigation, screen reader support

### Customization
- Full keyboard shortcut remapping via Settings
- Layout save/restore
- Favorites management
- Column reorder and resize

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 6, Tailwind CSS 4, Zustand 5 |
| Backend | Rust, Tauri v2 |
| Virtualization | react-window v2 |
| Testing | Vitest, Playwright, Cargo test |
| Build | Vite 7, pnpm |

## Getting Started

### Prerequisites
- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v10+)

### Installation

```bash
git clone https://github.com/andrewhofmann/KrakenEgg.git
cd KrakenEgg/krakenegg-app

pnpm install
pnpm tauri dev
```

### Building for Production

```bash
pnpm tauri build
```

The built `.app` bundle will be in `src-tauri/target/release/bundle/macos/`.

## Testing

```bash
# TypeScript unit tests (499 tests)
pnpm test

# Rust backend tests (109 tests)
cd src-tauri && cargo test --lib
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Switch between panels |
| `Enter` | Open file/folder |
| `Backspace` | Go to parent directory |
| `Cmd+C` / `Cmd+X` / `Cmd+V` | Copy / Cut / Paste |
| `Cmd+Backspace` | Delete |
| `F3` / `F4` | View / Edit file |
| `F5` / `F6` | Copy / Move to opposite panel |
| `F7` | New folder |
| `Shift+F4` | New file |
| `Shift+F6` | Rename |
| `Cmd+A` / `Cmd+D` | Select all / Deselect |
| `Cmd+,` | Settings |
| `Ctrl+Q` | Quick view |
| `Ctrl+H` | Toggle hidden files |
| `Cmd+Plus` / `Cmd+Minus` | Zoom in / out |

All shortcuts are customizable via Settings > Shortcuts.

## Project Structure

```
KrakenEgg/
└── krakenegg-app/              # Main Tauri application
    ├── src/                    # React frontend
    │   ├── components/         # UI components (20+)
    │   ├── hooks/              # useKeyboard, usePanelData
    │   ├── store/              # Zustand state management
    │   └── utils/              # Format, file icons
    ├── src-tauri/              # Rust backend
    │   └── src/
    │       ├── commands.rs     # Tauri IPC commands
    │       ├── archive.rs      # Archive operations
    │       ├── mrt.rs          # Multi-rename tool
    │       ├── app_state.rs    # Config persistence
    │       └── utils.rs        # File system utilities
    └── e2e/                    # E2E tests
```

## License

MIT License — see [LICENSE](LICENSE) for details.

## Author

**Andrew Hofmann**
