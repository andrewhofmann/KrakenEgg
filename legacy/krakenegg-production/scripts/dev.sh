#!/bin/bash

# KrakenEgg Development Script
# Starts the development server for the current version

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CURRENT_VERSION="v1.0.0"
VERSION_DIR="$PROJECT_ROOT/versions/$CURRENT_VERSION"

echo "🐙 Starting KrakenEgg Development Server"
echo "Version: $CURRENT_VERSION"
echo "Directory: $VERSION_DIR"
echo ""

# Check if version directory exists
if [ ! -d "$VERSION_DIR" ]; then
    echo "❌ Error: Version directory $CURRENT_VERSION not found"
    exit 1
fi

# Navigate to version directory
cd "$VERSION_DIR"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo ""
fi

# Start development server
echo "🚀 Starting development server..."
echo "Open http://localhost:1420 in your browser"
echo "Press Ctrl+C to stop"
echo ""

pnpm tauri dev