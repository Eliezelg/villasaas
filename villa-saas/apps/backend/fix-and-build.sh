#!/bin/bash

echo "🔧 Fixing TypeScript imports and building..."

# Clean dist folder
echo "🗑️  Cleaning dist folder..."
rm -rf dist

# Build all packages first
echo "📦 Building packages..."
cd ../..
npm run build:backend

# Check if dist was created
echo "🔍 Checking build output..."
cd apps/backend

if [ -d "dist" ]; then
    echo "✅ Build successful, checking for missing files..."
    
    # Check specific files
    echo -n "auth-signup.routes.js: "
    [ -f "dist/modules/auth/auth-signup.routes.js" ] && echo "✅" || echo "❌"
    
    echo -n "signup-session.routes.js: "
    [ -f "dist/modules/auth/signup-session.routes.js" ] && echo "✅" || echo "❌"
    
    echo -n "rbac.middleware.js: "
    [ -f "dist/middleware/rbac.middleware.js" ] && echo "✅" || echo "❌"
    
    # Count total files
    echo ""
    echo "📊 Build statistics:"
    echo "Total JS files: $(find dist -name "*.js" | wc -l)"
    echo "Total modules: $(ls -1 dist/modules | wc -l)"
else
    echo "❌ Build failed - no dist folder created"
    exit 1
fi