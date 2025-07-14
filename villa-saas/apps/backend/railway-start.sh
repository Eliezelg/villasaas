#!/bin/bash

echo "🚀 Starting Villa SaaS Backend for Railway..."
echo "📁 Current directory: $(pwd)"
echo "📂 Contents of current directory:"
ls -la

# Ensure we're in the right directory
if [ -d "villa-saas/apps/backend" ]; then
    cd villa-saas/apps/backend
    echo "📁 Changed to villa-saas/apps/backend"
elif [ -d "apps/backend" ]; then
    cd apps/backend
    echo "📁 Changed to apps/backend"
fi

echo "📁 Working directory: $(pwd)"
echo "📂 Contents:"
ls -la

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found!"
    echo "📂 Looking for dist in parent directories..."
    find .. -name "dist" -type d 2>/dev/null | head -10
    exit 1
fi

echo "📂 Contents of dist:"
ls -la dist/

# Check if server.js exists
if [ ! -f "dist/server.js" ]; then
    echo "❌ Error: dist/server.js not found!"
    echo "📂 Looking for server.js..."
    find . -name "server.js" 2>/dev/null | head -10
    exit 1
fi

# Check environment
echo "🔍 Environment check:"
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "PORT: ${PORT:-not set}"
echo "DATABASE_URL: ${DATABASE_URL:+[REDACTED]}"
echo "JWT_SECRET: ${JWT_SECRET:+[REDACTED]}"
echo "REFRESH_TOKEN_SECRET: ${REFRESH_TOKEN_SECRET:+[REDACTED]}"

# Set default PORT if not set
export PORT=${PORT:-3000}
echo "📍 Using PORT: $PORT"

# Start the server
echo "🏃 Starting server with node dist/server.js..."
exec node dist/server.js