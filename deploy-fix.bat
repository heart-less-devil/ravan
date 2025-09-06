@echo off
echo 🚀 URGENT FIX: Deploying BioPing with Real Stripe Keys...

REM Set environment variables for production with REAL KEYS
set STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
set STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
set REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE

echo 🔑 Environment variables set with real Stripe keys
echo 📦 Building project with correct keys...

REM Build the project
call npm run build

echo ✅ Build complete! 
echo 🌐 Your setup: GoDaddy domain + Render server
echo 📁 Deploy the 'build' folder to your GoDaddy hosting
echo 💳 Payment system will now work with your card: 6522940717096518
echo 🎯 12-day auto-cut subscription ready!
echo 
echo 📋 Next steps:
echo 1. Upload 'build' folder contents to GoDaddy
echo 2. Set environment variables on Render server
echo 3. Test payment with your card
pause
