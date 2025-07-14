#!/bin/bash

echo "🚀 Railway Debug Start Script"
echo "📁 Current directory: $(pwd)"
echo ""

# Check if we need to navigate to the right directory
if [ -d "villa-saas/apps/backend" ]; then
    cd villa-saas/apps/backend
    echo "📁 Changed to villa-saas/apps/backend"
elif [ -d "apps/backend" ]; then
    cd apps/backend
    echo "📁 Changed to apps/backend"
fi

echo "📁 Working directory: $(pwd)"
echo ""

# Check critical files
echo "🔍 Checking critical files:"
echo -n "✓ dist/server.js: "
[ -f "dist/server.js" ] && echo "EXISTS" || echo "MISSING"

echo -n "✓ dist/app.js: "
[ -f "dist/app.js" ] && echo "EXISTS" || echo "MISSING"

echo -n "✓ dist/modules/auth/auth.routes.js: "
[ -f "dist/modules/auth/auth.routes.js" ] && echo "EXISTS" || echo "MISSING"

echo -n "✓ dist/modules/auth/auth-signup.routes.js: "
[ -f "dist/modules/auth/auth-signup.routes.js" ] && echo "EXISTS" || echo "MISSING"

echo -n "✓ dist/modules/auth/signup-session.routes.js: "
[ -f "dist/modules/auth/signup-session.routes.js" ] && echo "EXISTS" || echo "MISSING"

echo ""
echo "📂 Contents of dist/modules/auth/:"
ls -la dist/modules/auth/ 2>/dev/null || echo "Directory not found"

echo ""
echo "🔍 Node.js version:"
node --version

echo ""
echo "🔍 npm version:"
npm --version

echo ""
echo "📦 Contents of node_modules (first 10):"
ls node_modules 2>/dev/null | head -10 || echo "node_modules not found"

echo ""
echo "🚀 Attempting to start server..."
node dist/server.js