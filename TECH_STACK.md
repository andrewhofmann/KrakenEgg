# KrakenEgg Technology Stack & Setup Guide

## Recommended Technology Stack

### Core Framework: Tauri + React + TypeScript

#### Why This Stack?
1. **Performance**: Native-level performance with minimal memory footprint
2. **Cross-platform**: Single codebase for macOS, Windows, Linux
3. **Developer Experience**: Modern tooling with hot reload and TypeScript
4. **Bundle Size**: <600KB using system webview vs 60MB+ for Electron
5. **Security**: Rust memory safety + sandboxed frontend environment

## Frontend Stack

### Core Technologies
```json
{
  "framework": "React 18+",
  "language": "TypeScript 5+",
  "bundler": "Vite 5+",
  "styling": "Tailwind CSS 3+",
  "state": "Zustand",
  "routing": "React Router 6+",
  "testing": "Vitest + React Testing Library",
  "e2e": "Playwright"
}
```

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework for rapid development
- **Headless UI**: Unstyled, accessible UI components
- **Lucide React**: Modern icon library
- **Framer Motion**: Smooth animations and transitions
- **React Virtual**: Virtualization for large file lists

### State Management
- **Zustand**: Lightweight state management (2.2KB)
- **Immer**: Immutable state updates
- **React Query**: Server state management and caching

### Development Tools
- **ESLint**: Code linting with strict rules
- **Prettier**: Code formatting
- **TypeScript**: Type safety and better developer experience
- **Husky**: Git hooks for quality assurance
- **Commitizen**: Conventional commit messages

## Backend Stack (Rust)

### Core Dependencies
```toml
[dependencies]
tauri = { version = "1.5", features = ["shell-open", "fs-read-dir", "fs-write-file"] }
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
uuid = { version = "1.0", features = ["v4"] }
thiserror = "1.0"
async-trait = "0.1"
```

### File System Operations
```toml
walkdir = "2.3"           # Directory traversal
filetime = "0.2"          # File timestamp handling
fs_extra = "1.3"          # Extended file operations
notify = "6.0"            # File system watching
trash = "3.0"             # Safe file deletion
```

### Archive Support
```toml
zip = "0.6"               # ZIP archive handling
sevenz-rust = "0.4"       # 7-Zip support
tar = "0.4"               # TAR archive support
flate2 = "1.0"            # GZIP compression
bzip2 = "0.4"             # BZIP2 compression
```

### Network & FTP
```toml
tokio-ftp = "0.3"         # Async FTP client
russh = "0.40"            # SFTP/SSH support
reqwest = { version = "0.11", features = ["json"] }  # HTTP client
url = "2.4"               # URL parsing
```

### Search & Indexing
```toml
tantivy = "0.19"          # Full-text search engine
regex = "1.8"             # Regular expressions
globset = "0.4"           # Glob pattern matching
```

### Utilities
```toml
dirs = "5.0"              # Standard directories
chrono = { version = "0.4", features = ["serde"] }  # Date/time handling
mime_guess = "2.0"        # MIME type detection
image = "0.24"            # Image processing for thumbnails
```

