#!/bin/bash

echo "🔨 Building backend..."
npx tsc

echo "✅ Build complete, starting server..."
node dist/server.js