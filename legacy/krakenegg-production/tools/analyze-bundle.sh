#!/bin/bash

# KrakenEgg Bundle Analyzer
# Analyzes the build output for optimization opportunities

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CURRENT_VERSION="v1.0.0"
VERSION_DIR="$PROJECT_ROOT/versions/$CURRENT_VERSION"

echo "🐙 Analyzing KrakenEgg Bundle"
echo "Version: $CURRENT_VERSION"
echo ""

cd "$VERSION_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo ""
fi

# Build the application for analysis
echo "🏗️ Building application for analysis..."
pnpm build
echo ""

# Analyze bundle size
echo "📊 Bundle Size Analysis:"
echo "========================"

if [ -d "dist" ]; then
    echo "Frontend Bundle:"
    find dist -name "*.js" -o -name "*.css" | while read file; do
        size=$(wc -c < "$file")
        size_kb=$((size / 1024))
        echo "  $(basename "$file"): ${size_kb}KB"
    done
    echo ""
fi

# Analyze Rust binary size
if [ -f "src-tauri/target/release/bundle/macos/KrakenEgg.app/Contents/MacOS/KrakenEgg" ]; then
    echo "Rust Binary:"
    rust_size=$(wc -c < "src-tauri/target/release/bundle/macos/KrakenEgg.app/Contents/MacOS/KrakenEgg")
    rust_size_mb=$((rust_size / 1024 / 1024))
    echo "  Binary size: ${rust_size_mb}MB"
    echo ""
fi

# Check for large dependencies
echo "📦 Large Dependencies:"
echo "======================"
if command -v npx >/dev/null 2>&1; then
    npx webpack-bundle-analyzer dist/assets/*.js --mode static --no-open --report bundle-report.html 2>/dev/null || echo "Bundle analyzer not available"
fi

# Count lines of code
echo "📝 Code Metrics:"
echo "================"
echo "TypeScript/TSX files:"
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1

echo ""
echo "Rust files:"
find src-tauri/src -name "*.rs" | xargs wc -l | tail -1

echo ""
echo "Component count:"
find src/components -name "*.tsx" | wc -l | tr -d ' '

# Check for unused exports
echo ""
echo "🔍 Optimization Suggestions:"
echo "============================"

# Check for large files
echo "Large files (>100KB):"
find dist -size +100k -type f 2>/dev/null | head -5 || echo "  None found"

# Check for duplicate dependencies
echo ""
echo "Potential duplicate dependencies:"
if command -v npx >/dev/null 2>&1; then
    npx npm-check-updates --format minimal 2>/dev/null | head -5 || echo "  Analysis unavailable"
fi

echo ""
echo "🎯 Performance Recommendations:"
echo "==============================="
echo "1. Enable gzip compression for static assets"
echo "2. Consider code splitting for large components"
echo "3. Optimize images and icons"
echo "4. Use dynamic imports for rarely-used features"
echo "5. Enable tree shaking for unused code elimination"

if [ -f "bundle-report.html" ]; then
    echo ""
    echo "📊 Detailed bundle report generated: bundle-report.html"
    echo "Open this file in a browser for interactive analysis"
fi