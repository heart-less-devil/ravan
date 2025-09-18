#!/bin/bash

echo "🚀 BioPing Deployment Script"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Step 1: Build the project
echo "📦 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Step 2: Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📥 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Step 3: Deploy to Netlify
echo "🌐 Deploying to Netlify..."
netlify deploy --prod --dir=build

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🎉 Your app is now live on Netlify!"
else
    echo "❌ Deployment failed! Please check the errors above."
    exit 1
fi

echo ""
echo "📋 Next Steps:"
echo "1. Go to your Netlify dashboard"
echo "2. Configure environment variables"
echo "3. Set up custom domain (optional)"
echo "4. Test all features"
echo ""
echo "🔗 Useful Links:"
echo "- Netlify Dashboard: https://app.netlify.com"
echo "- Render Dashboard: https://dashboard.render.com"
echo "- Project Repository: https://github.com/your-username/ravan" 