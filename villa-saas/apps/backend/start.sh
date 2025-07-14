#!/bin/bash
echo "🚀 Starting Villa SaaS Backend..."
echo "📁 Current directory: $(pwd)"
echo "📂 Files in current directory:"
ls -la
echo "📂 Files in dist directory:"
ls -la dist/
echo "🔍 Checking environment variables..."
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL: ${DATABASE_URL:0:20}..." # Show only first 20 chars for security
echo "🏃 Starting server..."
node dist/server.js