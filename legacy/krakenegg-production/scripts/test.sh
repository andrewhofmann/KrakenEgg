#!/bin/bash

# KrakenEgg Test Script
# Runs all tests for the current version

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CURRENT_VERSION="v1.0.0"
VERSION_DIR="$PROJECT_ROOT/versions/$CURRENT_VERSION"

echo "🐙 Running KrakenEgg Tests"
echo "Version: $CURRENT_VERSION"
echo ""

# Check if version directory exists
if [ ! -d "$VERSION_DIR" ]; then
    echo "❌ Error: Version directory $CURRENT_VERSION not found"
    exit 1
fi

# Navigate to version directory
cd "$VERSION_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo ""
fi

# Run linting
echo "🔍 Running ESLint..."
pnpm lint
echo "✅ Linting passed"
echo ""

# Run type checking
echo "🔍 Running TypeScript type checking..."
pnpm type-check
echo "✅ Type checking passed"
echo ""

# Run unit tests if available
if grep -q "\"test\"" package.json; then
    echo "🧪 Running unit tests..."
    pnpm test
    echo "✅ Unit tests passed"
    echo ""
fi

# Run Rust tests if available
if [ -d "src-tauri" ]; then
    echo "🦀 Running Rust tests..."
    cd src-tauri
    cargo test
    cd ..
    echo "✅ Rust tests passed"
    echo ""
fi

# Check for unused dependencies
echo "🔍 Checking for unused dependencies..."
if command -v depcheck >/dev/null 2>&1; then
    depcheck
else
    echo "⚠️ depcheck not installed, skipping unused dependency check"
    echo "Install with: npm install -g depcheck"
fi
echo ""

echo "🎉 All tests passed successfully!"