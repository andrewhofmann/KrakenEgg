# KrakenEgg Architecture

This document outlines the technical architecture and design principles of KrakenEgg.

## Overview

KrakenEgg is built using the Tauri framework, combining a Rust backend with a React frontend to create a fast, secure, and cross-platform file manager.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    KrakenEgg Application                     │
├─────────────────────────────────────────────────────────────┤
│                     React Frontend                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   Panels    │ │   Dialogs   │ │       Components        │ │
│  │             │ │             │ │                         │ │
│  │ • Left Pane │ │ • Compact   │ │ • UltraToolbar          │ │
│  │ • Right Pane│ │ • Settings  │ │ • StatusBar             │ │
│  │ • Tabs      │ │ • Archive   │ │ • ProgressBars          │ │
│  │ • Navigation│ │ • File Ops  │ │ • KeyboardHandler       │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   State Management                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   Zustand   │ │   Context   │ │      Local State        │ │
│  │             │ │             │ │                         │ │
│  │ • App State │ │ • Theme     │ │ • Dialog State          │ │
│  │ • Settings  │ │ • Keyboard  │ │ • Form State            │ │
│  │ • File Ops  │ │ • Focus     │ │ • Animation State       │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                  Tauri IPC Bridge                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │  Commands   │ │   Events    │ │       Plugins           │ │
│  │             │ │             │ │                         │ │
│  │ • File Ops  │ │ • Progress  │ │ • Archive Handler       │ │
│  │ • Archives  │ │ • Errors    │ │ • Network Client        │ │
│  │ • Network   │ │ • Updates   │ │ • Plugin System         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      Rust Backend                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │File System │ │  Archives   │ │       Network           │ │
│  │             │ │             │ │                         │ │
│  │ • Read/Write│ │ • ZIP/7Z    │ │ • FTP/SFTP              │ │
│  │ • Metadata  │ │ • TAR/RAR   │ │ • HTTP                  │ │
│  │ • Watching  │ │ • Extract   │ │ • WebDAV                │ │
│  │ • Permissions│ │ • Create   │ │ • Cloud APIs            │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Operating System                         │
│           macOS • Windows • Linux (Future)                  │
└─────────────────────────────────────────────────────────────┘
```

## Core Principles

### 1. Keyboard-First Design
- All interactions must be keyboard accessible
- Tab navigation trapped within dialogs
- Comprehensive keyboard shortcuts
- Visual focus indicators

### 2. Compact UI Philosophy
- Minimal screen real estate usage
- Information density optimization
- Progressive disclosure
- Contextual interfaces

### 3. Performance First
- Virtual scrolling for large directories
- Lazy loading of resources
- Optimized React rendering
- Efficient Rust operations

### 4. Cross-Platform Consistency
- Native look and feel per platform
- Consistent behavior across systems
- Platform-specific optimizations
- Shared core functionality

## Component Architecture

### Frontend Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── dialogs/         # Modal dialogs and overlays
│   ├── layout/          # Layout and navigation
│   └── panels/          # File panel components
├── hooks/               # Custom React hooks
├── stores/              # Zustand state management
├── types/               # TypeScript definitions
├── utils/               # Utility functions
└── styles/              # Global styles and themes
```

### Backend Structure

```
src-tauri/src/
├── commands/            # Tauri command handlers
├── file_system/         # File operations
├── archive/             # Archive handling
├── network/             # Network operations
├── plugins/             # Plugin system
└── utils/               # Rust utilities
```

## Key Components

### CompactDialog System
- Base dialog component with focus management
- Consistent keyboard navigation
- Size variants (xs, sm, md)
- Progress integration

### Dual-Panel Manager
- Independent panel state
- Tab management
- Keyboard switching
- Synchronized operations

### Plugin Architecture
- WebAssembly sandboxing
- Pane takeover capability
- Universal file flow
- Security model

## State Management

### Global State (Zustand)
- Application settings
- File operation queue
- Panel configurations
- Plugin registry

### Context State
- Theme and appearance
- Keyboard focus chain
- Dialog stack management

### Local State
- Component-specific state
- Form data
- Animation states
- Temporary UI state

## Security Model

### Frontend Security
- Content Security Policy
- Input sanitization
- XSS prevention
- Safe HTML rendering

### Backend Security
- Sandboxed file operations
- Permission validation
- Path traversal prevention
- Resource limiting

### Plugin Security
- WebAssembly sandboxing
- Limited API access
- Resource monitoring
- User permission model

## Performance Considerations

### Frontend Optimizations
- React.memo for expensive renders
- useMemo for complex calculations
- Virtual scrolling for large lists
- Lazy component loading

### Backend Optimizations
- Async file operations
- Connection pooling
- Caching strategies
- Batch operations

### Memory Management
- Efficient data structures
- Garbage collection awareness
- Resource cleanup
- Memory monitoring

## Testing Strategy

### Frontend Testing
- Unit tests with Vitest
- Component tests with Testing Library
- Integration tests with Playwright
- Visual regression tests

### Backend Testing
- Rust unit tests
- Integration tests with mock filesystem
- Performance benchmarks
- Security audits

## Build System

### Development
- Hot reload with Vite
- Type checking with TypeScript
- Linting with ESLint
- Formatting with Prettier

### Production
- Tree shaking
- Code splitting
- Asset optimization
- Bundle analysis

## Future Architecture

### Plugin Ecosystem
- Marketplace integration
- AI-powered recommendations
- Community contributions
- Enterprise plugins

### Cloud Integration
- Sync across devices
- Cloud storage providers
- Collaborative features
- Remote file access

### AI Features
- Smart file organization
- Predictive operations
- Natural language commands
- Automated workflows