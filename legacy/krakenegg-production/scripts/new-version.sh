#!/bin/bash

# KrakenEgg New Version Script
# Creates a new version directory from the current version

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CURRENT_VERSION="v1.0.0"

# Check if new version is provided
if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide a new version number"
    echo "Usage: $0 <new-version>"
    echo "Example: $0 v1.0.1"
    exit 1
fi

NEW_VERSION="$1"
CURRENT_VERSION_DIR="$PROJECT_ROOT/versions/$CURRENT_VERSION"
NEW_VERSION_DIR="$PROJECT_ROOT/versions/$NEW_VERSION"

echo "🐙 Creating New KrakenEgg Version"
echo "Current Version: $CURRENT_VERSION"
echo "New Version: $NEW_VERSION"
echo ""

# Check if current version exists
if [ ! -d "$CURRENT_VERSION_DIR" ]; then
    echo "❌ Error: Current version directory $CURRENT_VERSION not found"
    exit 1
fi

# Check if new version already exists
if [ -d "$NEW_VERSION_DIR" ]; then
    echo "❌ Error: Version $NEW_VERSION already exists"
    exit 1
fi

# Create backup of current version
echo "💾 Creating backup of current version..."
BACKUP_DIR="$PROJECT_ROOT/backups/$CURRENT_VERSION-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r "$CURRENT_VERSION_DIR"/* "$BACKUP_DIR/"
echo "✅ Backup created: $BACKUP_DIR"
echo ""

# Copy current version to new version
echo "📂 Creating new version directory..."
mkdir -p "$NEW_VERSION_DIR"
cp -r "$CURRENT_VERSION_DIR"/* "$NEW_VERSION_DIR/"
echo "✅ New version created: $NEW_VERSION_DIR"
echo ""

# Update version-related files
echo "📝 Updating version information..."
cd "$NEW_VERSION_DIR"

# Update package.json version if it exists
if [ -f "package.json" ]; then
    # Remove 'v' prefix for package.json
    VERSION_NUMBER="${NEW_VERSION#v}"
    sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION_NUMBER\"/" package.json
    echo "✅ Updated package.json version to $VERSION_NUMBER"
fi

# Update Cargo.toml version if it exists
if [ -f "src-tauri/Cargo.toml" ]; then
    VERSION_NUMBER="${NEW_VERSION#v}"
    sed -i '' "s/version = \".*\"/version = \"$VERSION_NUMBER\"/" src-tauri/Cargo.toml
    echo "✅ Updated Cargo.toml version to $VERSION_NUMBER"
fi

# Update tauri.conf.json version if it exists
if [ -f "src-tauri/tauri.conf.json" ]; then
    VERSION_NUMBER="${NEW_VERSION#v}"
    sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION_NUMBER\"/" src-tauri/tauri.conf.json
    echo "✅ Updated tauri.conf.json version to $VERSION_NUMBER"
fi

echo ""
echo "🎉 New version $NEW_VERSION created successfully!"
echo ""
echo "Next steps:"
echo "1. Update $PROJECT_ROOT/docs/VERSION_HISTORY.md with your changes"
echo "2. Update the CURRENT_VERSION variable in scripts to point to $NEW_VERSION"
echo "3. Start development: cd $NEW_VERSION_DIR && pnpm dev"
echo ""