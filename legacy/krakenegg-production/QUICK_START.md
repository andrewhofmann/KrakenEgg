# KrakenEgg Quick Start Guide

Get up and running with KrakenEgg development in minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Rust**: Latest stable version
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

- **Node.js**: Version 18 or later
  ```bash
  # Using Homebrew on macOS
  brew install node
  ```

- **pnpm**: Fast package manager
  ```bash
  npm install -g pnpm
  ```

- **Tauri CLI**: For building and running
  ```bash
  cargo install tauri-cli
  ```

## Quick Setup

1. **Clone or navigate to the project**:
   ```bash
   cd "/Users/andrew/Documents/Personal/Dev AI Coding/KrakenEgg/krakenegg-production"
   ```

2. **Start development server**:
   ```bash
   ./scripts/dev.sh
   ```

   This will:
   - Install dependencies automatically
   - Start the Tauri development server
   - Open the application window
   - Enable hot reload for development

3. **Open your browser** (if needed):
   The application should open automatically, but you can also access it at:
   `http://localhost:1420`

## Available Scripts

### Development
```bash
./scripts/dev.sh           # Start development server
./scripts/test.sh          # Run all tests and quality checks
```

### Building
```bash
./scripts/build.sh         # Build for production
```

### Version Management
```bash
./scripts/new-version.sh v1.0.1  # Create new version
```

### Development Tools
```bash
./tools/component-generator.sh MyComponent dialog  # Generate new component
./tools/analyze-bundle.sh                          # Analyze build output
```

## Project Structure Overview

```
krakenegg-production/
├── versions/v1.0.0/       # Current development version
│   ├── src/               # React frontend source
│   ├── src-tauri/         # Rust backend source
│   ├── package.json       # Node dependencies
│   └── ...
├── scripts/               # Build and dev scripts
├── tools/                 # Development utilities
├── docs/                  # Documentation
├── config/                # Environment configurations
├── releases/              # Built distributions
└── backups/               # Version backups
```

## Development Workflow

1. **Work in the current version**: `cd versions/v1.0.0`
2. **Make your changes**: Edit files in `src/` or `src-tauri/src/`
3. **Test your changes**: Run `../../scripts/test.sh`
4. **Build and verify**: Run `../../scripts/build.sh`
5. **Document changes**: Update `docs/VERSION_HISTORY.md`
6. **Create new version**: When ready, run `../../scripts/new-version.sh v1.0.1`

## Key Commands

### Inside Version Directory (`versions/v1.0.0/`)
```bash
# Install dependencies
pnpm install

# Development server
pnpm tauri dev

# Build for production
pnpm tauri build

# Run tests
pnpm test

# Linting and formatting
pnpm lint
pnpm lint:fix
pnpm format

# Type checking
pnpm type-check
```

### Rust Commands (`versions/v1.0.0/src-tauri/`)
```bash
# Run Rust tests
cargo test

# Rust linting
cargo clippy

# Rust formatting
cargo fmt

# Build Rust backend
cargo build --release
```

## Debugging

### Frontend Debugging
- Open browser dev tools in the Tauri window
- Use React Developer Tools
- Console logs appear in browser console

### Backend Debugging
- Set `RUST_LOG=debug` environment variable
- Use `println!` or `log::debug!` in Rust code
- Logs appear in terminal running the dev server

### Common Issues

**Compilation errors**:
- Check Rust version: `rustc --version`
- Update dependencies: `pnpm update`

**Permission errors on macOS**:
- Allow the app in System Preferences > Security & Privacy

**Port conflicts**:
- Change port in `vite.config.ts` if 1420 is in use

## Hot Tips

- **Fast iteration**: Keep `./scripts/dev.sh` running for instant feedback
- **Component development**: Use `./tools/component-generator.sh` for consistent structure
- **Performance**: Run `./tools/analyze-bundle.sh` to check bundle size
- **Version control**: Use `./scripts/new-version.sh` for clean version management

## Next Steps

1. **Explore the codebase**: Start with `src/App.tsx` and `src-tauri/src/main.rs`
2. **Read the docs**: Check `docs/ARCHITECTURE.md` for detailed technical info
3. **Try the components**: Look at existing dialogs in `src/components/dialogs/`
4. **Build something**: Use the component generator to create your first component

## Getting Help

- **Documentation**: Check the `docs/` directory
- **Version History**: See `docs/VERSION_HISTORY.md` for changes
- **Architecture**: Read `docs/ARCHITECTURE.md` for technical details

Happy coding! 🐙