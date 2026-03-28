#!/bin/bash

# KrakenEgg Swift App - Automated Testing & Bug Detection Script
# This script automatically builds, tests, and identifies bugs in the Swift application

set -e

echo "🔍 KrakenEgg Swift App - Automated Testing & Bug Detection"
echo "=========================================================="

# Navigate to project directory
cd "/Users/andrew/Documents/Personal/Dev AI Coding/KrakenEgg/krakenegg-swift-native"

echo "📋 Step 1: Building application..."
swift build 2>&1 | tee build.log

# Check for build warnings and errors
if grep -q "error:" build.log; then
    echo "❌ BUILD ERRORS DETECTED:"
    grep "error:" build.log
    exit 1
fi

if grep -q "warning:" build.log; then
    echo "⚠️  BUILD WARNINGS DETECTED:"
    grep "warning:" build.log
fi

echo "✅ Build completed successfully"

echo "📋 Step 2: Running application in background..."
swift run > runtime.log 2>&1 &
APP_PID=$!
sleep 5

echo "📋 Step 3: Testing basic functionality..."

# Check if app is running
if ps -p $APP_PID > /dev/null; then
    echo "✅ Application is running (PID: $APP_PID)"
else
    echo "❌ Application failed to start"
    cat runtime.log
    exit 1
fi

echo "📋 Step 4: Checking for runtime warnings..."
if grep -q "WARNING:" runtime.log; then
    echo "⚠️  RUNTIME WARNINGS DETECTED:"
    grep "WARNING:" runtime.log
fi

echo "📋 Step 5: Memory and performance check..."
# Get memory usage
MEMORY_MB=$(ps -o rss= -p $APP_PID | awk '{print int($1/1024)}')
echo "📊 Memory usage: ${MEMORY_MB}MB"

if [ "$MEMORY_MB" -gt 200 ]; then
    echo "⚠️  High memory usage detected: ${MEMORY_MB}MB (threshold: 200MB)"
fi

echo "📋 Step 6: Cleanup..."
kill $APP_PID 2>/dev/null || true
sleep 2

echo "✅ Testing completed successfully"
echo "📊 Summary:"
echo "   - Build: ✅ Success"
echo "   - Runtime: ✅ Running"
echo "   - Memory: ${MEMORY_MB}MB"
echo "   - Warnings: $(grep -c "warning:" build.log 2>/dev/null || echo "0") build, $(grep -c "WARNING:" runtime.log 2>/dev/null || echo "0") runtime"