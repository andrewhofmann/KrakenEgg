#!/bin/bash

# KrakenEgg Build Script
# Builds the application for production

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CURRENT_VERSION="v1.0.0"
VERSION_DIR="$PROJECT_ROOT/versions/$CURRENT_VERSION"
RELEASES_DIR="$PROJECT_ROOT/releases"
BUILD_DATE=$(date +"%Y%m%d-%H%M%S")

echo "🐙 Building KrakenEgg for Production"
echo "Version: $CURRENT_VERSION"
echo "Build Date: $BUILD_DATE"
echo ""

# Check if version directory exists
if [ ! -d "$VERSION_DIR" ]; then
    echo "❌ Error: Version directory $CURRENT_VERSION not found"
    exit 1
fi

# Navigate to version directory
cd "$VERSION_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo ""

# Run linting and type checking
echo "🔍 Running code quality checks..."
pnpm lint
pnpm type-check
echo ""

# Run tests if available
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    echo "🧪 Running tests..."
    pnpm test
    echo ""
fi

# Build the application
echo "🏗️ Building application..."
pnpm tauri build
echo ""

# Create release directory structure
RELEASE_DIR="$RELEASES_DIR/$CURRENT_VERSION-$BUILD_DATE"
mkdir -p "$RELEASE_DIR"

# Copy built artifacts
if [ -d "src-tauri/target/release/bundle" ]; then
    echo "📦 Copying build artifacts to releases..."
    cp -r src-tauri/target/release/bundle/* "$RELEASE_DIR/"

    # Create release info
    cat > "$RELEASE_DIR/RELEASE_INFO.md" << EOF
# KrakenEgg Release $CURRENT_VERSION

**Build Date**: $(date)
**Build ID**: $BUILD_DATE
**Platform**: $(uname -s)
**Architecture**: $(uname -m)

## Build Artifacts

This release contains the following build artifacts:

- **DMG**: macOS disk image for installation
- **App Bundle**: Raw macOS application bundle
- **Updater**: Auto-update packages (if configured)

## Installation

1. Download the appropriate artifact for your platform
2. For macOS: Open the DMG and drag KrakenEgg to Applications
3. Run the application and enjoy!

## Version Notes

See docs/VERSION_HISTORY.md for detailed changelog.

EOF

    echo "✅ Build completed successfully!"
    echo "📍 Release artifacts: $RELEASE_DIR"
    echo ""
    ls -la "$RELEASE_DIR"
else
    echo "❌ Build failed - no artifacts found"
    exit 1
fi