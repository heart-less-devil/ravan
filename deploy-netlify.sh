#!/bin/bash

# 🚀 Netlify Deployment Script
# This script helps deploy your React app to Netlify

echo "🚀 Starting Netlify Deployment..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Netlify
    echo "🚀 Deploying to Netlify..."
    netlify deploy --prod --dir=build
    
    echo "🎉 Deployment completed!"
    echo "📱 Your app should be live at the URL shown above"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi 