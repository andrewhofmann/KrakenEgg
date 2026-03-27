# KrakenEgg Production

A modern, cross-platform Total Commander clone designed for keyboard-first productivity with ultra-clean aesthetics.

## Project Organization

```
krakenegg-production/
├── versions/           # Version-controlled source code
│   ├── v1.0.0/        # Current development version
│   ├── v1.0.1/        # Future versions...
│   └── ...
├── releases/          # Built distributions and releases
├── docs/              # Project documentation
├── tools/             # Development tools and scripts
├── scripts/           # Build and deployment scripts
├── assets/            # Static assets
│   ├── icons/         # Application icons
│   ├── images/        # UI images and graphics
│   └── fonts/         # Custom fonts
├── config/            # Configuration files
├── tests/             # Test suites
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── e2e/           # End-to-end tests
└── backups/           # Version backups
```

## Version Management

Each version is stored in its own directory under `versions/` with complete source code. See `docs/VERSION_HISTORY.md` for detailed changelog between versions.

## Quick Start

1. Navigate to the current version: `cd versions/v1.0.0`
2. Install dependencies: `pnpm install`
3. Start development: `pnpm dev`
4. Build for production: `pnpm build`

## Technology Stack

- **Framework**: Tauri (Rust backend + React frontend)
- **Frontend**: React 18+ with TypeScript, Tailwind CSS
- **Backend**: Rust with async/await for file operations
- **State Management**: Zustand
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Development Workflow

1. Work in the current version directory
2. Test and iterate
3. Document changes in VERSION_HISTORY.md
4. Create new version when ready for major changes
5. Build and test releases

## Architecture

KrakenEgg follows a dual-pane file manager architecture with:
- Keyboard-first navigation and operation
- Compact, efficient dialogs
- Modern macOS-style design language
- Revolutionary plugin system for extensibility

For detailed architecture documentation, see `docs/ARCHITECTURE.md`.