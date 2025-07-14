#!/bin/bash
set -e

echo "🚀 Starting Villa SaaS Backend..."
echo "📁 Current directory: $(pwd)"

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "❌ dist directory not found! Running build..."
    npm run build
fi

# Check critical files
if [ ! -f "dist/modules/auth/auth-signup.routes.js" ]; then
    echo "❌ Critical files missing! Rebuilding..."
    rm -rf dist tsconfig.tsbuildinfo
    npx tsc
fi

# Verify before starting
if [ ! -f "dist/server.js" ]; then
    echo "❌ Error: dist/server.js not found after build!"
    exit 1
fi

echo "✅ All files present, starting server..."
exec node dist/server.js