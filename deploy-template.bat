@echo off
echo 🚀 Deploying with Stripe Keys...

REM Set environment variables for production
REM Replace YOUR_STRIPE_SECRET_KEY with your actual secret key
set STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
REM Replace YOUR_STRIPE_PUBLISHABLE_KEY with your actual publishable key
set STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY
set REACT_APP_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY

REM Build the project
echo 📦 Building project...
npm run build

echo ✅ Build complete! Deploy the build folder to your hosting platform.
echo 🔑 Environment variables are set for production.
pause
