#!/bin/bash

# JACC Netlify Deployment Script
# Run this script to prepare your project for Netlify deployment

echo "🚀 Preparing JACC for Netlify deployment..."

# Create necessary directories
mkdir -p netlify/functions

# Build the project
echo "📦 Building project..."
npm run build

# Copy server function
echo "📋 Setting up serverless functions..."
cp dist/index.js netlify/functions/server.js

# Create a simple server wrapper for Netlify
cat > netlify/functions/server.js << 'EOF'
const serverless = require('serverless-http');
const app = require('../../dist/index.js').default;

module.exports.handler = serverless(app);
EOF

# Check if required files exist
echo "✅ Checking required files..."

if [ ! -f "netlify.toml" ]; then
    echo "❌ netlify.toml not found!"
    exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
    echo "❌ Built frontend not found! Run 'npm run build' first."
    exit 1
fi

if [ ! -f "dist/index.js" ]; then
    echo "❌ Built server not found! Run 'npm run build' first."
    exit 1
fi

echo "✅ All files ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Connect your GitHub repo to Netlify"
echo "3. Set environment variables in Netlify dashboard"
echo "4. Deploy!"
echo ""
echo "See NETLIFY_DEPLOYMENT_GUIDE.md for detailed instructions."