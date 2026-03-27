# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**KrakenEgg** is a modern, cross-platform Total Commander clone designed primarily for macOS. It features a clean, keyboard-driven dual-pane file manager interface with 100% feature parity to Total Commander plus modern enhancements.

**Target Platforms**: macOS (primary), Windows, Linux (future)
**Primary Focus**: Keyboard-first operation with sleek, clean UI

## Technology Stack

- **Framework**: Tauri (Rust backend + React frontend)
- **Frontend**: React 18+ with TypeScript, Tailwind CSS
- **Backend**: Rust with async/await for file operations
- **State Management**: Zustand
- **Build Tool**: Vite
- **Package Manager**: npm (main project), pnpm (mentioned in docs)
- **Testing**: Vitest, React Testing Library

## Project Structure Overview

The project has multiple development directories:
- **krakenegg-production/versions/v1.0.0/**: Main Tauri application (Rust + React)
- **krakenegg-macos26-redesign/**: React-only prototype for macOS design exploration
- **krakenegg-ui-mockup/**: UI component testing and mockups

**Primary Development**: Work in `krakenegg-production/versions/v1.0.0/` for the full Tauri application.

## Common Development Commands

### Setup and Installation
```bash
# Install Rust and Tauri CLI (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install tauri-cli

# Navigate to the main development directory
cd krakenegg-production/versions/v1.0.0/

# Install Node.js dependencies
npm install
```

### Development
```bash
# Start development server with hot reload (from v1.0.0/ directory)
npm run tauri:dev

# Frontend only development
npm run dev

# Type checking
npm run type-check
```

### Building
```bash
# Build for production
npm run tauri:build

# Frontend build only
npm run build
```

### Code Quality
```bash
# Linting
npm run lint

# Testing
npm run test           # Unit tests with Vitest
npm run test:ui        # Test UI
npm run test:run       # Run tests once
npm run test:coverage  # Coverage report

# Rust linting and testing
cd src-tauri
cargo clippy           # Rust linting
cargo test             # Rust tests
cargo fmt              # Rust formatting
```

## Project Structure

### Main Application (`krakenegg-production/versions/v1.0.0/`)
```
├── src/                     # React frontend
│   ├── components/          # UI components
│   │   ├── common/         # Reusable components
│   │   ├── panels/         # File panel components
│   │   ├── dialogs/        # Modal dialogs
│   │   ├── layout/         # Layout components
│   │   └── elements/       # Basic UI elements
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand state stores
│   ├── services/           # API and business logic
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   ├── data/               # Static data and fixtures
│   ├── test/               # Test utilities and setup
│   └── App.tsx             # Main app component
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands.rs     # Tauri command handlers
│   │   ├── file_system.rs  # File operations
│   │   ├── types.rs        # Shared types
│   │   ├── error.rs        # Error handling
│   │   ├── logging.rs      # Logging setup
│   │   └── main.rs         # App entry point
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── dist/                   # Built frontend assets
└── package.json            # Node.js dependencies and scripts
```

## Key Architecture Patterns

### Frontend (React + TypeScript)
- **Component Architecture**: Function components with hooks
- **State Management**: Zustand stores for different domains (file manager, settings, UI)
- **Type Safety**: Strict TypeScript with comprehensive type definitions
- **Styling**: Tailwind CSS utility classes
- **Performance**: Virtual scrolling for large file lists, lazy loading

### Backend (Rust + Tauri)
- **Async Operations**: Tokio for async file operations and network requests
- **Command Pattern**: Tauri commands for frontend-backend communication
- **Error Handling**: Result types with custom error enums
- **Plugin System**: Trait-based plugin architecture for extensibility
- **Security**: Tauri's permission system and Rust's memory safety

### IPC Communication
- **Commands**: Frontend invokes Rust functions via Tauri commands
- **Events**: Backend emits progress events for long-running operations
- **Type Safety**: Shared TypeScript/Rust type definitions

## Development Guidelines

### Code Style
- **Frontend**: ESLint + Prettier with strict TypeScript rules
- **Backend**: Rust standard formatting with Clippy lints
- **Commits**: Conventional commit messages
- **Documentation**: JSDoc for complex functions, Rust doc comments

### Mandatory Testing Rule
**CRITICAL**: Every feature added or changed MUST have an associated unit test that passes. No untested code should be committed or presented to the user. This applies to:
- New features (write tests before or alongside implementation)
- Bug fixes (write regression test proving the fix)
- Refactors (ensure existing tests still pass, add new ones if behavior changes)
- Frontend components, hooks, utilities, and store actions
- Rust backend functions and commands

Run `pnpm test` and `pnpm test:rust` to verify all tests pass before committing.

### Testing and Quality Assurance Protocol

**CRITICAL REQUIREMENT**: Every time you compile a new set of changes for the user, you MUST:

1. **Test Before Presenting**: Changes must be thoroughly tested before showing them to the user
2. **Fresh App Restart**: Always restart the application fresh before user testing
3. **Comprehensive Testing**: Use automated testing frameworks for UI behavior validation

#### Pre-Delivery Testing Checklist

Before presenting any changes to the user:

1. **Code Analysis**:
   - Run automated code analysis to verify implementation completeness
   - Check for TypeScript interface compatibility
   - Validate all required functions and logic are present

2. **Automated Testing**:
   - Execute automated testing scripts (e.g., `test-autoscroll.js`)
   - Verify all critical implementation checks pass
   - Generate test environment with sufficient data for realistic testing

3. **UI Behavior Testing**:
   - Create comprehensive test scenarios for UI interactions
   - Test keyboard navigation, scrolling, and responsive behavior
   - Verify debug logging and error handling
   - Test edge cases and performance with large datasets

4. **Application Restart**:
   - Kill all background processes cleanly
   - Start fresh application instance
   - Verify hot-reload and development environment is stable

5. **User-Ready Validation**:
   - Confirm all changes work as expected
   - Verify no regressions in existing functionality
   - Ensure debug information is available for troubleshooting

#### UI Testing Framework

Use the comprehensive testing approach:

```bash
# Example testing workflow
node test-autoscroll.js                    # Run automated tests
pkill -f "tauri:dev" && pkill -f "vite"   # Clean shutdown
npm run tauri:dev                          # Fresh start
```

Testing should cover:
- **Functionality**: Core features work correctly
- **Performance**: Smooth operation with realistic data volumes
- **Accessibility**: Keyboard navigation and screen reader compatibility
- **Responsiveness**: UI adapts to different window sizes
- **Error Handling**: Graceful degradation and error recovery

### Testing Strategy
- **Unit Tests**: Vitest for frontend, native Rust tests for backend
- **Component Tests**: React Testing Library with jsdom
- **Integration Tests**: Test Tauri commands with mock file systems
- **Coverage**: Vitest coverage reporting

### Performance Requirements
- **File Listing**: Handle 100,000+ files smoothly with virtual scrolling
- **Memory Usage**: Keep under 200MB for typical usage
- **Startup Time**: App launch under 2 seconds
- **Operation Response**: File operations under 500ms response time
- **Parallel Processing**: High-performance async file system with LRU caching
- **Metadata Gathering**: Optimized parallel metadata collection with semaphores

## Key Features Implementation

### Dual-Panel File Manager
- Independent panels with tab support
- Keyboard navigation (Tab to switch panels)
- **Virtual scrolling for performance** - Renders only visible items from 100,000+ files
- Customizable column layouts
- **Parent directory navigation** - ".." entry for navigating up directory levels
- **Rich metadata display** - File sizes, extensions, dates, types in both brief and detailed views

### Keyboard Navigation System
- Total Commander compatible shortcuts (F1-F12)
- macOS-specific enhancements (Cmd key integration)
- Customizable key bindings
- Command palette for feature discovery

### File Operations
- Background operations with progress reporting
- Queue management for multiple operations
- Undo/redo support
- Conflict resolution dialogs

### Archive Support
- Multiple format support (ZIP, 7Z, RAR, TAR, etc.)
- Transparent archive browsing
- Plugin architecture for additional formats

### Network Features
- Built-in FTP/SFTP client
- Cloud storage integration
- Connection management and bookmarks

### Revolutionary Plugin System
- **Pane Takeover Plugins**: Complete pane replacement with custom applications
- **Embedded Applications**: Full applications running within KrakenEgg
- **Universal File Flow**: Seamless file passing between plugins and panes
- **WebAssembly Sandbox**: Secure execution with fine-grained permissions
- **Total Commander Compatibility**: Support for existing TC plugin ecosystem
- **AI-Powered Marketplace**: Intelligent plugin discovery and recommendations

## macOS Specific Considerations

### System Integration
- Spotlight search integration
- Quick Look support (Space key)
- Native file permissions and extended attributes
- Retina display optimization
- Dark mode support

### Keyboard Navigation
- Full Keyboard Access compliance
- VoiceOver accessibility support
- macOS standard shortcuts where appropriate
- Respect system keyboard preferences

## Documentation References

### Core Documentation
- **Research**: See `RESEARCH.md` for comprehensive Total Commander analysis
- **Features**: See `FEATURES.md` for complete feature specifications
- **Architecture**: See `ARCHITECTURE.md` for detailed technical architecture
- **Technology**: See `TECH_STACK.md` for setup and technology details
- **Keyboard**: See `KEYBOARD_SHORTCUTS.md` for complete shortcut reference

### Plugin Architecture Documentation
- **Plugin Overview**: See `PLUGIN_OVERVIEW.md` for complete plugin system overview
- **Plugin Architecture**: See `PLUGIN_ARCHITECTURE.md` for detailed technical architecture
- **Plugin API**: See `PLUGIN_API.md` for comprehensive API specification
- **Plugin Security**: See `PLUGIN_SECURITY.md` for security model and sandboxing
- **Plugin Marketplace**: See `PLUGIN_MARKETPLACE.md` for marketplace and distribution system

## Getting Started Checklist

1. **Environment Setup**:
   - [ ] Install Rust toolchain
   - [ ] Install Node.js and pnpm
   - [ ] Install Tauri CLI
   - [ ] Clone repository and install dependencies

2. **Development**:
   - [ ] Navigate to `krakenegg-production/versions/v1.0.0/`
   - [ ] Run `npm run tauri:dev` to start development
   - [ ] Review documentation files in root directory
   - [ ] Understand component structure in `src/components/`
   - [ ] Explore Rust backend in `src-tauri/src/`

3. **Contributing**:
   - [ ] Follow conventional commit format
   - [ ] Run linting and tests before committing
   - [ ] Ensure keyboard accessibility for new features
   - [ ] Test on multiple file system scenarios

## Troubleshooting

### Common Issues
- **Rust compilation errors**: Check Rust version and dependencies
- **Frontend build issues**: Clear node_modules and reinstall
- **Permission denied**: Check Tauri allowlist configuration
- **Performance issues**: Profile with browser dev tools and Rust profiling

### Debug Mode
- **Frontend**: Open browser dev tools in Tauri window
- **Backend**: Use `RUST_LOG=debug` environment variable
- **Tauri Development**: Use `KRAKENEGG_LOG_LEVEL=debug RUST_LOG=debug npm run tauri:dev` for verbose logging
- **Network**: Check Tauri security configuration for network access

## Important Testing Guidelines

**CRITICAL**: Always test localhost URLs before providing them to the user. Never give the user a localhost address without verifying it works first.

1. **Before providing any localhost URL**:
   - Use `curl` or similar to test the endpoint
   - Verify the response is valid HTML/content
   - Check the status code is 200 OK
   - Confirm the content loads properly

2. **Example testing process**:
   ```bash
   # Test the localhost endpoint
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3011/

   # If 200, then verify content
   curl -I http://localhost:3011/
   ```

3. **Only after successful testing**:
   - Provide the URL to the user
   - Mention that it has been verified working