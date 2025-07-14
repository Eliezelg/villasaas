#!/bin/bash
set -e

echo "🚀 Building Villa SaaS Backend for Railway..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist tsconfig.tsbuildinfo

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd ../../packages/database
npx prisma generate
cd ../../apps/backend

# Build all packages
echo "📦 Building packages..."
cd ../..
npm run build:backend

# Verify critical files
echo "🔍 Verifying build output..."
cd apps/backend

if [ ! -f "dist/modules/auth/auth-signup.routes.js" ]; then
    echo "❌ Error: auth-signup.routes.js not found!"
    echo "🔧 Attempting direct compilation..."
    npx tsc
fi

# Final verification
echo "✅ Build verification:"
echo -n "  - server.js: "
[ -f "dist/server.js" ] && echo "✓" || echo "✗"
echo -n "  - app.js: "
[ -f "dist/app.js" ] && echo "✓" || echo "✗"
echo -n "  - auth-signup.routes.js: "
[ -f "dist/modules/auth/auth-signup.routes.js" ] && echo "✓" || echo "✗"
echo -n "  - signup-session.routes.js: "
[ -f "dist/modules/auth/signup-session.routes.js" ] && echo "✓" || echo "✗"
echo -n "  - rbac.middleware.js: "
[ -f "dist/middleware/rbac.middleware.js" ] && echo "✓" || echo "✗"

echo ""
echo "📊 Total JS files: $(find dist -name "*.js" -type f 2>/dev/null | wc -l)"
echo "✅ Build complete!"