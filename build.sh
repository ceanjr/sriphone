#!/bin/bash
set -e

echo "🔧 Starting build process..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps || npm install

# Build the project
echo "🏗️ Building Astro project..."
npm run build

# Verify output
echo "✅ Checking build output..."
if [ -f ".vercel/output/config.json" ]; then
    echo "✓ config.json found"
    ls -lh .vercel/output/
else
    echo "❌ ERROR: config.json not found!"
    echo "Contents of .vercel/output:"
    ls -la .vercel/output/ || echo "Output directory does not exist"
    exit 1
fi

echo "🎉 Build completed successfully!"
