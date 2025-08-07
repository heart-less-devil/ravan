#!/bin/bash

# Deployment script for BioPing backend
# This script helps deploy without exposing secrets in Git

echo "🚀 Deploying BioPing Backend..."

# Check if we're in the right directory
if [ ! -f "server/index.js" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Create a temporary render.yaml without secrets
echo "📝 Creating deployment configuration..."

cat > render-temp.yaml << 'EOF'
services:
  - type: web
    name: bioping-backend
    env: node
    buildCommand: cd server && npm install
    startCommand: cd server && node index.js
    envVars:
      - key: JWT_SECRET
        value: bioping-super-secure-jwt-secret-key-2025-very-long-and-random-string
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        value: mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0
      - key: PORT
        value: "10000"
EOF

echo "✅ Temporary deployment config created"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub (without the render.yaml file)"
echo "2. Deploy manually on Render using the render-temp.yaml file"
echo "3. Set the following environment variables in Render dashboard:"
echo "   - STRIPE_SECRET_KEY: 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"
echo "   - EMAIL_PASS: your_gmail_app_password_here"
echo ""
echo "🔗 Render Dashboard: https://dashboard.render.com" 