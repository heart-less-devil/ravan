#!/bin/bash

# Deploy script template - Set your actual Stripe keys here
echo "🚀 Deploying with Stripe Keys..."

# Set environment variables for production
# Replace YOUR_STRIPE_SECRET_KEY with your actual secret key
export STRIPE_SECRET_KEY="YOUR_STRIPE_SECRET_KEY"
# Replace YOUR_STRIPE_PUBLISHABLE_KEY with your actual publishable key
export STRIPE_PUBLISHABLE_KEY="YOUR_STRIPE_PUBLISHABLE_KEY"
export REACT_APP_STRIPE_PUBLISHABLE_KEY="YOUR_STRIPE_PUBLISHABLE_KEY"

# Build the project
echo "📦 Building project..."
npm run build

echo "✅ Build complete! Deploy the build folder to your hosting platform."
echo "🔑 Environment variables are set for production."
