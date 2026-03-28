# KrakenEgg 🐙

A modern, cross-platform dual-pane file manager built for macOS, inspired by Total Commander and Finder.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-macOS-lightgrey.svg)
![Tests](https://img.shields.io/badge/tests-1044%20passing-brightgreen.svg)

## Features

### Dual-Pane File Management
- **Independent panels** with tabs, history, and navigation per pane
- **Keyboard-driven** operation with 28+ customizable hotkeys
- **Virtual scrolling** for smooth handling of 100,000+ files

### File Operations
- Copy, move, delete with progress tracking and conflict resolution
- Multi-Rename Tool with regex find/replace and case conversion
- Archive support: ZIP, TAR, TAR.GZ, TGZ (browse, extract, compress)
- Inline rename with auto-selection of filename without extension

### Search & Navigation
- Substring, glob, and regex search modes
- Clickable breadcrumb path navigation
- Type-ahead file search with visual indicator
- Folder size calculation on demand (Space key)

### Modern UI
- Dark and light theme support with system preference detection
- 60+ file type icons with color coding
- Loading skeleton animations
- Error boundaries for crash resilience
- Accessible: ARIA roles, keyboard navigation, screen reader support

### Customization
- Full keyboard shortcut remapping via Settings
- Font size, row height, grid lines, compact mode
- Favorites management
- Layout save/restore

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS + Zustand
- **Backend**: Rust + Tauri v2
- **Virtualization**: react-window v2
- **Testing**: Vitest + Playwright + Cargo test
- **Build**: Vite 7

## Getting Started

### Prerequisites
- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v10+)

### Installation

```bash
# Clone the repository
git clone https://github.com/andreshofmann/KrakenEgg.git
cd KrakenEgg/krakenegg-app

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev
```

### Building for Production

```bash
pnpm tauri build
```

## Testing

KrakenEgg has 1,044+ automated tests across three layers:

```bash
# TypeScript unit tests (499 tests)
pnpm test

# Rust backend tests (109 tests)
cd src-tauri && cargo test --lib

# E2E integration tests (461 tests)
pnpm test:e2e
```

### Test Coverage

| Layer | Tests | Coverage |
|-------|-------|----------|
| TypeScript unit | 499 | Store, utils, hooks, components |
| Rust backend | 109 | File I/O, archives, MRT, state |
| E2E integration | 461 | User interactions, stress, accessibility |
| **Total** | **1,044+** | |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Switch between panels |
| `Enter` | Open file/folder |
| `Backspace` | Go to parent directory |
| `⌘C` / `⌘X` / `⌘V` | Copy / Cut / Paste |
| `⌘⌫` | Delete |
| `F3` / `F4` | View / Edit file |
| `F5` / `F6` | Copy / Move to opposite panel |
| `F7` | New folder |
| `⇧F4` | New file |
| `⇧F6` | Rename |
| `⌘A` / `⌘D` | Select all / Deselect |
| `⌘⇧A` | Invert selection |
| `⌘,` | Settings |
| `Ctrl+Q` | Quick view |
| `Ctrl+H` | Toggle hidden files |
| `⌘+` / `⌘-` / `⌘0` | Zoom in / out / reset |

All shortcuts are customizable via Settings > Shortcuts.

## Project Structure

```
KrakenEgg/
├── krakenegg-app/           # Main Tauri application
│   ├── src/                 # React frontend
│   │   ├── components/      # UI components (20+)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Zustand state management
│   │   └── utils/           # Utility functions
│   ├── src-tauri/           # Rust backend
│   │   └── src/
│   │       ├── commands.rs  # Tauri IPC commands
│   │       ├── archive.rs   # Archive operations
│   │       ├── mrt.rs       # Multi-rename tool
│   │       └── utils.rs     # File system utilities
│   └── e2e/                 # Playwright E2E tests
│       └── integration/     # Sandbox-based integration tests
├── Graphics/                # App icons and assets
├── CHANGELOG.md             # Release notes
├── BACKLOG.md               # Bug tracking
└── TEST_CATALOG.md          # Test documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run the full test suite before committing (`pnpm test && pnpm test:rust`)
4. Commit with conventional commit messages (`feat:`, `fix:`, `test:`, `docs:`)
5. Push and open a Pull Request

See [CLAUDE.md](CLAUDE.md) for detailed development guidelines.

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

## Author

**Andrew Hofmann** — Creator and Lead Developer

---

*KrakenEgg — A file manager with tentacles in every directory.*