## Development Environment Setup

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js (via nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Install Tauri CLI
cargo install tauri-cli

# Install pnpm (faster than npm)
npm install -g pnpm
```

### macOS Specific Setup
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install additional dependencies for native modules
brew install openssl pkg-config

# For Apple Silicon Macs, ensure proper architecture
export CARGO_TARGET_AARCH64_APPLE_DARWIN_RUSTFLAGS="-C link-arg=-undefined -C link-arg=dynamic_lookup"
```

### Project Initialization
```bash
# Create new Tauri project
npx create-tauri-app@latest kraken-egg

# Choose options:
# - Package manager: pnpm
# - UI template: React with TypeScript
# - UI flavor: TypeScript

cd kraken-egg

# Install additional frontend dependencies
pnpm add \
  @headlessui/react \
  @heroicons/react \
  @tanstack/react-query \
  framer-motion \
  react-router-dom \
  react-virtual \
  zustand \
  immer \
  lucide-react

# Install development dependencies
pnpm add -D \
  @types/react \
  @types/react-dom \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  @vitejs/plugin-react \
  eslint \
  eslint-plugin-react-hooks \
  eslint-plugin-react-refresh \
  prettier \
  prettier-plugin-tailwindcss \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @playwright/test \
  husky \
  lint-staged

# Initialize Tailwind CSS
pnpm dlx tailwindcss init -p
```

### Project Structure
```
kraken-egg/
├── src/                          # Frontend React app
│   ├── components/
│   │   ├── common/              # Reusable UI components
│   │   ├── panels/              # File panel components
│   │   ├── dialogs/             # Modal dialogs
│   │   └── layout/              # Layout components
│   ├── hooks/                   # Custom React hooks
│   ├── stores/                  # Zustand stores
│   ├── utils/                   # Utility functions
│   ├── types/                   # TypeScript definitions
│   └── App.tsx
├── src-tauri/                   # Rust backend
│   ├── src/
│   │   ├── commands/           # Tauri command handlers
│   │   ├── file_system/        # File operations
│   │   ├── archive/            # Archive handling
│   │   ├── network/            # Network protocols
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── public/                      # Static assets
├── tests/                       # E2E tests
├── docs/                        # Documentation
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Configuration Files

### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(async () => ({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    target: process.env.TAURI_PLATFORM == "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
}));
```

### Tailwind Configuration
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### ESLint Configuration
```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
}
```

### Tauri Configuration
```json
// src-tauri/tauri.conf.json
{
  "build": {
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "devPath": "http://localhost:1420",
    "distDir": "../dist"
  },
  "package": {
    "productName": "KrakenEgg",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "fs": {
        "all": false,
        "readFile": true,
        "writeFile": true,
        "readDir": true,
        "createDir": true,
        "removeFile": true,
        "removeDir": true,
        "renameFile": true,
        "scope": ["**"]
      },
      "path": {
        "all": true
      },
      "os": {
        "all": true
      }
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.kraken-egg.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "resizable": true,
        "title": "KrakenEgg",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600
      }
    ]
  }
}
```

## Development Scripts

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "prepare": "husky install"
  }
}
```

### Git Hooks (Husky)
```json
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

```json
// package.json lint-staged configuration
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{js,jsx,json,css,md}": [
      "prettier --write"
    ]
  }
}
```

## Performance Optimizations

### Frontend Optimizations
```typescript
// Lazy loading for heavy components
const FileViewer = lazy(() => import('./components/FileViewer'));
const ArchiveExplorer = lazy(() => import('./components/ArchiveExplorer'));

// Virtual scrolling for large lists
const VirtualFileList = memo(({ files }: { files: FileInfo[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      {rowVirtualizer.getVirtualItems().map(virtualRow => (
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
});
```

### Rust Optimizations
```toml
# Cargo.toml - Release optimizations
[profile.release]
panic = "abort"
codegen-units = 1
lto = true
strip = true
opt-level = "s"  # Optimize for size

[profile.dev]
opt-level = 1    # Some optimization for dev builds
```

## Deployment Configuration

### GitHub Actions CI/CD
```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest, windows-latest, ubuntu-20.04]

    runs-on: ${{ matrix.platform }}
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install dependencies (ubuntu only)
        if: matrix.platform == 'ubuntu-20.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf

      - name: Rust setup
        uses: dtolnay/rust-toolchain@stable

      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: './src-tauri -> target'

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install frontend dependencies
        run: pnpm install

      - name: Build the app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'KrakenEgg v__VERSION__'
          releaseBody: 'See the assets to download and install this version.'
          releaseDraft: true
          prerelease: false
```

This comprehensive technology stack provides everything needed to build a high-performance, cross-platform Total Commander clone with modern development practices and excellent developer experience.